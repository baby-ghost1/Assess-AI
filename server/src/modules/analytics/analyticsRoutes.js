import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as analyticsController from './analyticsController.js'

const router = Router()

router.use(authenticate)

router.get('/me', analyticsController.getUserAnalytics)
router.get('/assessment/:id', analyticsController.getAssessmentAnalytics)
router.get('/question/:id', analyticsController.getQuestionAnalytics)
router.get('/insights', analyticsController.getInsights)
router.get('/insights/admin', authorize('admin'), analyticsController.getAdminInsights)
router.get('/report', analyticsController.downloadReport)
router.get('/report/admin', authorize('admin'), analyticsController.downloadReport)
router.get('/leaderboard', analyticsController.getLeaderboard)
router.get('/admin', authorize('admin'), analyticsController.getAdminAnalytics)
router.get('/setter', authorize('setter', 'admin'), analyticsController.getSetterAnalytics)

export default router
