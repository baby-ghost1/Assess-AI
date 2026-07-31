import { useEffect, useRef, useCallback, useState } from 'react'
import { io } from 'socket.io-client'

export default function useProctoring({ attemptId, enabled, onAutoSubmit, onViolation }) {
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

  const addViolation = useCallback((type, details = '') => {
    const v = { type, details, timestamp: new Date().toISOString() }
    violationsRef.current = [...violationsRef.current, v]
    setLastViolation(v)
    onViolation?.(v)

    if (socketRef.current?.connected) {
      socketRef.current.emit('proctoring:violation', {
        attemptId,
        type,
        details,
        metadata: { time: Date.now() },
      })
    }
  }, [attemptId, onViolation])

  // Socket connection
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
        onAutoSubmit?.(data)
      }
    })

    socket.on('proctoring:auto-submit', (data) => {
      onAutoSubmit?.(data)
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
  }, [enabled, attemptId, onAutoSubmit])

  // Webcam setup
  useEffect(() => {
    if (!enabled) return

    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: true,
        })
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }

        // Audio analysis
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
        audioContextRef.current = audioCtx
        const analyser = audioCtx.createAnalyser()
        analyserRef.current = analyser
        const source = audioCtx.createMediaStreamSource(stream)
        source.connect(analyser)
        analyser.fftSize = 256

        // Background noise detection
        audioIntervalRef.current = setInterval(() => {
          const dataArray = new Uint8Array(analyser.frequencyBinCount)
          analyser.getByteFrequencyData(dataArray)
          const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
          if (avg > 40) {
            addViolation('background_noise', `Noise level: ${Math.round(avg)}`)
          }
        }, 5000)

        // Face detection via canvas analysis
        const canvas = document.createElement('canvas')
        canvas.width = 320
        canvas.height = 240
        const ctx = canvas.getContext('2d')

        frameIntervalRef.current = setInterval(() => {
          if (!videoRef.current) return
          ctx.drawImage(videoRef.current, 0, 0, 320, 240)
          const imageData = ctx.getImageData(0, 0, 320, 240)
          const faceDetected = detectFaceSimple(imageData)

          if (!faceDetected) {
            addViolation('no_face', 'No face detected in frame')
          }
        }, 10000)

        setStatus('active')
      } catch (err) {
        console.warn('Camera access denied:', err.message)
        setStatus('no-camera')
      }
    }

    setupCamera()

    return () => {
      clearInterval(frameIntervalRef.current)
      clearInterval(audioIntervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
      }
      audioContextRef.current?.close()
    }
  }, [enabled, addViolation])

  // Tab switch detection
  useEffect(() => {
    if (!enabled) return

    const handleVisibility = () => {
      if (document.hidden) {
        addViolation('tab_switch', 'Candidate switched tabs')
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, addViolation])

  // Fullscreen enforcement
  useEffect(() => {
    if (!enabled) return

    const handleFullscreen = () => {
      if (!document.fullscreenElement) {
        addViolation('fullscreen_exit', 'Exited fullscreen mode')
        document.documentElement.requestFullscreen().catch(() => {})
      }
    }
    document.addEventListener('fullscreenchange', handleFullscreen)
    return () => document.removeEventListener('fullscreenchange', handleFullscreen)
  }, [enabled, addViolation])

  // Clipboard monitoring
  useEffect(() => {
    if (!enabled) return

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
  }, [enabled, addViolation])

  // Keyboard shortcut detection
  useEffect(() => {
    if (!enabled) return

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

  // Right-click disable
  useEffect(() => {
    if (!enabled) return

    const handleContextMenu = (e) => {
      addViolation('right_click', 'Right-click detected')
      e.preventDefault()
    }
    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [enabled, addViolation])

  // Network detection
  useEffect(() => {
    if (!enabled) return

    const handleOffline = () => addViolation('network_disconnect', 'Network connection lost')
    window.addEventListener('offline', handleOffline)
    return () => window.removeEventListener('offline', handleOffline)
  }, [enabled, addViolation])

  return { status, lastViolation, violationsRef, videoRef, streamRef }
}

// Simple face detection via skin-color heuristic
function detectFaceSimple(imageData) {
  const data = imageData.data
  let skinPixels = 0
  const total = data.length / 4

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    if (r > 220 && g > 180 && b > 140 &&
        r > g && r > b &&
        Math.abs(r - g) > 15) {
      skinPixels++
    }
  }

  return (skinPixels / total) > 0.02
}
