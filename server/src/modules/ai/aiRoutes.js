import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { generateQuestions, getAvailableProviders, generateInsights } from './aiProviders.js'
import Assessment from '../assessments/Assessment.js'
import Attempt from '../assessments/Attempt.js'
import Submission from '../assessments/Submission.js'
import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'

const router = Router()

router.use(authenticate)
router.use(authorize('candidate', 'setter', 'admin'))

router.get('/providers', (_, res) => {
  res.json({ success: true, data: getAvailableProviders(), message: 'Providers fetched', errors: null, meta: null })
})

router.post('/generate', validate(z.object({
  topic: z.string().min(2, 'Topic required'),
  count: z.coerce.number().min(1).max(20).default(5),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  questionType: z.enum(['single_correct', 'multi_correct', 'true_false', 'fill_blanks', 'coding', 'subjective']).default('single_correct'),
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('gemini'),
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
  provider: z.enum(['gemini', 'gpt', 'claude', 'deepseek', 'openrouter', 'perplexity', 'groq', 'nvidia']).default('gemini'),
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
      const result = await generateInsights(analyticsData, 'quiz', 'gemini')
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

export default router
