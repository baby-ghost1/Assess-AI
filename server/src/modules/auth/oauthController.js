import * as oauthService from './oauthService.js'
import { config } from '../../config/index.js'

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
  })
}

function redirectWithTokens(res, result, provider) {
  setRefreshCookie(res, result.refreshToken)
  const params = new URLSearchParams({
    accessToken: result.accessToken,
    provider,
  })
  res.redirect(`${config.clientUrl}/auth/callback?${params.toString()}`)
}

function getBackendUrl(req) {
  return process.env.BACKEND_URL || `${req.protocol}://${req.get('host')}`
}

export async function googleAuth(req, res) {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ')

  const backendUrl = getBackendUrl(req)

  const params = new URLSearchParams({
    client_id: config.oauth.google.clientId,
    redirect_uri: `${backendUrl}/api/v1/auth/google/callback`,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}

export async function googleCallback(req, res, next) {
  try {
    const { code, error } = req.query
    if (error || !code) {
      return res.redirect(`${config.clientUrl}/login?error=google_auth_failed`)
    }
    const backendUrl = getBackendUrl(req)
    const redirectUri = `${backendUrl}/api/v1/auth/google/callback`
    const result = await oauthService.handleGoogleCallback(code, redirectUri)
    redirectWithTokens(res, result, 'google')
  } catch (error) {
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}

export async function githubAuth(req, res) {
  const backendUrl = getBackendUrl(req)

  const params = new URLSearchParams({
    client_id: config.oauth.github.clientId,
    redirect_uri: `${backendUrl}/api/v1/auth/github/callback`,
    scope: 'user:email',
  })

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}

export async function githubCallback(req, res, next) {
  try {
    const { code, error } = req.query
    if (error || !code) {
      return res.redirect(`${config.clientUrl}/login?error=github_auth_failed`)
    }
    const result = await oauthService.handleGithubCallback(code)
    redirectWithTokens(res, result, 'github')
  } catch (error) {
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}
