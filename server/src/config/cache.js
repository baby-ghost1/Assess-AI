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
