import Notification from './Notification.js'
import { getCache, setCache, delCache } from '../../utils/cacheHelper.js'

const NOTIFICATION_TTL = 120

export async function createNotification(userId, { type, title, message }) {
  const result = await Notification.create({ user: userId, type, title, message })
  await delCache(`notifications:unread:${userId}`)
  try {
    const { getIO } = await import('../../config/socket.js')
    getIO()?.to(`user:${userId}`).emit('notification:new', {
      _id: result._id,
      type: result.type,
      title: result.title,
      message: result.message,
      read: result.read,
      createdAt: result.createdAt,
    })
  } catch {
    // socket layer unavailable — client will poll as fallback
  }
  return result
}

export async function getNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    getCache(`notifications:unread:${userId}`).then(async (cached) => {
      if (cached !== null) return cached
      const count = await Notification.countDocuments({ user: userId, read: false })
      await setCache(`notifications:unread:${userId}`, count, NOTIFICATION_TTL)
      return count
    }),
  ])
  return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) }
}

export async function markAsRead(userId, notificationId) {
  const result = await Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true }, { new: true })
  await delCache(`notifications:unread:${userId}`)
  return result
}

export async function markAllAsRead(userId) {
  const result = await Notification.updateMany({ user: userId, read: false }, { read: true })
  await delCache(`notifications:unread:${userId}`)
  return result
}

export async function deleteNotification(userId, notificationId) {
  const result = await Notification.findOneAndDelete({ _id: notificationId, user: userId })
  await delCache(`notifications:unread:${userId}`)
  return result
}

export async function deleteAllNotifications(userId) {
  const result = await Notification.deleteMany({ user: userId })
  await delCache(`notifications:unread:${userId}`)
  return result
}
