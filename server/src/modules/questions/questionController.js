import * as questionService from './questionService.js'

export async function createQuestion(req, res, next) {
  try {
    const question = await questionService.createQuestion(req.validatedBody, req.user._id)
    res.status(201).json({ success: true, data: question, message: 'Question created', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getQuestion(req, res, next) {
  try {
    const question = await questionService.getQuestionById(req.params.id)
    res.status(200).json({ success: true, data: question, message: 'Question fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function listQuestions(req, res, next) {
  try {
    const result = await questionService.listQuestions(req.query)
    res.status(200).json({ success: true, data: result.questions, message: 'Questions fetched', errors: null, meta: { page: result.page, limit: result.limit, total: result.total, pages: result.pages } })
  } catch (error) { next(error) }
}

export async function updateQuestion(req, res, next) {
  try {
    const question = await questionService.updateQuestion(req.params.id, req.validatedBody, req.user._id)
    res.status(200).json({ success: true, data: question, message: 'Question updated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteQuestion(req, res, next) {
  try {
    await questionService.deleteQuestion(req.params.id)
    res.status(200).json({ success: true, data: null, message: 'Question deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function submitForReview(req, res, next) {
  try {
    const question = await questionService.submitForReview(req.params.id, req.user._id)
    res.status(200).json({ success: true, data: question, message: 'Submitted for review', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function reviewQuestion(req, res, next) {
  try {
    const question = await questionService.reviewQuestion(req.params.id, req.validatedBody, req.user._id)
    res.status(200).json({ success: true, data: question, message: `Question ${req.validatedBody.status}`, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getVersions(req, res, next) {
  try {
    const versions = await questionService.getQuestionVersions(req.params.id)
    res.status(200).json({ success: true, data: versions, message: 'Versions fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}
