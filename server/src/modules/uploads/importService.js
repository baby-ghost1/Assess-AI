import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import { parseCSV, parseJSON, parseExcel, parsePDF, parseDOCX, parseTXT } from './fileParser.js'
import { ValidationError } from '../../shared/errors/AppError.js'

function mapRowToQuestion(row, userId) {
  const q = {
    title: row.title || row.question || row.name || 'Untitled',
    description: row.description || '',
    questionType: row.type || row.questionType || row.question_type || 'single_correct',
    difficulty: row.difficulty || 'medium',
    marks: Number(row.marks) || 1,
    negativeMarks: Number(row.negativeMarks) || 0,
    category: row.category || '',
    createdBy: userId,
    updatedBy: userId,
    source: 'imported',
    status: 'draft',
  }

  if (['single_correct', 'multi_correct'].includes(q.questionType) && row.options) {
    const parts = typeof row.options === 'string' ? row.options.split('|') : row.options
    q.options = parts.map((text, i) => ({
      text: text.trim(),
      key: String.fromCharCode(65 + i),
    }))
  }

  if (row.correctAnswer) q.correctAnswer = row.correctAnswer

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
      })
    }
  }
  if (current) questions.push(current)
  return questions
}

export async function importFile(file, userId) {
  const { buffer, mimetype, originalname } = file
  let questions = []

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

  if (questions.length === 0) {
    throw new ValidationError([{ field: 'file', message: 'No questions could be extracted from this file' }])
  }

  const created = []
  for (const qData of questions) {
    const question = await Question.create(qData)
    await QuestionVersion.create({
      question: question._id,
      version: 1,
      data: question.toObject(),
      changes: 'Imported from file',
      changedBy: userId,
    })
    created.push(question)
  }

  return { count: created.length, questions: created }
}
