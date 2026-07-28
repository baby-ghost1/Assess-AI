import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { aiGenerateLimiter } from '../../middleware/rateLimiter.js'
import { generateQuestions, getAvailableProviders, generateInsights, fetchFromProvider, PROVIDER_CONFIGS } from './aiProviders.js'
import Assessment from '../assessments/Assessment.js'
import Attempt from '../assessments/Attempt.js'
import Submission from '../assessments/Submission.js'
import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import { parseCSV, parseJSON, parseExcel, parsePDF, parseDOCX, parseTXT } from '../uploads/fileParser.js'
import { upload } from '../../middleware/upload.js'

const router = Router()

router.use(authenticate)
router.use(authorize('candidate', 'setter', 'admin'))

router.get('/providers', (_, res) => {
  res.json({ success: true, data: getAvailableProviders(), message: 'Providers fetched', errors: null, meta: null })
})

router.post('/generate', aiGenerateLimiter, validate(z.object({
  topic: z.string().min(2, 'Topic required'),
  count: z.coerce.number().min(1).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  questionType: z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks', 'coding', 'subjective']).default('single_correct'),
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('groq'),
  language: z.string().default('English'),
})), async (req, res, next) => {
  try {
    const { topic, count, difficulty, questionType, provider, language } = req.validatedBody
    const questions = await generateQuestions(topic, { count, difficulty, questionType, provider, language })

    const created = []
    for (const qData of questions) {
      const question = await Question.create({ ...qData, createdBy: req.user._id, updatedBy: req.user._id })
      await QuestionVersion.create({
        question: question._id, version: 1, data: question.toObject(),
        changes: `AI-generated via ${provider}`, changedBy: req.user._id,
      })
      created.push(question)
    }

    res.status(201).json({ success: true, data: { count: created.length, questions: created }, message: `${created.length} questions generated via ${provider}`, errors: null, meta: null })
  } catch (error) { next(error) }
})

router.post('/quiz/generate-and-start', validate(z.object({
  topic: z.string().min(2, 'Topic required'),
  count: z.coerce.number().min(1).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  questionTypes: z.array(z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks'])).min(1).default(['single_correct']),
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('groq'),
  timerType: z.enum(['overall', 'per_question']).default('overall'),
  timeLimit: z.coerce.number().min(0).default(600),
  language: z.string().default('English'),
})), async (req, res, next) => {
  try {
    const { topic, count, difficulty, questionTypes, provider, timerType, timeLimit, language } = req.validatedBody

    const perType = Math.max(1, Math.floor(count / questionTypes.length))
    const allQuestions = []

    for (const qt of questionTypes) {
      const qCount = qt === questionTypes[questionTypes.length - 1]
        ? count - allQuestions.length
        : perType
      if (qCount <= 0) continue
      const qs = await generateQuestions(topic, { count: qCount, difficulty, questionType: qt, provider, language })
      allQuestions.push(...qs)
    }

    const created = []
    for (const qData of allQuestions) {
      const question = await Question.create({
        ...qData,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        status: 'approved',
        source: 'ai_generated',
        isAiGenerated: true,
        aiModel: provider,
      })
      await QuestionVersion.create({
        question: question._id, version: 1, data: question.toObject(),
        changes: `AI quiz question via ${provider}`, changedBy: req.user._id,
      })
      created.push(question)
    }

    const totalMarks = created.length
    const assessment = await Assessment.create({
      title: `AI Quiz: ${topic}`,
      description: `AI-generated quiz on "${topic}" using ${provider}`,
      assessmentType: 'quiz',
      difficulty,
      sections: [{
        title: 'AI Generated Questions',
        questions: created.map((q) => q._id),
        totalMarks,
      }],
      timeLimit: timerType === 'overall' ? timeLimit : null,
      passingPercentage: 40,
      status: 'published',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isAiGenerated: true,
      aiQuizConfig: {
        timerType,
        perQuestionTime: timerType === 'per_question' ? timeLimit : null,
        questionTypes,
        aiProvider: provider,
      },
      showResultImmediately: true,
      showCorrectAnswers: true,
      maxAttempts: 1,
    })

    const questionOrder = created.map((q) => q._id)
    const attempt = await Attempt.create({
      assessment: assessment._id,
      user: req.user._id,
      timeLimit: assessment.timeLimit,
      timeRemaining: assessment.timeLimit,
      totalMarks,
      questionOrder,
      currentQuestionIndex: 0,
      status: 'in_progress',
      startedAt: new Date(),
    })

    for (let i = 0; i < questionOrder.length; i++) {
      await Submission.create({
        attempt: attempt._id,
        assessment: assessment._id,
        user: req.user._id,
        question: questionOrder[i],
        order: i,
      })
    }

    res.status(201).json({
      success: true,
      data: {
        assessmentId: assessment._id,
        attemptId: attempt._id,
        timerType,
        timeLimit,
      },
      message: 'AI quiz generated and started',
      errors: null,
      meta: null,
    })
  } catch (error) { next(error) }
})

router.get('/quiz/history', async (req, res, next) => {
  try {
    const attempts = await Attempt.find({ user: req.user._id })
      .populate({
        path: 'assessment',
        match: { isAiGenerated: true },
        select: 'title difficulty aiQuizConfig isAiGenerated',
      })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    const filtered = attempts.filter((a) => a.assessment)

    res.json({
      success: true,
      data: filtered.map((a) => ({
        attemptId: a._id,
        assessmentId: a.assessment._id,
        title: a.assessment.title,
        difficulty: a.assessment.difficulty,
        topic: a.assessment.title?.replace('AI Quiz: ', ''),
        provider: a.assessment.aiQuizConfig?.aiProvider,
        timerType: a.assessment.aiQuizConfig?.timerType,
        score: a.score,
        totalMarks: a.totalMarks,
        percentage: a.percentage,
        passed: a.passed,
        status: a.status,
        timeSpent: a.totalTimeSpent,
        startedAt: a.startedAt,
        completedAt: a.completedAt,
        totalQuestions: a.questionOrder?.length || 0,
      })),
      message: 'Quiz history fetched',
      errors: null,
      meta: null,
    })
  } catch (error) { next(error) }
})

router.get('/quiz/:attemptId/insights', async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId)
      .populate('assessment', 'title difficulty')
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })
    if (attempt.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not your attempt' })
    }

    const submissions = await Submission.find({ attempt: req.params.attemptId })
      .populate('question', 'title questionType difficulty')

    const correct = submissions.filter((s) => s.isCorrect)
    const incorrect = submissions.filter((s) => s.isAnswered && !s.isCorrect)
    const skipped = submissions.filter((s) => !s.isAnswered)

    const analyticsData = {
      quizTitle: attempt.assessment?.title,
      difficulty: attempt.assessment?.difficulty,
      totalQuestions: submissions.length,
      correct: correct.length,
      incorrect: incorrect.length,
      skipped: skipped.length,
      score: attempt.score,
      totalMarks: attempt.totalMarks,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.totalTimeSpent,
      correctTopics: correct.map((s) => s.question?.title).filter(Boolean),
      weakTopics: incorrect.map((s) => s.question?.title).filter(Boolean),
    }

    let insights
    try {
      const result = await generateInsights(analyticsData, 'quiz', 'groq')
      insights = result.insights
    } catch {
      insights = {
        overallAssessment: `You scored ${attempt.percentage}% on "${attempt.assessment?.title}".`,
        strengths: correct.length > 0
          ? [`Answered ${correct.length} questions correctly`]
          : ['Attempted the quiz'],
        weaknesses: incorrect.length > 0
          ? [`${incorrect.length} questions need review`]
          : [],
        recommendations: [
          skipped.length > 0 ? 'Try to attempt all questions next time' : 'Good job attempting all questions',
          'Review the questions you got wrong',
          'Practice similar topics to improve',
        ],
        improvementTips: ['Regular practice helps', 'Focus on weak areas'],
        estimatedProficiency: attempt.percentage >= 80 ? 'advanced' : attempt.percentage >= 60 ? 'intermediate' : 'beginner',
        focusAreas: [],
      }
    }

    res.json({ success: true, data: { insights, analytics: analyticsData }, message: 'Quiz insights generated', errors: null, meta: null })
  } catch (error) { next(error) }
})

// ─── Generate Assessment from Topic ──────────────────────

router.post('/generate-assessment', validate(z.object({
  title: z.string().min(2).max(200).optional(),
  topic: z.string().min(2, 'Topic required'),
  count: z.coerce.number().min(1).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  questionType: z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks']).default('single_correct'),
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('groq'),
  language: z.string().default('English'),
  assessmentType: z.enum(['quiz', 'coding', 'mixed']).default('quiz'),
  timeLimit: z.coerce.number().positive().optional().nullable().default(null),
  passingPercentage: z.coerce.number().min(0).max(100).default(40),
  maxAttempts: z.coerce.number().positive().default(1),
  shuffleQuestions: z.coerce.boolean().default(false),
  showResultImmediately: z.coerce.boolean().default(true),
  showCorrectAnswers: z.coerce.boolean().default(true),
  negativeMarking: z.coerce.boolean().default(false),
  negativeMarkingValue: z.coerce.number().min(0).default(0),
})), async (req, res, next) => {
  try {
    const {
      title, topic, count, difficulty, questionType, provider, language,
      assessmentType, timeLimit, passingPercentage, maxAttempts,
      shuffleQuestions, showResultImmediately, showCorrectAnswers,
      negativeMarking, negativeMarkingValue,
    } = req.validatedBody

    const questions = await generateQuestions(topic, { count, difficulty, questionType, provider, language })

    const created = []
    for (const qData of questions) {
      const question = await Question.create({
        ...qData,
        createdBy: req.user._id,
        updatedBy: req.user._id,
        status: 'draft',
        source: 'ai_generated',
        isAiGenerated: true,
        aiModel: provider,
      })
      await QuestionVersion.create({
        question: question._id, version: 1, data: question.toObject(),
        changes: `AI-generated via ${provider}`, changedBy: req.user._id,
      })
      created.push(question)
    }

    const assessment = await Assessment.create({
      title: title || `AI Assessment: ${topic}`,
      description: `AI-generated assessment on "${topic}" using ${provider}`,
      assessmentType,
      difficulty,
      sections: [{
        title: 'AI Generated Questions',
        description: `Questions generated on ${topic}`,
        questions: created.map((q) => q._id),
        totalMarks: created.length,
      }],
      timeLimit: timeLimit ? timeLimit * 60 : null,
      passingPercentage,
      maxAttempts,
      shuffleQuestions,
      showResultImmediately,
      showCorrectAnswers,
      negativeMarking,
      negativeMarkingValue,
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isAiGenerated: true,
      aiQuizConfig: {
        timerType: 'overall',
        perQuestionTime: null,
        questionTypes: [questionType],
        aiProvider: provider,
      },
    })

    res.status(201).json({ success: true, data: assessment, message: `Assessment created with ${created.length} AI-generated questions`, errors: null, meta: null })
  } catch (error) { next(error) }
})

// ─── Import Assessment from File (AI-powered) ────────────

async function extractTextFromFile(file) {
  const { buffer, mimetype } = file
  try {
    switch (mimetype) {
      case 'text/csv':
      case 'application/csv':
        return parseCSV(buffer).map((r) => Object.values(r).join(' ')).join('\n')
      case 'application/json': {
        const data = JSON.parse(buffer.toString())
        return Array.isArray(data) ? data.map((r) => JSON.stringify(r)).join('\n') : JSON.stringify(data)
      }
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        return parseExcel(buffer).map((r) => Object.values(r).join(' ')).join('\n')
      case 'application/pdf': return await parsePDF(buffer)
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return await parseDOCX(buffer)
      case 'text/plain':
      case 'text/markdown':
        return parseTXT(buffer)
      default: return ''
    }
  } catch (err) {
    return ''
  }
}

router.post('/import-assessment', upload.single('file'), validate(z.object({
  title: z.string().min(2).max(200).optional(),
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('groq'),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  assessmentType: z.enum(['quiz', 'coding', 'mixed']).default('quiz'),
  timeLimit: z.coerce.number().positive().optional().nullable().default(null),
  passingPercentage: z.coerce.number().min(0).max(100).default(40),
  language: z.string().default('English'),
})), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, message: 'No file uploaded', errors: [{ field: 'file', message: 'File is required' }], meta: null })
    }

    const fileText = await extractTextFromFile(req.file)
    if (!fileText || fileText.trim().length < 10) {
      return res.status(400).json({ success: false, data: null, message: 'Could not extract readable content from file. Ensure the file is not empty and contains text.', errors: null, meta: null })
    }

    const { title, provider, difficulty, assessmentType, timeLimit, passingPercentage, language } = req.validatedBody
    const truncatedText = fileText.slice(0, 8000)

    const prompt = `You are an expert assessment creator. Analyze the following content and generate a well-structured assessment.

Content from file:
${truncatedText}

Generate a JSON object with:
{
  "title": "Assessment title based on the content",
  "description": "Brief description of what this assessment covers",
  "questions": [
    {
      "title": "question text",
      "description": "",
      "questionType": "single_correct",
      "difficulty": "${difficulty}",
      "marks": 1,
      "options": [
        {"text": "option A", "key": "A", "isCorrect": true},
        {"text": "option B", "key": "B", "isCorrect": false},
        {"text": "option C", "key": "C", "isCorrect": false},
        {"text": "option D", "key": "D", "isCorrect": false}
      ],
      "correctAnswer": "A"
    }
  ]
}

Rules:
- Generate 10-15 high-quality questions based on the content
- Questions must test understanding, not just recall
- For single_correct: exactly 4 options A,B,C,D, one correct
- For multi_correct: 4 options, multiple correct, correctAnswer is array
- For true_false: 2 options A=True B=False
- Each question MUST have isCorrect on every option
- Return ONLY valid JSON, no markdown`

    const cfg = PROVIDER_CONFIGS[provider]
    if (!cfg?.apiKey) {
      return res.status(400).json({ success: false, data: null, message: `${provider} API key not configured`, errors: null, meta: null })
    }

    let aiResult
    try {
      if (provider === 'gemini') {
        const data = await fetchFromProvider(`${cfg.baseUrl}/models/${cfg.model}:generateContent?key=${cfg.apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 4096 },
          }),
        })
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
        aiResult = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
      } else {
        const data = await fetchFromProvider(`${cfg.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${cfg.apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: cfg.model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.3,
            max_tokens: 4096,
          }),
        })
        const text = data?.choices?.[0]?.message?.content || ''
        aiResult = JSON.parse(text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim())
      }
    } catch (parseErr) {
      return res.status(502).json({ success: false, data: null, message: 'AI provider returned an invalid response. Please try again or use a different provider.', errors: null, meta: null })
    }

    const questionsData = aiResult.questions || []
    const created = []
    for (const qData of questionsData) {
      try {
        const question = await Question.create({
          ...qData,
          createdBy: req.user._id,
          updatedBy: req.user._id,
          status: 'draft',
          source: 'imported',
          isAiGenerated: true,
          aiModel: provider,
        })
        await QuestionVersion.create({
          question: question._id, version: 1, data: question.toObject(),
          changes: `AI-imported from file via ${provider}`, changedBy: req.user._id,
        })
        created.push(question)
      } catch (qErr) {
        // Skip individual question errors, continue with others
      }
    }

    if (created.length === 0) {
      return res.status(422).json({ success: false, data: null, message: 'AI generated questions could not be saved. Please try a different file or provider.', errors: null, meta: null })
    }

    const assessment = await Assessment.create({
      title: title || aiResult.title || `Imported: ${req.file.originalname}`,
      description: aiResult.description || `Assessment imported from ${req.file.originalname}`,
      assessmentType,
      difficulty,
      sections: [{
        title: 'Imported Questions',
        description: `Questions generated from ${req.file.originalname} using AI`,
        questions: created.map((q) => q._id),
        totalMarks: created.length,
      }],
      timeLimit: timeLimit ? timeLimit * 60 : null,
      passingPercentage,
      maxAttempts: 1,
      shuffleQuestions: true,
      showResultImmediately: true,
      showCorrectAnswers: true,
      status: 'draft',
      createdBy: req.user._id,
      updatedBy: req.user._id,
      isAiGenerated: true,
      aiQuizConfig: {
        timerType: 'overall',
        perQuestionTime: null,
        questionTypes: ['single_correct'],
        aiProvider: provider,
      },
    })

    res.status(201).json({ success: true, data: assessment, message: `Assessment created from file with ${created.length} questions`, errors: null, meta: null })
  } catch (error) { next(error) }
})



export default router
