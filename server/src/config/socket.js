import { Server } from 'socket.io'
import { config } from './index.js'
import { logger } from './logger.js'
import * as proctoringService from '../modules/proctoring/proctoringService.js'
import Attempt from '../modules/assessments/Attempt.js'

let io = null

export function setupSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.clientUrl,
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
      socket.userId = decoded.userId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    logger.debug(`Proctoring client connected: ${socket.userId}`)

    socket.on('proctoring:join', async ({ attemptId }) => {
      if (!attemptId) return
      const attempt = await Attempt.findById(attemptId).select('user')
      if (!attempt || attempt.user.toString() !== socket.userId) return
      socket.join(`attempt:${attemptId}`)
      socket.currentAttemptId = attemptId
      logger.debug(`User ${socket.userId} joined attempt ${attemptId}`)
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
        if (!attempt || attempt.user.toString() !== socket.userId) return

        const result = await proctoringService.logViolation({
          attemptId,
          userId: socket.userId,
          assessmentId: attempt.assessment?._id,
          type,
          details,
          metadata,
        })

        io.to(`attempt:${attemptId}`).emit('proctoring:violation-logged', {
          type,
          severity: result.violation.severity,
          count: result.typeCount,
          action: result.action,
          totalViolations: result.totalCount,
        })

        if (result.shouldAutoSubmit) {
          io.to(`attempt:${attemptId}`).emit('proctoring:auto-submit', {
            reason: `Exceeded ${type} violation limit`,
            violations: result.totalCount,
          })
        }
      } catch (error) {
        logger.error('Proctoring violation error:', error)
      }
    })

    socket.on('proctoring:frame', async (data) => {
      // Face detection frame - could be processed server-side
      // For now, we just acknowledge receipt
      socket.emit('proctoring:frame-ack', { received: true })
    })

    socket.on('disconnect', () => {
      logger.debug(`Proctoring client disconnected: ${socket.userId}`)
    })
  })

  return io
}
