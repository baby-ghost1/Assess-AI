import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as dashboardController from './dashboardController.js'

const router = Router()

router.use(authenticate)

router.get('/candidate', authorize('candidate', 'admin'), dashboardController.getCandidateDashboard)
router.get('/setter', authorize('setter', 'admin'), dashboardController.getSetterDashboard)

export default router
