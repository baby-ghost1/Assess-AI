import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import * as dashboardController from './dashboardController.js'

const router = Router()

router.use(authenticate)

router.get('/candidate', dashboardController.getCandidateDashboard)
router.get('/setter', dashboardController.getSetterDashboard)

export default router
