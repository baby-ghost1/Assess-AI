import jwt from 'jsonwebtoken'
import { config } from '../../config/index.js'
import User from '../users/User.js'
import { UnauthorizedError } from '../../shared/errors/AppError.js'

function generateTokens(userId, rememberMe = false) {
  const accessTokenExpiry = rememberMe ? '30d' : '15m'
  const refreshTokenExpiry = rememberMe ? '30d' : '7d'
  const accessToken = jwt.sign({ userId }, config.jwt.accessSecret, { expiresIn: accessTokenExpiry })
  const refreshToken = jwt.sign({ userId }, config.jwt.refreshSecret, { expiresIn: refreshTokenExpiry })
  return { accessToken, refreshToken }
}

async function findOrCreateOAuthUser({ provider, providerId, email, name, avatar }) {
  let user = await User.findOne({ provider, providerId })

  if (user) {
    user.lastLoginAt = new Date()
    if (avatar && !user.avatar) user.avatar = avatar
    await user.save({ validateBeforeSave: false })
    return user
  }

  user = await User.findOne({ email })
  if (user) {
    user.provider = provider
    user.providerId = providerId
    if (avatar && !user.avatar) user.avatar = avatar
    user.lastLoginAt = new Date()
    await user.save({ validateBeforeSave: false })
    return user
  }

  user = await User.create({
    name: name || email.split('@')[0],
    email,
    password: undefined,
    provider,
    providerId,
    avatar,
    role: 'candidate',
    isApproved: true,
    isEmailVerified: true,
    lastLoginAt: new Date(),
  })

  return user
}

export async function handleGoogleCallback(code) {
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: config.oauth.google.clientId,
      client_secret: config.oauth.google.clientSecret,
      redirect_uri: `${config.clientUrl}/auth/callback?provider=google`,
      grant_type: 'authorization_code',
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) throw new UnauthorizedError('Google authentication failed')

  const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const userInfo = await userInfoRes.json()
  if (!userInfo.email) throw new UnauthorizedError('Google authentication failed')

  const user = await findOrCreateOAuthUser({
    provider: 'google',
    providerId: userInfo.id,
    email: userInfo.email,
    name: userInfo.name,
    avatar: userInfo.picture,
  })

  const tokens = generateTokens(user._id, true)
  user.refreshToken = tokens.refreshToken
  await user.save({ validateBeforeSave: false })

  return { user, ...tokens }
}

export async function handleGithubCallback(code) {
  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.oauth.github.clientId,
      client_secret: config.oauth.github.clientSecret,
      code,
    }),
  })

  const tokenData = await tokenRes.json()
  if (tokenData.error) throw new UnauthorizedError('GitHub authentication failed')

  const userRes = await fetch('https://api.github.com/user', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })

  const githubUser = await userRes.json()
  if (!githubUser.email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })
    const emails = await emailsRes.json()
    const primary = emails.find((e) => e.primary && e.verified)
    if (primary) githubUser.email = primary.email
  }

  if (!githubUser.email) throw new UnauthorizedError('GitHub authentication failed — no verified email found')

  const user = await findOrCreateOAuthUser({
    provider: 'github',
    providerId: String(githubUser.id),
    email: githubUser.email,
    name: githubUser.name || githubUser.login,
    avatar: githubUser.avatar_url,
  })

  const tokens = generateTokens(user._id, true)
  user.refreshToken = tokens.refreshToken
  await user.save({ validateBeforeSave: false })

  return { user, ...tokens }
}
