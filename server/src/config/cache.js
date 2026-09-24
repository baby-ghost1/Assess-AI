import Redis from 'ioredis'
import { config } from './index.js'
import { logger } from './logger.js'

let client = null
let unavailable = false

export async function connectCache() {
  if (unavailable) return null
  if (client?.status === 'ready') return client
  try {
    client = new Redis(config.redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null
        return Math.min(times * 200, 2000)
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    })
    client.on('error', () => {})
    await client.connect()
    logger.info('Redis cache connected')
  } catch (error) {
    unavailable = true
    client = null
    logger.warn('Redis cache unavailable, running without cache')
  }
  return client
}
