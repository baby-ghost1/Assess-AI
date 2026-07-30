import * as authService from './authService.js'

function setRefreshCookie(res, refreshToken, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
}

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.validatedBody)
    setRefreshCookie(res, result.refreshToken, true)
    res.status(201).json({ success: true, data: result, message: 'Registration successful', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.validatedBody)
    setRefreshCookie(res, result.refreshToken, req.validatedBody.rememberMe)
    res.status(200).json({ success: true, data: result, message: 'Login successful', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function adminLogin(req, res, next) {
  try {
    const result = await authService.adminLogin(req.validatedBody)
    setRefreshCookie(res, result.refreshToken, req.validatedBody.rememberMe)
    res.status(200).json({ success: true, data: result, message: 'Admin login successful', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.user._id)
    res.clearCookie('refreshToken', { path: '/' })
    res.status(200).json({ success: true, data: null, message: 'Logout successful', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function refreshToken(req, res, next) {
  try {
    const token = req.cookies?.refreshToken
    const result = await authService.refreshToken(token)
    setRefreshCookie(res, result.refreshToken, true)
    res.status(200).json({ success: true, data: result, message: 'Token refreshed', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getMe(req, res) {
  res.status(200).json({ success: true, data: req.user, message: 'User fetched', errors: null, meta: null })
}

export async function changePassword(req, res, next) {
  try {
    const result = await authService.changePassword(req.user._id, req.validatedBody)
    res.status(200).json({ success: true, data: result, message: 'Password changed successfully', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function updateProfile(req, res, next) {
  try {
    const result = await authService.updateProfile(req.user._id, req.validatedBody)
    res.status(200).json({ success: true, data: result, message: 'Profile updated successfully', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function getPreferences(req, res, next) {
  try {
    const result = await authService.getPreferences(req.user._id)
    res.status(200).json({ success: true, data: result, message: 'Preferences fetched', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function updatePreferences(req, res, next) {
  try {
    const result = await authService.updatePreferences(req.user._id, req.validatedBody)
    res.status(200).json({ success: true, data: result, message: 'Preferences updated', errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function deleteAccount(req, res, next) {
  try {
    const result = await authService.deleteAccount(req.user._id, req.validatedBody)
    res.clearCookie('refreshToken', { path: '/' })
    res.status(200).json({ success: true, data: null, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function sendDeleteOtp(req, res, next) {
  try {
    const result = await authService.sendDeleteOtp(req.user._id)
    res.status(200).json({ success: true, data: null, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function verifyDeleteOtp(req, res, next) {
  try {
    const result = await authService.verifyDeleteOtp(req.user._id, req.validatedBody)
    res.clearCookie('refreshToken', { path: '/' })
    res.status(200).json({ success: true, data: null, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function forgotPassword(req, res, next) {
  try {
    const result = await authService.forgotPassword(req.validatedBody.email)
    res.status(200).json({ success: true, data: null, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}

export async function resetPassword(req, res, next) {
  try {
    const result = await authService.resetPassword(req.validatedBody.token, req.validatedBody.password)
    res.status(200).json({ success: true, data: null, message: result.message, errors: null, meta: null })
  } catch (error) { next(error) }
}
