import Notification from './Notification.js'

export async function createNotification(userId, { type, title, message }) {
  return Notification.create({ user: userId, type, title, message })
}

export async function getNotifications(userId, { page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find({ user: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments({ user: userId }),
    Notification.countDocuments({ user: userId, read: false }),
  ])
  return { notifications, total, unreadCount, page, pages: Math.ceil(total / limit) }
}

export async function markAsRead(userId, notificationId) {
  return Notification.findOneAndUpdate({ _id: notificationId, user: userId }, { read: true }, { new: true })
}

export async function markAllAsRead(userId) {
  return Notification.updateMany({ user: userId, read: false }, { read: true })
}

export async function deleteNotification(userId, notificationId) {
  return Notification.findOneAndDelete({ _id: notificationId, user: userId })
}

export async function deleteAllNotifications(userId) {
  return Notification.deleteMany({ user: userId })
}
