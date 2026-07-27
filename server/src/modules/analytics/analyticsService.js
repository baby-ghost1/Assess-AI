import Attempt from '../assessments/Attempt.js'
import Submission from '../assessments/Submission.js'
import Assessment from '../assessments/Assessment.js'
import Question from '../questions/Question.js'
import { generateInsights } from '../ai/aiProviders.js'

// ─── User Analytics ─────────────────────────────────────

export async function getUserAnalytics(userId) {
  const attempts = await Attempt.find({ user: userId })
    .populate('assessment', 'title assessmentType difficulty passingPercentage')
    .sort({ createdAt: -1 })

  const totalAttempts = attempts.length
  const completed = attempts.filter((a) => a.status === 'completed')
  const passed = completed.filter((a) => a.passed)
  const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0
  const avgScore = completed.length > 0 ? completed.reduce((acc, a) => acc + a.percentage, 0) / completed.length : 0

  const scores = completed.map((a) => ({
    date: a.completedAt || a.createdAt,
    score: a.percentage,
    assessment: a.assessment?.title || 'Unknown',
    passed: a.passed,
  }))

  const typeDistribution = {}
  attempts.forEach((a) => {
    const type = a.assessment?.assessmentType || 'unknown'
    typeDistribution[type] = (typeDistribution[type] || 0) + 1
  })

  const recentActivity = attempts.slice(0, 10).map((a) => ({
    id: a._id,
    title: a.assessment?.title || 'Unknown',
    type: a.assessment?.assessmentType || 'quiz',
    score: a.percentage,
    passed: a.passed,
    date: a.createdAt,
    status: a.status,
  }))

  return {
    totalAttempts,
    completed: completed.length,
    passed: passed.length,
    passRate: Math.round(passRate * 100) / 100,
    avgScore: Math.round(avgScore * 100) / 100,
    scores,
    typeDistribution,
    recentActivity,
  }
}

// ─── Assessment Analytics ───────────────────────────────

export async function getAssessmentAnalytics(assessmentId) {
  const assessment = await Assessment.findById(assessmentId)
  if (!assessment) throw new Error('Assessment not found')

  const attempts = await Attempt.find({ assessment: assessmentId, status: 'completed' })
  const totalAttempts = attempts.length
  const passed = attempts.filter((a) => a.passed)
  const passRate = totalAttempts > 0 ? (passed.length / totalAttempts) * 100 : 0
  const avgScore = totalAttempts > 0 ? attempts.reduce((acc, a) => acc + a.percentage, 0) / totalAttempts : 0

  const scoreDistribution = []
  const buckets = [0, 20, 40, 60, 80, 100]
  for (let i = 0; i < buckets.length - 1; i++) {
    const count = attempts.filter((a) => a.percentage >= buckets[i] && a.percentage < buckets[i + 1]).length
    scoreDistribution.push({ range: `${buckets[i]}-${buckets[i + 1]}%`, count })
  }
  scoreDistribution.push({ range: '100%', count: attempts.filter((a) => a.percentage === 100).length })

  const submissions = await Submission.find({ assessment: assessmentId }).populate('question')

  const questionStats = {}
  submissions.forEach((s) => {
    if (!s.question) return
    const qId = s.question._id.toString()
    if (!questionStats[qId]) {
      questionStats[qId] = {
        questionId: qId,
        title: s.question.title,
        type: s.question.questionType,
        difficulty: s.question.difficulty,
        total: 0,
        correct: 0,
        incorrect: 0,
        skipped: 0,
        avgTime: 0,
        totalTime: 0,
      }
    }
    questionStats[qId].total++
    if (s.isCorrect) questionStats[qId].correct++
    else if (s.isAnswered) questionStats[qId].incorrect++
    else questionStats[qId].skipped++
    questionStats[qId].totalTime += s.timeSpent || 0
  })

  Object.values(questionStats).forEach((qs) => {
    qs.correctPercentage = qs.total > 0 ? Math.round((qs.correct / qs.total) * 100) : 0
    qs.avgTime = qs.total > 0 ? Math.round(qs.totalTime / qs.total) : 0
    delete qs.totalTime
  })

  return {
    assessmentId,
    title: assessment.title,
    totalAttempts,
    passed: passed.length,
    passRate: Math.round(passRate * 100) / 100,
    avgScore: Math.round(avgScore * 100) / 100,
    scoreDistribution,
    questionStats: Object.values(questionStats),
    recentAttempts: attempts.slice(0, 20).map((a) => ({
      id: a._id,
      userId: a.user,
      score: a.percentage,
      passed: a.passed,
      date: a.completedAt,
      timeSpent: a.totalTimeSpent,
    })),
  }
}

// ─── Setter Analytics ───────────────────────────────────

export async function getSetterAnalytics(userId) {
  const [questions, assessments] = await Promise.all([
    Question.find({ createdBy: userId }).select('title questionType difficulty status source createdAt').lean(),
    Assessment.find({ createdBy: userId }).select('title status assessmentType createdAt').lean(),
  ])

  const questionStats = {
    total: questions.length,
    draft: questions.filter((q) => q.status === 'draft').length,
    pending: questions.filter((q) => q.status === 'pending_review').length,
    approved: questions.filter((q) => q.status === 'approved').length,
    rejected: questions.filter((q) => q.status === 'rejected').length,
  }

  const byType = {}
  const byDifficulty = {}
  questions.forEach((q) => {
    byType[q.questionType] = (byType[q.questionType] || 0) + 1
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] || 0) + 1
  })

  const assessmentStats = {
    total: assessments.length,
    draft: assessments.filter((a) => a.status === 'draft').length,
    published: assessments.filter((a) => a.status === 'published').length,
  }

  const assessmentIds = assessments.map((a) => a._id)

  let totalAttempts = 0
  let totalScoreSum = 0
  let passedCount = 0
  let scoreDistribution = { '0-20': 0, '20-40': 0, '40-60': 0, '60-80': 0, '80-100': 0 }
  let perAssessment = {}

  assessments.forEach((a) => {
    perAssessment[a._id.toString()] = { title: a.title, status: a.status, attempts: 0, passed: 0, totalScore: 0 }
  })

  if (assessmentIds.length > 0) {
    const attempts = await Attempt.find({ assessment: { $in: assessmentIds }, status: 'completed' })
      .populate('assessment', 'title')
      .lean()

    totalAttempts = attempts.length

    attempts.forEach((a) => {
      totalScoreSum += a.percentage || 0
      if (a.passed) passedCount++

      const pct = a.percentage || 0
      if (pct < 20) scoreDistribution['0-20']++
      else if (pct < 40) scoreDistribution['20-40']++
      else if (pct < 60) scoreDistribution['40-60']++
      else if (pct < 80) scoreDistribution['60-80']++
      else scoreDistribution['80-100']++

      const aId = a.assessment?._id?.toString()
      if (aId && perAssessment[aId]) {
        perAssessment[aId].attempts++
        if (a.passed) perAssessment[aId].passed++
        perAssessment[aId].totalScore += a.percentage || 0
      }
    })
  }

  const avgScore = totalAttempts > 0 ? Math.round((totalScoreSum / totalAttempts) * 100) / 100 : 0
  const passRate = totalAttempts > 0 ? Math.round((passedCount / totalAttempts) * 100 * 100) / 100 : 0

  const assessmentPerformance = Object.values(perAssessment)
    .map((a) => ({
      title: a.title,
      status: a.status,
      attempts: a.attempts,
      passed: a.passed,
      avgScore: a.attempts > 0 ? Math.round(a.totalScore / a.attempts) : 0,
      passRate: a.attempts > 0 ? Math.round((a.passed / a.attempts) * 100) : 0,
    }))
    .sort((a, b) => b.attempts - a.attempts)

  const questionIds = questions.filter((q) => q.status === 'approved').map((q) => q._id)
  let questionPerformance = []

  if (questionIds.length > 0) {
    const submissions = await Submission.find({ question: { $in: questionIds } })
      .populate('question', 'title questionType difficulty')
      .lean()

    const qStats = {}
    submissions.forEach((s) => {
      if (!s.question) return
      const qId = s.question._id.toString()
      if (!qStats[qId]) {
        qStats[qId] = { title: s.question.title, type: s.question.questionType, difficulty: s.question.difficulty, total: 0, correct: 0, skipped: 0, totalTime: 0 }
      }
      qStats[qId].total++
      if (s.isCorrect) qStats[qId].correct++
      else if (!s.isAnswered) qStats[qId].skipped++
      qStats[qId].totalTime += s.timeSpent || 0
    })

    questionPerformance = Object.values(qStats).map((q) => ({
      title: q.title,
      type: q.type,
      difficulty: q.difficulty,
      total: q.total,
      correct: q.total > 0 ? Math.round((q.correct / q.total) * 100) : 0,
      skipped: q.total > 0 ? Math.round((q.skipped / q.total) * 100) : 0,
      avgTime: q.total > 0 ? Math.round(q.totalTime / q.total) : 0,
    })).sort((a, b) => b.total - a.total).slice(0, 20)
  }

  const recentAttempts = await Attempt.find({ assessment: { $in: assessmentIds } })
    .populate('user', 'name email')
    .populate('assessment', 'title')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  return {
    questions: questionStats,
    questionTypes: byType,
    questionDifficulty: byDifficulty,
    assessments: assessmentStats,
    totalAttempts,
    avgScore,
    passRate,
    passedCount,
    scoreDistribution,
    assessmentPerformance,
    questionPerformance,
    recentAttempts: recentAttempts.map((a) => ({
      user: a.user?.name || 'Unknown',
      assessment: a.assessment?.title || 'Unknown',
      score: a.percentage,
      passed: a.passed,
      date: a.createdAt,
    })),
  }
}

// ─── Admin Dashboard ────────────────────────────────────

export async function getAdminAnalytics() {
  const [
    totalUsers,
    totalAssessments,
    totalAttempts,
    totalQuestions,
    completedAttempts,
    recentAttempts,
    assessmentStats,
  ] = await Promise.all([
    (await import('../users/User.js')).default.countDocuments(),
    Assessment.countDocuments(),
    Attempt.countDocuments(),
    Question.countDocuments(),
    Attempt.countDocuments({ status: 'completed' }),
    Attempt.find()
      .populate('user', 'name email')
      .populate('assessment', 'title')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    Assessment.aggregate([
      { $group: { _id: '$assessmentType', count: { $sum: 1 } } },
    ]),
  ])

  const passRate = completedAttempts > 0
    ? Math.round((await Attempt.countDocuments({ status: 'completed', passed: true })) / completedAttempts * 100 * 100) / 100
    : 0

  return {
    totalUsers,
    totalAssessments,
    totalAttempts,
    totalQuestions,
    completedAttempts,
    passRate,
    assessmentTypeDistribution: assessmentStats.map((a) => ({ type: a._id, count: a.count })),
    recentAttempts: recentAttempts.map((a) => ({
      id: a._id,
      user: a.user?.name || 'Unknown',
      assessment: a.assessment?.title || 'Unknown',
      score: a.percentage,
      passed: a.passed,
      date: a.createdAt,
      status: a.status,
    })),
  }
}

// ─── Question Analytics ─────────────────────────────────

export async function getQuestionAnalytics(questionId) {
  const submissions = await Submission.find({ question: questionId }).populate('question')

  const total = submissions.length
  const correct = submissions.filter((s) => s.isCorrect).length
  const incorrect = submissions.filter((s) => s.isAnswered && !s.isCorrect).length
  const skipped = submissions.filter((s) => !s.isAnswered).length

  const difficultyIndex = total > 0 ? 1 - (correct / total) : 0

  return {
    questionId,
    total,
    correct,
    incorrect,
    skipped,
    correctPercentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    difficultyIndex: Math.round(difficultyIndex * 100) / 100,
    interpretation: difficultyIndex < 0.3 ? 'Easy' : difficultyIndex < 0.7 ? 'Medium' : 'Hard',
  }
}

// ─── Leaderboard ────────────────────────────────────────

import User from '../users/User.js'

export async function getLeaderboard(currentUser) {
  const match = {}
  if (currentUser.role === 'candidate') {
    match.role = 'candidate'
  }

  const users = await User.find(match).select('name email role')
  const userIds = users.map((u) => u._id)

  const stats = await Attempt.aggregate([
    { $match: { user: { $in: userIds }, status: 'completed' } },
    { $group: { _id: '$user', avgScore: { $avg: '$percentage' }, totalAssessments: { $sum: 1 }, totalScore: { $sum: '$percentage' } } },
    { $sort: { avgScore: -1 } },
    { $limit: 50 },
  ])

  const userMap = {}
  users.forEach((u) => { userMap[u._id.toString()] = u })

  return stats.map((s) => {
    const u = userMap[s._id.toString()] || {}
    return {
      _id: s._id,
      name: u.name || 'Unknown',
      email: u.email,
      role: u.role,
      avgScore: Math.round(s.avgScore * 100) / 100,
      totalAssessments: s.totalAssessments,
    }
  })
}

// ─── AI-Powered Insights ────────────────────────────────

const insightsCache = new Map()
const CACHE_TTL = 1000 * 60 * 30

function getCacheKey(userId, scope, providerName) {
  return `${userId}:${scope}:${providerName || 'default'}`
}

function getCachedInsights(key) {
  const cached = insightsCache.get(key)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
  insightsCache.delete(key)
  return null
}

function setCachedInsights(key, data) {
  if (insightsCache.size > 100) {
    const oldest = insightsCache.entries().next().value
    if (oldest) insightsCache.delete(oldest[0])
  }
  insightsCache.set(key, { data, timestamp: Date.now() })
}

function buildFallbackInsights(analyticsData, scope) {
  if (scope === 'user' && analyticsData) {
    const passRate = analyticsData.passRate ?? 50
    const avgScore = analyticsData.avgScore ?? 0
    return {
      overallAssessment: `You've completed ${analyticsData.totalAttempts || 0} assessments with an average score of ${avgScore}%.`,
      strengths: passRate >= 60 ? ['Good pass rate', 'Consistent performance'] : ['Started your learning journey'],
      weaknesses: passRate < 60 ? ['Room for improvement in pass rate'] : ['Keep pushing to reach higher scores'],
      recommendations: [
        passRate < 60 ? 'Review incorrect answers and retry assessments' : 'Challenge yourself with harder assessments',
        'Practice regularly to maintain consistency',
      ],
      improvementTips: ['Focus on areas where you scored lowest', 'Use the question bank for targeted practice'],
      estimatedProficiency: avgScore >= 80 ? 'advanced' : avgScore >= 60 ? 'intermediate' : 'beginner',
      focusAreas: ['Core concepts review', 'Practice assessments'],
    }
  }
  if (scope === 'admin' && analyticsData) {
    return {
      overallAssessment: `Platform has ${analyticsData.totalUsers || 0} users and ${analyticsData.totalAssessments || 0} assessments.`,
      keyMetrics: [
        `Total Users: ${analyticsData.totalUsers || 0}`,
        `Total Assessments: ${analyticsData.totalAssessments || 0}`,
        `Total Attempts: ${analyticsData.totalAttempts || 0}`,
        `Pass Rate: ${analyticsData.passRate || 0}%`,
      ],
      recommendations: ['Encourage more user participation', 'Create diverse assessment types'],
      growthOpportunities: ['Expand question bank', 'Increase user engagement'],
    }
  }
  return {
    overallAssessment: 'Performance data is being analyzed.',
    strengths: ['Activity recorded'],
    weaknesses: ['More data needed for detailed insights'],
    recommendations: ['Complete more assessments for personalized insights'],
    improvementTips: ['Regular practice leads to better results'],
    estimatedProficiency: 'beginner',
    focusAreas: ['Getting started with assessments'],
  }
}

export async function getAIInsights(userId, scope = 'user', providerName) {
  const cacheKey = getCacheKey(userId, scope, providerName)
  const cached = getCachedInsights(cacheKey)
  if (cached) return cached

  let analyticsData
  if (scope === 'user') {
    analyticsData = await getUserAnalytics(userId)
  } else if (scope === 'assessment') {
    const attempts = await Attempt.find({ user: userId, status: 'completed' })
      .populate('assessment', 'title')
      .sort({ createdAt: -1 })
      .limit(5)
    analyticsData = {
      recentScores: attempts.map((a) => ({ title: a.assessment?.title, score: a.percentage, passed: a.passed })),
      avgScore: attempts.length > 0 ? attempts.reduce((a, b) => a + b.percentage, 0) / attempts.length : 0,
      passRate: attempts.length > 0 ? (attempts.filter((a) => a.passed).length / attempts.length) * 100 : 0,
    }
  } else if (scope === 'admin') {
    analyticsData = await getAdminAnalytics()
  }

  try {
    const insights = await generateInsights(analyticsData, scope, providerName)
    const result = { success: true, insights, source: 'ai' }
    setCachedInsights(cacheKey, result)
    return result
  } catch (error) {
    const fallback = buildFallbackInsights(analyticsData, scope)
    const result = { success: true, insights: fallback, source: 'fallback' }
    setCachedInsights(cacheKey, result)
    return result
  }
}
