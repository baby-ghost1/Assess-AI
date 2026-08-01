import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react'

const MusicPlayerContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || ''

function getStreamUrl(track) {
  if (track.streamUrl) return `${API_BASE}/api/v1/music/stream?url=${encodeURIComponent(track.streamUrl)}`
  return null
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch { return fallback }
}

function saveToStorage(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export function MusicPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => loadFromStorage('vibes_volume', 0.7))
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [shuffledIndices, setShuffledIndices] = useState([])
  const [likedSongs, setLikedSongs] = useState(() => loadFromStorage('vibes_liked', []))
  const [recentlyPlayed, setRecentlyPlayed] = useState(() => loadFromStorage('vibes_recent', []))
  const [queuePanelOpen, setQueuePanelOpen] = useState(false)

  const audioRef = useRef(null)
  const repeatRef = useRef(repeat)
  const volumeRef = useRef(volume)
  const queueRef = useRef(queue)
  const queueIndexRef = useRef(queueIndex)
  const shuffleRef = useRef(shuffle)
  const shuffledIndicesRef = useRef(shuffledIndices)

  useEffect(() => { repeatRef.current = repeat }, [repeat])
  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices }, [shuffledIndices])
  useEffect(() => { saveToStorage('vibes_volume', volume) }, [volume])
  useEffect(() => { saveToStorage('vibes_liked', likedSongs) }, [likedSongs])
  useEffect(() => { saveToStorage('vibes_recent', recentlyPlayed) }, [recentlyPlayed])

  const generateShuffle = useCallback((listLength) => {
    const indices = Array.from({ length: listLength }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }, [])

  const addToRecentlyPlayed = useCallback((track) => {
    setRecentlyPlayed((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 50)
    })
  }, [])

  const playNextAuto = useCallback(() => {
    const q = queueRef.current
    const idx = queueIndexRef.current
    const rep = repeatRef.current
    const shuf = shuffleRef.current
    const shufIdx = shuffledIndicesRef.current

    if (q.length === 0 || idx < 0) {
      setIsPlaying(false)
      return
    }

    if (rep === 'one') return

    if (rep === 'off' && idx >= q.length - 1 && !shuf) {
      setIsPlaying(false)
      return
    }

    let nextIdx
    if (shuf && shufIdx.length > 0) {
      const posInShuffle = shufIdx.indexOf(idx)
      const nextPos = (posInShuffle + 1) % shufIdx.length
      nextIdx = shufIdx[nextPos]
    } else {
      nextIdx = (idx + 1) % q.length
    }

    const track = q[nextIdx]
    const url = getStreamUrl(track)
    if (!url) { setIsPlaying(false); return }

    if (audioRef.current) audioRef.current.pause()

    const audio = new Audio(url)
    audio.volume = volumeRef.current
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    audio.addEventListener('ended', playNextAuto)
    audio.addEventListener('error', () => setIsPlaying(false))

    audio.play().catch(() => setIsPlaying(false))
    setQueueIndex(nextIdx)
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    addToRecentlyPlayed(track)
  }, [addToRecentlyPlayed])

  const attachEndedHandler = useCallback((audio) => {
    audio.addEventListener('ended', playNextAuto)
  }, [playNextAuto])

  const playTrack = useCallback((track, trackList) => {
    const url = getStreamUrl(track)
    if (!url) return

    if (audioRef.current) audioRef.current.pause()

    const audio = new Audio(url)
    audio.volume = volumeRef.current
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    attachEndedHandler(audio)
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
    })

    audio.play().catch((e) => console.error('Play error:', e))
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    addToRecentlyPlayed(track)

    if (trackList) {
      setQueue(trackList)
      const idx = trackList.findIndex((t) => t.id === track.id)
      setQueueIndex(idx >= 0 ? idx : 0)
      if (shuffle) setShuffledIndices(generateShuffle(trackList.length))
    }
  }, [shuffle, generateShuffle, addToRecentlyPlayed, attachEndedHandler])

  const playTrackNow = useCallback((track) => {
    const url = getStreamUrl(track)
    if (!url) return

    if (audioRef.current) audioRef.current.pause()

    const audio = new Audio(url)
    audio.volume = volumeRef.current
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    attachEndedHandler(audio)
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
    })

    audio.play().catch((e) => console.error('Play error:', e))
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    addToRecentlyPlayed(track)

    setQueue((prevQueue) => {
      const newQueue = [...prevQueue]
      const existingIdx = newQueue.findIndex((t) => t.id === track.id)
      if (existingIdx >= 0) {
        newQueue.splice(existingIdx, 1)
      }
      const insertIdx = queueIndex + 1
      newQueue.splice(insertIdx, 0, track)
      setQueueIndex(insertIdx)
      return newQueue
    })
  }, [queueIndex, addToRecentlyPlayed, attachEndedHandler])

  const addToQueue = useCallback((track) => {
    setQueue((prev) => {
      const exists = prev.some((t) => t.id === track.id)
      if (exists) return prev
      return [...prev, track]
    })
  }, [])

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => {
      const newQueue = [...prev]
      newQueue.splice(index, 1)
      if (index < queueIndex) {
        setQueueIndex((i) => i - 1)
      } else if (index === queueIndex) {
        if (newQueue.length === 0) {
          setQueueIndex(-1)
          setCurrentTrack(null)
          setIsPlaying(false)
          setProgress(0)
          setDuration(0)
          if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current = null
          }
        } else {
          const newIdx = Math.min(index, newQueue.length - 1)
          setQueueIndex(newIdx)
          const nextTrack = newQueue[newIdx]
          const url = getStreamUrl(nextTrack)
          if (url) {
            if (audioRef.current) audioRef.current.pause()
            const audio = new Audio(url)
            audio.volume = volumeRef.current
            audio.crossOrigin = 'anonymous'
            audioRef.current = audio
            audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
            audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
            attachEndedHandler(audio)
            audio.play().catch(() => {})
            setCurrentTrack(nextTrack)
            setIsPlaying(true)
            setProgress(0)
          }
        }
      }
      return newQueue
    })
  }, [queueIndex, attachEndedHandler])

  const clearQueue = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setQueue([])
    setQueueIndex(-1)
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
    setDuration(0)
  }, [])

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play().catch(() => {})
      setIsPlaying(true)
    }
  }, [isPlaying])

  const playNext = useCallback(() => {
    if (queue.length === 0 || queueIndex < 0) return
    let nextIdx
    if (shuffle && shuffledIndices.length > 0) {
      const posInShuffle = shuffledIndices.indexOf(queueIndex)
      const nextPos = (posInShuffle + 1) % shuffledIndices.length
      nextIdx = shuffledIndices[nextPos]
    } else {
      nextIdx = (queueIndex + 1) % queue.length
    }
    const track = queue[nextIdx]
    const url = getStreamUrl(track)
    if (!url) return
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audio.volume = volumeRef.current
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    attachEndedHandler(audio)
    audio.play().catch(() => {})
    setQueueIndex(nextIdx)
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    addToRecentlyPlayed(track)
  }, [queue, queueIndex, shuffle, shuffledIndices, addToRecentlyPlayed, attachEndedHandler])

  const playPrev = useCallback(() => {
    if (queue.length === 0 || queueIndex < 0) return
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      return
    }
    let prevIdx
    if (shuffle && shuffledIndices.length > 0) {
      const posInShuffle = shuffledIndices.indexOf(queueIndex)
      const prevPos = (posInShuffle - 1 + shuffledIndices.length) % shuffledIndices.length
      prevIdx = shuffledIndices[prevPos]
    } else {
      prevIdx = (queueIndex - 1 + queue.length) % queue.length
    }
    const track = queue[prevIdx]
    const url = getStreamUrl(track)
    if (!url) return
    if (audioRef.current) audioRef.current.pause()
    const audio = new Audio(url)
    audio.volume = volumeRef.current
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    attachEndedHandler(audio)
    audio.play().catch(() => {})
    setQueueIndex(prevIdx)
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
    addToRecentlyPlayed(track)
  }, [queue, queueIndex, shuffle, shuffledIndices, addToRecentlyPlayed, attachEndedHandler])

  const toggleShuffle = useCallback(() => {
    setShuffle((p) => {
      const next = !p
      if (next && queue.length > 0) {
        setShuffledIndices(generateShuffle(queue.length))
      }
      return next
    })
  }, [queue, generateShuffle])

  const toggleRepeat = useCallback(() => {
    setRepeat((p) => p === 'off' ? 'all' : p === 'all' ? 'one' : 'off')
  }, [])

  const seek = useCallback((pct) => {
    if (!audioRef.current || !duration) return
    audioRef.current.currentTime = pct * duration
  }, [duration])

  const changeVolume = useCallback((v) => {
    setVolume(v)
    saveToStorage('vibes_volume', v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const toggleMute = useCallback(() => {
    if (volume > 0) {
      saveToStorage('vibes_pre_mute', volume)
      setVolume(0)
      if (audioRef.current) audioRef.current.volume = 0
    } else {
      const prev = loadFromStorage('vibes_pre_mute', 0.7)
      setVolume(prev)
      if (audioRef.current) audioRef.current.volume = prev
    }
  }, [volume])

  const toggleLike = useCallback((track) => {
    setLikedSongs((prev) => {
      const exists = prev.some((t) => t.id === track.id)
      if (exists) return prev.filter((t) => t.id !== track.id)
      return [track, ...prev]
    })
  }, [])

  const isLiked = useCallback((trackId) => {
    return likedSongs.some((t) => t.id === trackId)
  }, [likedSongs])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setIsPlaying(false)
    setCurrentTrack(null)
    setProgress(0)
    setDuration(0)
    setQueue([])
    setQueueIndex(-1)
    setShuffle(false)
    setRepeat('off')
    setShuffledIndices([])
  }, [])

  const toggleQueuePanel = useCallback(() => {
    setQueuePanelOpen((p) => !p)
  }, [])

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      shuffle, repeat, queue, queueIndex, hasTrack: !!currentTrack,
      likedSongs, recentlyPlayed, queuePanelOpen,
      playTrack, playTrackNow, addToQueue, removeFromQueue, clearQueue,
      togglePlayPause, playNext, playPrev,
      toggleShuffle, toggleRepeat, seek, changeVolume, toggleMute,
      toggleLike, isLiked, toggleQueuePanel, stop,
    }}>
      {children}
    </MusicPlayerContext.Provider>
  )
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext)
  if (!ctx) throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  return ctx
}
