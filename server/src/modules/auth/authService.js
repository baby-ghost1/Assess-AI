import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { config } from '../../config/index.js'
import User from '../users/User.js'
import Otp from './Otp.js'
import Notification from '../notifications/Notification.js'
import { ConflictError, UnauthorizedError, ForbiddenError } from '../../shared/errors/AppError.js'
import { createNotification } from '../notifications/notificationService.js'
import { sendOTPEmail, sendPasswordResetEmail } from '../../services/emailService.js'
import { generateTokens } from './tokenUtils.js'
import { getSettingValue } from '../settings/settingsService.js'

export async function register({ name, email, password, role = 'candidate' }) {
  // Server-authoritative registration gate (admin system setting)
  if ((await getSettingValue('enable_registration')) === false) {
    throw new ForbiddenError('Registration is currently disabled')
  }

  const existing = await User.findOne({ email })
  if (existing) throw new ConflictError('Email already registered')

  const isApproved = role === 'candidate'
  const user = await User.create({ name, email, password, role, isApproved })

  await createNotification(user._id, {
    type: 'account_update',
    title: 'Welcome to AssessAI!',
    message: `Hi ${name}, your account has been created successfully. Start exploring assessments now!`,
  })

  if (isApproved) {
    const tokens = generateTokens(user._id, true)
    user.refreshToken = tokens.refreshToken
    await user.save({ validateBeforeSave: false })
    return { user, ...tokens }
  }

  return { user, message: 'Your account has been created. An admin will review and approve your setter account before you can sign in.' }
}

export async function login({ email, password, rememberMe = false }) {
  const user = await User.findOne({ email }).select('+password +preferences')
  if (!user) throw new UnauthorizedError('Invalid email or password')

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw new UnauthorizedError('Invalid email or password')

  if (!user.isActive) throw new UnauthorizedError('Account is deactivated')

  if (user.role === 'setter' && !user.isApproved) {
    throw new ForbiddenError('Your setter account is awaiting admin approval. You will be able to sign in once approved.')
  }

  const tokens = generateTokens(user._id, rememberMe)
  user.refreshToken = tokens.refreshToken
  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  const recentLoginNotice = await Notification.findOne({ user: user._id, message: /new session/i, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
  if (!recentLoginNotice && user.preferences?.passwordAlerts !== false) {
    await createNotification(user._id, {
      type: 'account_update',
      title: 'New Login Detected',
      message: 'Logged in successfully from a new session.',
    })
  }

  return { user, ...tokens }
}

export async function adminLogin({ email, password, rememberMe = false }) {
  const safeEquals = (a, b) => crypto.timingSafeEqual(
    crypto.createHash('sha256').update(a || '').digest(),
    crypto.createHash('sha256').update(b || '').digest()
  )
  const emailMatch = safeEquals(String(email), config.admin.email)
  const passwordMatch = safeEquals(String(password), config.admin.password)
  if (!emailMatch || !passwordMatch) {
    throw new UnauthorizedError('Invalid admin credentials')
  }

  let user = await User.findOne({ email })
  if (user && user.role !== 'admin') {
    throw new UnauthorizedError('Invalid admin credentials')
  }
  if (!user) {
    user = await User.create({ name: 'Admin', email, password, role: 'admin', isApproved: true })
  }

  const tokens = generateTokens(user._id, rememberMe)
  user.refreshToken = tokens.refreshToken
  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  return { user, ...tokens }
}

export async function logout(userId) {
  await User.findByIdAndUpdate(userId, { refreshToken: null })
}

export async function refreshToken(token) {
  if (!token) throw new UnauthorizedError('Refresh token required')

  const decoded = jwt.verify(token, config.jwt.refreshSecret)
  const user = await User.findById(decoded.userId).select('+refreshToken')
  if (!user || user.refreshToken !== token) throw new UnauthorizedError('Invalid refresh token')

  const tokens = generateTokens(user._id)
  user.refreshToken = tokens.refreshToken
  await user.save({ validateBeforeSave: false })

  return tokens
}

export async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await User.findById(userId).select('+password')
  if (!user) throw new UnauthorizedError('User not found')

  const isMatch = await user.comparePassword(oldPassword)
  if (!isMatch) throw new UnauthorizedError('Current password is incorrect')

  user.password = newPassword
  await user.save()

  await createNotification(userId, {
    type: 'password_change',
    title: 'Password Changed',
    message: 'Your account password was successfully changed.',
  })

  return { message: 'Password changed successfully' }
}

export async function updateProfile(userId, updates) {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('User not found')

  if (updates.email && updates.email !== user.email) {
    const existing = await User.findOne({ email: updates.email, _id: { $ne: userId } })
    if (existing) throw new ConflictError('Email already in use')
  }

  if (updates.name) user.name = updates.name
  if (updates.email) user.email = updates.email
  await user.save()

  return { user }
}

const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  assessmentReminders: true,
  resultAlerts: true,
  passwordAlerts: true,
}

export async function getPreferences(userId) {
  const user = await User.findById(userId).select('preferences')
  return user?.preferences || DEFAULT_PREFERENCES
}

export async function updatePreferences(userId, prefs) {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('User not found')
  user.preferences = { ...DEFAULT_PREFERENCES, ...prefs }
  await user.save({ validateBeforeSave: false })
  return user.preferences
}

export async function sendDeleteOtp(userId) {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('User not found')
  if (user.password) throw new UnauthorizedError('Password users can delete directly')

  await Otp.deleteMany({ user: userId, purpose: 'delete_account' })

  const otp = crypto.randomInt(100000, 999999).toString()
  await Otp.create({
    user: userId,
    otp,
    purpose: 'delete_account',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  await sendOTPEmail({ email: user.email, name: user.name, otp })

  return { message: 'OTP sent to your email' }
}

export async function verifyDeleteOtp(userId, { otp }) {
  const record = await Otp.findOne({ user: userId, purpose: 'delete_account', otp })
  if (!record) throw new UnauthorizedError('Invalid or expired OTP')
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id })
    throw new UnauthorizedError('OTP has expired')
  }

  await Otp.deleteOne({ _id: record._id })

  const user = await User.findByIdAndDelete(userId)
  if (!user) throw new UnauthorizedError('User not found')

  return { message: 'Account deleted successfully' }
}

export async function deleteAccount(userId, { password }) {
  const user = await User.findById(userId).select('+password')
  if (!user) throw new UnauthorizedError('User not found')

  if (user.password) {
    const isMatch = await user.comparePassword(password)
    if (!isMatch) throw new UnauthorizedError('Incorrect password')
  }

  user.isActive = false
  user.name = 'Deleted User'
  user.email = `deleted_${user._id}@removed.com`
  user.password = undefined
  user.refreshToken = null
  user.avatar = null
  user.preferences = {}
  await user.save({ validateBeforeSave: false })

  return { message: 'Account deleted successfully' }
}

export async function sendPasswordOtp(userId) {
  const user = await User.findById(userId)
  if (!user) throw new UnauthorizedError('User not found')
  if (!user.provider || user.provider === 'local') throw new UnauthorizedError('Only OAuth users can use this flow')

  await Otp.deleteMany({ user: userId, purpose: 'password_reset' })

  const otp = crypto.randomInt(100000, 999999).toString()
  await Otp.create({
    user: userId,
    otp,
    purpose: 'password_reset',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  })

  await sendOTPEmail({ email: user.email, name: user.name, otp, purpose: 'password_reset' })

  return { message: 'OTP sent to your email' }
}

export async function verifyPasswordOtp(userId, { otp, newPassword }) {
  const record = await Otp.findOne({ user: userId, purpose: 'password_reset', otp })
  if (!record) throw new UnauthorizedError('Invalid or expired OTP')
  if (record.expiresAt < new Date()) {
    await Otp.deleteOne({ _id: record._id })
    throw new UnauthorizedError('OTP has expired')
  }

  if (!newPassword) {
    return { message: 'OTP verified' }
  }

  await Otp.deleteOne({ _id: record._id })

  const user = await User.findById(userId).select('+password')
  if (!user) throw new UnauthorizedError('User not found')

  user.password = newPassword
  await user.save()

  await createNotification(userId, {
    type: 'password_change',
    title: 'Password Set',
    message: 'Your password was set successfully. You can now log in with your email and password.',
  })

  return { message: 'Password set successfully' }
}

export async function forgotPassword(email) {
  const user = await User.findOne({ email })
  if (!user) {
    return { message: 'If an account exists with this email, a reset link has been sent.' }
  }

  const resetToken = jwt.sign({ userId: user._id, purpose: 'password-reset' }, config.jwt.accessSecret, { expiresIn: '1h' })
  await User.updateOne({ _id: user._id }, { resetToken })

  const clientUrl = config.clientUrl.split(',')[0].trim()
  const resetUrl = `${clientUrl}/reset-password/${resetToken}`

  try {
    await sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl })
  } catch {
    // Email provider failure — still create in-app notice; link was issued
  }

  await createNotification(user._id, {
    type: 'account_update',
    title: 'Password Reset Requested',
    message: 'A password reset was requested. Check your email for the reset link.',
  })

  return { message: 'If an account exists with this email, a reset link has been sent.' }
}

export async function resetPassword(token, newPassword) {
  if (!token) throw new UnauthorizedError('Reset token required')

  let decoded
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret)
  } catch {
    throw new UnauthorizedError('Invalid or expired reset token')
  }

  if (decoded.purpose !== 'password-reset') throw new UnauthorizedError('Invalid reset token')

  const user = await User.findById(decoded.userId).select('+resetToken')
  if (!user || user.resetToken !== token) throw new UnauthorizedError('Invalid or expired reset token')

  user.password = newPassword
  user.resetToken = null
  await user.save()

  await createNotification(user._id, {
    type: 'password_change',
    title: 'Password Reset Successfully',
    message: 'Your password has been reset. You can now log in with your new password.',
  })

  return { message: 'Password reset successful. You can now log in.' }
}
