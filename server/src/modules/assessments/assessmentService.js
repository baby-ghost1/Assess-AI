import Assessment from './Assessment.js'
import Attempt from './Attempt.js'
import Submission from './Submission.js'
import ProctoringViolation from '../proctoring/ProctoringViolation.js'
import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import User from '../users/User.js'
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors/AppError.js'
import { createNotification } from '../notifications/notificationService.js'
import { invalidateUserCaches, invalidateAssessmentCaches, invalidateLeaderboard } from '../analytics/analyticsService.js'
import { invalidateDashboardCache } from '../dashboard/dashboardService.js'
import { getAssessmentDefaults } from '../settings/settingsService.js'
import bcrypt from 'bcrypt'

// ─── Helpers ─────────────────────────────────────────────

async function processInlineQuestions(sections, userId) {
  const allInlineQuestions = []
  const sectionInlineCounts = []

  for (const section of sections) {
    const inlineCount = section.inlineQuestions?.length || 0
    sectionInlineCounts.push(inlineCount)
    if (inlineCount > 0) {
      for (const qData of section.inlineQuestions) {
        allInlineQuestions.push({
          ...qData,
          createdBy: userId,
          updatedBy: userId,
          status: 'draft',
          source: 'manual',
        })
      }
    }
  }

  let createdQuestions = []
  if (allInlineQuestions.length > 0) {
    for (const q of allInlineQuestions) {
      if (q.options?.length) {
        q.options = q.options.filter((o) => o.text && o.text.trim())
      }
      if (q.codingConfig) {
        q.codingDetails = q.codingConfig
        delete q.codingConfig
      }
      if (q.codingDetails?.testCases?.length) {
        q.codingDetails.testCases = q.codingDetails.testCases.filter((tc) => tc.output && tc.output.trim())
      }
    }
    createdQuestions = await Question.insertMany(allInlineQuestions, { ordered: true })
    const versionDocs = createdQuestions.map((q) => ({
      question: q._id,
      version: 1,
      data: q.toObject(),
      changes: 'Created for assessment',
      changedBy: userId,
    }))
    await QuestionVersion.insertMany(versionDocs)
  }

  const processed = []
  let questionOffset = 0
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i]
    const questionIds = [...(section.questions || [])]
    let totalMarks = 0
    if (questionIds.length > 0) {
      const bankQuestions = await Question.find({ _id: { $in: questionIds } }).select('marks').lean()
      totalMarks += bankQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)
    }
    const inlineCount = sectionInlineCounts[i]
    if (inlineCount > 0) {
      const sectionCreated = createdQuestions.slice(questionOffset, questionOffset + inlineCount)
      for (const question of sectionCreated) {
        totalMarks += question.marks || 0
        questionIds.push(question._id)
      }
      questionOffset += inlineCount
    }
    processed.push({ ...section, questions: questionIds, inlineQuestions: undefined, totalMarks })
  }
  return processed
}

// Return a candidate-safe copy of a question (no answer keys / scoring hints)
// (sanitizeQuestionForViewer / presentQuestion defined above)

// ─── Assessment CRUD ─────────────────────────────────────

async function hashSharedPassword(data) {
  if (data.sharedPassword && data.sharedPassword.length > 0) {
    data.sharedPassword = await bcrypt.hash(data.sharedPassword, 10)
  }
  return data
}

function isSelfCreatedAssessment(assessment, userId) {
  if (!userId || !assessment) return false
  const creatorId = assessment.createdBy?._id || assessment.createdBy
  return !!creatorId && creatorId.toString() === userId.toString()
}

function getRetakeGrantCount(assessment, userId) {
  return (assessment.retakeGrants || []).filter((grant) => grant.user?.toString() === userId?.toString()).length
}

function getAllowedAttemptCount(assessment, userId) {
  if (isSelfCreatedAssessment(assessment, userId)) return Number.MAX_SAFE_INTEGER
  const configured = Number(assessment.maxAttempts)
  const base = Number.isFinite(configured) && configured > 0 ? configured : 1
  return base + getRetakeGrantCount(assessment, userId)
}

// Result visibility is server-authoritative:
// - restricted: only after admin release
// - open: showResultImmediately (default true) OR manual release
function isResultReleased(assessment) {
  if (!assessment) return false
  if (assessment.accessMode === 'restricted') return assessment.resultsReleased === true
  if (assessment.showResultImmediately === false) return assessment.resultsReleased === true
  return true
}

// Deterministic option shuffle (seeded) so candidates see stable order per attempt+question
function hashSeed(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(a) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffleOptionsSeeded(options, seed) {
  const rng = mulberry32(hashSeed(seed))
  const arr = [...options]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Candidate-facing question projection.
// includeKeys only when results are visible AND showCorrectAnswers is on.
function presentQuestion(q, { includeKeys = false, shuffleOptions = false, seed = '' } = {}) {
  if (!q) return q
  if (typeof q !== 'object') return q
  const payload = typeof q.toObject === 'function' ? q.toObject() : { ...q }

  if (Array.isArray(payload.options) && payload.options.length > 1 && shuffleOptions && seed) {
    payload.options = shuffleOptionsSeeded(payload.options, `${seed}-${payload._id || ''}`)
  }

  if (!includeKeys) {
    delete payload.correctAnswer
    if (Array.isArray(payload.options)) {
      payload.options = payload.options.map((o) => ({ text: o.text, key: o.key }))
    }
    if (payload.codingDetails) {
      payload.codingDetails = {
        language: payload.codingDetails.language,
        starterCode: payload.codingDetails.starterCode,
        starterCodes: payload.codingDetails.starterCodes,
        constraints: payload.codingDetails.constraints,
        topics: payload.codingDetails.topics,
        companies: payload.codingDetails.companies,
        timeLimit: payload.codingDetails.timeLimit,
        memoryLimit: payload.codingDetails.memoryLimit,
      }
    }
  }
  return payload
}

function sanitizeQuestionForViewer(q, privileged) {
  if (!q || privileged) return q
  if (typeof q !== 'object') return q
  if (typeof q.toObject !== 'function' && Object.keys(q).length === 0) return q
  return presentQuestion(q, { includeKeys: false })
}

function sanitizeAssessmentForCandidate(assessment) {
  if (!assessment) return assessment
  const payload = typeof assessment.toObject === 'function' ? assessment.toObject() : { ...assessment }
  delete payload.candidateList
  delete payload.sharedPassword
  delete payload.retakeGrants
  for (const section of payload.sections || []) {
    section.questions = (section.questions || []).map((q) => sanitizeQuestionForViewer(q, false))
  }
  return payload
}

// opts: { includeScores, includeKeys, shuffleOptions, seed }
function sanitizeSubmissionForCandidate(submission, opts = {}) {
  if (!submission) return submission
  const { includeScores = false, includeKeys = false, shuffleOptions = false, seed = '' } = opts
  const payload = typeof submission.toObject === 'function' ? submission.toObject() : { ...submission }
  if (payload.question) {
    payload.question = presentQuestion(payload.question, { includeKeys, shuffleOptions, seed })
  }
  if (!includeScores) {
    delete payload.isCorrect
    delete payload.marksObtained
    delete payload.marksAwarded
    delete payload.negativeMarks
  }
  return payload
}

function sanitizeAttemptForCandidate(attempt, assessment) {
  const payload = typeof attempt.toObject === 'function' ? attempt.toObject() : { ...attempt }
  const resultsVisible = isResultReleased(assessment)
  if (!resultsVisible) {
    for (const key of ['score', 'totalMarks', 'percentage', 'passed', 'correctCount', 'incorrectCount', 'unansweredCount']) {
      delete payload[key]
    }
  }
  if (payload.assessment && typeof payload.assessment === 'object') {
    const a = typeof payload.assessment.toObject === 'function' ? payload.assessment.toObject() : payload.assessment
    delete a.candidateList
    delete a.sharedPassword
    delete a.retakeGrants
    for (const section of a.sections || []) {
      section.questions = (section.questions || []).map((q) => sanitizeQuestionForViewer(q, false))
    }
    payload.assessment = a
  }
  if (Array.isArray(payload.questionOrder)) {
    payload.questionOrder = payload.questionOrder.map((q) => sanitizeQuestionForViewer(q, false))
  }
  payload.resultReleased = resultsVisible
  // Expose a server-authoritative deadline so the client can render the countdown
  // from the real clock instead of a local counter (survives reloads/tab throttling).
  if (typeof payload.timeLimit === 'number' && payload.timeLimit > 0 && payload.startedAt) {
    const deadline = new Date(payload.startedAt).getTime() + payload.timeLimit * 1000
    payload.deadline = deadline
    payload.timeRemaining = Math.max(0, Math.round((deadline - Date.now()) / 1000))
  }
  return payload
}

export async function createAssessment(data, userId) {
  const user = await User.findById(userId).lean()
  if (user.role === 'setter' && !user.isApproved) {
    throw new ForbiddenError('Your account is not yet approved by admin. You cannot create assessments until approved.')
  }
  // Apply admin defaults when the client omitted optional fields
  if (data.timeLimit === undefined) {
    const defaults = await getAssessmentDefaults()
    data.timeLimit = defaults.timeLimit
  }
  if (data.passingPercentage === undefined) {
    const defaults = await getAssessmentDefaults()
    data.passingPercentage = defaults.passingPercentage
  }
  if (data.maxAttempts === undefined) {
    const defaults = await getAssessmentDefaults()
    data.maxAttempts = defaults.maxAttempts
  }
  if (data.sections?.length) {
    data.sections = await processInlineQuestions(data.sections, userId)
  }
  await hashSharedPassword(data)
  // Ensure questionStatus is initialized as an empty object
  return Assessment.create({ ...data, questionStatus: {}, createdBy: userId, updatedBy: userId })
}

export async function getAssessmentById(assessmentId, requestingUser) {
  let assessment = await Assessment.findById(assessmentId)
    .populate('sections.questions', 'title description questionType difficulty options marks correctAnswer')
    .populate('createdBy', 'name email')
    .lean()

  if (!assessment) throw new NotFoundError('Assessment')

  const role = requestingUser?.role
  const creatorId = assessment.createdBy?._id || assessment.createdBy
  const isCreator = requestingUser && creatorId?.toString() === requestingUser._id.toString()
  const isPrivileged = role === 'admin' || role === 'setter' || isCreator

  if (requestingUser && role !== 'admin' && !isCreator && assessment.status !== 'published') {
    throw new NotFoundError('Assessment')
  }

  // Practice AI quizzes are private to their creator (and admins)
  if (assessment.isAiGenerated && role !== 'admin' && !isCreator) {
    throw new NotFoundError('Assessment')
  }

  // Hiring (restricted) assessments: only invited candidates may fetch them
  if (assessment.accessMode === 'restricted' && role !== 'admin' && !isCreator && role !== 'setter') {
    const email = (requestingUser?.email || '').toLowerCase()
    const invited = (assessment.candidateList || []).some((c) => c.email?.toLowerCase() === email)
    if (!invited) throw new NotFoundError('Assessment')
  }

  // Admins and the creator get full data; everyone else (incl. other setters
  // and candidates) gets no candidate PII, no password hash and no answer keys
  if (role !== 'admin' && !isCreator) {
    delete assessment.candidateList
    delete assessment.sharedPassword
    delete assessment.retakeGrants
    for (const section of assessment.sections || []) {
      section.questions = (section.questions || []).map((q) => sanitizeQuestionForViewer(q, false))
    }
  }
  return assessment
}

export async function listAssessments(filters, requestingUser) {
  const query = {}
  if (filters.search) query.$text = { $search: filters.search }
  if (filters.assessmentType) query.assessmentType = filters.assessmentType
  if (filters.difficulty) query.difficulty = filters.difficulty
  if (filters.status) query.status = filters.status
  if (filters.createdBy) query.createdBy = filters.createdBy

  if (!requestingUser || (requestingUser.role !== 'admin' && requestingUser.role !== 'setter')) {
    query.status = 'published'
    // Practice AI quizzes stay out of the public catalog (only owner sees them via history)
    query.isAiGenerated = false
    // Candidates only see hiring assessments they are invited to
    if (requestingUser?.role === 'candidate' && requestingUser.email) {
      const escaped = String(requestingUser.email).toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      query.$or = [
        { accessMode: { $ne: 'restricted' } },
        { accessMode: 'restricted', candidateList: { $elemMatch: { email: new RegExp(`^${escaped}$`, 'i') } } },
      ]
    }
  } else if (requestingUser?.role === 'admin') {
    query.isAiGenerated = false
  }

  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const [rawAssessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('createdBy', 'name email')
      .populate('sections.questions', 'title questionType difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(query),
  ])

  // Never expose candidate PII / password hashes to non-admins
  const assessments = rawAssessments.map((a) => {
    if (requestingUser?.role !== 'admin') {
      delete a.candidateList
      delete a.sharedPassword
    }
    return a
  })

  return { assessments, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function updateAssessment(assessmentId, data, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  const user = await User.findById(userId).lean()
  if (user.role === 'setter' && assessment.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Not your assessment')
  }
  if (user.role === 'setter' && assessment.status !== 'draft') {
    throw new ValidationError('Only draft assessments can be edited')
  }
  if (user.role !== 'admin') delete data.status
  if (data.sections?.length) {
    data.sections = await processInlineQuestions(data.sections, userId)
  }
  if (data.sharedPassword && data.sharedPassword.length > 0 && !data.sharedPassword.startsWith('$2')) {
    data.sharedPassword = await bcrypt.hash(data.sharedPassword, 10)
  }
  const proctoringChanged =
    data.proctoringRequired !== undefined && data.proctoringRequired !== assessment.proctoringRequired
  Object.assign(assessment, data, { updatedBy: userId })
  await assessment.save()

  // Push live proctoring-required change to any active attempt rooms
  if (proctoringChanged) {
    try {
      const { getIO } = await import('../../config/socket.js')
      const io = getIO()
      if (io) {
        io.to(`assessment:${assessmentId}`).emit('assessment:proctoring-changed', {
          assessmentId,
          proctoringRequired: assessment.proctoringRequired,
        })
      }
    } catch {
      // socket layer unavailable — clients will re-sync on next status fetch
    }
  }
  return assessment
}

export async function deleteAssessment(assessmentId) {
  const assessment = await Assessment.findByIdAndDelete(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  await Attempt.deleteMany({ assessment: assessmentId })
  await Submission.deleteMany({ assessment: assessmentId })
  await ProctoringViolation.deleteMany({ assessment: assessmentId })
  return assessment
}

// ─── Setter Approval Flow ───────────────────────────────

export async function submitForApproval(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.createdBy.toString() !== userId.toString()) throw new ForbiddenError('Not your assessment')
  if (assessment.status !== 'draft') throw new ValidationError('Only draft assessments can be submitted')

  const questionStatus = {}
  for (const section of assessment.sections) {
    for (const qId of section.questions) {
      questionStatus[qId.toString()] = 'pending_review'
    }
  }

  assessment.status = 'pending_approval'
  assessment.rejectionReason = ''
  assessment.questionStatus = questionStatus
  await assessment.save()

  // Instant push: admins see the new pending item without refresh
  try {
    const { getIO } = await import('../../config/socket.js')
    const io = getIO()
    io?.to('role:admin').emit('assessment:pending_approval', {
      assessmentId: assessment._id,
      title: assessment.title,
      createdBy: assessment.createdBy,
      createdAt: assessment.updatedAt || new Date(),
    })
  } catch {
    // socket layer unavailable
  }
  try {
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id')
    await Promise.all(
      admins.map((a) =>
        createNotification(a._id, {
          type: 'system',
          title: 'New Assessment Pending Review',
          message: `"${assessment.title}" was submitted for approval.`,
        })
      )
    )
  } catch {
    // notification failure should not block submit
  }
  return assessment
}

export async function approveAssessment(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')
  assessment.status = 'published'
  assessment.publishedAt = new Date()
  assessment.updatedBy = userId
  await assessment.save()

  const allQuestionIds = assessment.sections.flatMap((s) => s.questions || [])
  // Respect per-question review decisions: never flip an individually rejected
  // question to approved just because the whole assessment was approved.
  const rejectedIds = new Set(
    allQuestionIds
      .filter((qId) => assessment.questionStatus?.get(qId.toString()) === 'rejected')
      .map((qId) => qId.toString())
  )
  const approveIds = allQuestionIds.filter((qId) => !rejectedIds.has(qId.toString()))
  if (approveIds.length > 0) {
    await Question.updateMany(
      { _id: { $in: approveIds }, status: { $ne: 'approved' } },
      { $set: { status: 'approved', updatedBy: userId } }
    )
  }

  if (assessment.createdBy && assessment.createdBy.toString() !== userId.toString()) {
    await createNotification(assessment.createdBy, {
      type: 'assessment_published',
      title: 'Assessment Approved',
      message: `Your assessment "${assessment.title}" has been approved and is now live.`,
    })
    await emitReviewDecided(assessment, 'published')
  }

  return assessment
}

export async function rejectAssessment(assessmentId, reason, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')
  assessment.status = 'draft'
  assessment.rejectionReason = reason || ''
  assessment.questionStatus = {}
  assessment.updatedBy = userId
  await assessment.save()

  if (assessment.createdBy && assessment.createdBy.toString() !== userId.toString()) {
    await createNotification(assessment.createdBy, {
      type: 'assessment_rejected',
      title: 'Assessment Rejected',
      message: reason
        ? `Your assessment "${assessment.title}" was rejected: ${reason}`
        : `Your assessment "${assessment.title}" was rejected. Please review the feedback and resubmit.`,
    })
  }
  await emitReviewDecided(assessment, 'draft', reason)
  return assessment
}

async function emitReviewDecided(assessment, status, rejectionReason = '') {
  try {
    const { getIO } = await import('../../config/socket.js')
    const io = getIO()
    if (io && assessment.createdBy) {
      io.to(`user:${assessment.createdBy}`).emit('assessment:review-decided', {
        assessmentId: assessment._id,
        title: assessment.title,
        status,
        rejectionReason,
      })
    }
  } catch {
    // socket layer unavailable
  }
}

export async function reviewAssessmentQuestion(assessmentId, questionId, status, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')
  const qId = questionId.toString()
  if (!assessment.questionStatus || !assessment.questionStatus.has(qId)) {
    throw new NotFoundError('Question not found in this assessment')
  }
  assessment.questionStatus.set(qId, status)
  assessment.updatedBy = userId
  await assessment.save()
  return assessment
}

export async function approveAllQuestions(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')

  for (const [qId] of assessment.questionStatus) {
    assessment.questionStatus.set(qId, 'approved')
  }

  assessment.status = 'published'
  assessment.publishedAt = new Date()
  assessment.updatedBy = userId
  await assessment.save()

  const allQuestionIds = assessment.sections.flatMap((s) => s.questions || [])
  if (allQuestionIds.length > 0) {
    const publishDate = assessment.publishedAt || new Date()
    await Question.updateMany(
      { _id: { $in: allQuestionIds }, status: { $ne: 'approved' } },
      { $set: { status: 'approved', updatedBy: userId, approvedAt: publishDate } }
    )
  }

  if (assessment.createdBy && assessment.createdBy.toString() !== userId.toString()) {
    await createNotification(assessment.createdBy, {
      type: 'assessment_published',
      title: 'Assessment Approved',
      message: `Your assessment "${assessment.title}" has been approved and is now live.`,
    })
    await emitReviewDecided(assessment, 'published')
  }

  return assessment
}

export async function getPendingAssessments() {
  return Assessment.find({ status: 'pending_approval' })
    .populate('createdBy', 'name email')
    .populate('sections.questions', 'title questionType difficulty options marks correctAnswer')
    .sort({ createdAt: -1 })
    .lean()
}

export async function getSetterAssessments(userId, filters = {}) {
  const query = { createdBy: userId }
  if (filters.status) query.status = filters.status

  const page = Math.max(1, parseInt(filters.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(filters.limit, 10) || 20))
  const skip = (page - 1) * limit

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('sections.questions', 'title questionType difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Assessment.countDocuments(query),
  ])

  return { assessments, total, page, limit, pages: Math.ceil(total / limit) }
}

// ─── Attempt Flow ────────────────────────────────────────

export async function startAttempt(assessmentId, userId, meta = {}) {
  const assessment = await Assessment.findById(assessmentId).lean()
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'published') throw new ForbiddenError('Assessment is not published')
  if (assessment.accessMode === 'restricted') throw new ForbiddenError('This assessment requires email and password to start')

  const activeAttempt = await Attempt.findOne({
    assessment: assessmentId,
    user: userId,
    status: { $in: ['in_progress', 'paused'] },
  })
  if (activeAttempt) throw new ForbiddenError('An active attempt is already in progress')

  const nonAbandonedCount = await Attempt.countDocuments({ assessment: assessmentId, user: userId, status: { $ne: 'abandoned' } })
  if (nonAbandonedCount >= getAllowedAttemptCount(assessment, userId)) {
    throw new ForbiddenError('Maximum attempts reached')
  }

  const allQuestions = assessment.sections.reduce((acc, s) => [...acc, ...s.questions], [])
  const questionOrder = assessment.shuffleQuestions
    ? [...allQuestions].sort(() => Math.random() - 0.5)
    : allQuestions

  const totalMarks = assessment.sections.reduce((acc, s) => acc + s.totalMarks, 0) || questionOrder.length

  const attempt = await Attempt.create({
    assessment: assessmentId,
    user: userId,
    timeLimit: assessment.timeLimit,
    timeRemaining: assessment.timeLimit,
    totalMarks,
    questionOrder,
    currentQuestionIndex: 0,
    attemptNumber: nonAbandonedCount + 1,
    startedAt: new Date(),
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  })

  const submissionDocs = questionOrder.map((qId, i) => ({
    attempt: attempt._id,
    assessment: assessmentId,
    user: userId,
    question: qId,
    order: i,
  }))
  await Submission.insertMany(submissionDocs)

  const populated = await attempt.populate(['questionOrder', 'assessment'])
  return sanitizeAttemptForCandidate(populated, assessment)
}

export async function getActiveAttempt(assessmentId, userId) {
  const attempt = await Attempt.findOne({
    assessment: assessmentId,
    user: userId,
    status: { $in: ['in_progress', 'paused'] },
  })
    .populate({
      path: 'questionOrder',
      // Active attempt → never expose answer keys or scoring fields
      select: 'title description questionType difficulty options marks correctAnswer negativeMarks codingDetails',
    })
    .populate('assessment')
  if (!attempt) return null
  const submissions = await Submission.find({ attempt: attempt._id })
    .populate('question')
    .sort({ order: 1 })
  return {
    attempt: sanitizeAttemptForCandidate(attempt, attempt.assessment),
    submissions: submissions.map((s) => sanitizeSubmissionForCandidate(s, {
      includeScores: false,
      includeKeys: false,
      shuffleOptions: attempt.assessment?.shuffleOptions === true,
      seed: String(attempt._id),
    })),
  }
}

export async function startRestrictedAttempt(assessmentId, candidateEmail, password, meta = {}) {
  const assessment = await Assessment.findById(assessmentId).lean()
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'published') throw new ForbiddenError('Assessment is not published')
  if (assessment.accessMode !== 'restricted') throw new ForbiddenError('This assessment does not use restricted access')

  // Verify candidate is in the list
  const candidateEntry = assessment.candidateList.find(
    (c) => c.email.toLowerCase() === candidateEmail.toLowerCase()
  )
  if (!candidateEntry) throw new ForbiddenError('You are not authorized to take this assessment')

  // Verify shared password
  const passwordMatch = await bcrypt.compare(password, assessment.sharedPassword)
  if (!passwordMatch) throw new ForbiddenError('Incorrect password')

  // Find or create a user for this candidate email
  let user = await User.findOne({ email: candidateEmail.toLowerCase() }).lean()
  if (!user) {
    // Create a temporary user; pre('save') hook hashes the raw password
    user = await User.create({
      name: candidateEntry.name || candidateEmail.split('@')[0],
      email: candidateEmail.toLowerCase(),
      password,
      role: 'candidate',
      isApproved: true,
      provider: 'local',
    })
    user = user.toObject ? user.toObject() : user
  }

  // Check active attempt (in_progress or paused)
  const activeAttempt = await Attempt.findOne({
    assessment: assessmentId,
    user: user._id,
    status: { $in: ['in_progress', 'paused'] },
  })
  if (activeAttempt) throw new ForbiddenError('An active attempt is already in progress')

  // Check attempt limit (grants counted via getAllowedAttemptCount)
  const nonAbandonedCount = await Attempt.countDocuments({ assessment: assessmentId, user: user._id, status: { $ne: 'abandoned' } })
  if (nonAbandonedCount >= getAllowedAttemptCount(assessment, user._id)) {
    throw new ForbiddenError('Maximum attempts reached')
  }

  const allQuestions = assessment.sections.reduce((acc, s) => [...acc, ...s.questions], [])
  const questionOrder = assessment.shuffleQuestions
    ? [...allQuestions].sort(() => Math.random() - 0.5)
    : allQuestions

  const totalMarks = assessment.sections.reduce((acc, s) => acc + s.totalMarks, 0) || questionOrder.length

  const attempt = await Attempt.create({
    assessment: assessmentId,
    user: user._id,
    candidateEmail: candidateEmail.toLowerCase(),
    timeLimit: assessment.timeLimit,
    timeRemaining: assessment.timeLimit,
    totalMarks,
    questionOrder,
    currentQuestionIndex: 0,
    attemptNumber: nonAbandonedCount + 1,
    startedAt: new Date(),
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  })

  const submissionDocs = questionOrder.map((qId, i) => ({
    attempt: attempt._id,
    assessment: assessmentId,
    user: user._id,
    question: qId,
    order: i,
  }))
  await Submission.insertMany(submissionDocs)

  const populated = await attempt.populate(['questionOrder', 'assessment'])
  return { attempt: sanitizeAttemptForCandidate(populated, assessment), candidateEmail: candidateEmail.toLowerCase() }
}

// Server-authoritative deadline: startedAt + timeLimit (+10s grace for clock skew)
function isPastDeadline(attempt) {
  if (!attempt.timeLimit || attempt.timeLimit <= 0 || !attempt.startedAt) return false
  const deadline = new Date(attempt.startedAt).getTime() + attempt.timeLimit * 1000
  return Date.now() > deadline + 10 * 1000
}

export async function submitAnswer(attemptId, questionId, { answer, timeSpent, isBookmarked, notes }, userId) {
  if (!attemptId || attemptId === 'undefined') throw new NotFoundError('Attempt')
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')
  if (attempt.status !== 'in_progress') throw new ForbiddenError('Attempt is not active')

  // Enforce time limit server-side (client timer is advisory only)
  if (isPastDeadline(attempt)) {
    await finishAttempt(attemptId, userId, 'timeout')
    throw new ForbiddenError('Time limit exceeded. Your attempt has been auto-submitted.')
  }

  const question = await Question.findById(questionId).lean()
  if (!question) throw new NotFoundError('Question')

  let submission = await Submission.findOne({ attempt: attemptId, question: questionId })
  if (!submission) throw new NotFoundError('Submission')

  const wasAnswered = submission.isAnswered
  submission.answer = answer
  submission.isAnswered = answer !== null && answer !== undefined && answer !== ''
  submission.isBookmarked = isBookmarked ?? submission.isBookmarked
  submission.notes = notes ?? submission.notes
  submission.timeSpent = (submission.timeSpent || 0) + (timeSpent || 0)

  const assessment = await Assessment.findById(attempt.assessment).lean()
  if (submission.isAnswered) {
    const scored = scoreAnswer(question, answer, assessment)
    submission.isCorrect = scored.isCorrect
    submission.marksObtained = scored.marks
    submission.marksAwarded = scored.marks
    submission.negativeMarks = scored.negativeMarks
  } else {
    submission.isCorrect = false
    submission.marksObtained = 0
    submission.marksAwarded = 0
    submission.negativeMarks = 0
  }

  await submission.save()

  if (!wasAnswered && submission.isAnswered) {
    attempt.answeredCount += 1
  } else if (wasAnswered && !submission.isAnswered) {
    attempt.answeredCount = Math.max(0, attempt.answeredCount - 1)
  }

  if (isBookmarked !== undefined) {
    const qIdStr = questionId.toString()
    if (isBookmarked) {
      if (!attempt.bookmarkedQuestions.some((id) => id.toString() === qIdStr)) {
        attempt.bookmarkedQuestions.push(questionId)
      }
    } else {
      attempt.bookmarkedQuestions = attempt.bookmarkedQuestions.filter(
        (id) => id.toString() !== qIdStr
      )
    }
  }
  await attempt.save()

  const populatedSubmission = await submission.populate('question')
  // Active attempt → never expose answer keys or scoring to the client
  return sanitizeSubmissionForCandidate(populatedSubmission, {
    includeScores: false,
    includeKeys: false,
    shuffleOptions: assessment?.shuffleOptions === true,
    seed: String(attemptId),
  })
}

export async function navigateQuestion(attemptId, questionIndex, userId) {
  if (!attemptId || attemptId === 'undefined') throw new NotFoundError('Attempt')
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')

  const maxIndex = attempt.questionOrder.length - 1
  attempt.currentQuestionIndex = Math.max(0, Math.min(questionIndex, maxIndex))
  await attempt.save()

  const currentQuestionId = attempt.questionOrder[attempt.currentQuestionIndex]
  let submission = await Submission.findOne({ attempt: attemptId, question: currentQuestionId }).populate('question').lean()

  let questions = await Submission.find({ attempt: attemptId }).populate('question').lean()
  const submissionMap = new Map(questions.map(s => [s.question._id.toString(), s]))
  questions = attempt.questionOrder.map(qId => submissionMap.get(qId.toString()) || null)

  // Active attempt → always candidate-safe (no answer keys / scores), all access modes
  const assessment = await Assessment.findById(attempt.assessment).lean()
  const opts = {
    includeScores: false,
    includeKeys: false,
    shuffleOptions: assessment?.shuffleOptions === true,
    seed: String(attemptId),
  }
  submission = sanitizeSubmissionForCandidate(submission, opts)
  questions = questions.map((q) => sanitizeSubmissionForCandidate(q, opts))

  return { attempt, currentSubmission: submission, questions }
}

export async function finishAttempt(attemptId, userId, reason = 'manual') {
  if (!attemptId || attemptId === 'undefined') throw new NotFoundError('Attempt')

  // Atomic claim: only one concurrent caller may move the attempt out of in_progress
  const terminalStatus = reason === 'auto_submit' ? 'auto_submitted' : reason === 'timeout' ? 'timed_out' : 'completed'
  const claimed = await Attempt.findOneAndUpdate(
    { _id: attemptId, user: userId, status: { $in: ['in_progress', 'paused'] } },
    { $set: { status: terminalStatus, completedAt: new Date() } },
    { new: true }
  ).populate('assessment')

  if (!claimed) {
    const existing = await Attempt.findById(attemptId).populate('assessment')
    if (!existing) throw new NotFoundError('Attempt')
    if (existing.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')
    return existing
  }

  const attempt = claimed
  const submissions = await Submission.find({ attempt: attemptId }).populate('question')
  const assessment = attempt.assessment

  let score = 0
  let correctCount = 0
  let answeredCount = 0

  const bulkOps = []

  for (const sub of submissions) {
    if (sub.isAnswered === undefined || sub.isAnswered === null) {
      sub.isAnswered = sub.answer !== null && sub.answer !== undefined && sub.answer !== ''
    }
    if (sub.isAnswered) answeredCount++

    const scored = sub.isAnswered
      ? scoreAnswer(sub.question, sub.answer, assessment)
      : { isCorrect: false, marks: 0, negativeMarks: 0 }

    if (scored.isCorrect) correctCount++
    score += scored.marks

    if (sub.isCorrect !== scored.isCorrect || sub.marksObtained !== scored.marks || (sub.negativeMarks || 0) !== scored.negativeMarks) {
      bulkOps.push({
        updateOne: {
          filter: { _id: sub._id },
          update: {
            $set: {
              isAnswered: sub.isAnswered,
              isCorrect: scored.isCorrect,
              marksObtained: scored.marks,
              marksAwarded: scored.marks,
              negativeMarks: scored.negativeMarks,
            },
          },
        },
      })
    }
  }

  if (bulkOps.length > 0) {
    await Submission.bulkWrite(bulkOps)
  }

  const incorrectCount = answeredCount - correctCount
  const unansweredCount = attempt.questionOrder.length - answeredCount
  const percentage = attempt.totalMarks > 0 ? (score / attempt.totalMarks) * 100 : 0

  attempt.answeredCount = answeredCount
  attempt.score = Math.round(score * 100) / 100
  attempt.correctCount = correctCount
  attempt.incorrectCount = incorrectCount
  attempt.unansweredCount = unansweredCount
  attempt.percentage = Math.round(percentage * 100) / 100
  attempt.passed = attempt.percentage >= assessment.passingPercentage
  // Distinct terminal statuses so the UI can explain what happened
  attempt.status = reason === 'auto_submit' ? 'auto_submitted' : reason === 'timeout' ? 'timed_out' : 'completed'
  attempt.completedAt = new Date()
  attempt.resultReleased = isResultReleased(assessment)

  if (attempt.startedAt) {
    const end = attempt.completedAt || new Date()
    attempt.totalTimeSpent = Math.round((end.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
  } else {
    attempt.totalTimeSpent = attempt.totalTimeSpent || 0
  }

  await attempt.save()

  invalidateUserCaches(userId).catch(() => {})
  invalidateDashboardCache(userId).catch(() => {})
  invalidateAssessmentCaches(assessment._id.toString()).catch(() => {})
  invalidateLeaderboard().catch(() => {})

  // Only reveal score in the notification when results are visible to the candidate
  const assessmentTitle = assessment?.title || 'Assessment'
  if (isResultReleased(assessment)) {
    await createNotification(userId, {
      type: 'assessment_completed',
      title: 'Assessment Completed',
      message: `You scored ${attempt.percentage}% on "${assessmentTitle}". ${attempt.passed ? 'Congratulations, you passed!' : 'Keep practicing, you\'ll do better next time.'}`,
    })
  } else {
    await createNotification(userId, {
      type: 'assessment_completed',
      title: 'Assessment Completed',
      message: `You have completed "${assessmentTitle}". Results will be available once released.`,
    })
  }

  return attempt.populate('assessment')
}

export async function syncTimer(attemptId, timeRemaining, userId) {
  if (!attemptId || attemptId === 'undefined') throw new NotFoundError('Attempt')
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')
  const cap = attempt.timeLimit && attempt.timeLimit > 0 ? attempt.timeLimit : Number.MAX_SAFE_INTEGER
  attempt.timeRemaining = Math.max(0, Math.min(Number(timeRemaining) || 0, cap))
  await attempt.save()
  return { timeRemaining: attempt.timeRemaining }
}

async function enrichAttemptWithLimits(payload, assessment, userId) {
  if (!assessment?._id || !userId) return
  const allowed = getAllowedAttemptCount(assessment, userId)
  const attemptCount = await Attempt.countDocuments({ assessment: assessment._id, user: userId, status: { $ne: 'abandoned' } })
  payload.attemptCount = attemptCount
  payload.remainingAttempts = allowed >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.max(0, allowed - attemptCount)
  payload.isUnlimited = allowed >= Number.MAX_SAFE_INTEGER
}

export async function getAttempt(attemptId, userId) {
  if (!attemptId || attemptId === 'undefined') throw new NotFoundError('Attempt')
  const attempt = await Attempt.findById(attemptId)
    .populate('assessment')
    .populate('questionOrder')
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')

  const assessment = attempt.assessment
  const payload = sanitizeAttemptForCandidate(attempt, assessment)
  await enrichAttemptWithLimits(payload, assessment, userId)

  const active = attempt.status === 'in_progress' || attempt.status === 'paused'
  const released = isResultReleased(assessment)
  const includeScores = !active && released
  const includeKeys = includeScores && assessment?.showCorrectAnswers !== false

  if (!active && !released) {
    return { attempt: payload, submissions: [] }
  }

  const submissions = await Submission.find({ attempt: attemptId })
    .populate('question')
    .sort({ order: 1 })

  return {
    attempt: payload,
    submissions: submissions.map((s) => sanitizeSubmissionForCandidate(s, {
      includeScores,
      includeKeys,
      shuffleOptions: !includeKeys && assessment?.shuffleOptions === true,
      seed: String(attemptId),
    })),
  }
}

export async function getUserAttempts(userId) {
  const attempts = await Attempt.find({ user: userId })
    .populate('assessment', 'title assessmentType difficulty accessMode resultsReleased maxAttempts passingPercentage createdBy retakeGrants')
    .sort({ createdAt: -1 })
    .lean()

  const countByAssessment = {}
  for (const a of attempts) {
    const key = a.assessment?._id?.toString()
    if (!key || a.status === 'abandoned') continue
    countByAssessment[key] = (countByAssessment[key] || 0) + 1
  }

  return attempts.map((a) => {
    const assessment = a.assessment || {}
    const key = assessment._id?.toString()
    const attemptCount = key ? (countByAssessment[key] || 0) : 0
    const allowed = getAllowedAttemptCount(assessment, userId)
    const payload = sanitizeAttemptForCandidate(a, assessment)
    payload.attemptCount = attemptCount
    payload.remainingAttempts = allowed >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : Math.max(0, allowed - attemptCount)
    payload.isUnlimited = allowed >= Number.MAX_SAFE_INTEGER
    return payload
  })
}

// ─── Helpers ─────────────────────────────────────────────

function getCorrectKeys(question) {
  const fromOptions = question.options?.filter((o) => o.isCorrect).map((o) => o.key)
  if (fromOptions?.length > 0) return fromOptions

  const ca = question.correctAnswer
  if (ca === undefined || ca === null) return []

  if (Array.isArray(ca)) return ca.map(String)
  return [String(ca)]
}

function evaluateAnswer(question, answer) {
  if (answer === null || answer === undefined || answer === '') return false
  const correctKeys = getCorrectKeys(question)
  if (correctKeys.length === 0) return false

  switch (question.questionType) {
    case 'single_correct':
    case 'true_false':
      return correctKeys[0] === answer
    case 'multi_correct': {
      if (!Array.isArray(answer)) return false
      return correctKeys.length === answer.length && correctKeys.every((k) => answer.includes(k))
    }
    case 'fill_blanks':
      return question.correctAnswer?.toString().toLowerCase() === answer.toString().toLowerCase()
    case 'coding':
    case 'subjective':
      return false
    default:
      return false
  }
}

// Negative penalty for a wrong answer: per-question negativeMarks wins, else assessment value
function getNegativePenalty(assessment, question) {
  if (!assessment?.negativeMarking) return 0
  const perQuestion = Number(question?.negativeMarks)
  if (Number.isFinite(perQuestion) && perQuestion > 0) return perQuestion
  const fallback = Number(assessment.negativeMarkingValue)
  return Number.isFinite(fallback) && fallback > 0 ? fallback : 0
}

// Server-side scoring for one submission (used by submitAnswer + finishAttempt).
// Returns { isCorrect, marks, negativeMarks }.
// - correct → full question marks
// - unanswered → 0 (no penalty)
// - wrong → -penalty (0 when negative marking off)
// - multi_correct + partialMarking → proportional marks when partially correct
function scoreAnswer(question, answer, assessment) {
  const penalty = getNegativePenalty(assessment, question)

  if (answer === null || answer === undefined || answer === '') {
    return { isCorrect: false, marks: 0, negativeMarks: 0 }
  }

  if (
    question.questionType === 'multi_correct' &&
    assessment?.partialMarking &&
    Array.isArray(answer)
  ) {
    const correctKeys = getCorrectKeys(question)
    if (correctKeys.length === 0) {
      return { isCorrect: false, marks: -penalty, negativeMarks: penalty }
    }
    const selected = answer.map(String)
    const correctSel = selected.filter((k) => correctKeys.includes(k)).length
    const wrongSel = selected.length - correctSel
    const ratio = Math.max(0, (correctSel - wrongSel) / correctKeys.length)
    if (ratio <= 0) {
      return { isCorrect: false, marks: -penalty, negativeMarks: penalty }
    }
    const marks = Math.round(question.marks * ratio * 100) / 100
    const isFullyCorrect = ratio === 1
    return { isCorrect: isFullyCorrect, marks: isFullyCorrect ? question.marks : marks, negativeMarks: 0 }
  }

  const isCorrect = evaluateAnswer(question, answer)
  if (isCorrect) {
    return { isCorrect: true, marks: question.marks, negativeMarks: 0 }
  }
  return { isCorrect: false, marks: -penalty, negativeMarks: penalty }
}

async function getBookmarkedQuestions(attemptId) {
  const subs = await Submission.find({ attempt: attemptId, isBookmarked: true }).lean()
  return subs.map((s) => s.question)
}

// ─── Restricted Assessment Results (Admin) ───────────────

export async function getRestrictedAssessmentResults(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId).lean()
  if (!assessment) throw new NotFoundError('Assessment')

  const user = await User.findById(userId).lean()
  if (user.role !== 'admin' && assessment.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Not authorized')
  }

  const attempts = await Attempt.find({ assessment: assessmentId })
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .lean()

  // Group by candidate
  const candidateMap = new Map()

  for (const attempt of attempts) {
    const email = attempt.candidateEmail || attempt.user?.email || 'unknown'
    if (!candidateMap.has(email)) {
      candidateMap.set(email, {
        email,
        name: attempt.user?.name || email.split('@')[0],
        userIds: new Set(),
        attempts: [],
        totalAttempts: 0,
        bestScore: 0,
        bestPercentage: 0,
        passed: false,
      })
    }
    const candidate = candidateMap.get(email)
    if (attempt.user?._id) candidate.userIds.add(attempt.user._id.toString())
    candidate.attempts.push({
      attemptId: attempt._id,
      userId: attempt.user?._id || null,
      attemptNumber: attempt.attemptNumber || 1,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      correctCount: attempt.correctCount,
      incorrectCount: attempt.incorrectCount,
      unansweredCount: attempt.unansweredCount,
      totalTimeSpent: attempt.totalTimeSpent,
      violationCount: attempt.violationCount,
      status: attempt.status,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
    })
    candidate.totalAttempts++
    if (attempt.percentage > candidate.bestPercentage) {
      candidate.bestScore = attempt.score
      candidate.bestPercentage = attempt.percentage
      candidate.passed = attempt.passed
    }
  }

  const candidates = Array.from(candidateMap.values()).map((c) => {
    const { userIds, ...candidate } = c
    candidate.grantCount = (assessment.retakeGrants || []).filter((g) => userIds.has(g.user?.toString())).length
    return candidate
  })

  return {
    assessment: {
      id: assessment._id,
      title: assessment.title,
      accessMode: assessment.accessMode,
      candidateList: assessment.candidateList,
      maxAttempts: assessment.maxAttempts,
      passingPercentage: assessment.passingPercentage,
      resultsReleased: assessment.resultsReleased,
      retakeGrants: assessment.retakeGrants,
    },
    candidates,
    totalCandidates: candidateMap.size,
  }
}

export async function releaseAssessmentResults(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  const user = await User.findById(userId).lean()
  if (user.role !== 'admin' && assessment.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Not authorized')
  }
  if (assessment.resultsReleased) return assessment

  const wasOpenAutoVisible = assessment.accessMode !== 'restricted' && assessment.showResultImmediately !== false

  assessment.resultsReleased = true
  assessment.updatedBy = userId
  await assessment.save()
  await Attempt.updateMany({ assessment: assessmentId }, { $set: { resultReleased: true } })

  // Notify every user who has an attempt (only on false→true transition, which is guaranteed above)
  const userIds = await Attempt.distinct('user', { assessment: assessmentId })
  for (const uid of userIds) {
    await createNotification(uid, {
      type: 'result_published',
      title: 'Results Published',
      message: wasOpenAutoVisible
        ? `Results for "${assessment.title}" have been formally released.`
        : `Results for "${assessment.title}" are now available.`,
    }).catch(() => {})
  }
  return assessment
}

export async function grantRetake(assessmentId, userId, targetUserId) {
  if (!targetUserId) throw new ValidationError('Candidate userId is required')
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  const user = await User.findById(userId).lean()
  if (user.role !== 'admin' && assessment.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Not authorized')
  }
  if (assessment.accessMode !== 'restricted') {
    throw new ValidationError('Only restricted assessments support retake grants')
  }
  const granted = assessment.retakeGrants.some((g) => g.user?.toString() === targetUserId.toString())
  if (!granted) {
    assessment.retakeGrants.push({ user: targetUserId, grantedAt: new Date() })
    await createNotification(targetUserId, {
      type: 'system',
      title: 'Retake Granted',
      message: `You have been granted a retake for "${assessment.title}".`,
    }).catch(() => {})
  }
  assessment.updatedBy = userId
  await assessment.save()
  return assessment
}
