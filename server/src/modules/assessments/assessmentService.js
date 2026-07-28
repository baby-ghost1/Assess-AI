import Assessment from './Assessment.js'
import Attempt from './Attempt.js'
import Submission from './Submission.js'
import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import User from '../users/User.js'
import { NotFoundError, ForbiddenError, ValidationError } from '../../shared/errors/AppError.js'
import { createNotification } from '../notifications/notificationService.js'

// ─── Helpers ─────────────────────────────────────────────

async function processInlineQuestions(sections, userId) {
  const processed = []
  for (const section of sections) {
    const questionIds = [...(section.questions || [])]
    let totalMarks = 0
    if (questionIds.length > 0) {
      const bankQuestions = await Question.find({ _id: { $in: questionIds } }).select('marks').lean()
      totalMarks += bankQuestions.reduce((sum, q) => sum + (q.marks || 0), 0)
    }
    if (section.inlineQuestions?.length) {
      for (const qData of section.inlineQuestions) {
        const question = await Question.create({
          ...qData,
          createdBy: userId,
          updatedBy: userId,
          status: 'approved',
          source: 'manual',
        })
        await QuestionVersion.create({
          question: question._id, version: 1, data: question.toObject(),
          changes: 'Created for assessment', changedBy: userId,
        })
        totalMarks += question.marks || 0
        questionIds.push(question._id)
      }
    }
    processed.push({ ...section, questions: questionIds, inlineQuestions: undefined, totalMarks })
  }
  return processed
}

// ─── Assessment CRUD ─────────────────────────────────────

export async function createAssessment(data, userId) {
  const user = await User.findById(userId)
  if (user.role === 'setter' && !user.isApproved) {
    throw new ForbiddenError('Your account is not yet approved by admin. You cannot create assessments until approved.')
  }
  if (data.sections?.length) {
    data.sections = await processInlineQuestions(data.sections, userId)
  }
  return Assessment.create({ ...data, createdBy: userId, updatedBy: userId })
}

export async function getAssessmentById(assessmentId) {
  const assessment = await Assessment.findById(assessmentId)
    .populate('sections.questions', 'title questionType difficulty options marks correctAnswer')
    .populate('createdBy', 'name email')
  if (!assessment) throw new NotFoundError('Assessment')
  return assessment
}

export async function listAssessments(filters) {
  const query = {}
  if (filters.search) query.$text = { $search: filters.search }
  if (filters.assessmentType) query.assessmentType = filters.assessmentType
  if (filters.difficulty) query.difficulty = filters.difficulty
  if (filters.status) query.status = filters.status
  if (filters.createdBy) query.createdBy = filters.createdBy

  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Assessment.countDocuments(query),
  ])

  return { assessments, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function updateAssessment(assessmentId, data, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  const user = await User.findById(userId)
  if (user.role === 'setter' && assessment.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Not your assessment')
  }
  if (user.role === 'setter' && assessment.status !== 'draft') {
    throw new ValidationError('Only draft assessments can be edited')
  }
  delete data.status
  if (data.sections?.length) {
    data.sections = await processInlineQuestions(data.sections, userId)
  }
  Object.assign(assessment, data, { updatedBy: userId })
  await assessment.save()
  return assessment
}

export async function deleteAssessment(assessmentId) {
  const assessment = await Assessment.findByIdAndDelete(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  await Attempt.deleteMany({ assessment: assessmentId })
  await Submission.deleteMany({ assessment: assessmentId })
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
  return assessment
}

export async function approveAssessment(assessmentId, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')
  assessment.status = 'published'
  assessment.updatedBy = userId
  await assessment.save()

  if (assessment.createdBy && assessment.createdBy.toString() !== userId.toString()) {
    await createNotification(assessment.createdBy, {
      type: 'assessment_published',
      title: 'Assessment Approved',
      message: `Your assessment "${assessment.title}" has been approved and is now live.`,
    })
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
  return assessment
}

export async function reviewAssessmentQuestion(assessmentId, questionId, status, userId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'pending_approval') throw new ValidationError('Assessment is not pending approval')
  if (!assessment.questionStatus || !assessment.questionStatus.has(questionId)) {
    throw new NotFoundError('Question not found in this assessment')
  }
  assessment.questionStatus.set(questionId, status)
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
  assessment.updatedBy = userId
  await assessment.save()

  if (assessment.createdBy && assessment.createdBy.toString() !== userId.toString()) {
    await createNotification(assessment.createdBy, {
      type: 'assessment_published',
      title: 'Assessment Approved',
      message: `Your assessment "${assessment.title}" has been approved and is now live.`,
    })
  }

  return assessment
}

export async function getPendingAssessments() {
  return Assessment.find({ status: 'pending_approval' })
    .populate('createdBy', 'name email')
    .populate('sections.questions', 'title questionType difficulty options marks correctAnswer')
    .sort({ createdAt: -1 })
}

export async function getSetterAssessments(userId, filters = {}) {
  const query = { createdBy: userId }
  if (filters.status) query.status = filters.status

  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('sections.questions', 'title questionType difficulty')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Assessment.countDocuments(query),
  ])

  return { assessments, total, page, limit, pages: Math.ceil(total / limit) }
}

// ─── Attempt Flow ────────────────────────────────────────

export async function startAttempt(assessmentId, userId, meta = {}) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new NotFoundError('Assessment')
  if (assessment.status !== 'published') throw new ForbiddenError('Assessment is not published')

  const existingAttempts = await Attempt.countDocuments({ assessment: assessmentId, user: userId, status: { $ne: 'abandoned' } })
  if (existingAttempts >= assessment.maxAttempts) {
    throw new ForbiddenError('Maximum attempts reached')
  }

  const allQuestions = assessment.sections.reduce((acc, s) => [...acc, ...s.questions], [])
  const questionOrder = assessment.shuffleQuestions
    ? allQuestions.sort(() => Math.random() - 0.5)
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
    startedAt: new Date(),
    ipAddress: meta.ip || '',
    userAgent: meta.userAgent || '',
  })

  for (let i = 0; i < questionOrder.length; i++) {
    await Submission.create({
      attempt: attempt._id,
      assessment: assessmentId,
      user: userId,
      question: questionOrder[i],
      order: i,
    })
  }

  return attempt.populate('questionOrder')
}

export async function submitAnswer(attemptId, questionId, { answer, timeSpent, isBookmarked, notes }, userId) {
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')
  if (attempt.status !== 'in_progress') throw new ForbiddenError('Attempt is not active')

  const question = await Question.findById(questionId)
  if (!question) throw new NotFoundError('Question')

  let submission = await Submission.findOne({ attempt: attemptId, question: questionId })
  if (!submission) throw new NotFoundError('Submission')

  const wasAnswered = submission.isAnswered
  submission.answer = answer
  submission.isAnswered = answer !== null && answer !== undefined && answer !== ''
  submission.isBookmarked = isBookmarked ?? submission.isBookmarked
  submission.notes = notes ?? submission.notes
  submission.timeSpent = (submission.timeSpent || 0) + (timeSpent || 0)

  if (submission.isAnswered) {
    const isCorrect = evaluateAnswer(question, answer)
    submission.isCorrect = isCorrect
    submission.marksObtained = isCorrect ? question.marks : 0
    submission.marksAwarded = isCorrect ? question.marks : 0
  }

  await submission.save()

  if (!wasAnswered && submission.isAnswered) {
    attempt.answeredCount += 1
  }

  attempt.bookmarkedQuestions = await getBookmarkedQuestions(attemptId)
  await attempt.save()

  return submission.populate('question')
}

export async function navigateQuestion(attemptId, questionIndex, userId) {
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')

  const maxIndex = attempt.questionOrder.length - 1
  attempt.currentQuestionIndex = Math.max(0, Math.min(questionIndex, maxIndex))
  await attempt.save()

  const currentQuestionId = attempt.questionOrder[attempt.currentQuestionIndex]
  const submission = await Submission.findOne({ attempt: attemptId, question: currentQuestionId }).populate('question')

  const allSubmissions = await Submission.find({ attempt: attemptId }).populate('question')
  const submissionMap = new Map(allSubmissions.map(s => [s.question._id.toString(), s]))
  const questions = attempt.questionOrder.map(qId => submissionMap.get(qId.toString()) || null)

  return { attempt, currentSubmission: submission, questions }
}

export async function finishAttempt(attemptId, userId) {
  const attempt = await Attempt.findById(attemptId).populate('assessment')
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')

  const submissions = await Submission.find({ attempt: attemptId }).populate('question')

  let score = 0
  let correctCount = 0
  let answeredCount = 0

  for (const sub of submissions) {
    if (sub.isAnswered === undefined || sub.isAnswered === null) {
      sub.isAnswered = sub.answer !== null && sub.answer !== undefined && sub.answer !== ''
    }
    if (sub.isAnswered) answeredCount++

    const isCorrect = sub.isAnswered ? evaluateAnswer(sub.question, sub.answer) : false

    if (isCorrect) {
      score += sub.question.marks
      correctCount++
    }

    if (sub.isCorrect !== isCorrect || sub.marksObtained !== (isCorrect ? sub.question.marks : 0)) {
      sub.isCorrect = isCorrect
      sub.marksObtained = isCorrect ? sub.question.marks : 0
      sub.marksAwarded = isCorrect ? sub.question.marks : 0
      await sub.save()
    }
  }

  const incorrectCount = answeredCount - correctCount
  const unansweredCount = attempt.questionOrder.length - answeredCount
  const percentage = attempt.totalMarks > 0 ? (score / attempt.totalMarks) * 100 : 0

  attempt.answeredCount = answeredCount
  attempt.score = score
  attempt.correctCount = correctCount
  attempt.incorrectCount = incorrectCount
  attempt.unansweredCount = unansweredCount
  attempt.percentage = Math.round(percentage * 100) / 100
  attempt.passed = attempt.percentage >= attempt.assessment.passingPercentage
  attempt.status = 'completed'
  attempt.completedAt = new Date()

  if (attempt.startedAt) {
    const end = attempt.completedAt || new Date()
    attempt.totalTimeSpent = Math.round((end.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
  } else {
    attempt.totalTimeSpent = attempt.totalTimeSpent || 0
  }

  await attempt.save()

  const assessment = attempt.assessment
  const assessmentTitle = assessment?.title || 'Assessment'
  await createNotification(userId, {
    type: 'assessment_completed',
    title: 'Assessment Completed',
    message: `You scored ${attempt.percentage}% on "${assessmentTitle}". ${attempt.passed ? 'Congratulations, you passed!' : 'Keep practicing, you\'ll do better next time.'}`,
  })

  return attempt.populate('assessment')
}

export async function syncTimer(attemptId, timeRemaining, userId) {
  const attempt = await Attempt.findById(attemptId)
  if (!attempt) throw new NotFoundError('Attempt')
  if (attempt.user.toString() !== userId.toString()) throw new ForbiddenError('Not your attempt')
  attempt.timeRemaining = timeRemaining
  await attempt.save()
  return { timeRemaining: attempt.timeRemaining }
}

export async function getAttempt(attemptId, userId) {
  const attempt = await Attempt.findById(attemptId)
    .populate('assessment')
    .populate('questionOrder')
  if (!attempt) throw new NotFoundError('Attempt')

  const submissions = await Submission.find({ attempt: attemptId })
    .populate('question')
    .sort({ order: 1 })

  return { attempt, submissions }
}

export async function getUserAttempts(userId) {
  const attempts = await Attempt.find({ user: userId })
    .populate('assessment', 'title assessmentType difficulty')
    .sort({ createdAt: -1 })
  return attempts
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

async function getBookmarkedQuestions(attemptId) {
  const subs = await Submission.find({ attempt: attemptId, isBookmarked: true })
  return subs.map((s) => s.question)
}
