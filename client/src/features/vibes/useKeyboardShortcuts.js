import { useEffect, useRef } from 'react'
import { useMusicPlayer } from './musicPlayerContext'

export default function useKeyboardShortcuts() {
  const {
    hasTrack, isPlaying, volume, progress, duration, currentTrack,
    togglePlayPause, playNext, playPrev,
    seek, changeVolume, toggleMute, toggleShuffle, toggleRepeat,
    toggleQueuePanel, toggleLike,
  } = useMusicPlayer()

  const progressRef = useRef(progress)
  const durationRef = useRef(duration)
  progressRef.current = progress
  durationRef.current = duration

  useEffect(() => {
    const handler = (e) => {
      const tag = e.target.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target.isContentEditable) return

      const currentPct = durationRef.current ? progressRef.current / durationRef.current : 0

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          if (hasTrack) togglePlayPause()
          break
        case 'ArrowRight':
          if (e.shiftKey) {
            e.preventDefault()
            playNext()
          } else {
            e.preventDefault()
            seek(Math.min(1, currentPct + 0.05))
          }
          break
        case 'ArrowLeft':
          if (e.shiftKey) {
            e.preventDefault()
            playPrev()
          } else {
            e.preventDefault()
            seek(Math.max(0, currentPct - 0.05))
          }
          break
        case 'ArrowUp':
          e.preventDefault()
          changeVolume(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          changeVolume(Math.max(0, volume - 0.05))
          break
        case 'KeyN':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            playNext()
          }
          break
        case 'KeyP':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            playPrev()
          }
          break
        case 'KeyM':
          e.preventDefault()
          toggleMute()
          break
        case 'KeyS':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            toggleShuffle()
          }
          break
        case 'KeyR':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            toggleRepeat()
          }
          break
        case 'KeyQ':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            toggleQueuePanel()
          }
          break
        case 'KeyL':
          if (!e.ctrlKey && !e.metaKey && currentTrack) {
            e.preventDefault()
            toggleLike(currentTrack)
          }
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [hasTrack, isPlaying, volume, currentTrack,
    togglePlayPause, playNext, playPrev,
    seek, changeVolume, toggleMute, toggleShuffle, toggleRepeat,
    toggleQueuePanel, toggleLike])
}
