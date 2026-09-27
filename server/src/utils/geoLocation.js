const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fe80:/i,
  /^f[cd][0-9a-f]{2}:/i,
]

export function isPrivateIp(ip) {
  if (!ip) return true
  const clean = String(ip).replace(/^::ffff:/i, '').trim()
  return PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(clean))
}

/**
 * Best-effort, non-blocking IP → "City, Country" lookup.
 * Returns 'Localhost' for private addresses, null when the lookup fails.
 */
export async function resolveLocation(ip) {
  if (!ip) return null
  const clean = String(ip).replace(/^::ffff:/i, '').trim()
  if (!clean || isPrivateIp(clean)) return 'Localhost'

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 2500)
  try {
    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(clean)}?fields=status,country,city&lang=en`,
      { signal: controller.signal }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (data.status !== 'success') return null
    const parts = [data.city, data.country].filter(Boolean)
    return parts.length ? parts.join(', ') : null
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}
