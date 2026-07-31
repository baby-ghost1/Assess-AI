import express from 'express'
import { createServer } from 'http'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import compression from 'compression'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import { config } from './config/index.js'
import { connectDatabase } from './config/database.js'
import { connectCache } from './config/cache.js'
import { logger } from './config/logger.js'
import { setupSocket } from './config/socket.js'
import { errorHandler } from './middleware/errorHandler.js'
import { ensureIndexes } from './config/indexes.js'
import authRoutes from './modules/auth/authRoutes.js'
import questionRoutes from './modules/questions/questionRoutes.js'
import tagRoutes from './modules/tags/tagRoutes.js'
import uploadRoutes from './modules/uploads/uploadRoutes.js'
import aiRoutes from './modules/ai/aiRoutes.js'
import assessmentRoutes, { adminRouter as adminAssessmentRoutes } from './modules/assessments/assessmentRoutes.js'
import proctoringRoutes from './modules/proctoring/proctoringRoutes.js'
import analyticsRoutes, { adminRouter as adminAnalyticsRoutes, setterRouter as setterAnalyticsRoutes } from './modules/analytics/analyticsRoutes.js'
import adminRoutes from './modules/admin/adminRoutes.js'
import { candidateRouter as candidateDashboardRoutes, setterRouter as setterDashboardRoutes } from './modules/dashboard/dashboardRoutes.js'
import codingRoutes from './modules/coding/codingRoutes.js'
import notificationRoutes from './modules/notifications/notificationRoutes.js'
import privacyRouter from './modules/legal/privacyRouter.js'
import termsRouter from './modules/legal/termsRouter.js'
import homeRouter from './modules/legal/homeRouter.js'
import { detectLanguages } from './modules/coding/codingService.js'

const app = express()
const httpServer = createServer(app)

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      fontSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'ws:', 'wss:', 'https://assessai-beta.vercel.app'],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
}))
app.use(compression())
app.use(cors({
  origin: (origin, callback) => {
    const allowed = (config.clientUrl || '').split(',').map(s => s.trim())
    if (!origin || allowed.includes(origin) || allowed.includes('*')) {
      callback(null, true)
    } else {
      callback(null, true)
    }
  },
  credentials: true,
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
})
app.use('/api/', limiter)

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Routes
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/questions', questionRoutes)
app.use('/api/v1/tags', tagRoutes)
app.use('/api/v1/uploads', uploadRoutes)
app.use('/api/v1/ai', aiRoutes)
app.use('/api/v1/assessments', assessmentRoutes)
app.use('/api/v1/proctoring', proctoringRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/api/v1/admin', adminRoutes)
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes)
app.use('/api/v1/admin/assessments', adminAssessmentRoutes)
app.use('/api/v1/setter/analytics', setterAnalyticsRoutes)
app.use('/api/v1/candidate/dashboard', candidateDashboardRoutes)
app.use('/api/v1/setter/dashboard', setterDashboardRoutes)
app.use('/api/v1/coding', codingRoutes)
app.use('/api/v1/notifications', notificationRoutes)

// Legal pages (Google OAuth branding verification)
app.use(homeRouter)
app.use(privacyRouter)
app.use(termsRouter)

// Health check
app.get('/api/health', (_, res) => {
  res.json({ success: true, message: 'Server is running', timestamp: new Date().toISOString() })
})

// Serve static files from client build (only if built locally)
import fs from 'fs'
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../../client/dist')
const clientDistExists = fs.existsSync(clientDist)

if (clientDistExists) {
  app.use(express.static(clientDist))
} else {
  console.log('⚠️  client/dist not found — serving API only (frontend hosted on Vercel)')
}

// SPA catch-all: return index.html for non-API, non-file routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    if (clientDistExists) {
      res.sendFile(path.join(clientDist, 'index.html'))
    } else {
      res.status(404).json({ success: false, message: 'API only — frontend hosted separately' })
    }
  } else {
    res.status(404).json({ success: false, message: 'Route not found' })
  }
})

// Error handler
app.use(errorHandler)

// Socket.io setup
const io = setupSocket(httpServer)

// Start server
async function start() {
  await connectDatabase()
  await connectCache()
  await ensureIndexes()
  detectLanguages()

  httpServer.listen(config.port, () => {
    logger.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`)
  })
}

start().catch((error) => {
  logger.error('Failed to start server:', error)
  process.exit(1)
})

export { app, httpServer, io }
