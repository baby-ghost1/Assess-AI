import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { validate } from '../../middleware/validate.js'
import { z } from 'zod'
import * as proctoringService from './proctoringService.js'
import Attempt from '../assessments/Attempt.js'

const router = Router()

router.use(authenticate)

router.get('/violations/attempt/:attemptId', async (req, res, next) => {
  try {
    if (!req.params.attemptId) return res.status(400).json({ success: false, message: 'Attempt ID required' })
    const attempt = await Attempt.findById(req.params.attemptId).select('user')
    if (!attempt) return res.status(404).json({ success: false, message: 'Attempt not found' })
    if (attempt.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' })
    }
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
