import { Router } from 'express'
import { z } from 'zod'
import { validate } from '../../middleware/validate.js'
import { authenticate } from '../../middleware/authenticate.js'
import { authLimiter } from '../../middleware/rateLimiter.js'
import { registerSchema, loginSchema, adminLoginSchema, changePasswordSchema, updateProfileSchema, deleteAccountSchema } from './authValidation.js'
import * as authController from './authController.js'
import * as oauthController from './oauthController.js'

const router = Router()

router.post('/register', authLimiter, validate(registerSchema), authController.register)
router.post('/login', authLimiter, validate(loginSchema), authController.login)
router.post('/admin/login', authLimiter, validate(adminLoginSchema), authController.adminLogin)
router.post('/logout', authenticate, authController.logout)
router.post('/refresh', authController.refreshToken)
router.get('/me', authenticate, authController.getMe)
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword)
router.patch('/profile', authenticate, validate(updateProfileSchema), authController.updateProfile)
router.get('/preferences', authenticate, authController.getPreferences)
router.patch('/preferences', authenticate, validate(z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  emailNotifications: z.boolean().optional(),
  language: z.string().min(1).max(20).optional(),
}).strict()), authController.updatePreferences)
router.delete('/account', authenticate, validate(deleteAccountSchema), authController.deleteAccount)

router.get('/google', oauthController.googleAuth)
router.get('/google/callback', oauthController.googleCallback)
router.get('/github', oauthController.githubAuth)
router.get('/github/callback', oauthController.githubCallback)

export default router
