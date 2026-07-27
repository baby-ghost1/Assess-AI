import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { createAssessmentSchema, updateAssessmentSchema, adminUpdateAssessmentSchema, submitAnswerSchema } from './assessmentValidation.js'
import * as assessmentController from './assessmentController.js'

const router = Router()

router.use(authenticate)

// Assessment CRUD
router.get('/', assessmentController.listAssessments)
router.get('/my', authorize('setter', 'admin'), assessmentController.getSetterAssessments)
router.post('/', authorize('setter', 'admin'), validate(createAssessmentSchema), assessmentController.createAssessment)

// Pending assessments (admin) - must be before /:id
router.get('/admin/pending', authorize('admin'), assessmentController.getPendingAssessments)

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

// Attempt flow
router.post('/attempt/start', validate(z.object({ assessmentId: z.string() })), assessmentController.startAttempt)
router.get('/attempt/my', assessmentController.getUserAttempts)
router.get('/attempt/:id', assessmentController.getAttempt)
router.post('/attempt/:attemptId/answer', validate(submitAnswerSchema), assessmentController.submitAnswer)
router.post('/attempt/:attemptId/navigate/:index(\\d+)', assessmentController.navigateQuestion)
router.post('/attempt/:attemptId/finish', assessmentController.finishAttempt)
router.post('/attempt/:attemptId/timer', validate(z.object({ timeRemaining: z.number() })), assessmentController.syncTimer)

export default router
