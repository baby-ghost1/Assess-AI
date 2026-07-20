import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import Tag from './Tag.js'

const router = Router()

router.use(authenticate)

router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query
    const query = {}
    if (search) query.name = { $regex: search, $options: 'i' }
    const tags = await Tag.find(query).sort({ usageCount: -1 }).skip((page - 1) * limit).limit(Number(limit))
    const total = await Tag.countDocuments(query)
    res.json({ success: true, data: tags, message: 'Tags fetched', errors: null, meta: { page, limit, total } })
  } catch (error) { next(error) }
})

router.post('/', authorize('setter', 'admin'), validate(z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional().default(''),
  color: z.string().optional().default('#6366F1'),
})), async (req, res, next) => {
  try {
    const tag = await Tag.create({ ...req.validatedBody, createdBy: req.user._id })
    res.status(201).json({ success: true, data: tag, message: 'Tag created', errors: null, meta: null })
  } catch (error) { next(error) }
})

router.delete('/:id', authorize('admin'), async (req, res, next) => {
  try {
    await Tag.findByIdAndDelete(req.params.id)
    res.json({ success: true, data: null, message: 'Tag deleted', errors: null, meta: null })
  } catch (error) { next(error) }
})

export default router
