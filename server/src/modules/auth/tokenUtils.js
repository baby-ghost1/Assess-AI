import jwt from 'jsonwebtoken'
import { config } from '../../config/index.js'

export function generateTokens(userId, rememberMe = false) {
  const accessTokenExpiry = rememberMe ? '30d' : '15m'
  const refreshTokenExpiry = rememberMe ? '30d' : '7d'
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: accessTokenExpiry })
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: refreshTokenExpiry })
  return { accessToken, refreshToken }
}

export function setMediaCookie(res, accessToken) {
  if (!accessToken) return
  let maxAge = 15 * 60 * 1000
  try {
    const decoded = jwt.decode(accessToken)
    if (decoded?.exp) maxAge = Math.max(0, decoded.exp * 1000 - Date.now())
  } catch {}
  if (maxAge <= 0) return clearMediaCookie(res)
  res.cookie('mediaToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge,
    path: '/',
  })
}

export function clearMediaCookie(res) {
  res.clearCookie('mediaToken', { path: '/' })
}

export function setRefreshCookie(res, refreshToken, rememberMe = false) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge,
    path: '/',
  })
}
