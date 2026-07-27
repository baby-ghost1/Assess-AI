import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import { parseCSV, parseJSON, parseExcel, parsePDF, parseDOCX, parseTXT } from './fileParser.js'
import { ValidationError } from '../../shared/errors/AppError.js'

function mapRowToQuestion(row, userId) {
  const get = (...keys) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k]
    }
    return undefined
  }

  const rawType = get('type', 'questionType', 'question_type') || 'single_correct'
  const questionType = rawType.toLowerCase().replace(/\s+/g, '_')

  const q = {
    title: get('title', 'question', 'name') || 'Untitled',
    description: get('description', 'desc') || '',
    questionType,
    difficulty: (get('difficulty') || 'medium').toLowerCase(),
    marks: Number(get('marks', 'score', 'points')) || 1,
    negativeMarks: Number(get('negativeMarks', 'negative_marks', 'negative')) || 0,
    category: get('category', 'subject', 'topic') || '',
    createdBy: userId,
    updatedBy: userId,
    source: 'imported',
    status: 'draft',
  }

  if (['single_correct', 'multi_correct'].includes(q.questionType) && get('options')) {
    const raw = get('options')
    const parts = typeof raw === 'string' ? raw.split(/[|,;]\s*/) : raw
    if (Array.isArray(parts)) {
      q.options = parts.map((text, i) => ({
        text: String(text).trim(),
        key: String.fromCharCode(65 + i),
        isCorrect: false,
      }))
    }
  }

  const correct = get('correctAnswer', 'correct_answer', 'correctanswer', 'answer')
  if (correct) q.correctAnswer = correct

  return q
}

function extractQuestionsFromText(text, userId) {
  const lines = text.split('\n').filter(Boolean)
  const questions = []
  let current = null

  for (const line of lines) {
    const trimmed = line.trim()
    if (/^\d+[.)]\s/.test(trimmed) || trimmed.startsWith('Q:')) {
      if (current) questions.push(current)
      current = {
        title: trimmed.replace(/^\d+[.)]\s/, '').replace(/^Q:\s*/, ''),
        description: '',
        questionType: 'single_correct',
        difficulty: 'medium',
        marks: 1,
        negativeMarks: 0,
        options: [],
        createdBy: userId,
        updatedBy: userId,
        source: 'imported',
        status: 'draft',
      }
    } else if (current && /^[A-D][.)]\s/.test(trimmed)) {
      current.options.push({
        text: trimmed.replace(/^[A-D][.)]\s*/, ''),
        key: trimmed[0],
        isCorrect: false,
      })
    }
  }
  if (current) questions.push(current)
  return questions
}

export async function importFile(file, userId) {
  const { buffer, mimetype, originalname } = file
  let questions = []

  try {
    switch (mimetype) {
      case 'text/csv':
        questions = parseCSV(buffer).map((row) => mapRowToQuestion(row, userId))
        break
      case 'application/json':
        questions = parseJSON(buffer).map((row) => mapRowToQuestion(row, userId))
        break
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        questions = parseExcel(buffer).map((row) => mapRowToQuestion(row, userId))
        break
      case 'application/pdf': {
        const pdfText = await parsePDF(buffer)
        questions = extractQuestionsFromText(pdfText, userId)
        break
      }
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
        const docxText = await parseDOCX(buffer)
        questions = extractQuestionsFromText(docxText, userId)
        break
      }
      case 'text/plain': {
        const txt = parseTXT(buffer)
        questions = extractQuestionsFromText(txt, userId)
        break
      }
      default:
        throw new ValidationError([{ field: 'file', message: `Unsupported format: ${originalname}` }])
    }
  } catch (err) {
    if (err.isOperational) throw err
    throw new ValidationError([{ field: 'file', message: `Failed to parse file: ${err.message}` }])
  }

  if (questions.length === 0) {
    throw new ValidationError([{ field: 'file', message: 'No questions could be extracted from this file. Use format: "1. Question text" followed by "A) Option" lines.' }])
  }

  const created = []
  const errors = []
  for (let i = 0; i < questions.length; i++) {
    const qData = questions[i]
    try {
      const question = await Question.create(qData)
      await QuestionVersion.create({
        question: question._id,
        version: 1,
        data: question.toObject(),
        changes: 'Imported from file',
        changedBy: userId,
      })
      created.push(question)
    } catch (err) {
      const detail = err.name === 'ValidationError'
        ? Object.values(err.errors).map((e) => e.message).join('; ')
        : err.message
      errors.push({ question: qData.title, error: detail })
    }
  }

  if (created.length === 0) {
    throw new ValidationError([{ field: 'file', message: `Could not import any questions. Errors: ${errors.map((e) => e.error).join('; ')}` }])
  }

  return { count: created.length, questions: created, errors: errors.length > 0 ? errors : undefined }
}
