import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as analyticsController from './analyticsController.js'

const router = Router()
const adminRouter = Router()
const setterRouter = Router()

router.use(authenticate)

// Common analytics routes
router.get('/me', analyticsController.getUserAnalytics)
router.get('/assessment/:id', analyticsController.getAssessmentAnalytics)
router.get('/question/:id', analyticsController.getQuestionAnalytics)
router.get('/insights', analyticsController.getInsights)
router.get('/report', analyticsController.downloadReport)
router.get('/leaderboard', analyticsController.getLeaderboard)

// Admin analytics (mounted at /api/v1/admin/analytics)
adminRouter.use(authenticate)
adminRouter.get('/', authorize('admin'), analyticsController.getAdminAnalytics)
adminRouter.get('/insights', authorize('admin'), analyticsController.getAdminInsights)
adminRouter.get('/report', authorize('admin'), analyticsController.downloadReport)

// Setter analytics (mounted at /api/v1/setter/analytics)
setterRouter.use(authenticate)
setterRouter.get('/', authorize('setter', 'admin'), analyticsController.getSetterAnalytics)

export default router
export { adminRouter, setterRouter }
