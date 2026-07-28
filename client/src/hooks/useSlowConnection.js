import { useState, useEffect, useCallback } from 'react'

export default function useSlowConnection(threshold = 3000) {
  const [isSlow, setIsSlow] = useState(false)
  const [lastCheck, setLastCheck] = useState(null)

  const checkSpeed = useCallback(async () => {
    if (!navigator.onLine) return

    try {
      const start = Date.now()
      await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-store',
      })
      const duration = Date.now() - start
      setIsSlow(duration > threshold)
      setLastCheck(duration)
    } catch {
      setIsSlow(true)
    }
  }, [threshold])

  useEffect(() => {
    checkSpeed()
    const interval = setInterval(checkSpeed, 30000)
    return () => clearInterval(interval)
  }, [checkSpeed])

  const dismiss = () => setIsSlow(false)

  return { isSlow, lastCheck, dismiss, recheck: checkSpeed }
}
