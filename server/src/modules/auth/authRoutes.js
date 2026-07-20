import { Router } from 'express'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { registerSchema, loginSchema, adminLoginSchema, changePasswordSchema } from './authValidation.js'
import * as authController from './authController.js'

const router = Router()

router.post('/register', validate(registerSchema), authController.register)
router.post('/login', validate(loginSchema), authController.login)
router.post('/admin/login', validate(adminLoginSchema), authController.adminLogin)
router.post('/logout', authenticate, authController.logout)
router.post('/refresh', authController.refreshToken)
router.get('/me', authenticate, authController.getMe)
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword)

export default router
