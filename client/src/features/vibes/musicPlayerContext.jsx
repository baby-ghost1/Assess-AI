import { createContext, useContext, useState, useRef, useCallback } from 'react'

const MusicPlayerContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || ''

function getStreamUrl(track) {
  if (track.streamUrl) return `${API_BASE}/api/v1/music/stream?url=${encodeURIComponent(track.streamUrl)}`
  return null
}

export function MusicPlayerProvider({ children }) {
  const [currentTrack, setCurrentTrack] = useState(null)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(-1)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [shuffledIndices, setShuffledIndices] = useState([])
  const audioRef = useRef(null)

  const generateShuffle = useCallback((listLength) => {
    const indices = Array.from({ length: listLength }, (_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    return indices
  }, [])

  const playTrack = useCallback((track, trackList) => {
    const url = getStreamUrl(track)
    if (!url) return

    if (audioRef.current) audioRef.current.pause()

    const audio = new Audio(url)
    audio.volume = volume
    audio.crossOrigin = 'anonymous'
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration))
    audio.addEventListener('timeupdate', () => setProgress(audio.currentTime))
    audio.addEventListener('ended', () => {
      if (repeat === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        setIsPlaying(false)
      }
    })
    audio.addEventListener('error', (e) => {
      console.error('Audio error:', e)
    })

    audio.play().catch((e) => console.error('Play error:', e))
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)

    if (trackList) {
      setQueue(trackList)
      const idx = trackList.findIndex((t) => t.id === track.id)
      setQueueIndex(idx >= 0 ? idx : 0)
      if (shuffle) setShuffledIndices(generateShuffle(trackList.length))
    }
  }, [volume, shuffle, repeat, generateShuffle])

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
    setQueueIndex(nextIdx)
    playTrack(queue[nextIdx])
  }, [queue, queueIndex, shuffle, shuffledIndices, playTrack])

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
    setQueueIndex(prevIdx)
    playTrack(queue[prevIdx])
  }, [queue, queueIndex, shuffle, shuffledIndices, playTrack])

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
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  const toggleMute = useCallback(() => {
    const newVol = volume > 0 ? 0 : 0.7
    setVolume(newVol)
    if (audioRef.current) audioRef.current.volume = newVol
  }, [volume])

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

  return (
    <MusicPlayerContext.Provider value={{
      currentTrack, isPlaying, progress, duration, volume,
      shuffle, repeat, queue, queueIndex, hasTrack: !!currentTrack,
      playTrack, togglePlayPause, playNext, playPrev,
      toggleShuffle, toggleRepeat, seek, changeVolume, toggleMute, stop,
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
