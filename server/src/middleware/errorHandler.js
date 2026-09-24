import { logger } from '../config/logger.js'
import { config } from '../config/index.js'

const lastLogged = new Map()
const LOG_DEDUPE_MS = 60_000

function shouldLog(key) {
  const now = Date.now()
  const last = lastLogged.get(key)
  if (last && now - last < LOG_DEDUPE_MS) return false
  lastLogged.set(key, now)
  if (lastLogged.size > 50) {
    for (const [k, t] of lastLogged) {
      if (now - t >= LOG_DEDUPE_MS) lastLogged.delete(k)
    }
  }
  return true
}

export function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500
  let message = err.isOperational ? err.message : 'Internal server error'

  // Mongoose CastError (bad ObjectId etc.) → client error, not 500
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid ${err.path || 'value'} provided`
  } else if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate value for a unique field'
  }

  if (!err.isOperational && statusCode === 500) {
    const isMongoConn =
      err.name === 'MongoServerSelectionError' ||
      err.name === 'MongoNetworkError' ||
      err.name === 'MongoNotConnectedError' ||
      /ETIMEDOUT|ReplicaSetNoPrimary|Server selection timed out/i.test(
        err.message || ''
      )
    const key = isMongoConn
      ? `mongo:${err.name}:${err.message?.slice(0, 120)}`
      : `err:${err.name}:${err.message?.slice(0, 120)}`
    if (shouldLog(key)) {
      logger.error(
        isMongoConn
          ? 'MongoDB unreachable (repeating errors suppressed for 60s):'
          : 'Unexpected error:',
        err
      )
    }
  }

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    errors: err.details || null,
    meta: null,
  })
}
