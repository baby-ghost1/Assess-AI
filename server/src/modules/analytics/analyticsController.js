import * as analyticsService from './analyticsService.js'

export async function getUserAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getUserAnalytics(req.user._id)
    res.json({ success: true, data, message: 'Analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAssessmentAnalytics(req, res, next) {
  try {
    const { default: Assessment } = await import('../assessments/Assessment.js')
    const assessment = await Assessment.findById(req.params.id).select('createdBy')
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' })
    if (req.user.role !== 'admin' && assessment.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const data = await analyticsService.getAssessmentAnalytics(req.params.id)
    res.json({ success: true, data, message: 'Assessment analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAdminAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getAdminAnalytics()
    res.json({ success: true, data, message: 'Admin analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getSetterAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getSetterAnalytics(req.user._id)
    res.json({ success: true, data, message: 'Setter analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getQuestionAnalytics(req, res, next) {
  try {
    const { default: Question } = await import('../questions/Question.js')
    const question = await Question.findById(req.params.id).select('createdBy')
    if (!question) return res.status(404).json({ success: false, message: 'Question not found' })
    if (req.user.role !== 'admin' && question.createdBy?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
    const data = await analyticsService.getQuestionAnalytics(req.params.id)
    res.json({ success: true, data, message: 'Question analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getInsights(req, res, next) {
  try {
    const provider = req.query.provider
    const data = await analyticsService.getAIInsights(req.user._id, 'user', provider)
    res.json({ success: true, data, message: 'AI insights generated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAdminInsights(req, res, next) {
  try {
    const provider = req.query.provider
    const data = await analyticsService.getAIInsights(req.user._id, 'admin', provider)
    res.json({ success: true, data, message: 'Admin insights generated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getLeaderboard(req, res, next) {
  try {
    const data = await analyticsService.getLeaderboard(req.user)
    const me = req.user?._id?.toString()
    // Never expose candidate emails to other users on the public leaderboard.
    const sanitized = data.map((entry) => ({
      ...entry,
      email: entry._id?.toString() === me ? entry.email : undefined,
    }))
    res.json({ success: true, data: sanitized, message: 'Leaderboard fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

function escapeCsv(val) {
  const str = String(val ?? '')
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export async function downloadReport(req, res, next) {
  try {
    const type = req.query.type || 'user'
    const format = req.query.format || 'csv'
    let data

    if (type === 'user') {
      data = await analyticsService.getUserAnalytics(req.user._id)
    } else if (type === 'assessment' && req.query.id) {
      const { default: Assessment } = await import('../assessments/Assessment.js')
      const assessment = await Assessment.findById(req.query.id).select('createdBy')
      if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found', errors: null, meta: null })
      if (req.user.role !== 'admin' && assessment.createdBy?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized', errors: null, meta: null })
      }
      data = await analyticsService.getAssessmentAnalytics(req.query.id)
    } else if (type === 'admin') {
      if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized', errors: null, meta: null })
      }
      data = await analyticsService.getAdminAnalytics()
    } else {
      return res.status(400).json({ success: false, message: 'Invalid report type', errors: null, meta: null })
    }

    if (format === 'csv') {
      let csv = ''
      if (type === 'user') {
        csv = 'Date,Assessment,Score,Passed\n'
        data.scores.forEach((s) => {
          csv += `${escapeCsv(s.date)},${escapeCsv(s.assessment)},${escapeCsv(s.score)},${escapeCsv(s.passed)}\n`
        })
      } else if (type === 'assessment') {
        csv = 'Question,Type,Difficulty,Correct,Incorrect,Skipped,Correct%,AvgTime\n'
        data.questionStats.forEach((qs) => {
          csv += `${escapeCsv(qs.title)},${escapeCsv(qs.type)},${escapeCsv(qs.difficulty)},${escapeCsv(qs.correct)},${escapeCsv(qs.incorrect)},${escapeCsv(qs.skipped)},${escapeCsv(qs.correctPercentage)},${escapeCsv(qs.avgTime)}\n`
        })
      } else {
        csv = 'Metric,Value\n'
        csv += `Total Users,${escapeCsv(data.totalUsers)}\nTotal Assessments,${escapeCsv(data.totalAssessments)}\nTotal Attempts,${escapeCsv(data.totalAttempts)}\nTotal Questions,${escapeCsv(data.totalQuestions)}\nCompleted Attempts,${escapeCsv(data.completedAttempts)}\nPass Rate,${escapeCsv(data.passRate)}%\n`
        data.assessmentTypeDistribution.forEach((a) => {
          csv += `Assessment Type - ${a.type},${a.count}\n`
        })
      }

      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${Date.now()}.csv`)
      return res.send(csv)
    }

    res.json({ success: true, data, message: 'Report data fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}
