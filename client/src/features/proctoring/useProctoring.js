import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'

const DEFAULT_SETTINGS = {
  enabled: true,
  faceDetection: true,
  gazeDetection: true,
  postureDetection: false,
  clipboardDetection: true,
  rightClickDetection: true,
  networkMonitoring: true,
  tabSwitchLimit: 3,
  autoSubmit: true,
}

export default function useProctoring({ attemptId, enabled, settings, onAutoSubmit, onViolation }) {
  const socketRef = useRef(null)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const frameIntervalRef = useRef(null)
  const audioIntervalRef = useRef(null)
  const violationsRef = useRef([])
  const [status, setStatus] = useState('inactive')
  const [lastViolation, setLastViolation] = useState(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Always-latest settings for detectors (avoids re-running effects on every admin change)
  const settingsRef = useRef({ ...DEFAULT_SETTINGS, ...(settings || {}) })
  settingsRef.current = { ...DEFAULT_SETTINGS, ...(settings || {}) }
  const mergedSettings = { ...DEFAULT_SETTINGS, ...(settings || {}) }

  const onViolationRef = useRef(onViolation)
  onViolationRef.current = onViolation
  const onAutoSubmitRef = useRef(onAutoSubmit)
  onAutoSubmitRef.current = onAutoSubmit
  const attemptIdRef = useRef(attemptId)
  attemptIdRef.current = attemptId
  const wasEnabledRef = useRef(false)
  const suppressExitViolationRef = useRef(false)

  const addViolation = useCallback((type, details = '') => {
    const v = { type, details, timestamp: new Date().toISOString() }
    violationsRef.current = [...violationsRef.current, v]
    setLastViolation(v)
    onViolationRef.current?.(v)

    if (socketRef.current?.connected) {
      socketRef.current.emit('proctoring:violation', {
        attemptId: attemptIdRef.current,
        type,
        details,
        metadata: { time: Date.now() },
      })
    }
  }, [])

  const enterFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }
  }, [])

  // Socket connection — stable: reconnects only when enabled/attemptId changes
  useEffect(() => {
    if (!enabled || !attemptId) return

    const token = localStorage.getItem('accessToken')
    const socket = io(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      socket.emit('proctoring:join', { attemptId })
      setStatus('active')
    })

    socket.on('proctoring:violation-logged', (data) => {
      if (data.action === 'auto_submit') {
        onAutoSubmitRef.current?.(data)
      }
    })

    socket.on('proctoring:auto-submit', (data) => {
      onAutoSubmitRef.current?.(data)
    })

    socket.on('disconnect', () => {
      setStatus('disconnected')
    })

    socketRef.current = socket

    return () => {
      socket.emit('proctoring:leave')
      socket.disconnect()
      socketRef.current = null
    }
  }, [enabled, attemptId])

  // Camera setup — starts only when a camera-dependent detector is on;
  // re-runs when those settings change (admin can toggle mid-attempt)
  const cameraDependent =
    mergedSettings.faceDetection || mergedSettings.gazeDetection || mergedSettings.postureDetection

  useEffect(() => {
    if (!enabled || !cameraDependent) {
      // Tear down any existing stream when camera becomes unnecessary
      clearInterval(frameIntervalRef.current)
      clearInterval(audioIntervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      audioContextRef.current?.close().catch(() => {})
      audioContextRef.current = null
      return undefined
    }

    let cancelled = false

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Audio analysis (no admin sub-toggle — always active while camera stream exists)
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyserRef.current = analyser
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
        analyser.fftSize = 256

        // Background noise detection — max 1 warning per 30s to avoid spam
        let lastNoiseWarn = 0
        audioIntervalRef.current = setInterval(() => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          if (avg > 40 && Date.now() - lastNoiseWarn > 30000) {
            lastNoiseWarn = Date.now()
            addViolation('background_noise', `Noise level: ${Math.round(avg)}`)
          }
        }, 5000)

        // Frame analysis — grace period + consecutive-miss threshold
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext('2d')

        const GRACE_MS = 15000
        const MISS_THRESHOLD = 3
        const startedAt = Date.now()
        let missed = 0
        let outside = 0
        let dark = 0
        let looking = 0
        let posture = 0

        frameIntervalRef.current = setInterval(() => {
          if (cancelled || !videoRef.current) return
          if (Date.now() - startedAt < GRACE_MS) return
          try {
            ctx.drawImage(videoRef.current, 0, 0, 320, 240)
            const imageData = ctx.getImageData(0, 0, 320, 240)
            const { hasFace, brightness, centerRatio, centerX, centerY } = analyzeFrame(imageData)
            const s = settingsRef.current

            if (hasFace) {
              missed = 0
              if (s.faceDetection) {
                // Face mostly outside the central safe zone → partially out of frame
                if (centerRatio < 0.35) {
                  outside++
                  if (outside === MISS_THRESHOLD) {
                    addViolation('face_outside_screen', 'Face appears outside the camera frame')
                  }
                } else {
                  outside = 0
                }
              }

              // Gaze: face centroid far left/right sustained → looking away
              if (s.gazeDetection) {
                if (centerX < 0.25 || centerX > 0.75) {
                  looking++
                  if (looking === MISS_THRESHOLD) {
                    addViolation('looking_away', 'Candidate appears to be looking away from screen')
                  }
                } else {
                  looking = 0
                }
              }

              // Posture: face centroid unusually low → slouching / leaning down
              if (s.postureDetection) {
                if (centerY > 0.75) {
                  posture++
                  if (posture === MISS_THRESHOLD) {
                    addViolation('posture_violation', 'Candidate posture appears slouched or leaning down')
                  }
                } else {
                  posture = 0
                }
              }
            } else {
              missed++
              if (s.faceDetection && missed === MISS_THRESHOLD) {
                addViolation('no_face', 'No face detected in frame')
              }
            }

            if (s.faceDetection && brightness < 40) {
              dark++
              if (dark === MISS_THRESHOLD) {
                addViolation('low_lighting', `Low lighting detected (brightness: ${Math.round(brightness)})`)
              }
            } else {
              dark = 0
            }
          } catch {
            // video frame not ready
          }
        }, 10000)

        setStatus('active')
      } catch (err) {
        if (cancelled) return
        console.warn('Camera access denied:', err.message)
        setStatus('no-camera')
        onViolationRef.current?.({ type: 'camera_denied', details: err.message || 'Camera access was denied', timestamp: new Date().toISOString() })
      }
    }

    setupCamera()

    return () => {
      cancelled = true
      clearInterval(frameIntervalRef.current)
      clearInterval(audioIntervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
      audioContextRef.current?.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [enabled, cameraDependent, addViolation])

  // Fullscreen enforcement + state tracking
  useEffect(() => {
    if (!enabled) return undefined

    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement))
    sync()

    const handleFullscreen = () => {
      const inFs = Boolean(document.fullscreenElement)
      setIsFullscreen(inFs)
      if (!inFs) {
        if (suppressExitViolationRef.current) {
          suppressExitViolationRef.current = false
          return
        }
        addViolation('fullscreen_exit', 'Exited fullscreen mode')
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    }

    const tryOnInteract = () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    document.addEventListener('pointerdown', tryOnInteract, { once: true, capture: true })
    document.addEventListener('keydown', tryOnInteract, { once: true, capture: true })

    document.addEventListener('fullscreenchange', handleFullscreen)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreen)
      document.removeEventListener('pointerdown', tryOnInteract, { capture: true })
      document.removeEventListener('keydown', tryOnInteract, { capture: true })
    }
  }, [enabled, addViolation])

  // Exit fullscreen only on a real enabled true→false transition (StrictMode-safe)
  useEffect(() => {
    if (!enabled) {
      setIsFullscreen(false)
      const was = wasEnabledRef.current
      wasEnabledRef.current = false
      if (was && document.fullscreenElement) {
        suppressExitViolationRef.current = true
        document.exitFullscreen().catch(() => { suppressExitViolationRef.current = false })
      }
      return
    }
    suppressExitViolationRef.current = false
    wasEnabledRef.current = true
  }, [enabled])

  // Exit fullscreen on true unmount while proctoring was active (post-submit navigation)
  useEffect(() => {
    return () => {
      if (wasEnabledRef.current && document.fullscreenElement) {
        suppressExitViolationRef.current = true
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [])

  // Tab switch detection — always active while proctoring is on (limit enforced server-side)
  useEffect(() => {
    if (!enabled) return undefined

    const handleVisibility = () => {
      if (document.hidden) {
        addViolation('tab_switch', 'Candidate switched tabs')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, addViolation])

  // Clipboard monitoring — gated by admin clipboardDetection toggle
  useEffect(() => {
    if (!enabled || !mergedSettings.clipboardDetection) return undefined

    const handleCopy = (e) => {
      addViolation('copy_paste', 'Copy action detected')
      e.preventDefault()
    }
    const handleCut = (e) => {
      addViolation('clipboard_usage', 'Cut action detected')
      e.preventDefault()
    }
    const handlePaste = (e) => {
      addViolation('clipboard_usage', 'Paste action detected')
      e.preventDefault()
    }

    document.addEventListener('copy', handleCopy)
    document.addEventListener('cut', handleCut)
    document.addEventListener('paste', handlePaste)
    return () => {
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('cut', handleCut)
      document.removeEventListener('paste', handlePaste)
    }
  }, [enabled, mergedSettings.clipboardDetection, addViolation])

  // Keyboard shortcut detection — always active while proctoring is on
  useEffect(() => {
    if (!enabled) return undefined

    const handleKeyDown = (e) => {
      if (
        (e.ctrlKey && ['c', 'v', 'x', 'a', 's', 'p', 'u'].includes(e.key.toLowerCase())) ||
        e.key === 'PrintScreen' ||
        (e.metaKey && ['c', 'v', 'x', 'a', 's', 'p'].includes(e.key.toLowerCase()))
      ) {
        addViolation('keyboard_shortcut', `Blocked shortcut: ${e.ctrlKey || e.metaKey ? 'Ctrl+' : ''}${e.key}`)
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [enabled, addViolation])

  // Right-click disable — gated by admin rightClickDetection toggle
  useEffect(() => {
    if (!enabled || !mergedSettings.rightClickDetection) return undefined

    const handleContextMenu = (e) => {
      addViolation('right_click', 'Right-click detected')
      e.preventDefault()
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [enabled, mergedSettings.rightClickDetection, addViolation])

  // Network detection — gated by admin networkMonitoring toggle
  useEffect(() => {
    if (!enabled || !mergedSettings.networkMonitoring) return undefined

    const handleOffline = () => addViolation('network_disconnect', 'Network connection lost')
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [enabled, mergedSettings.networkMonitoring, addViolation])

  return { status, lastViolation, violationsRef, videoRef, streamRef, isFullscreen, enterFullscreen }
}

// Frame analysis: skin-color face heuristic + brightness + face position
function analyzeFrame(imageData) {
  const data = imageData.data
  const w = imageData.width
  const h = imageData.height
  const total = w * h
  let skinPixels = 0
  let centerSkin = 0
  let sumX = 0
  let sumY = 0
  let brightnessSum = 0

  const cx0 = w * 0.2
  const cx1 = w * 0.8
  const cy0 = h * 0.15
  const cy1 = h * 0.85

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      brightnessSum += (r + g + b) / 3

      const isSkin = r > 200 && g > 160 && b > 120 &&
                     r > g && r > b &&
                     (r + g + b) > 380 &&
                     !(r > 240 && g > 240 && b > 240)

      if (isSkin) {
        skinPixels++
        sumX += x
        sumY += y
        if (x > cx0 && x < cx1 && y > cy0 && y < cy1) {
          centerSkin++
        }
      }
    }
  }

  return {
    hasFace: (skinPixels / total) > 0.03,
    brightness: brightnessSum / total,
    centerRatio: skinPixels > 0 ? centerSkin / skinPixels : 1,
    centerX: skinPixels > 0 ? sumX / skinPixels / w : 0.5,
    centerY: skinPixels > 0 ? sumY / skinPixels / h : 0.5,
  }
}
