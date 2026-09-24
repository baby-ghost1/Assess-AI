import { connectCache } from '../config/cache.js'
import { logger } from '../config/logger.js'

let redis = null
let checked = false

async function getClient() {
  if (!checked) {
    redis = await connectCache()
    checked = true
  }
  return redis
}

export async function getCache(key) {
  const client = await getClient()
  if (!client) return null
  try {
    const raw = await client.get(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch (error) {
    return null
  }
}

export async function setCache(key, data, ttlSeconds = 300) {
  const client = await getClient()
  if (!client) return
  try {
    const serialized = JSON.stringify(data)
    if (ttlSeconds > 0) {
      await client.setex(key, ttlSeconds, serialized)
    } else {
      await client.set(key, serialized)
    }
  } catch (error) {
    // silent fail
  }
}

export async function delCache(key) {
  const client = await getClient()
  if (!client) return
  try {
    await client.del(key)
  } catch (error) {
    // silent fail
  }
}

export async function delPattern(pattern) {
  const client = await getClient()
  if (!client) return
  try {
    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
    }
  } catch (error) {
    // silent fail
  }
}
