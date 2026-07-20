import { Router } from 'express'
import { authenticate } from '../../middleware/authenticate.js'
import * as notificationController from './notificationController.js'

const router = Router()

router.use(authenticate)
router.get('/', notificationController.getNotifications)
router.patch('/:id/read', notificationController.markAsRead)
router.patch('/read-all', notificationController.markAllAsRead)
router.delete('/:id', notificationController.deleteNotification)
router.delete('/', notificationController.deleteAllNotifications)

export default router
