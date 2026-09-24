import crypto from 'crypto'
import * as oauthService from './oauthService.js'
import { config } from '../../config/index.js'
import { setRefreshCookie, setMediaCookie } from './tokenUtils.js'

const CLIENT_ORIGIN = safeOrigin(config.clientUrl)
const BACKEND_ORIGIN = safeOrigin(config.backendUrl)

function safeOrigin(value) {
  try { return new URL(value) } catch { return null }
}

function setOAuthStateCookie(res, state) {
  res.cookie('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: '/',
  })
}

function clearOAuthStateCookie(res) {
  res.clearCookie('oauth_state', { path: '/' })
}

function redirectBase(req) {
  const host = (req.get('host') || '').toLowerCase()
  for (const origin of [CLIENT_ORIGIN, BACKEND_ORIGIN]) {
    if (origin && origin.host.toLowerCase() === host) return origin.origin
  }
  if (/^(\[::1\]|localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    return `http://${host}`
  }
  return CLIENT_ORIGIN?.origin || BACKEND_ORIGIN?.origin || `http://${host}`
}

function redirectWithTokens(res, result, provider) {
  setRefreshCookie(res, result.refreshToken, true)
  setMediaCookie(res, result.accessToken)
  res.redirect(`${config.clientUrl}/auth/callback?provider=${provider}`)
}

export async function googleAuth(req, res) {
  const state = crypto.randomBytes(16).toString('hex')
  setOAuthStateCookie(res, state)

  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ].join(' ')

  const params = new URLSearchParams({
    client_id: config.oauth.google.clientId,
    redirect_uri: `${redirectBase(req)}/api/v1/auth/google/callback`,
    response_type: 'code',
    scope: scopes,
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`)
}

export async function googleCallback(req, res) {
  try {
    const { code, error, state } = req.query
    const storedState = req.cookies?.oauth_state
    if (error || !code || !state || !storedState || state !== storedState) {
      clearOAuthStateCookie(res)
      return res.redirect(`${config.clientUrl}/login?error=google_auth_failed`)
    }
    clearOAuthStateCookie(res)
    const redirectUri = `${redirectBase(req)}/api/v1/auth/google/callback`
    const result = await oauthService.handleGoogleCallback(code, redirectUri)
    redirectWithTokens(res, result, 'google')
  } catch (error) {
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}

export async function githubAuth(req, res) {
  const state = crypto.randomBytes(16).toString('hex')
  setOAuthStateCookie(res, state)

  const params = new URLSearchParams({
    client_id: config.oauth.github.clientId,
    redirect_uri: `${redirectBase(req)}/api/v1/auth/github/callback`,
    scope: 'user:email',
    state,
  })

  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`)
}

export async function githubCallback(req, res) {
  try {
    const { code, error, state } = req.query
    const storedState = req.cookies?.oauth_state
    if (error || !code || !state || !storedState || state !== storedState) {
      clearOAuthStateCookie(res)
      return res.redirect(`${config.clientUrl}/login?error=github_auth_failed`)
    }
    clearOAuthStateCookie(res)
    const result = await oauthService.handleGithubCallback(code)
    redirectWithTokens(res, result, 'github')
  } catch (error) {
    res.redirect(`${config.clientUrl}/login?error=${encodeURIComponent(error.message)}`)
  }
}