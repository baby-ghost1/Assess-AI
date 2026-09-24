import { useMusicPlayer } from './musicPlayerContext'
import {
  Play, Pause, SkipBack, SkipForward, Music, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Heart, ListMusic, Zap, AlertCircle
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Equalizer from './Equalizer'
import QueuePanel from './QueuePanel'

function formatTime(sec) {
  if (!Number.isFinite(sec) || sec <= 0) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function MiniPlayer() {
  const {
    currentTrack, isPlaying, progress, duration, volume,
    shuffle, repeat, hasTrack, queue, queueIndex, queuePanelOpen,
    error, crossfade,
    togglePlayPause, playNext, playPrev, seek,
    toggleShuffle, toggleRepeat, toggleMute, changeVolume,
    toggleLike, isLiked, toggleQueuePanel, setCrossfade,
  } = useMusicPlayer()
  const location = useLocation()
  const pathname = location.pathname.replace(/\/$/, '') || '/'
  // UI only on Vibes tab — playback continues via app-level MusicPlayerProvider
  const isVibesRoute = pathname === '/vibes'
  const pct = duration ? Math.min(100, Math.max(0, (progress / duration) * 100)) : 0
  const liked = currentTrack ? isLiked(currentTrack.id) : false
  const remaining = Math.max(0, queue.length - queueIndex - 1)

  if (!hasTrack || !isVibesRoute) return null

  return (
    <>
      <QueuePanel />
      <AnimatePresence>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-[60] h-[72px] bg-[#181818] border-t border-[#282828] md:left-[var(--sidebar-width,200px)]"
      >
        {/* Progress bar - top edge */}
        <div
          className="absolute top-0 left-0 right-0 h-1.5 bg-[#333] cursor-pointer group z-20"
          role="slider"
          tabIndex={0}
          aria-label="Seek through track"
          aria-valuemin={0}
          aria-valuemax={duration || 0}
          aria-valuenow={progress}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') { event.preventDefault(); seek(Math.min(1, pct / 100 + 0.05)) }
            if (event.key === 'ArrowLeft') { event.preventDefault(); seek(Math.max(0, pct / 100 - 0.05)) }
          }}
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
            className="absolute top-0 left-0 h-full bg-white group-hover:bg-[#1db954] transition-colors will-change-transform"
            style={{ width: `${pct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity will-change-transform"
            style={{ left: `${pct}%`, marginLeft: '-6px' }}
          />
        </div>

        <div className="flex items-center h-full px-3 sm:px-4 pt-3.5 gap-2 sm:gap-4">
          {/* ─── Left: Track Info ─── */}
          <div className="flex items-center gap-2 sm:gap-3 w-[38%] sm:w-[30%] min-w-0">
            {/* CD Disc Shape */}
            <div className={cn(
              'relative h-11 w-11 sm:h-15 sm:w-15 shrink-0 rounded-full shadow-lg transition-transform',
              isPlaying && 'vinyl-spin-slow'
            )} style={{ height: '44px', width: '44px' }}>
              {/* Outer disc ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#2a2a2a] via-[#1a1a1a] to-[#111] shadow-[0_0_8px_rgba(0,0,0,0.5)]" />
              {/* Album artwork (circular, inset) */}
              <div className="absolute inset-[3px] rounded-full overflow-hidden bg-[#282828]">
                {currentTrack?.image ? (
                  <img
                    src={currentTrack.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-[#282828]">
                    <Music className="h-4 w-4 text-[#7f7f7f]" />
                  </div>
                )}
              </div>
              {/* Center hole */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[6px] w-[6px] rounded-full bg-[#181818] border border-[#333] shadow-inner z-10" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm font-semibold text-white truncate leading-tight max-w-[120px] sm:max-w-[180px]">
                  {currentTrack?.title}
                </p>
                {isPlaying && <Equalizer isPlaying className="h-2.5" barCount={3} />}
              </div>
              <p className="text-[10px] sm:text-[11px] text-[#b3b3b3] truncate leading-tight max-w-[120px] sm:max-w-[180px] transition-colors">
                {currentTrack?.artist}
              </p>
            </div>
            <button
              onClick={() => currentTrack && toggleLike(currentTrack)}
              aria-label={liked ? 'Remove current track from liked songs' : 'Like current track'}
              aria-pressed={liked}
              className={cn(
                'shrink-0 ml-1 transition-all',
                liked ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              )}
            >
              <Heart className={cn('h-4 w-4', liked && 'fill-current')} />
            </button>
          </div>

          {/* ─── Center: Controls ─── */}
          <div className="flex flex-col items-center flex-1 max-w-[45%] sm:max-w-[40%]">
            <div className="flex items-center gap-3 sm:gap-5">
              {/* Shuffle */}
              <button
                 onClick={toggleShuffle}
                 aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                 aria-pressed={shuffle}
                 className={cn(
                   'block transition-colors',
                  shuffle ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
                )}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Prev */}
              <button
                 onClick={playPrev}
                 aria-label="Previous track"
                 className="text-[#b3b3b3] hover:text-white transition-colors hover:scale-105 active:scale-95"
              >
                <SkipBack className="h-5 w-5 fill-current" />
              </button>

              {/* Play/Pause */}
              <button
                 onClick={togglePlayPause}
                 aria-label={isPlaying ? 'Pause' : 'Play'}
                 aria-pressed={isPlaying}
                 className="h-10 w-10 sm:h-9 sm:w-9 flex items-center justify-center rounded-full bg-white hover:scale-105 active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-black fill-current" />
                ) : (
                  <Play className="h-4 w-4 sm:h-5 sm:w-5 text-black fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                 onClick={playNext}
                 aria-label="Next track"
                 className="text-[#b3b3b3] hover:text-white transition-colors hover:scale-105 active:scale-95"
              >
                <SkipForward className="h-5 w-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                 onClick={toggleRepeat}
                 aria-label={`Repeat ${repeat === 'off' ? 'off' : repeat === 'all' ? 'all' : 'one'}`}
                 aria-pressed={repeat !== 'off'}
                 className={cn(
                   'block transition-colors',
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
          <div className="flex items-center gap-2 sm:gap-3 sm:w-[30%] justify-end">
            {/* Error toast */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                   className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium max-w-[200px]">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span className="truncate">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <div className="sm:hidden flex items-center text-red-400" title={error} aria-label={error}>
                <AlertCircle className="h-4 w-4" />
              </div>
            )}

            <button
              onClick={() => setCrossfade(!crossfade)}
              aria-label={crossfade ? 'Disable crossfade' : 'Enable crossfade'}
              aria-pressed={crossfade}
              className={cn('sm:hidden transition-colors', crossfade ? 'text-[#1db954]' : 'text-[#b3b3b3]')}
            >
              <Zap className="h-4 w-4" />
            </button>

            {/* Crossfade toggle */}
            <button
               onClick={() => setCrossfade(!crossfade)}
               aria-label={crossfade ? 'Disable crossfade' : 'Enable crossfade'}
               aria-pressed={crossfade}
               className={cn(
                 'hidden sm:block transition-colors',
                crossfade ? 'text-[#1db954]' : 'text-[#b3b3b3] hover:text-white'
              )}
              title={crossfade ? 'Crossfade: ON' : 'Crossfade: OFF'}
            >
              <Zap className="h-4 w-4" />
            </button>

            {/* Queue toggle */}
            <button
               onClick={toggleQueuePanel}
               aria-label={queuePanelOpen ? 'Close queue' : 'Open queue'}
               aria-pressed={queuePanelOpen}
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
               <button onClick={toggleMute} aria-label={volume === 0 ? 'Unmute' : 'Mute'} className="text-[#b3b3b3] hover:text-white transition-colors">
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <div className="relative group hidden sm:block w-24">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  aria-label="Volume"
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
    </>
  )
}
