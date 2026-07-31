import jwt from 'jsonwebtoken'
import { config } from '../../config/index.js'

export function generateTokens(userId, rememberMe = false) {
  const accessTokenExpiry = rememberMe ? '30d' : '15m'
  const refreshTokenExpiry = rememberMe ? '30d' : '7d'
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: accessTokenExpiry })
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: refreshTokenExpiry })
  return { accessToken, refreshToken }
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
