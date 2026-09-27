import User from './User.js'
import Attempt from '../assessments/Attempt.js'
import Submission from '../assessments/Submission.js'
import Notification from '../notifications/Notification.js'
import ProctoringViolation from '../proctoring/ProctoringViolation.js'
import CodingSubmission from '../coding/CodingSubmission.js'
import CodingProgress from '../coding/CodingProgress.js'
import CodingComment from '../coding/CodingComment.js'
import CodingBookmark from '../coding/CodingBookmark.js'
import Otp from '../auth/Otp.js'
import { AccountDeletedError, UnauthorizedError } from '../../shared/errors/AppError.js'
import { logger } from '../../config/logger.js'
import { resolveLocation } from '../../utils/geoLocation.js'

export const SELF_DELETE_GRACE_DAYS = 7
export const RESTORE_GRACE_DAYS = SELF_DELETE_GRACE_DAYS
const GRACE_MS = RESTORE_GRACE_DAYS * 24 * 60 * 60 * 1000

function clearDeletionFields(user) {
  user.deletedAt = null
  user.deletedBy = null
  user.deletedReason = null
  user.deletionType = null
  user.graceExpiresAt = null
  user.restoreRequestedAt = null
  user.purgedAt = null
}

/** Self-deletion: account is deactivated but kept for the grace period so the user can log back in. */
export function markSelfDeleted(user, reason = null) {
  const now = new Date()
  clearDeletionFields(user)
  user.deletedAt = now
  user.deletionType = 'self'
  user.deletedReason = reason || null
  user.graceExpiresAt = new Date(now.getTime() + GRACE_MS)
  user.isActive = false
  user.refreshToken = null
  return user
}

/** Admin deletion: soft delete — data is kept for the 7-day restore window so the user can see the reason and request restoration. */
export function markAdminDeleted(user, reason, adminId) {
  const now = new Date()
  clearDeletionFields(user)
  user.deletedAt = now
  user.deletionType = 'admin'
  user.deletedReason = reason
  user.deletedBy = adminId
  user.graceExpiresAt = new Date(now.getTime() + GRACE_MS)
  user.isActive = false
  user.refreshToken = null
  return user
}

export async function restoreAccount(user) {
  clearDeletionFields(user)
  user.isActive = true
  await user.save({ validateBeforeSave: false })
  logger.info('Account restored', { userId: String(user._id), email: user.email })
  return user
}

/** Irreversible cleanup once the restore window has expired or an admin purges the account. */
export async function purgeAccountData(user) {
  const userId = user._id

  await Promise.all([
    Notification.deleteMany({ user: userId }),
    ProctoringViolation.deleteMany({ user: userId }),
    Attempt.deleteMany({ user: userId }),
    Submission.deleteMany({ user: userId }),
    CodingSubmission.deleteMany({ user: userId }),
    CodingProgress.deleteMany({ user: userId }),
    CodingComment.deleteMany({ user: userId }),
    CodingBookmark.deleteMany({ user: userId }),
    Otp.deleteMany({ user: userId }),
  ])

  user.name = 'Deleted User'
  user.email = `deleted_${user._id}@removed.com`
  user.password = undefined
  user.avatar = null
  user.preferences = {}
  user.isActive = false
  user.refreshToken = null
  user.graceExpiresAt = null
  user.deletedAt = user.deletedAt || new Date()
  user.purgedAt = new Date()
  await user.save({ validateBeforeSave: false })

  logger.info('Account permanently purged after grace period', { userId: String(userId) })
  return user
}

export function buildAccountDeletedError(user) {
  const requestHint = user.restoreRequestedAt
    ? ' You already requested restoration — an administrator is reviewing it.'
    : ' You can request account restoration below.'
  return new AccountDeletedError(`Your account was deleted by an administrator.${requestHint}`, {
    code: 'ACCOUNT_DELETED',
    email: user.email,
    reason: user.deletedReason || null,
    deletedAt: user.deletedAt,
    restoreRequested: Boolean(user.restoreRequestedAt),
  })
}

/**
 * Runs after the password/OAuth check succeeded.
 * Returns 'restored' when a self-deleted account came back during its grace period,
 * null when the account is fine, and throws when the account is blocked or gone for good.
 */
export async function resolveDeletedUserOnLogin(user) {
  if (!user.deletedAt) return null

  const withinGrace = user.graceExpiresAt && user.graceExpiresAt.getTime() > Date.now()

  if (user.deletionType === 'self' && withinGrace) {
    await restoreAccount(user)
    return 'restored'
  }

  // Grace expired (or never granted for legacy records): erase the data for good.
  const expired = user.graceExpiresAt && !withinGrace
  if (expired) {
    await purgeAccountData(user)
    throw new UnauthorizedError(
      `Your account was permanently deleted after the ${RESTORE_GRACE_DAYS}-day recovery window and can no longer be recovered.`
    )
  }

  throw buildAccountDeletedError(user)
}

/**
 * Purges every deleted account whose restore window has elapsed.
 * Runs on a schedule so accounts whose owners never sign in are cleaned up too.
 */
export async function purgeExpiredAccounts() {
  const expired = await User.find({
    deletedAt: { $ne: null },
    purgedAt: null,
    graceExpiresAt: { $ne: null, $lt: new Date() },
  })

  let purged = 0
  for (const user of expired) {
    try {
      await purgeAccountData(user)
      purged += 1
    } catch (err) {
      logger.warn('Failed to purge expired account', { userId: String(user._id), error: err.message })
    }
  }
  return purged
}

/** Stamps last-login metadata; the location lookup runs in the background so login is never delayed. */
export function recordLoginMeta(user, ip) {
  user.lastLoginAt = new Date()
  if (!ip) return

  user.lastLoginIp = ip
  const previousLocation = user.lastLoginLocation
  resolveLocation(ip)
    .then((location) => {
      if (!location || location === previousLocation) return
      return User.updateOne({ _id: user._id }, { $set: { lastLoginLocation: location } })
    })
    .catch(() => {
      // geolocation is best-effort only
    })
}
