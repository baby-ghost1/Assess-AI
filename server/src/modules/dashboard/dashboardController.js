import * as dashboardService from './dashboardService.js'

export async function getCandidateDashboard(req, res, next) {
  try {
    const data = await dashboardService.getCandidateDashboard(req.user._id)
    res.json({ success: true, data, message: 'Candidate dashboard fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getSetterDashboard(req, res, next) {
  try {
    const data = await dashboardService.getSetterDashboard(req.user._id)
    res.json({ success: true, data, message: 'Setter dashboard fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}
