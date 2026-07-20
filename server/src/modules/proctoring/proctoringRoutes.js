import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as proctoringService from './proctoringService.js'

const router = Router()

router.use(authenticate)

router.get('/violations/attempt/:attemptId', async (req, res, next) => {
  try {
    const violations = await proctoringService.getViolations(req.params.attemptId)
    res.json({ success: true, data: violations, message: 'Violations fetched', errors: null, meta: null })
  } catch (error) { next(error) }
})

router.get('/violations/assessment/:assessmentId', authorize('admin'), async (req, res, next) => {
  try {
    const violations = await proctoringService.getViolationsByAssessment(req.params.assessmentId)
    res.json({ success: true, data: violations, message: 'Violations fetched', errors: null, meta: null })
  } catch (error) { next(error) }
})

router.get('/violations/my', async (req, res, next) => {
  try {
    const violations = await proctoringService.getViolationsByUser(req.user._id)
    res.json({ success: true, data: violations, message: 'Violations fetched', errors: null, meta: null })
  } catch (error) { next(error) }
})

export default router
