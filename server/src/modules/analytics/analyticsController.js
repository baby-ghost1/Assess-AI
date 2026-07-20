import * as analyticsService from './analyticsService.js'

export async function getUserAnalytics(req, res, next) {
  try {
    const data = await analyticsService.getUserAnalytics(req.user._id)
    res.json({ success: true, data, message: 'Analytics fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getAssessmentAnalytics(req, res, next) {
  try {
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

export async function getQuestionAnalytics(req, res, next) {
  try {
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
    res.json({ success: true, data, message: 'Leaderboard fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function downloadReport(req, res, next) {
  try {
    const type = req.query.type || 'user'
    const format = req.query.format || 'csv'
    let data

    if (type === 'user') {
      data = await analyticsService.getUserAnalytics(req.user._id)
    } else     if (type === 'assessment' && req.query.id) {
      data = await analyticsService.getAssessmentAnalytics(req.query.id)
    } else {
      data = await analyticsService.getAdminAnalytics()
    }

    if (format === 'csv') {
      let csv = ''
      if (type === 'user') {
        csv = 'Date,Assessment,Score,Passed\n'
        data.scores.forEach((s) => {
          csv += `${s.date},${s.assessment},${s.score},${s.passed}\n`
        })
      } else if (type === 'assessment') {
        csv = 'Question,Type,Difficulty,Correct,Incorrect,Skipped,Correct%,AvgTime\n'
        data.questionStats.forEach((qs) => {
          csv += `${qs.title},${qs.type},${qs.difficulty},${qs.correct},${qs.incorrect},${qs.skipped},${qs.correctPercentage},${qs.avgTime}\n`
        })
      } else {
        csv = 'Metric,Value\n'
        csv += `Total Users,${data.totalUsers}\nTotal Assessments,${data.totalAssessments}\nTotal Attempts,${data.totalAttempts}\nTotal Questions,${data.totalQuestions}\nCompleted Attempts,${data.completedAttempts}\nPass Rate,${data.passRate}%\n`
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
