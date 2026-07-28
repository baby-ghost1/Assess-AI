import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as dashboardController from './dashboardController.js'

const candidateRouter = Router()
const setterRouter = Router()

// Candidate dashboard (mounted at /api/v1/candidate/dashboard)
candidateRouter.use(authenticate)
candidateRouter.get('/', authorize('candidate', 'admin'), dashboardController.getCandidateDashboard)

// Setter dashboard (mounted at /api/v1/setter/dashboard)
setterRouter.use(authenticate)
setterRouter.get('/', authorize('setter', 'admin'), dashboardController.getSetterDashboard)

export { candidateRouter, setterRouter }
