import { motion, AnimatePresence } from 'framer-motion'
import { X, Music, Trash2, Play, Pause, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusicPlayer } from './musicPlayerContext'

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function QueueTrack({ track, index, isActive, isPlaying, onPlay, onRemove }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'group flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150',
        isActive ? 'bg-[#282828]' : 'hover:bg-[#ffffff0a]'
      )}
    >
      <div className="w-5 flex justify-center shrink-0">
        {isActive && isPlaying ? (
          <div className="flex items-center gap-px">
            <div className="w-0.5 h-3 bg-[#1db954] rounded-full animate-pulse" />
            <div className="w-0.5 h-4 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
            <div className="w-0.5 h-2.5 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
          </div>
        ) : isActive && !isPlaying ? (
          <Pause className="h-3 w-3 text-[#1db954] fill-current" />
        ) : (
          <span className="text-xs text-[#7f7f7f] group-hover:hidden">{index + 1}</span>
        )}
        {!(isActive) && (
          <Play className="h-3 w-3 text-white hidden group-hover:block fill-current" />
        )}
      </div>

      <div className="h-10 w-10 rounded overflow-hidden bg-[#282828] shrink-0">
        {track.image ? (
          <img src={track.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="h-4 w-4 text-[#7f7f7f]" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0" onClick={() => onPlay(track)}>
        <p className={cn(
          'text-sm truncate leading-tight cursor-pointer transition-colors',
          isActive ? 'text-[#1db954]' : 'text-white'
        )}>
          {track.title}
        </p>
        <p className="text-xs text-[#b3b3b3] truncate leading-tight">
          {track.artist}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[11px] text-[#7f7f7f] font-mono">{formatTime(track.duration)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(index) }}
          className="text-[#7f7f7f] hover:text-white opacity-0 group-hover:opacity-100 transition-all p-1"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

export default function QueuePanel() {
  const {
    currentTrack, isPlaying, queue, queueIndex,
    queuePanelOpen, toggleQueuePanel,
    playTrackNow, removeFromQueue, clearQueue,
  } = useMusicPlayer()

  const nextTracks = queue.slice(queueIndex + 1)

  return (
    <AnimatePresence>
      {queuePanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 320, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="h-full bg-[#121212] border-l border-[#282828] overflow-hidden shrink-0 hidden lg:block"
        >
          <div className="h-full flex flex-col w-[320px]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-[#282828]">
              <h3 className="text-sm font-bold text-white">Queue</h3>
              <div className="flex items-center gap-2">
                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-[11px] text-[#b3b3b3] hover:text-white transition-colors px-2 py-1 rounded hover:bg-[#282828]"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={toggleQueuePanel}
                  className="text-[#b3b3b3] hover:text-white transition-colors p-1 rounded hover:bg-[#282828]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide px-2 py-2">
              {/* Now Playing */}
              {currentTrack && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white">Now Playing</span>
                    {isPlaying && (
                      <div className="flex items-center gap-px">
                        <div className="w-0.5 h-2 bg-[#1db954] rounded-full animate-pulse" />
                        <div className="w-0.5 h-3 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.15s' }} />
                        <div className="w-0.5 h-2 bg-[#1db954] rounded-full animate-pulse" style={{ animationDelay: '0.3s' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#282828]/50">
                    <div className="h-12 w-12 rounded overflow-hidden bg-[#282828] shrink-0 shadow-lg">
                      {currentTrack.image ? (
                        <img src={currentTrack.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-5 w-5 text-[#7f7f7f]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1db954] truncate">{currentTrack.title}</p>
                      <p className="text-xs text-[#b3b3b3] truncate">{currentTrack.artist}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Next in Queue */}
              {nextTracks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-2 mb-2">
                    <Clock className="h-3 w-3 text-[#b3b3b3]" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#b3b3b3]">
                      Next in Queue
                    </span>
                    <span className="text-[10px] text-[#7f7f7f]">({nextTracks.length})</span>
                  </div>
                  <AnimatePresence>
                    {nextTracks.map((track, i) => (
                      <QueueTrack
                        key={`${track.id}-${queueIndex + 1 + i}`}
                        track={track}
                        index={queueIndex + 1 + i}
                        isActive={false}
                        isPlaying={false}
                        onPlay={(t) => playTrackNow(t)}
                        onRemove={(idx) => removeFromQueue(idx)}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Empty state */}
              {(!currentTrack || nextTracks.length === 0) && (
                <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                  <div className="h-16 w-16 rounded-full bg-[#282828] flex items-center justify-center mb-4">
                    <Music className="h-8 w-8 text-[#7f7f7f]" />
                  </div>
                  <p className="text-sm font-semibold text-white mb-1">Queue is empty</p>
                  <p className="text-xs text-[#b3b3b3] max-w-[200px]">
                    Add songs to the queue to see them here
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
