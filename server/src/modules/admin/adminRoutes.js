import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import { authorize } from '../../middleware/authorize.js'
import * as adminController from './adminController.js'

const router = Router()

router.use(authenticate)
router.use(authorize('admin', 'super_admin'))

// Users
router.get('/users', adminController.listUsers)
router.get('/users/:id', adminController.getUserById)
router.patch('/users/:id', adminController.updateUser)
router.delete('/users/:id', adminController.deleteUser)

// Roles
router.get('/roles', adminController.listRoles)

// Settings
router.get('/settings', adminController.getSettings)
router.patch('/settings/:key', adminController.updateSetting)

// System
router.get('/stats', adminController.getPlatformStats)
router.get('/health', adminController.getSystemHealth)

export default router
