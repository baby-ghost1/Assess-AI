import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { createAssessmentSchema, updateAssessmentSchema, adminUpdateAssessmentSchema, submitAnswerSchema, restrictedStartSchema, releaseResultsSchema, grantRetakeSchema, finishAttemptSchema } from './assessmentValidation.js'
import { restrictedStartLimiter } from '../../middleware/rateLimiter.js'
import * as assessmentController from './assessmentController.js'
import { getProctoringSettings, getAssessmentDefaults } from '../settings/settingsService.js'

const router = Router()
const adminRouter = Router()

// ─── Public routes (no auth) ────────────────────────────

// Restricted attempt start (public - verified by password, not auth)
router.post('/attempt/restricted-start', restrictedStartLimiter, validate(restrictedStartSchema), assessmentController.startRestrictedAttempt)

// Proctoring status (lightweight, any authenticated user) — full sub-toggle settings
router.get('/proctoring/status', async (req, res) => {
  try {
    const data = await getProctoringSettings()
    res.json({ success: true, data, message: 'Proctoring settings fetched', errors: null, meta: null })
  } catch (err) {
    res.json({ success: true, data: { enabled: true, faceDetection: true, gazeDetection: true, postureDetection: false, clipboardDetection: true, rightClickDetection: true, networkMonitoring: true, tabSwitchLimit: 3, autoSubmit: true }, message: 'Proctoring settings fetched', errors: null, meta: null })
  }
})

// Assessment creation defaults (must be registered before /:id)
router.get('/defaults', authenticate, async (req, res) => {
  try {
    const data = await getAssessmentDefaults()
    res.json({ success: true, data, message: 'Assessment defaults fetched', errors: null, meta: null })
  } catch (err) {
    res.json({ success: true, data: { timeLimit: 1800, passingPercentage: 40, maxAttempts: 1 }, message: 'Assessment defaults fetched', errors: null, meta: null })
  }
})

// ─── Authenticated routes ───────────────────────────────
router.use(authenticate)

// Attempt flow
router.post('/attempt/start', validate(z.object({ assessmentId: z.string() })), assessmentController.startAttempt)
router.get('/attempt/active/:assessmentId', assessmentController.getActiveAttempt)
router.get('/attempt/my', assessmentController.getUserAttempts)
router.get('/attempt/:id', assessmentController.getAttempt)
router.post('/attempt/:attemptId/answer', validate(submitAnswerSchema), assessmentController.submitAnswer)
router.post('/attempt/:attemptId/navigate/:index(\\d+)', assessmentController.navigateQuestion)
router.post('/attempt/:attemptId/finish', validate(finishAttemptSchema), assessmentController.finishAttempt)
router.post('/attempt/:attemptId/timer', validate(z.object({ timeRemaining: z.number() })), assessmentController.syncTimer)

// Assessment CRUD
router.get('/', assessmentController.listAssessments)
router.get('/my', authorize('setter', 'admin'), assessmentController.getSetterAssessments)
router.post('/', authorize('setter', 'admin'), validate(createAssessmentSchema), assessmentController.createAssessment)

router.get('/:id', assessmentController.getAssessment)
router.put('/:id', authorize('setter', 'admin'), (req, res, next) => {
  if (req.user.role === 'admin') {
    validate(adminUpdateAssessmentSchema)(req, res, next)
  } else {
    validate(updateAssessmentSchema)(req, res, next)
  }
}, assessmentController.updateAssessment)
router.delete('/:id', authorize('admin'), assessmentController.deleteAssessment)

// Setter approval flow
router.post('/:id/submit-approval', authorize('setter'), assessmentController.submitForApproval)
router.post('/:id/approve', authorize('admin'), assessmentController.approveAssessment)
router.post('/:id/approve-all', authorize('admin'), assessmentController.approveAllQuestions)
router.post('/:id/reject', authorize('admin'), validate(z.object({ reason: z.string().optional() })), assessmentController.rejectAssessment)
router.post('/:id/questions/:questionId/review', authorize('admin'), validate(z.object({ status: z.enum(['approved', 'rejected']) })), assessmentController.reviewAssessmentQuestion)

// Admin restricted assessment results
router.get('/:id/restricted-results', authorize('admin', 'setter'), assessmentController.getRestrictedAssessmentResults)
router.post('/:id/release-results', authorize('admin'), validate(releaseResultsSchema), assessmentController.releaseAssessmentResults)
router.post('/:id/retake-grants', authorize('admin'), validate(grantRetakeSchema), assessmentController.grantRetake)

// Admin assessments (mounted at /api/v1/admin/assessments)
adminRouter.use(authenticate)
adminRouter.get('/pending', authorize('admin'), assessmentController.getPendingAssessments)

export default router
export { adminRouter }
