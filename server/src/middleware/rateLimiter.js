import rateLimit from 'express-rate-limit'
import { config } from '../config/index.js'

const dev = config.nodeEnv !== 'production'

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 500 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Try again later.' },
  skipSuccessfulRequests: false,
})

// Restricted assessment entry is protected by a shared password but a class may
// share one IP, so only FAILED password guesses are counted (successful entries
// bust the counter). Prevents brute-forcing the shared password without locking
// out a room of legitimate candidates behind a NAT.
export const restrictedStartLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: dev ? 300 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many incorrect attempts. Try again later.' },
  skipSuccessfulRequests: true,
})

export const codeRunLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: dev ? 30 : 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many code submissions. Slow down.' },
})

export const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: dev ? 20 : 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many AI requests. Please wait.' },
})
