import User from '../users/User.js'
import Assessment from '../assessments/Assessment.js'
import Question from '../questions/Question.js'
import QuestionVersion from '../questions/QuestionVersion.js'
import Attempt from '../assessments/Attempt.js'
import Submission from '../assessments/Submission.js'
import Settings from '../settings/Settings.js'
import Tag from '../tags/Tag.js'
import Notification from '../notifications/Notification.js'
import ProctoringViolation from '../proctoring/ProctoringViolation.js'
import CodingSubmission from '../coding/CodingSubmission.js'
import CodingProgress from '../coding/CodingProgress.js'
import CodingComment from '../coding/CodingComment.js'
import CodingBookmark from '../coding/CodingBookmark.js'
import { createNotification } from '../notifications/notificationService.js'
import { NotFoundError, ValidationError, ForbiddenError, ConflictError, AppError } from '../../shared/errors/AppError.js'
import { markAdminDeleted, restoreAccount, purgeAccountData } from '../users/accountLifecycle.js'
import { DEFAULT_SETTINGS } from '../settings/settingsService.js'
import { logger } from '../../config/logger.js'

// ─── User Management ────────────────────────────────────

export async function listUsers(filters) {
  const query = {}
  if (filters.search) {
    const escaped = filters.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    query.$or = [
      { name: { $regex: escaped, $options: 'i' } },
      { email: { $regex: escaped, $options: 'i' } },
    ]
  }
  if (filters.role) query.role = filters.role
  if (filters.isActive !== undefined) query.isActive = filters.isActive === 'true' || filters.isActive === true
  if (filters.status === 'purged') query.purgedAt = { $ne: null }
  else {
    // Permanently deleted accounts stay hidden unless explicitly filtered for
    query.purgedAt = null
    if (filters.status === 'deleted') query.deletedAt = { $ne: null }
    else if (filters.status === 'active') query.deletedAt = null
  }
  if (filters.restoreRequested === 'true') query.restoreRequestedAt = { $ne: null }

  const page = parseInt(filters.page) || 1
  const limit = parseInt(filters.limit) || 20
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password -refreshToken'),
    User.countDocuments(query),
  ])

  return {
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  }
}

export async function getUserById(userId) {
  const user = await User.findById(userId).select('-password -refreshToken')
  if (!user) throw new NotFoundError('User')
  return user
}

export async function updateUser(userId, data) {
  const existingUser = await User.findById(userId)
  if (!existingUser) throw new NotFoundError('User')
  if (existingUser.deletedAt) throw new ConflictError('Restore the account before editing it')

  const updates = {}
  if (data.name) updates.name = data.name
  if (data.role) updates.role = data.role
  if (data.isActive !== undefined) updates.isActive = data.isActive
  if (data.isApproved !== undefined) updates.isApproved = data.isApproved
  if (data.isEmailVerified !== undefined) updates.isEmailVerified = data.isEmailVerified
  if (data.avatar) updates.avatar = data.avatar

  const user = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true, runValidators: true }).select('-password -refreshToken')
  if (!user) throw new NotFoundError('User')

  if (data.role && data.role !== existingUser.role) {
    await createNotification(userId, {
      type: 'account_update',
      title: 'Role Updated',
      message: `Your role has been changed to "${data.role}" by an administrator.`,
    })
  }
  if (data.isApproved !== undefined && data.isApproved !== existingUser.isApproved) {
    await createNotification(userId, {
      type: 'account_update',
      title: data.isApproved ? 'Account Approved' : 'Approval Revoked',
      message: data.isApproved ? 'Your setter account has been approved by an administrator. You can now create assessments.' : 'Your setter approval has been revoked by an administrator.',
    })
  }
  if (data.isActive !== undefined && data.isActive !== existingUser.isActive) {
    await createNotification(userId, {
      type: 'account_update',
      title: data.isActive ? 'Account Activated' : 'Account Deactivated',
      message: data.isActive ? 'Your account has been re-activated by an administrator.' : 'Your account has been deactivated by an administrator.',
    })
  }

  return user
}

export async function deleteUser(userId, reason, adminId) {
  if (!reason || !reason.trim()) throw new ValidationError([{ field: 'reason', message: 'Deletion reason is required' }])
  if (String(userId) === String(adminId)) throw new ForbiddenError('You cannot delete your own account')

  const user = await User.findById(userId)
  if (!user) throw new NotFoundError('User')
  if (user.deletedAt) throw new ConflictError('User is already deleted')

  // Soft delete: the account is blocked but kept intact so the user can read the
  // reason when they try to sign in again and ask for a restoration.
  markAdminDeleted(user, reason.trim(), adminId)
  await user.save({ validateBeforeSave: false })

  logger.info('User deleted by admin', { userId, adminId: String(adminId), reason: reason.trim(), email: user.email, role: user.role })
  return user
}

export async function purgeUserPermanently(userId, reason, adminId) {
  if (String(userId) === String(adminId)) throw new ForbiddenError('You cannot delete your own account')

  const user = await User.findById(userId)
  if (!user) throw new NotFoundError('User')
  if (user.purgedAt) throw new ConflictError('User has already been permanently deleted')

  if (!user.deletedAt) {
    if (!reason || !reason.trim()) throw new ValidationError([{ field: 'reason', message: 'Deletion reason is required' }])
    markAdminDeleted(user, reason.trim(), adminId)
    await user.save({ validateBeforeSave: false })
  }

  await purgeAccountData(user)

  logger.info('User permanently deleted by admin', {
    userId,
    adminId: String(adminId),
    email: user.email,
    role: user.role,
    reason: reason?.trim() || user.deletedReason,
  })
  return user
}

export async function purgeUsersPermanently(userIds, reason, adminId) {
  if (!reason || !reason.trim()) throw new ValidationError([{ field: 'reason', message: 'Deletion reason is required' }])

  const ids = [...new Set((userIds || []).map(String))].filter((id) => id !== String(adminId))
  if (ids.length === 0) throw new ValidationError([{ field: 'ids', message: 'No deletable users selected' }])

  const results = await Promise.allSettled(ids.map((id) => purgeUserPermanently(id, reason, adminId)))
  const purged = ids.filter((_, i) => results[i].status === 'fulfilled')
  const skipped = results
    .map((result, i) => (result.status === 'rejected' ? { id: ids[i], reason: result.reason?.message || 'Failed' } : null))
    .filter(Boolean)

  if (purged.length === 0) throw new AppError('No users could be permanently deleted', 400)

  return { purged: purged.length, purgedIds: purged, skipped }
}

export async function deleteUsers(userIds, reason, adminId) {
  if (!reason || !reason.trim()) throw new ValidationError([{ field: 'reason', message: 'Deletion reason is required' }])

  const ids = [...new Set((userIds || []).map(String))].filter((id) => id !== String(adminId))
  if (ids.length === 0) throw new ValidationError([{ field: 'ids', message: 'No deletable users selected' }])

  const results = await Promise.allSettled(ids.map((id) => deleteUser(id, reason, adminId)))
  const deleted = ids.filter((_, i) => results[i].status === 'fulfilled')
  const skipped = results
    .map((result, i) => (result.status === 'rejected' ? { id: ids[i], reason: result.reason?.message || 'Failed' } : null))
    .filter(Boolean)

  if (deleted.length === 0) throw new AppError('No users could be deleted', 400)

  return { deleted: deleted.length, deletedIds: deleted, skipped }
}

export async function bulkUpdateUsers(userIds, updates) {
  const ids = [...new Set((userIds || []).map(String))]
  if (ids.length === 0) throw new ValidationError([{ field: 'ids', message: 'Select at least one user' }])

  const set = {}
  if (updates.isActive !== undefined) set.isActive = updates.isActive
  if (updates.isApproved !== undefined) set.isApproved = updates.isApproved
  if (Object.keys(set).length === 0) throw new ValidationError([{ field: 'updates', message: 'Nothing to update' }])

  const users = await User.find({ _id: { $in: ids } })
  const eligible = users.filter((user) => !user.deletedAt)
  if (eligible.length === 0) throw new AppError('Selected users are deleted — restore them first', 400)

  await User.updateMany({ _id: { $in: eligible.map((u) => u._id) } }, { $set: set })

  const deactivated = []
  if (updates.isActive !== undefined) {
    for (const user of eligible) {
      if (user.isActive === updates.isActive) continue
      if (updates.isActive === false) deactivated.push(String(user._id))
      await createNotification(user._id, {
        type: 'account_update',
        title: updates.isActive ? 'Account Activated' : 'Account Deactivated',
        message: updates.isActive
          ? 'Your account has been re-activated by an administrator.'
          : 'Your account has been deactivated by an administrator.',
      })
    }
  }

  logger.info('Bulk user update', { count: eligible.length, updates })
  return { updated: eligible.length, deactivated }
}

export async function restoreUser(userId, adminId) {
  const user = await User.findById(userId)
  if (!user) throw new NotFoundError('User')
  if (!user.deletedAt) throw new ConflictError('Account is not deleted')
  if (user.purgedAt) throw new ConflictError('This account was permanently erased and cannot be restored')

  await restoreAccount(user)

  await createNotification(userId, {
    type: 'account_update',
    title: 'Account Restored',
    message: 'Your account has been restored by an administrator. You can sign in again.',
  })

  logger.info('User restored by admin', { userId, adminId: String(adminId), email: user.email })
  return user
}

// ─── Role Management ────────────────────────────────────

export const ROLES = ['candidate', 'setter', 'admin']

export const ROLE_PERMISSIONS = {
  candidate: ['view_assessments', 'attempt_assessments', 'view_own_results', 'view_own_analytics', 'bookmark_questions'],
  setter: ['view_assessments', 'create_questions', 'edit_own_questions', 'view_own_questions', 'import_questions', 'generate_ai_questions'],
  admin: ['view_assessments', 'create_assessments', 'edit_assessments', 'manage_questions', 'manage_users', 'view_analytics', 'manage_proctoring', 'export_reports', 'approve_questions', 'reject_questions'],
}

export function listRoles() {
  return ROLES.map((role) => ({
    name: role,
    label: role.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    permissions: ROLE_PERMISSIONS[role] || [],
  }))
}

// ─── System Settings ────────────────────────────────────

export async function getSettings(category) {
  const filter = category ? { category } : {}
  let settings = await Settings.find(filter).sort({ category: 1, key: 1 })

  if (settings.length === 0) {
    await Settings.insertMany(DEFAULT_SETTINGS)
    settings = await Settings.find(filter).sort({ category: 1, key: 1 })
  }

  return settings.map((s) => ({
    id: s._id,
    key: s.key,
    value: s.value,
    description: s.description,
    category: s.category,
    updatedAt: s.updatedAt,
  }))
}

export async function updateSetting(key, value, userId) {
  const setting = await Settings.findOneAndUpdate(
    { key },
    { $set: { value, updatedBy: userId } },
    { new: true, upsert: true }
  )
  return setting
}

// ─── Platform Stats ─────────────────────────────────────

export async function getPlatformStats() {
  const [
    totalUsers,
    activeUsers,
    totalAssessments,
    totalQuestions,
    totalAttempts,
    completedAttempts,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ isActive: true }),
    Assessment.countDocuments(),
    Question.countDocuments(),
    Attempt.countDocuments(),
    Attempt.countDocuments({ status: { $in: ['completed', 'auto_submitted', 'timed_out'] } }),
  ])

  return {
    totalUsers,
    activeUsers,
    totalAssessments,
    totalQuestions,
    totalAttempts,
    completedAttempts,
  }
}

export async function getSystemHealth() {
  const mongoose = (await import('mongoose')).default
  const dbState = mongoose.connection.readyState
  const stateMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' }

  return {
    database: stateMap[dbState] || 'unknown',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    nodeVersion: process.version,
    platform: process.platform,
  }
}

export async function deleteAllData(adminId, confirmation, password) {
  if (confirmation !== 'DELETE ALL DATA') {
    throw new ValidationError('Invalid confirmation text')
  }

  const admin = await User.findById(adminId).select('+password')
  if (!admin || admin.role !== 'admin') {
    throw new NotFoundError('Only admin can perform this action')
  }

  const isPasswordValid = await admin.comparePassword(password)
  if (!isPasswordValid) {
    throw new ValidationError('Incorrect password')
  }

  await Promise.all([
    User.deleteMany({ _id: { $ne: adminId } }),
    Assessment.deleteMany({}),
    Question.deleteMany({}),
    QuestionVersion.deleteMany({}),
    Attempt.deleteMany({}),
    Submission.deleteMany({}),
    Tag.deleteMany({}),
    Settings.deleteMany({}),
    Notification.deleteMany({ user: { $ne: adminId } }),
    ProctoringViolation.deleteMany({}),
    CodingSubmission.deleteMany({}),
    CodingProgress.deleteMany({}),
    CodingComment.deleteMany({}),
    CodingBookmark.deleteMany({}),
  ])

  await User.findByIdAndUpdate(adminId, {
    refreshToken: null,
    lastLoginAt: null,
    preferences: {},
  })

  return { message: 'All data has been deleted. Admin account preserved.' }
}
