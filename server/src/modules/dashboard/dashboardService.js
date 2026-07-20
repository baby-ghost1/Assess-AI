import Assessment from '../assessments/Assessment.js'
import Attempt from '../assessments/Attempt.js'
import Question from '../questions/Question.js'

export async function getCandidateDashboard(userId) {
  const attempts = await Attempt.find({ user: userId })
    .populate('assessment', 'title assessmentType difficulty')
    .sort({ createdAt: -1 })

  const totalAttempts = attempts.length
  const completed = attempts.filter((a) => a.status === 'completed')
  const passed = completed.filter((a) => a.passed)
  const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0
  const avgScore = completed.length > 0
    ? completed.reduce((acc, a) => acc + a.percentage, 0) / completed.length
    : 0

  const byType = {}
  attempts.forEach((a) => {
    const t = a.assessment?.assessmentType || 'unknown'
    byType[t] = (byType[t] || 0) + 1
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

  const pendingAssessments = attempts
    .filter((a) => a.status === 'in_progress')
    .map((a) => ({
      id: a._id,
      title: a.assessment?.title || 'Unknown',
      startedAt: a.startedAt,
    }))

  return {
    totalAttempts,
    completed: completed.length,
    passed: passed.length,
    passRate: Math.round(passRate * 100) / 100,
    avgScore: Math.round(avgScore * 100) / 100,
    typeDistribution: byType,
    recentActivity,
    pendingAssessments,
  }
}

export async function getSetterDashboard(userId) {
  const [totalQuestions, totalAssessments, pendingQuestions, assessments] = await Promise.all([
    Question.countDocuments({ createdBy: userId }),
    Assessment.countDocuments({ createdBy: userId }),
    Question.countDocuments({ createdBy: userId, status: 'pending_review' }),
    Assessment.find({ createdBy: userId })
      .select('title status createdAt totalAttempts averageScore')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
  ])

  const assessmentIds = assessments.map((a) => a._id)
  let totalAttempts = 0
  let totalScoreSum = 0
  let totalScoreCount = 0

  if (assessmentIds.length > 0) {
    const attemptStats = await Attempt.aggregate([
      { $match: { assessment: { $in: assessmentIds }, status: 'completed' } },
      { $group: { _id: null, total: { $sum: 1 }, avgSum: { $sum: '$percentage' }, count: { $sum: 1 } } },
    ])
    if (attemptStats.length > 0) {
      totalAttempts = attemptStats[0].total
      totalScoreSum = attemptStats[0].avgSum
      totalScoreCount = attemptStats[0].count
    }
  }

  const avgScore = totalScoreCount > 0 ? totalScoreSum / totalScoreCount : 0

  const recentAssessments = assessments.map((a) => ({
    id: a._id,
    title: a.title,
    status: a.status,
    attempts: a.totalAttempts || 0,
    avgScore: a.averageScore || 0,
    createdAt: a.createdAt,
  }))

  return {
    totalQuestions,
    totalAssessments,
    totalAttempts,
    avgScore: Math.round(avgScore * 100) / 100,
    pendingApprovals: pendingQuestions,
    recentAssessments,
  }
}
