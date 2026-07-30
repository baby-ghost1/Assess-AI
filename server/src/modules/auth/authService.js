import jwt from 'jsonwebtoken'
import { config } from '../../config/index.js'
import User from '../users/User.js'
import { ConflictError, UnauthorizedError } from '../../shared/errors/AppError.js'
import { createNotification } from '../notifications/notificationService.js'

function generateTokens(userId, rememberMe = false) {
  const accessTokenExpiry = rememberMe ? '30d' : '15m'
  const refreshTokenExpiry = rememberMe ? '30d' : '7d'
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: accessTokenExpiry })
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: refreshTokenExpiry })
  return { accessToken, refreshToken }
}

export async function register({ name, email, password, role = 'candidate' }) {
  const existing = await User.findOne({ email })
  if (existing) throw new ConflictError('Email already registered')

  const user = await User.create({ name, email, password, role, isApproved: role === 'candidate' })
  const tokens = generateTokens(user._id, true)

  user.refreshToken = tokens.refreshToken
  await user.save({ validateBeforeSave: false })

  await createNotification(user._id, {
    type: 'account_update',
    title: 'Welcome to AssessAI!',
    message: `Hi ${name}, your account has been created successfully. Start exploring assessments now!`,
  })

  return { user, ...tokens }
}

export async function login({ email, password, rememberMe = false }) {
  const user = await User.findOne({ email }).select('+password')
  if (!user) throw new UnauthorizedError('Invalid email or password')

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw new UnauthorizedError('Invalid email or password')

  if (!user.isActive) throw new UnauthorizedError('Account is deactivated')

  const tokens = generateTokens(user._id, rememberMe)
  user.refreshToken = tokens.refreshToken
  user.lastLoginAt = new Date()
  await user.save({ validateBeforeSave: false })

  await createNotification(user._id, {
    type: 'account_update',
    title: 'New Login Detected',
    message: 'Logged in successfully from a new session.',
  })

  return { user, ...tokens }
}

export async function adminLogin({ email, password, rememberMe = false }) {
  if (email !== config.admin.email || password !== config.admin.password) {
    throw new UnauthorizedError('Invalid admin credentials')
  }

  let user = await User.findOne({ email })
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

export async function deleteAccount(userId, { password }) {
  const user = await User.findById(userId).select('+password')
  if (!user) throw new UnauthorizedError('User not found')

  const isMatch = await user.comparePassword(password)
  if (!isMatch) throw new UnauthorizedError('Incorrect password')

  user.isActive = false
  user.name = 'Deleted User'
  user.email = `deleted_${user._id}@removed.com`
  user.password = password
  user.refreshToken = null
  user.avatar = null
  user.preferences = {}
  await user.save({ validateBeforeSave: false })

  return { message: 'Account deleted successfully' }
}
