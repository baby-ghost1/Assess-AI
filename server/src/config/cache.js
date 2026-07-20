import Redis from 'ioredis'
import { config } from './index.js'
import { logger } from './logger.js'

let client = null

export async function connectCache() {
  if (client) return client
  try {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
    })
    await client.connect()
    logger.info('Redis cache connected')
  } catch (error) {
    logger.warn('Redis cache unavailable, running without cache:', error.message)
    client = null
  }
  return client
}

export function getCache() {
  return client
}

const DEFAULT_TTL = 300

export function cacheMiddleware(ttlSeconds = DEFAULT_TTL) {
  return async (req, res, next) => {
    if (!client || req.method !== 'GET') return next()

    const key = `cache:${req.originalUrl}`
    try {
      const cached = await client.get(key)
      if (cached) {
        res.json(JSON.parse(cached))
        return
      }

      const originalJson = res.json.bind(res)
      res.json = function (body) {
        client.setex(key, ttlSeconds, JSON.stringify(body)).catch(() => {})
        originalJson(body)
      }
    } catch {
    }
    next()
  }
}

export async function clearCache(pattern = 'cache:*') {
  if (!client) return
  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) await client.del(...keys)
  } catch {
  }
}
