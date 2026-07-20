import * as assessmentService from './assessmentService.js'

export async function createAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.createAssessment(req.validatedBody, req.user._id)
    res.status(201).json({ success: true, data: assessment, message: 'Assessment created', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.getAssessmentById(req.params.id)
    res.status(200).json({ success: true, data: assessment, message: 'Assessment fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function listAssessments(req, res, next) {
  try {
    const result = await assessmentService.listAssessments(req.query)
    res.status(200).json({ success: true, data: result.assessments, message: 'Assessments fetched', errors: null, meta: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } })
  } catch (error) { next(error) }
}

export async function updateAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.updateAssessment(req.params.id, req.validatedBody, req.user._id)
    res.status(200).json({ success: true, data: assessment, message: 'Assessment updated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteAssessment(req, res, next) {
  try {
    await assessmentService.deleteAssessment(req.params.id)
    res.status(200).json({ success: true, data: null, message: 'Assessment deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function startAttempt(req, res, next) {
  try {
    const { assessmentId } = req.validatedBody
    const meta = { ip: req.ip, userAgent: req.headers['user-agent'] }
    const attempt = await assessmentService.startAttempt(assessmentId, req.user._id, meta)
    res.status(201).json({ success: true, data: attempt, message: 'Attempt started', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function submitAnswer(req, res, next) {
  try {
    const submission = await assessmentService.submitAnswer(req.params.attemptId, req.validatedBody.questionId, req.validatedBody, req.user._id)
    res.status(200).json({ success: true, data: submission, message: 'Answer submitted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function navigateQuestion(req, res, next) {
  try {
    const result = await assessmentService.navigateQuestion(req.params.attemptId, parseInt(req.params.index), req.user._id)
    res.status(200).json({ success: true, data: result, message: 'Navigated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function finishAttempt(req, res, next) {
  try {
    const attempt = await assessmentService.finishAttempt(req.params.attemptId, req.user._id)
    res.status(200).json({ success: true, data: attempt, message: 'Attempt completed', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function syncTimer(req, res, next) {
  try {
    const result = await assessmentService.syncTimer(req.params.attemptId, req.validatedBody.timeRemaining, req.user._id)
    res.status(200).json({ success: true, data: result, message: 'Timer synced', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAttempt(req, res, next) {
  try {
    const result = await assessmentService.getAttempt(req.params.id, req.user._id)
    res.status(200).json({ success: true, data: result, message: 'Attempt fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getUserAttempts(req, res, next) {
  try {
    const attempts = await assessmentService.getUserAttempts(req.user._id)
    res.status(200).json({ success: true, data: attempts, message: 'Attempts fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function submitForApproval(req, res, next) {
  try {
    const assessment = await assessmentService.submitForApproval(req.params.id, req.user._id)
    res.status(200).json({ success: true, data: assessment, message: 'Assessment submitted for approval', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function approveAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.approveAssessment(req.params.id, req.user._id)
    res.status(200).json({ success: true, data: assessment, message: 'Assessment approved', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function rejectAssessment(req, res, next) {
  try {
    const assessment = await assessmentService.rejectAssessment(req.params.id, req.validatedBody?.reason, req.user._id)
    res.status(200).json({ success: true, data: assessment, message: 'Assessment rejected', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getPendingAssessments(req, res, next) {
  try {
    const assessments = await assessmentService.getPendingAssessments()
    res.status(200).json({ success: true, data: assessments, message: 'Pending assessments fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}
