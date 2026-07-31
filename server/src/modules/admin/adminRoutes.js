import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as adminController from './adminController.js'

const router = Router()

router.use(authenticate)
router.use(authorize('admin'))

// Users
router.get('/users', adminController.listUsers)
router.get('/users/:id', adminController.getUserById)
router.patch('/users/:id', validate(z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['candidate', 'setter', 'admin']).optional(),
  isActive: z.boolean().optional(),
}).strict()), adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// Roles
router.get('/roles', adminController.listRoles)

// Settings
router.get('/settings', adminController.getSettings)
router.patch('/settings/:key', validate(z.object({
  value: z.any(),
}).strict()), adminController.updateSetting)

// System
router.get('/stats', adminController.getPlatformStats)
router.get('/health', adminController.getSystemHealth)
router.post('/delete-all', validate(z.object({
  confirmation: z.literal('DELETE ALL DATA', {
    errorMap: () => ({ message: 'Please type "DELETE ALL DATA" to confirm' }),
  }),
  password: z.string().min(1, 'Password is required'),
})), adminController.deleteAllData)

export default router
