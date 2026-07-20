import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import { upload } from '../../middleware/upload.js'
import { importFile } from './importService.js'

const router = Router()

router.use(authenticate)
router.use(authorize('setter', 'admin'))

router.post('/import', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, data: null, message: 'No file uploaded', errors: [{ field: 'file', message: 'File is required' }], meta: null })
    }
    const result = await importFile(req.file, req.user._id)
    res.status(200).json({ success: true, data: result, message: `${result.count} questions imported successfully`, errors: null, meta: null })
  } catch (error) { next(error) }
})

export default router
