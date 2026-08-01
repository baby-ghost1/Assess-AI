import { useMusicPlayer } from './musicPlayerContext'
import {
  Play, Pause, SkipBack, SkipForward, Music, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ListMusic
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Equalizer from './Equalizer'

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat, hasTrack, queue, queueIndex, queuePanelOpen,
    togglePlayPause, playNext, playPrev, seek,
    toggleShuffle, toggleRepeat, toggleMute, changeVolume,
    toggleLike, isLiked, toggleQueuePanel,
  } = useMusicPlayer()
  const location = useLocation()

  if (!hasTrack || location.pathname !== '/vibes') return null

  const pct = duration ? (progress / duration) * 100 : 0
  const liked = currentTrack ? isLiked(currentTrack.id) : false
  const remaining = queue.length - queueIndex - 1

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[60] h-[72px] bg-[#181818] border-t border-[#282828] md:left-[220px]"
      >
        {/* Progress bar - top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-1 bg-[#333] cursor-pointer group z-20"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            seek((e.clientX - rect.left) / rect.width)
          }}
          onMouseMove={(e) => {
            if (e.buttons !== 1) return
            const rect = e.currentTarget.getBoundingClientRect()
            seek((e.clientX - rect.left) / rect.width)
          }}
        >
          <div
            className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954] transition-colors"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `${pct}%`, marginLeft: '-6px' }}
          />
        </div>

        <div className="flex items-center h-full px-4 pt-2 gap-4">
          {/* ─── Left: Track Info ─── */}
          <div className="flex items-center gap-3 w-[30%] min-w-0">
            <div className="h-14 w-14 rounded-md overflow-hidden bg-[#282828] shrink-0 shadow-lg">
              {currentTrack?.image ? (
                <img
                  src={currentTrack.image}
                  alt=""
                  className={cn('h-full w-full object-cover transition-all', isPlaying && 'vinyl-spin-slow')}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center">
                  <Music className="h-6 w-6 text-[#7f7f7f]" />
                </div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-white truncate leading-tight max-w-[180px] hover:underline cursor-pointer">
                  {currentTrack?.title}
                </p>
                {isPlaying && <Equalizer isPlaying className="h-2.5" barCount={3} />}
              </div>
              <p className="text-[11px] text-[#b3b3b3] truncate leading-tight max-w-[180px] hover:underline cursor-pointer hover:text-white transition-colors">
                {currentTrack?.artist}
              </p>
            </div>
            <button
              onClick={() => currentTrack && toggleLike(currentTrack)}
              className={cn(
                'shrink-0 ml-1 hidden sm:block transition-all',
                liked ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            </button>
          </div>

          {/* ─── Center: Controls ─── */}
          <div className="flex flex-col items-center flex-1 max-w-[40%]">
            <div className="flex items-center gap-4 sm:gap-5">
              {/* Shuffle */}
              <button
                onClick={toggleShuffle}
                className={cn(
                  'hidden sm:block transition-colors',
                  shuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                )}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Prev */}
              <button
                onClick={playPrev}
                className="text-[#b3b3b3] hover:text-white transition-colors hover:scale-105 active:scale-95"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              {/* Play/Pause */}
              <button
                onClick={togglePlayPause}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5 text-black fill-current" />
                ) : (
                  <Play className="h-5 w-5 text-black fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={playNext}
                className="text-[#b3b3b3] hover:text-white transition-colors hover:scale-105 active:scale-95"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={toggleRepeat}
                className={cn(
                  'hidden sm:block transition-colors',
                  repeat !== 'off' ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                )}
              >
                {repeat === 'one' ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
              </button>
            </div>

            {/* Time display */}
            <div className="hidden sm:flex items-center gap-2 mt-1">
              <span className="text-[11px] text-[#b3b3b3] font-mono tabular-nums w-10 text-right">{formatTime(progress)}</span>
              <span className="text-[11px] text-[#7f7f7f]">/</span>
              <span className="text-[11px] text-[#b3b3b3] font-mono tabular-nums w-10">{formatTime(duration)}</span>
            </div>
          </div>

          {/* ─── Right: Volume + Queue ─── */}
          <div className="hidden md:flex items-center gap-3 w-[30%] justify-end">
            {/* Queue toggle */}
            <button
              onClick={toggleQueuePanel}
              className={cn(
                'relative transition-colors',
                queuePanelOpen ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              )}
            >
              <ListMusic className="h-4 w-4" />
              {remaining > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-[#1db954] text-black text-[9px] font-bold px-1">
                  {remaining}
                </span>
              )}
            </button>

            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-[#b3b3b3] hover:text-white transition-colors">
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="relative group w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-full h-1 accent-white cursor-pointer appearance-none bg-[#535353] rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:opacity-0 group-hover:[&::-webkit-slider-thumb]:opacity-100 [&::-webkit-slider-thumb]:transition-opacity"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 left-0 h-1 bg-white rounded-full pointer-events-none group-hover:bg-[#1db954]"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
