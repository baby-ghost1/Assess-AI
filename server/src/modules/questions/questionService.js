import Question from './Question.js'
import QuestionVersion from './QuestionVersion.js'
import Tag from '../tags/Tag.js'
import { NotFoundError, ForbiddenError } from '../../shared/errors/AppError.js'

export async function createQuestion(data, userId) {
  const question = await Question.create({ ...data, createdBy: userId, updatedBy: userId })

  if (data.tags?.length) {
    await Tag.updateMany({ _id: { $in: data.tags } }, { $inc: { usageCount: 1 } })
  }

  await QuestionVersion.create({
    question: question._id,
    version: 1,
    data: question.toObject(),
    changes: 'Initial creation',
    changedBy: userId,
  })

  return question.populate('tags createdBy', 'name email')
}

export async function getQuestionById(questionId) {
  let question
  try {
    question = await Question.findById(questionId)
      .populate('tags', 'name color')
      .populate('createdBy updatedBy', 'name email')
  } catch (err) {
    if (err.name === 'CastError') {
      throw new NotFoundError('Question')
    }
    throw err
  }
  if (!question) throw new NotFoundError('Question')
  return question
}

export async function listQuestions(filters) {
  const query = {}

  if (filters.search) {
    query.$text = { $search: filters.search }
  }
  if (filters.questionType) query.questionType = filters.questionType
  if (filters.difficulty) query.difficulty = filters.difficulty
  if (filters.status) query.status = filters.status
  if (filters.category) query.category = filters.category
  if (filters.tags) query.tags = { $in: filters.tags.split(',') }
  if (filters.createdBy) query.createdBy = filters.createdBy

  const page = filters.page || 1
  const limit = filters.limit || 20
  const skip = (page - 1) * limit

  const sort = {}
  if (filters.sort) {
    const parts = filters.sort.split(',')
    for (const part of parts) {
      if (part.startsWith('-')) sort[part.slice(1)] = -1
      else sort[part] = 1
    }
  }

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('tags', 'name color')
      .populate('createdBy', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Question.countDocuments(query),
  ])

  return { questions, total, page, limit, pages: Math.ceil(total / limit) }
}

export async function updateQuestion(questionId, data, userId) {
  const question = await Question.findById(questionId)
  if (!question) throw new NotFoundError('Question')

  if (question.status === 'approved') {
    throw new ForbiddenError('Approved questions cannot be edited directly. Create a new version.')
  }

  const oldData = question.toObject()
  Object.assign(question, data, { updatedBy: userId })
  question.version += 1
  await question.save()

  await QuestionVersion.create({
    question: question._id,
    version: question.version,
    data: question.toObject(),
    changes: 'Question updated',
    changedBy: userId,
  })

  return question.populate('tags createdBy updatedBy', 'name email')
}

export async function deleteQuestion(questionId) {
  const question = await Question.findByIdAndDelete(questionId)
  if (!question) throw new NotFoundError('Question')
  await QuestionVersion.deleteMany({ question: questionId })
  return question
}

export async function submitForReview(questionId, userId) {
  const question = await Question.findById(questionId)
  if (!question) throw new NotFoundError('Question')
  if (question.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Only the creator can submit for review')
  }
  if (question.status !== 'draft' && question.status !== 'rejected') {
    throw new ForbiddenError('Only draft or rejected questions can be submitted for review')
  }
  question.status = 'pending_review'
  question.updatedBy = userId
  await question.save()

  await QuestionVersion.create({
    question: question._id,
    version: question.version,
    data: question.toObject(),
    changes: 'Submitted for review',
    changedBy: userId,
  })

  return question
}

export async function withdrawFromReview(questionId, userId) {
  const question = await Question.findById(questionId)
  if (!question) throw new NotFoundError('Question')
  if (question.createdBy.toString() !== userId.toString()) {
    throw new ForbiddenError('Only the creator can withdraw from review')
  }
  if (question.status !== 'pending_review') {
    throw new ForbiddenError('Question is not pending review')
  }
  question.status = 'draft'
  question.updatedBy = userId
  await question.save()

  await QuestionVersion.create({
    question: question._id,
    version: question.version,
    data: question.toObject(),
    changes: 'Withdrawn from review',
    changedBy: userId,
  })

  return question
}

export async function reviewQuestion(questionId, { status, rejectionReason }, userId) {
  if (!['approved', 'rejected'].includes(status)) {
    throw new Error('Status must be approved or rejected')
  }

  const question = await Question.findById(questionId)
  if (!question) throw new NotFoundError('Question')

  if (question.status !== 'pending_review') {
    throw new ForbiddenError('Only questions pending review can be approved or rejected')
  }

  question.status = status
  question.updatedBy = userId
  if (status === 'rejected') question.rejectionReason = rejectionReason || ''
  await question.save()

  await QuestionVersion.create({
    question: question._id,
    version: question.version,
    data: question.toObject(),
    changes: status === 'approved' ? 'Approved by admin' : `Rejected: ${rejectionReason || 'No reason provided'}`,
    changedBy: userId,
  })

  return question
}

export async function getQuestionVersions(questionId) {
  const versions = await QuestionVersion.find({ question: questionId })
    .sort({ version: -1 })
    .populate('changedBy', 'name email')
  return versions
}
