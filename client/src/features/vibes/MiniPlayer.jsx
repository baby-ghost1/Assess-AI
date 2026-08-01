import { useMusicPlayer } from './musicPlayerContext'
import { Play, Pause, SkipBack, SkipForward, Music, Shuffle, Repeat, Repeat1, Volume2, VolumeX } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat, hasTrack,
    togglePlayPause, playNext, playPrev, seek,
    toggleShuffle, toggleRepeat, toggleMute, changeVolume,
  } = useMusicPlayer()
  const location = useLocation()

  if (!hasTrack || location.pathname !== '/vibes') return null

  const pct = duration ? (progress / duration) * 100 : 0

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 120, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 120, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[60]"
      >
        <div className="mx-auto max-w-3xl px-3 pb-3">
          <div className="relative rounded-2xl bg-bg-card/95 backdrop-blur-2xl border border-border shadow-2xl shadow-black/40 overflow-hidden">
            {/* Progress bar - clickable */}
            <div
              className="h-1.5 bg-bg-tertiary w-full cursor-pointer group"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                seek((e.clientX - rect.left) / rect.width)
              }}
            >
              <div className="relative h-full">
                <div className="absolute inset-0 bg-bg-tertiary" />
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `${pct}%`, marginLeft: '-7px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3">
              {/* Album art + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-14 w-14 rounded-xl overflow-hidden bg-bg-tertiary shrink-0 shadow-lg">
                  {currentTrack?.artwork || currentTrack?.image ? (
                    <img src={currentTrack.artwork || currentTrack.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Music className="h-6 w-6 text-text-tertiary" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-sm font-semibold text-text-primary truncate leading-tight max-w-[200px]">
                    {currentTrack?.title}
                  </p>
                  <p className="text-xs text-text-secondary truncate leading-tight max-w-[200px]">
                    {currentTrack?.artist}
                  </p>
                  <p className="text-[10px] text-text-tertiary mt-0.5 font-mono">
                    {formatTime(progress)} / {formatTime(duration)}
                  </p>
                </div>
              </div>

              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={cn(
                  'hidden sm:flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0',
                  shuffle ? 'text-primary bg-primary/10' : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Prev */}
              <button onClick={playPrev} className="text-text-secondary hover:text-text-primary transition-colors p-1 shrink-0">
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              {/* Play/Pause - bigger */}
              <button
                onClick={togglePlayPause}
                className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-black hover:scale-105 active:scale-95 transition-transform shrink-0 shadow-lg"
              >
                {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-0.5" />}
              </button>

              {/* Next */}
              <button onClick={playNext} className="text-text-secondary hover:text-text-primary transition-colors p-1 shrink-0">
                <SkipForward className="h-5 w-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className={cn(
                  'hidden sm:flex h-8 w-8 items-center justify-center rounded-full transition-colors shrink-0',
                  repeat !== 'off' ? 'text-primary bg-primary/10' : 'text-text-tertiary hover:text-text-primary'
                )}
              >
                {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>

              {/* Volume */}
              <div className="hidden md:flex items-center gap-2 shrink-0">
                <button onClick={toggleMute} className="text-text-secondary hover:text-text-primary transition-colors">
                  {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range" min="0" max="1" step="0.01" value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 accent-primary cursor-pointer"
                />
              </div>

            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
