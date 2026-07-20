import { logger } from '../config/logger.js'
import { config } from '../config/index.js'

export function errorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Internal server error'

  if (!err.isOperational) {
    logger.error('Unexpected error:', err)
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors: err.details || null,
    meta: null,
  })
}
