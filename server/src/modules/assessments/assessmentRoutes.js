import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { createAssessmentSchema, updateAssessmentSchema, submitAnswerSchema } from './assessmentValidation.js'
import * as assessmentController from './assessmentController.js'

const router = Router()

router.use(authenticate)

// Assessment CRUD
router.get('/', assessmentController.listAssessments)
router.get('/:id', assessmentController.getAssessment)
router.post('/', authorize('setter', 'admin'), validate(createAssessmentSchema), assessmentController.createAssessment)
router.put('/:id', authorize('setter', 'admin'), validate(updateAssessmentSchema), assessmentController.updateAssessment)
router.delete('/:id', authorize('admin'), assessmentController.deleteAssessment)

// Setter approval flow
router.post('/:id/submit-approval', authorize('setter'), assessmentController.submitForApproval)
router.post('/:id/approve', authorize('admin'), assessmentController.approveAssessment)
router.post('/:id/reject', authorize('admin'), validate(z.object({ reason: z.string().optional() })), assessmentController.rejectAssessment)

// Pending assessments (admin)
router.get('/admin/pending', authorize('admin'), assessmentController.getPendingAssessments)

// Attempt flow
router.post('/attempt/start', validate(z.object({ assessmentId: z.string() })), assessmentController.startAttempt)
router.get('/attempt/my', assessmentController.getUserAttempts)
router.get('/attempt/:id', assessmentController.getAttempt)
router.post('/attempt/:attemptId/answer', validate(submitAnswerSchema), assessmentController.submitAnswer)
router.post('/attempt/:attemptId/navigate/:index(\\d+)', assessmentController.navigateQuestion)
router.post('/attempt/:attemptId/finish', assessmentController.finishAttempt)
router.post('/attempt/:attemptId/timer', validate(z.object({ timeRemaining: z.number() })), assessmentController.syncTimer)

export default router
