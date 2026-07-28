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
