import { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAppSelector } from '@/hooks'

const MusicPlayerContext = createContext(null)

const API_BASE = import.meta.env.VITE_API_URL || ''
const CROSSFADE_MS = 5000

function getStreamUrl(track) {
  if (!track?.streamUrl) return null
  const params = new URLSearchParams({ url: track.streamUrl })
  return `${API_BASE}/api/v1/music/stream?${params.toString()}`
}

function loadFromStorage(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') return fallback
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveToStorage(key, value) {
  try {
    if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

function storageKey(scope, name) {
  return `vibes:${encodeURIComponent(scope)}:${name}`
}

function getScope(user) {
  return user?._id || user?.email || 'guest'
}

function isTrack(track) {
  return Boolean(track && typeof track === 'object' && track.id)
}

function uniqueTracks(tracks, limit = 50) {
  const seen = new Set()
  return (Array.isArray(tracks) ? tracks : []).filter((track) => {
    if (!isTrack(track) || seen.has(track.id)) return false
    seen.add(track.id)
    return true
  }).slice(0, limit)
}

function readPersistedState(scope) {
  const currentTrack = loadFromStorage(storageKey(scope, 'currentTrack'), null)
  const storedQueue = uniqueTracks(loadFromStorage(storageKey(scope, 'queue'), []), 500)
  const queue = isTrack(currentTrack) && !storedQueue.some((track) => track.id === currentTrack.id)
    ? [currentTrack, ...storedQueue]
    : storedQueue
  const storedIndex = Number(loadFromStorage(storageKey(scope, 'queueIndex'), -1))
  const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id)
  const queueIndex = queue.length === 0
    ? -1
    : currentIndex >= 0
      ? currentIndex
      : Number.isInteger(storedIndex) && storedIndex >= 0 && storedIndex < queue.length
        ? storedIndex
        : 0
  const volume = Number(loadFromStorage(storageKey(scope, 'volume'), 0.7))
  return {
    currentTrack: isTrack(currentTrack) ? currentTrack : null,
    queue,
    queueIndex,
    volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : 0.7,
    likedSongs: uniqueTracks(loadFromStorage(storageKey(scope, 'liked'), [])),
    recentlyPlayed: uniqueTracks(loadFromStorage(storageKey(scope, 'recent'), [])),
    crossfade: loadFromStorage(storageKey(scope, 'crossfade'), true) !== false,
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function generateShuffle(length, currentIndex = -1) {
  const indices = Array.from({ length }, (_, index) => index)
  for (let index = indices.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[indices[index], indices[swapIndex]] = [indices[swapIndex], indices[index]]
  }
  if (currentIndex >= 0 && currentIndex < indices.length) {
    const currentPosition = indices.indexOf(currentIndex)
    ;[indices[0], indices[currentPosition]] = [indices[currentPosition], indices[0]]
  }
  return indices
}

function isValidShuffleOrder(order, length) {
  return Array.isArray(order) && order.length === length && new Set(order).size === length && order.every((index) => Number.isInteger(index) && index >= 0 && index < length)
}

function disposeAudio(audio) {
  if (!audio) return
  try {
    audio.__vibesCleanup?.()
  } catch {}
  try {
    audio.pause()
  } catch {}
  try {
    audio.removeAttribute('src')
    audio.load()
  } catch {}
}

function getNextIndex(queue, currentIndex, repeat, shuffle, order, automatic) {
  if (!queue.length || currentIndex < 0) return -1
  const validShuffle = shuffle && isValidShuffleOrder(order, queue.length)
  if (automatic && repeat === 'off' && currentIndex >= queue.length - 1 && !validShuffle) return -1
  if (validShuffle) {
    const position = order.indexOf(currentIndex)
    if (position >= 0) {
      if (automatic && repeat === 'off' && position >= order.length - 1) return -1
      return order[(position + 1) % order.length]
    }
  }
  return (currentIndex + 1) % queue.length
}

export function MusicPlayerProvider({ children }) {
  const user = useAppSelector((state) => state.auth.user)
  const scope = getScope(user)
  const initialState = useMemo(() => readPersistedState(scope), [scope])
  const [currentTrack, setCurrentTrack] = useState(initialState.currentTrack)
  const [queue, setQueue] = useState(initialState.queue)
  const [queueIndex, setQueueIndex] = useState(initialState.queueIndex)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(initialState.volume)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [error, setError] = useState(null)
  const [shuffledIndices, setShuffledIndices] = useState([])
  const [likedSongs, setLikedSongs] = useState(initialState.likedSongs)
  const [recentlyPlayed, setRecentlyPlayed] = useState(initialState.recentlyPlayed)
  const [queuePanelOpen, setQueuePanelOpen] = useState(false)
  const [crossfade, setCrossfadeState] = useState(initialState.crossfade)
  const [scopeReady, setScopeReady] = useState(true)
  const [scopeVersion, setScopeVersion] = useState(0)

  const audioRef = useRef(null)
  const previousAudioRef = useRef(null)
  const crossfadeRafRef = useRef(null)
  const audioGenerationRef = useRef(0)
  const endedHandlerRef = useRef(null)
  const currentTrackRef = useRef(initialState.currentTrack)
  const isPlayingRef = useRef(false)
  const volumeRef = useRef(initialState.volume)
  const queueRef = useRef(initialState.queue)
  const queueIndexRef = useRef(initialState.queueIndex)
  const shuffleRef = useRef(false)
  const repeatRef = useRef('off')
  const shuffledIndicesRef = useRef([])
  const crossfadeRef = useRef(initialState.crossfade)
  const likedSongsRef = useRef(initialState.likedSongs)
  const recentlyPlayedRef = useRef(initialState.recentlyPlayed)
  const activeScopeRef = useRef(scope)
  const scopeGenerationRef = useRef(0)
  const pendingScopeRef = useRef(null)

  useEffect(() => { volumeRef.current = volume }, [volume])
  useEffect(() => { queueRef.current = queue }, [queue])
  useEffect(() => { queueIndexRef.current = queueIndex }, [queueIndex])
  useEffect(() => { shuffleRef.current = shuffle }, [shuffle])
  useEffect(() => { repeatRef.current = repeat }, [repeat])
  useEffect(() => { shuffledIndicesRef.current = shuffledIndices }, [shuffledIndices])
  useEffect(() => { crossfadeRef.current = crossfade }, [crossfade])
  useEffect(() => { likedSongsRef.current = likedSongs }, [likedSongs])
  useEffect(() => { recentlyPlayedRef.current = recentlyPlayed }, [recentlyPlayed])

  useEffect(() => {
    if (!scopeReady || activeScopeRef.current !== scope) return
    saveToStorage(storageKey(scope, 'volume'), volume)
    saveToStorage(storageKey(scope, 'liked'), likedSongs)
    saveToStorage(storageKey(scope, 'recent'), recentlyPlayed)
    saveToStorage(storageKey(scope, 'crossfade'), crossfade)
    saveToStorage(storageKey(scope, 'currentTrack'), currentTrack)
    saveToStorage(storageKey(scope, 'queue'), queue)
    saveToStorage(storageKey(scope, 'queueIndex'), queueIndex)
  }, [scope, scopeReady, volume, likedSongs, recentlyPlayed, crossfade, currentTrack, queue, queueIndex])

  const setPlaybackState = useCallback((value) => {
    isPlayingRef.current = value
    setIsPlaying(value)
  }, [])

  const setTrack = useCallback((track) => {
    currentTrackRef.current = track
    setCurrentTrack(track)
  }, [])

  const commitQueue = useCallback((nextQueue, nextIndex) => {
    const safeQueue = uniqueTracks(nextQueue, 500)
    const safeIndex = safeQueue.length ? clamp(Number(nextIndex) || 0, 0, safeQueue.length - 1) : -1
    queueRef.current = safeQueue
    queueIndexRef.current = safeIndex
    setQueue(safeQueue)
    setQueueIndex(safeIndex)
    return safeQueue
  }, [])

  const setShuffleOrder = useCallback((nextOrder) => {
    shuffledIndicesRef.current = nextOrder
    setShuffledIndices(nextOrder)
  }, [])

  const regenerateShuffle = useCallback((list, currentTrackId) => {
    if (!shuffleRef.current || list.length < 2) {
      setShuffleOrder([])
      return
    }
    const currentIndex = list.findIndex((track) => track.id === currentTrackId)
    setShuffleOrder(generateShuffle(list.length, currentIndex))
  }, [setShuffleOrder])

  const cancelCrossfade = useCallback(() => {
    if (crossfadeRafRef.current && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(crossfadeRafRef.current)
    }
    crossfadeRafRef.current = null
    if (previousAudioRef.current && previousAudioRef.current !== audioRef.current) {
      disposeAudio(previousAudioRef.current)
    }
    previousAudioRef.current = null
  }, [])

  const beginCrossfade = useCallback((oldAudio, newAudio) => {
    cancelCrossfade()
    previousAudioRef.current = oldAudio
    const startedAt = typeof performance !== 'undefined' ? performance.now() : Date.now()
    const tick = (now) => {
      if (audioRef.current !== newAudio) {
        if (previousAudioRef.current === oldAudio) previousAudioRef.current = null
        disposeAudio(oldAudio)
        return
      }
      const elapsed = (now ?? Date.now()) - startedAt
      const amount = clamp(elapsed / CROSSFADE_MS, 0, 1)
      const targetVolume = volumeRef.current
      oldAudio.volume = Math.max(0, targetVolume * (1 - amount))
      newAudio.volume = Math.min(targetVolume, targetVolume * amount)
      if (amount < 1) {
        crossfadeRafRef.current = requestAnimationFrame(tick)
      } else {
        crossfadeRafRef.current = null
        previousAudioRef.current = null
        disposeAudio(oldAudio)
      }
    }
    if (typeof requestAnimationFrame === 'undefined') {
      oldAudio.pause()
      disposeAudio(oldAudio)
      previousAudioRef.current = null
      newAudio.volume = targetVolume
    } else {
      crossfadeRafRef.current = requestAnimationFrame(tick)
    }
  }, [cancelCrossfade])

  const attachAudioEvents = useCallback((audio, generation) => {
    const isCurrent = () => audioRef.current === audio && audioGenerationRef.current === generation
    const onLoadedMetadata = () => {
      if (!isCurrent()) return
      const nextDuration = Number(audio.duration)
      setDuration(Number.isFinite(nextDuration) && nextDuration > 0 ? nextDuration : 0)
      setProgress(audio.currentTime || 0)
    }
    const onTimeUpdate = () => {
      if (isCurrent()) setProgress(audio.currentTime || 0)
    }
    const onPlay = () => {
      if (isCurrent()) setPlaybackState(true)
    }
    const onPause = () => {
      if (isCurrent()) setPlaybackState(false)
    }
    const onEnded = () => {
      if (isCurrent()) endedHandlerRef.current?.(audio)
    }
    const onError = () => {
      if (!isCurrent()) return
      setPlaybackState(false)
      setError('Stream failed to load')
    }
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('durationchange', onLoadedMetadata)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.__vibesCleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('durationchange', onLoadedMetadata)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [setPlaybackState])

  const createAudio = useCallback((track, shouldPlay = true, onFailure) => {
    if (!isTrack(track)) {
      setError('Invalid track')
      return null
    }
    const url = getStreamUrl(track)
    if (!url) {
      setError('No stream URL available')
      return null
    }

    const oldAudio = audioRef.current
    const oldTrack = currentTrackRef.current
    const oldGeneration = audioGenerationRef.current
    const canFade = Boolean(crossfadeRef.current && oldAudio && !oldAudio.paused)
    cancelCrossfade()
    if (oldAudio && !canFade) disposeAudio(oldAudio)

    let audio
    try {
      audio = new Audio(url)
    } catch {
      setError('Unable to create audio player')
      return null
    }
    audio.preload = 'metadata'
    const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
    const apiOrigin = API_BASE && currentOrigin ? new URL(API_BASE, currentOrigin).origin : currentOrigin
    audio.crossOrigin = apiOrigin && currentOrigin && apiOrigin !== currentOrigin ? 'use-credentials' : 'anonymous'
    audio.volume = canFade ? 0 : volumeRef.current
    audio.loop = false
    const generation = ++audioGenerationRef.current
    audioRef.current = audio
    attachAudioEvents(audio, generation)
    setTrack(track)
    setDuration(0)
    setProgress(0)
    setError(null)

    if (!shouldPlay) {
      setPlaybackState(false)
      return audio
    }

    const handleFailure = () => {
      if (audioRef.current !== audio || audioGenerationRef.current !== generation) return
      if (canFade && oldAudio && audioRef.current === audio) {
        disposeAudio(audio)
        audioRef.current = oldAudio
        audioGenerationRef.current = oldGeneration
        currentTrackRef.current = oldTrack
        setCurrentTrack(oldTrack)
        oldAudio.volume = volumeRef.current
        setPlaybackState(!oldAudio.paused)
      } else if (onFailure) {
        disposeAudio(audio)
        audioRef.current = null
        audioGenerationRef.current = oldGeneration
        setPlaybackState(false)
      } else {
        setPlaybackState(false)
      }
      setError('Playback failed')
      onFailure?.()
    }

    try {
      const playPromise = audio.play()
      Promise.resolve(playPromise).then(() => {
        if (audioRef.current !== audio || audioGenerationRef.current !== generation) return
        setPlaybackState(true)
        if (canFade && oldAudio) beginCrossfade(oldAudio, audio)
      }).catch(handleFailure)
    } catch {
      handleFailure()
    }
    return audio
  }, [attachAudioEvents, beginCrossfade, cancelCrossfade, setPlaybackState, setTrack])

  const addToRecentlyPlayed = useCallback((track) => {
    if (!isTrack(track)) return
    const next = uniqueTracks([track, ...recentlyPlayedRef.current.filter((item) => item.id !== track.id)])
    recentlyPlayedRef.current = next
    setRecentlyPlayed(next)
  }, [])

  const playQueueIndex = useCallback((index) => {
    const currentQueue = queueRef.current
    const track = currentQueue[index]
    if (!isTrack(track)) {
      setPlaybackState(false)
      setError('Track is no longer available')
      return
    }
    const previousQueue = [...currentQueue]
    const previousIndex = queueIndexRef.current
    const previousTrack = currentTrackRef.current
    commitQueue(currentQueue, index)
    createAudio(track, true, () => {
      commitQueue(previousQueue, previousIndex)
      regenerateShuffle(previousQueue, previousTrack?.id)
      setTrack(previousTrack)
    })
    addToRecentlyPlayed(track)
  }, [addToRecentlyPlayed, commitQueue, createAudio, regenerateShuffle, setPlaybackState, setTrack])

  const playNextAuto = useCallback((endedAudio) => {
    if (endedAudio && audioRef.current !== endedAudio) return
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    if (!currentQueue.length || currentIndex < 0) {
      setPlaybackState(false)
      return
    }
    if (repeatRef.current === 'one') {
      const audio = audioRef.current
      if (!audio) return
      audio.currentTime = 0
      setProgress(0)
      try {
        const playPromise = audio.play()
        Promise.resolve(playPromise).then(() => setPlaybackState(true)).catch(() => {
          setPlaybackState(false)
          setError('Playback failed')
        })
      } catch {
        setPlaybackState(false)
        setError('Playback failed')
      }
      return
    }
    const nextIndex = getNextIndex(currentQueue, currentIndex, repeatRef.current, shuffleRef.current, shuffledIndicesRef.current, true)
    if (nextIndex < 0) {
      setPlaybackState(false)
      return
    }
    playQueueIndex(nextIndex)
  }, [playQueueIndex, setPlaybackState])

  endedHandlerRef.current = playNextAuto

  const playTrack = useCallback((track, trackList) => {
    if (!isTrack(track)) return
    const previousQueue = [...queueRef.current]
    const previousIndex = queueIndexRef.current
    const previousTrack = currentTrackRef.current
    const source = uniqueTracks(Array.isArray(trackList) ? trackList : [], 500)
    const existingIndex = source.findIndex((item) => item.id === track.id)
    const nextQueue = existingIndex >= 0
      ? source
      : [...source, track]
    const nextIndex = Math.max(0, nextQueue.findIndex((item) => item.id === track.id))
    commitQueue(nextQueue, nextIndex)
    regenerateShuffle(nextQueue, track.id)
    createAudio(track, true, () => {
      if (!previousTrack) return
      commitQueue(previousQueue, previousIndex)
      regenerateShuffle(previousQueue, previousTrack.id)
      setTrack(previousTrack)
    })
    addToRecentlyPlayed(track)
  }, [addToRecentlyPlayed, commitQueue, createAudio, regenerateShuffle, setTrack])

  const playTrackNow = useCallback((track) => {
    if (!isTrack(track)) return
    const previousQueue = [...queueRef.current]
    const previousIndex = queueIndexRef.current
    const previousTrack = currentTrackRef.current
    const currentQueue = queueRef.current.filter((item) => item.id !== track.id)
    const currentTrackId = currentTrackRef.current?.id
    const currentPosition = currentTrackId ? currentQueue.findIndex((item) => item.id === currentTrackId) : -1
    const insertIndex = currentPosition >= 0 ? currentPosition + 1 : currentQueue.length
    currentQueue.splice(insertIndex, 0, track)
    commitQueue(currentQueue, insertIndex)
    regenerateShuffle(currentQueue, track.id)
    createAudio(track, true, () => {
      if (!previousTrack) return
      commitQueue(previousQueue, previousIndex)
      regenerateShuffle(previousQueue, previousTrack.id)
      setTrack(previousTrack)
    })
    addToRecentlyPlayed(track)
  }, [addToRecentlyPlayed, commitQueue, createAudio, regenerateShuffle, setTrack])

  const addToQueue = useCallback((track) => {
    if (!isTrack(track) || queueRef.current.some((item) => item.id === track.id)) return
    const nextQueue = [...queueRef.current, track]
    commitQueue(nextQueue, queueIndexRef.current)
    regenerateShuffle(nextQueue, currentTrackRef.current?.id)
  }, [commitQueue, regenerateShuffle])

  const removeFromQueue = useCallback((index) => {
    const currentQueue = queueRef.current
    if (index < 0 || index >= currentQueue.length) return
    const currentIndex = queueIndexRef.current
    const removingCurrent = index === currentIndex
    const wasPlaying = isPlayingRef.current
    const nextQueue = currentQueue.filter((_, itemIndex) => itemIndex !== index)
    if (!nextQueue.length) {
      commitQueue([], -1)
      if (audioRef.current) disposeAudio(audioRef.current)
      audioRef.current = null
      setTrack(null)
      setPlaybackState(false)
      setProgress(0)
      setDuration(0)
      setShuffleOrder([])
      return
    }

    let nextIndex = currentIndex
    if (removingCurrent) {
      nextIndex = Math.min(index, nextQueue.length - 1)
    } else if (index < currentIndex) {
      nextIndex = currentIndex - 1
    }
    commitQueue(nextQueue, nextIndex)
    regenerateShuffle(nextQueue, removingCurrent ? nextQueue[nextIndex]?.id : currentTrackRef.current?.id)

    if (removingCurrent) {
      const nextTrack = nextQueue[nextIndex]
      if (nextTrack) {
        createAudio(nextTrack, wasPlaying)
      } else {
        if (audioRef.current) disposeAudio(audioRef.current)
        audioRef.current = null
        setTrack(null)
        setPlaybackState(false)
        setProgress(0)
        setDuration(0)
      }
    }
  }, [commitQueue, createAudio, regenerateShuffle, setPlaybackState, setShuffleOrder, setTrack])

  const clearQueue = useCallback(() => {
    cancelCrossfade()
    if (audioRef.current) disposeAudio(audioRef.current)
    audioRef.current = null
    commitQueue([], -1)
    setTrack(null)
    setPlaybackState(false)
    setProgress(0)
    setDuration(0)
    setShuffleOrder([])
  }, [cancelCrossfade, commitQueue, setPlaybackState, setShuffleOrder, setTrack])

  const togglePlayPause = useCallback(() => {
    let audio = audioRef.current
    if (!audio && currentTrackRef.current) {
      audio = createAudio(currentTrackRef.current, false)
    }
    if (!audio) return
    if (!audio.paused) {
      cancelCrossfade()
      audio.pause()
      setPlaybackState(false)
      return
    }
    try {
      const playPromise = audio.play()
      Promise.resolve(playPromise).then(() => {
        if (audioRef.current === audio) setPlaybackState(true)
      }).catch(() => {
        if (audioRef.current === audio) {
          setPlaybackState(false)
          setError('Playback failed')
        }
      })
    } catch {
      setPlaybackState(false)
      setError('Playback failed')
    }
  }, [cancelCrossfade, createAudio, setPlaybackState])

  const playOrToggleTrack = useCallback((track, trackList) => {
    if (currentTrackRef.current?.id === track?.id && audioRef.current) {
      togglePlayPause()
      return
    }
    playTrack(track, trackList)
  }, [playTrack, togglePlayPause])

  const playNext = useCallback(() => {
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    const nextIndex = getNextIndex(currentQueue, currentIndex, 'all', shuffleRef.current, shuffledIndicesRef.current, false)
    if (nextIndex >= 0) playQueueIndex(nextIndex)
  }, [playQueueIndex])

  const playPrev = useCallback(() => {
    const currentQueue = queueRef.current
    const currentIndex = queueIndexRef.current
    if (!currentQueue.length || currentIndex < 0) return
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0
      setProgress(0)
      return
    }
    const order = shuffledIndicesRef.current
    let previousIndex = currentIndex - 1
    if (shuffleRef.current && isValidShuffleOrder(order, currentQueue.length)) {
      const position = order.indexOf(currentIndex)
      if (position >= 0) previousIndex = order[(position - 1 + order.length) % order.length]
    } else {
      previousIndex = (currentIndex - 1 + currentQueue.length) % currentQueue.length
    }
    if (previousIndex >= 0) playQueueIndex(previousIndex)
  }, [playQueueIndex, setProgress])

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current
    shuffleRef.current = next
    setShuffle(next)
    if (next) {
      setShuffleOrder(generateShuffle(queueRef.current.length, queueIndexRef.current))
    } else {
      setShuffleOrder([])
    }
  }, [setShuffleOrder])

  const toggleRepeat = useCallback(() => {
    const next = repeatRef.current === 'off' ? 'all' : repeatRef.current === 'all' ? 'one' : 'off'
    repeatRef.current = next
    setRepeat(next)
  }, [])

  const seek = useCallback((percentage) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const nextTime = clamp(Number(percentage) || 0, 0, 1) * duration
    audio.currentTime = nextTime
    setProgress(nextTime)
  }, [duration, setProgress])

  const changeVolume = useCallback((value) => {
    const nextVolume = clamp(Number(value) || 0, 0, 1)
    volumeRef.current = nextVolume
    setVolume(nextVolume)
    if (audioRef.current) audioRef.current.volume = nextVolume
  }, [])

  const toggleMute = useCallback(() => {
    const currentVolume = volumeRef.current
    if (currentVolume > 0) {
      saveToStorage(storageKey(activeScopeRef.current, 'preMute'), currentVolume)
      changeVolume(0)
    } else {
      const previousVolume = Number(loadFromStorage(storageKey(activeScopeRef.current, 'preMute'), 0.7))
      changeVolume(Number.isFinite(previousVolume) ? clamp(previousVolume, 0, 1) : 0.7)
    }
  }, [changeVolume])

  const toggleLike = useCallback((track) => {
    if (!isTrack(track)) return
    const exists = likedSongsRef.current.some((item) => item.id === track.id)
    const next = exists
      ? likedSongsRef.current.filter((item) => item.id !== track.id)
      : [track, ...likedSongsRef.current]
    likedSongsRef.current = next
    setLikedSongs(next)
  }, [])

  const isLiked = useCallback((trackId) => likedSongsRef.current.some((track) => track.id === trackId), [])

  const stop = useCallback(() => {
    cancelCrossfade()
    if (audioRef.current) disposeAudio(audioRef.current)
    audioRef.current = null
    setPlaybackState(false)
    setTrack(null)
    setProgress(0)
    setDuration(0)
    setError(null)
    commitQueue([], -1)
    setQueuePanelOpen(false)
    shuffleRef.current = false
    setShuffle(false)
    repeatRef.current = 'off'
    setRepeat('off')
    setShuffleOrder([])
  }, [cancelCrossfade, commitQueue, setPlaybackState, setShuffleOrder, setTrack])

  const setCrossfade = useCallback((value) => {
    const next = Boolean(value)
    crossfadeRef.current = next
    setCrossfadeState(next)
    if (!next) {
      cancelCrossfade()
      if (audioRef.current) audioRef.current.volume = volumeRef.current
    }
  }, [cancelCrossfade])

  const toggleQueuePanel = useCallback(() => {
    setQueuePanelOpen((open) => !open)
  }, [])

  useEffect(() => {
    if (activeScopeRef.current === scope) return
    activeScopeRef.current = scope
    const generation = ++scopeGenerationRef.current
    pendingScopeRef.current = { scope, generation }
    setScopeReady(false)
    cancelCrossfade()
    if (audioRef.current) disposeAudio(audioRef.current)
    audioRef.current = null
    const next = readPersistedState(scope)
    currentTrackRef.current = next.currentTrack
    queueRef.current = next.queue
    queueIndexRef.current = next.queueIndex
    volumeRef.current = next.volume
    likedSongsRef.current = next.likedSongs
    recentlyPlayedRef.current = next.recentlyPlayed
    crossfadeRef.current = next.crossfade
    shuffleRef.current = false
    repeatRef.current = 'off'
    shuffledIndicesRef.current = []
    setCurrentTrack(next.currentTrack)
    setQueue(next.queue)
    setQueueIndex(next.queueIndex)
    setVolume(next.volume)
    setLikedSongs(next.likedSongs)
    setRecentlyPlayed(next.recentlyPlayed)
    setCrossfadeState(next.crossfade)
    setShuffle(false)
    setRepeat('off')
    setShuffledIndices([])
    setQueuePanelOpen(false)
    setPlaybackState(false)
    setProgress(0)
    setDuration(0)
    setError(null)
    setScopeVersion((version) => version + 1)
  }, [cancelCrossfade, scope, setPlaybackState])

  useEffect(() => {
    const pending = pendingScopeRef.current
    if (!pending || pending.scope !== scope || scopeReady) return
    if (pending.generation !== scopeGenerationRef.current) return
    pendingScopeRef.current = null
    setScopeReady(true)
  }, [scope, scopeReady, scopeVersion])

  useEffect(() => {
    if (!scopeReady || !currentTrack || audioRef.current || activeScopeRef.current !== scope) return
    createAudio(currentTrack, false)
  }, [createAudio, currentTrack, scope, scopeReady])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return
    const mediaSession = navigator.mediaSession
    if (!currentTrack) {
      mediaSession.metadata = null
      try { mediaSession.playbackState = 'none' } catch {}
      return
    }
    mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title || 'Unknown',
      artist: currentTrack.artist || 'Unknown',
      album: currentTrack.album || 'AssessAI Vibes',
      artwork: currentTrack.image ? [{ src: currentTrack.image, sizes: '512x512', type: 'image/jpeg' }] : [],
    })
    const handlers = {
      play: () => togglePlayPause(),
      pause: () => {
        if (audioRef.current) {
          cancelCrossfade()
          audioRef.current.pause()
          setPlaybackState(false)
        }
      },
      previoustrack: () => playPrev(),
      nexttrack: () => playNext(),
      seekto: (details) => {
        if (audioRef.current && details.seekTime != null) {
          audioRef.current.currentTime = clamp(details.seekTime, 0, duration || audioRef.current.duration || 0)
        }
      },
    }
    Object.entries(handlers).forEach(([action, handler]) => {
      try { mediaSession.setActionHandler(action, handler) } catch {}
    })
    return () => {
      Object.keys(handlers).forEach((action) => {
        try { mediaSession.setActionHandler(action, null) } catch {}
      })
    }
  }, [cancelCrossfade, currentTrack, duration, playNext, playPrev, setPlaybackState, togglePlayPause])

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : currentTrack ? 'paused' : 'none'
      if (currentTrack && duration && Number.isFinite(progress)) {
        navigator.mediaSession.setPositionState?.({ duration, position: clamp(progress, 0, duration), playbackRate: 1 })
      }
    } catch {}
  }, [currentTrack, duration, isPlaying, progress])

  useEffect(() => {
    return () => {
      cancelCrossfade()
      if (audioRef.current) disposeAudio(audioRef.current)
      audioRef.current = null
    }
  }, [cancelCrossfade])

  const upcomingTracks = useMemo(() => {
    if (!queue.length) return []
    const order = shuffle && isValidShuffleOrder(shuffledIndices, queue.length)
      ? shuffledIndices
      : queue.map((_, index) => index)
    const currentPosition = order.indexOf(queueIndex)
    const nextIndexes = currentPosition >= 0 ? order.slice(currentPosition + 1) : order
    return nextIndexes.map((index) => queue[index]).filter(Boolean)
  }, [queue, queueIndex, shuffle, shuffledIndices])

  const value = useMemo(() => ({
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat, queue, queueIndex, hasTrack: Boolean(currentTrack),
    likedSongs, recentlyPlayed, queuePanelOpen, upcomingTracks, error, crossfade,
    playTrack, playOrToggleTrack, playTrackNow, addToQueue, removeFromQueue, clearQueue,
    togglePlayPause, playNext, playPrev, toggleShuffle, toggleRepeat, seek, changeVolume,
    toggleMute, toggleLike, isLiked, toggleQueuePanel, stop, setCrossfade,
  }), [
    currentTrack, isPlaying, progress, duration, volume, shuffle, repeat, queue, queueIndex,
    likedSongs, recentlyPlayed, queuePanelOpen, upcomingTracks, error, crossfade, playTrack, playOrToggleTrack,
    playTrackNow, addToQueue, removeFromQueue, clearQueue, togglePlayPause, playNext, playPrev,
    toggleShuffle, toggleRepeat, seek, changeVolume, toggleMute, toggleLike, isLiked,
    toggleQueuePanel, stop, setCrossfade,
  ])

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (!context) throw new Error('useMusicPlayer must be used within MusicPlayerProvider')
  return context
}
