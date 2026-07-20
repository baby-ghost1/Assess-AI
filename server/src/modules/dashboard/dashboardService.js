import Assessment from '../assessments/Assessment.js'
import Attempt from '../assessments/Attempt.js'
import Question from '../questions/Question.js'

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '🌅' }
  if (h < 17) return { text: 'Good afternoon', emoji: '☀️' }
  return { text: 'Good evening', emoji: '🌙' }
}

function calculateStreak(attempts) {
  if (attempts.length === 0) return 0
  const days = [...new Set(attempts.map((a) => new Date(a.createdAt).toDateString()))]
  days.sort((a, b) => new Date(b) - new Date(a))
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  if (days[0] !== today && days[0] !== yesterday) return 0
  let streak = 1
  for (let i = 0; i < days.length - 1; i++) {
    const curr = new Date(days[i])
    const prev = new Date(days[i + 1])
    const diff = (curr - prev) / 86400000
    if (diff === 1) streak++
    else break
  }
  return streak
}

function calculateXP(completed, passed, avgScore) {
  let xp = completed * 50
  xp += passed * 25
  xp += Math.floor(avgScore * 2)
  return xp
}

function getLevel(xp) {
  const levels = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]
  let level = 1
  for (let i = 1; i < levels.length; i++) {
    if (xp >= levels[i]) level = i + 1
    else break
  }
  const currentMin = levels[level - 1] || 0
  const nextMin = levels[level] || levels[levels.length - 1] + 1000
  const progress = ((xp - currentMin) / (nextMin - currentMin)) * 100
  return { level, xp, currentMin, nextMin, progress: Math.min(progress, 100) }
}

function getAchievements(completed, passed, passRate, streak, avgScore) {
  const achievements = []
  if (completed >= 1) achievements.push({ id: 'first_step', title: 'First Step', desc: 'Completed your first assessment', icon: '🎯', color: 'bg-primary/10 text-primary' })
  if (completed >= 5) achievements.push({ id: 'getting_started', title: 'Getting Started', desc: 'Completed 5 assessments', icon: '📚', color: 'bg-blue-500/10 text-blue-500' })
  if (completed >= 10) achievements.push({ id: 'dedicated', title: 'Dedicated Learner', desc: 'Completed 10 assessments', icon: '🏅', color: 'bg-amber-500/10 text-amber-500' })
  if (completed >= 25) achievements.push({ id: 'quarter_century', title: 'Quarter Century', desc: 'Completed 25 assessments', icon: '🏆', color: 'bg-purple-500/10 text-purple-500' })
  if (completed >= 50) achievements.push({ id: 'half_century', title: 'Half Century', desc: 'Completed 50 assessments', icon: '👑', color: 'bg-yellow-500/10 text-yellow-500' })
  if (passed >= 1) achievements.push({ id: 'first_pass', title: 'First Pass', desc: 'Passed your first assessment', icon: '✅', color: 'bg-emerald-500/10 text-emerald-500' })
  if (passRate >= 80 && completed >= 3) achievements.push({ id: 'high_achiever', title: 'High Achiever', desc: '80%+ pass rate', icon: '⭐', color: 'bg-amber-500/10 text-amber-500' })
  if (avgScore >= 90 && completed >= 3) achievements.push({ id: 'perfectionist', title: 'Perfectionist', desc: '90%+ average score', icon: '💎', color: 'bg-cyan-500/10 text-cyan-500' })
  if (streak >= 3) achievements.push({ id: 'on_fire', title: 'On Fire', desc: '3 day streak', icon: '🔥', color: 'bg-red-500/10 text-red-500' })
  if (streak >= 7) achievements.push({ id: 'unstoppable', title: 'Unstoppable', desc: '7 day streak', icon: '⚡', color: 'bg-amber-500/10 text-amber-500' })
  return achievements
}

function getWeakAreas(typeDistribution, typeScores) {
  const weak = []
  for (const [type, scores] of Object.entries(typeScores)) {
    if (scores.length >= 2) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      if (avg < 60) {
        weak.push({ area: type, avgScore: Math.round(avg), attempts: scores.length })
      }
    }
  }
  return weak.sort((a, b) => a.avgScore - b.avgScore).slice(0, 3)
}

export async function getCandidateDashboard(userId) {
  const attempts = await Attempt.find({ user: userId })
    .populate('assessment', 'title assessmentType difficulty passingPercentage')
    .sort({ createdAt: -1 })

  const totalAttempts = attempts.length
  const completed = attempts.filter((a) => a.status === 'completed')
  const passed = completed.filter((a) => a.passed)
  const passRate = completed.length > 0 ? (passed.length / completed.length) * 100 : 0
  const avgScore = completed.length > 0
    ? completed.reduce((acc, a) => acc + a.percentage, 0) / completed.length
    : 0

  const byType = {}
  const typeScores = {}
  attempts.forEach((a) => {
    const t = a.assessment?.assessmentType || 'unknown'
    byType[t] = (byType[t] || 0) + 1
    if (a.status === 'completed') {
      if (!typeScores[t]) typeScores[t] = []
      typeScores[t].push(a.percentage)
    }
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
      type: a.assessment?.assessmentType || 'quiz',
      difficulty: a.assessment?.difficulty || 'medium',
    }))

  const streak = calculateStreak(completed)
  const xp = calculateXP(completed.length, passed.length, avgScore)
  const levelInfo = getLevel(xp)
  const achievements = getAchievements(completed.length, passed.length, passRate, streak, avgScore)
  const weakAreas = getWeakAreas(byType, typeScores)

  const scoreTrend = completed.slice(0, 10).reverse().map((a) => ({
    score: a.percentage,
    title: a.assessment?.title || 'Unknown',
    date: a.createdAt,
  }))

  const weeklyGoal = { target: 5, completed: completed.filter((a) => {
    const d = new Date(a.createdAt)
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()))
    weekStart.setHours(0, 0, 0, 0)
    return d >= weekStart
  }).length }

  const allAssessments = await Assessment.find({ status: 'approved' }).select('title assessmentType difficulty').limit(20)
  const attemptedIds = new Set(attempts.map((a) => a.assessment?._id?.toString()))
  const recommended = allAssessments
    .filter((a) => !attemptedIds.has(a._id.toString()))
    .slice(0, 3)
    .map((a) => ({ id: a._id, title: a.title, type: a.assessmentType, difficulty: a.difficulty }))

  return {
    greeting: getGreeting(),
    totalAttempts,
    completed: completed.length,
    passed: passed.length,
    passRate: Math.round(passRate * 100) / 100,
    avgScore: Math.round(avgScore * 100) / 100,
    typeDistribution: byType,
    recentActivity,
    pendingAssessments,
    streak,
    xp,
    level: levelInfo,
    achievements,
    weakAreas,
    scoreTrend,
    weeklyGoal,
    recommended,
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
