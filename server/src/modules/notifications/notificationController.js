import * as notificationService from './notificationService.js'

export async function getNotifications(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const result = await notificationService.getNotifications(req.user._id, { page, limit })
    res.json({ success: true, data: result, message: 'Notifications fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function markAsRead(req, res, next) {
  try {
    const notification = await notificationService.markAsRead(req.user._id, req.params.id)
    if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' })
    res.json({ success: true, data: notification, message: 'Marked as read', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function markAllAsRead(req, res, next) {
  try {
    await notificationService.markAllAsRead(req.user._id)
    res.json({ success: true, data: null, message: 'All notifications marked as read', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteNotification(req, res, next) {
  try {
    const result = await notificationService.deleteNotification(req.user._id, req.params.id)
    if (!result) return res.status(404).json({ success: false, message: 'Notification not found' })
    res.json({ success: true, data: null, message: 'Notification deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteAllNotifications(req, res, next) {
  try {
    await notificationService.deleteAllNotifications(req.user._id)
    res.json({ success: true, data: null, message: 'All notifications deleted', errors: null, meta: null })
  } catch (error) { next(error) }
}
