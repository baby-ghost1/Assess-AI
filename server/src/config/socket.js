import { Server } from 'socket.io'
import { config } from './index.js'
import { logger } from './logger.js'
import * as proctoringService from '../modules/proctoring/proctoringService.js'
import * as assessmentService from '../modules/assessments/assessmentService.js'
import Attempt from '../modules/assessments/Attempt.js'
import User from '../modules/users/User.js'

let io = null
const userSockets = new Map() // userId -> Set<socketId>

export function getIO() {
  return io
}

export function disconnectUserSockets(userId) {
  const key = String(userId)
  const sockets = userSockets.get(key)
  if (!sockets) return
  if (io) {
    for (const sid of sockets) {
      const s = io.sockets.sockets.get(sid)
      if (s) s.disconnect(true)
    }
  }
  userSockets.delete(key)
}

export function setupSocket(httpServer) {
  const allowedOrigins = (config.clientUrl || '').split(',').map((s) => s.trim()).filter(Boolean)
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const jwt = await import('jsonwebtoken')
      const decoded = jwt.default.verify(token, config.jwt.accessSecret)
      socket.userId = String(decoded.userId)

      // Reject deactivated users at connection time; load role for room targeting
      const user = await User.findById(decoded.userId).select('isActive role')
      if (!user || !user.isActive) {
        return next(new Error('Account is deactivated'))
      }
      socket.role = user.role
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    logger.debug(`Client connected: ${socket.userId} (${socket.role})`)

    const userKey = String(socket.userId)
    if (!userSockets.has(userKey)) userSockets.set(userKey, new Set())
    userSockets.get(userKey).add(socket.id)
    socket.join(`user:${userKey}`)
    if (socket.role) socket.join(`role:${socket.role}`)

    socket.on('proctoring:join', async ({ attemptId } = {}) => {
      if (!attemptId) return
      try {
        const attempt = await Attempt.findById(attemptId).select('user assessment status')
        if (!attempt || attempt.user.toString() !== socket.userId) return
        socket.join(`attempt:${attemptId}`)
        if (attempt.assessment) socket.join(`assessment:${attempt.assessment}`)
        socket.currentAttemptId = attemptId
        logger.debug(`User ${socket.userId} joined attempt ${attemptId}`)
      } catch (error) {
        logger.error('proctoring:join error:', error)
      }
    })

    socket.on('proctoring:leave', () => {
      if (socket.currentAttemptId) {
        socket.leave(`attempt:${socket.currentAttemptId}`)
        socket.currentAttemptId = null
      }
    })

    socket.on('proctoring:violation', async (data) => {
      try {
        const { attemptId, type, details, metadata } = data
        if (!attemptId || !type) return

        const attempt = await Attempt.findById(attemptId).populate('assessment')
        if (!attempt || String(attempt.user) !== socket.userId) return

        // Only log against live attempts
        if (attempt.status !== 'in_progress') return

        // Per-assessment proctoring requirement (global enable handled in logViolation)
        if (!attempt.assessment?.proctoringRequired) return

        const result = await proctoringService.logViolation({
          attemptId,
          userId: socket.userId,
          assessmentId: attempt.assessment?._id,
          type,
          details,
          metadata,
        })

        if (result.dropped) return

        io.to(`attempt:${attemptId}`).emit('proctoring:violation-logged', {
          type,
          severity: result.violation.severity,
          count: result.typeCount,
          action: result.action,
          totalViolations: result.totalCount,
        })

        if (result.shouldAutoSubmit) {
          // Server-authoritative auto-submit: finalize first, then notify client
          try {
            await assessmentService.finishAttempt(attemptId, socket.userId, 'auto_submit')
          } catch (finishErr) {
            logger.error('Auto-submit finish failed:', finishErr)
          }
          io.to(`attempt:${attemptId}`).emit('proctoring:auto-submit', {
            reason: `Exceeded ${type} violation limit`,
            violations: result.totalCount,
          })
        }
      } catch (error) {
        logger.error('Proctoring violation error:', error)
      }
    })

    socket.on('disconnect', () => {
      const set = userSockets.get(String(socket.userId))
      if (set) {
        set.delete(socket.id)
        if (set.size === 0) userSockets.delete(String(socket.userId))
      }
      logger.debug(`Proctoring client disconnected: ${socket.userId}`)
    })
  })

  return io
}
