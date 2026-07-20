import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { createQuestionSchema, updateQuestionSchema, questionFilterSchema } from './questionValidation.js'
import * as questionController from './questionController.js'

const router = Router()

router.use(authenticate)

router.get('/', validate(questionFilterSchema, 'query'), questionController.listQuestions)
router.get('/:id', questionController.getQuestion)
router.post('/', authorize('setter', 'admin'), validate(createQuestionSchema), questionController.createQuestion)
router.put('/:id', authorize('setter', 'admin'), validate(updateQuestionSchema), questionController.updateQuestion)
router.delete('/:id', authorize('admin'), questionController.deleteQuestion)

router.post('/:id/submit-review', authorize('setter', 'admin'), questionController.submitForReview)

router.post('/:id/review', authorize('admin'), validate(z.object({
  status: z.enum(['approved', 'rejected']),
  rejectionReason: z.string().optional(),
})), questionController.reviewQuestion)

router.get('/:id/versions', questionController.getVersions)

export default router
