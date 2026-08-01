import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Play, Pause, Music, Heart, Loader2, X, Disc3, Sparkles, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusicPlayer } from './musicPlayerContext'
import Equalizer from './Equalizer'

const API_BASE = import.meta.env.VITE_API_URL || ''

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPlays(n) {
  if (!n) return ''
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr plays`
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L plays`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K plays`
  return `${n} plays`
}

async function fetchSuggestions(q) {
  const res = await fetch(`${API_BASE}/api/v1/music/suggest?q=${encodeURIComponent(q)}`)
  const data = await res.json()
  return data.suggestions || []
}

async function searchSaavn(q) {
  const res = await fetch(`${API_BASE}/api/v1/music/search?q=${encodeURIComponent(q)}`)
  const data = await res.json()
  return data.results || []
}

async function loadTrendingSaavn() {
  const res = await fetch(`${API_BASE}/api/v1/music/trending`)
  const data = await res.json()
  return data.results || []
}

function NowPlayingHero({ track, isPlaying, progress, duration, onSeek }) {
  const pct = duration ? (progress / duration) * 100 : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative mb-6"
    >
      <div className="flex items-center gap-5 sm:gap-7 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-primary/10 via-bg-card to-accent/10 border border-primary/20 backdrop-blur-sm overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/30 rounded-full blur-[60px] glow-pulse" />
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/30 rounded-full blur-[60px] glow-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Rotating album art */}
        <div className="relative shrink-0">
          <div className={cn(
            'h-24 w-24 sm:h-32 sm:w-32 rounded-full overflow-hidden border-4 border-primary/30 shadow-2xl',
            isPlaying ? 'vinyl-spin' : 'vinyl-spin vinyl-spin-paused'
          )}>
            {track?.image ? (
              <img src={track.image} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-bg-tertiary flex items-center justify-center">
                <Music className="h-10 w-10 text-text-tertiary" />
              </div>
            )}
          </div>
          {/* Pulse ring */}
          {isPlaying && (
            <div className="absolute inset-0 rounded-full border-2 border-primary/40 pulse-ring" />
          )}
          {/* Center dot (vinyl hole) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-bg-primary border-2 border-primary/50" />
        </div>

        {/* Track info + progress */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">Now Playing</span>
            {isPlaying && <Equalizer isPlaying className="h-3" barCount={4} />}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-text-primary truncate mb-0.5">{track?.title}</h2>
          <p className="text-sm text-text-secondary truncate mb-3">{track?.artist}</p>

          {/* Progress bar */}
          <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              onSeek((e.clientX - rect.left) / rect.width)
            }}
          >
            <div className="absolute inset-0 bg-white/10 rounded-full" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-accent to-primary rounded-full"
              style={{ width: `${pct}%` }}
              layoutId="hero-progress"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${pct}%`, marginLeft: '-7px' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-text-tertiary font-mono">{formatTime(progress)}</span>
            <span className="text-[10px] text-text-tertiary font-mono">{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function TrackRow({ track, index, isActive, isPlaying, onPlay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={() => onPlay(track)}
      className={cn(
        'group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3 rounded-xl cursor-pointer transition-all duration-300',
        isActive
          ? 'bg-gradient-to-r from-primary/15 to-accent/10 border border-primary/25 shadow-lg shadow-primary/5'
          : 'hover:bg-white/[0.04] border border-transparent hover:border-white/5'
      )}
    >
      <div className="w-7 sm:w-8 text-center shrink-0">
        {isActive && isPlaying ? (
          <Equalizer isPlaying className="h-4 mx-auto" barCount={3} />
        ) : isActive && !isPlaying ? (
          <Pause className="h-4 w-4 text-primary mx-auto fill-current" />
        ) : (
          <>
            <span className="text-sm text-text-tertiary group-hover:hidden">{index + 1}</span>
            <Play className="h-4 w-4 text-text-primary hidden group-hover:block mx-auto fill-current" />
          </>
        )}
      </div>

      <div className={cn(
        'h-10 w-10 rounded-lg overflow-hidden bg-bg-tertiary shrink-0 transition-all duration-300',
        isActive && 'ring-2 ring-primary/40 shadow-lg shadow-primary/20'
      )}>
        {track.image ? (
          <img src={track.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="h-5 w-5 text-text-tertiary" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn(
          'text-sm font-medium truncate leading-tight transition-colors',
          isActive ? 'text-primary' : 'text-text-primary group-hover:text-white'
        )}>
          {track.title}
        </p>
        <p className="text-xs text-text-secondary truncate leading-tight">
          {track.artist}
        </p>
      </div>

      <div className="hidden sm:flex items-center gap-3 shrink-0">
        {track.playCount > 0 && (
          <span className="text-[10px] text-text-tertiary">{formatPlays(track.playCount)}</span>
        )}
        <Heart className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-danger hover:fill-danger/20 transition-all cursor-pointer" />
        <span className="text-xs text-text-tertiary w-10 text-right font-mono">{formatTime(track.duration)}</span>
      </div>
    </motion.div>
  )
}

function SuggestionDropdown({ suggestions, onSelect, loading }) {
  if (!suggestions.length && !loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-bg-card/95 backdrop-blur-2xl border border-border shadow-2xl shadow-black/50 overflow-hidden max-h-80 overflow-y-auto"
    >
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        suggestions.map((s, i) => (
          <motion.button
            key={s.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onSelect(s.title)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/[0.05] transition-colors text-left group"
          >
            {s.image ? (
              <div className="h-9 w-9 rounded-lg overflow-hidden bg-bg-tertiary shrink-0 group-hover:ring-2 ring-primary/30 transition-all">
                <img src={s.image} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
                <Music className="h-4 w-4 text-text-tertiary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate font-medium group-hover:text-white">{s.title}</p>
              <p className="text-xs text-text-secondary truncate">{s.artist}</p>
            </div>
            {s.type === 'album' && (
              <span className="text-[10px] text-text-tertiary bg-white/5 px-2 py-0.5 rounded-full shrink-0">Album</span>
            )}
          </motion.button>
        ))
      )}
    </motion.div>
  )
}

function FloatingParticles({ isPlaying }) {
  if (!isPlaying) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-primary/20"
          style={{
            width: `${4 + Math.random() * 6}px`,
            height: `${4 + Math.random() * 6}px`,
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animation: `float-particle ${4 + Math.random() * 6}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function MusicPlayerPage() {
  const { currentTrack, isPlaying, progress, duration, playTrack, seek, hasTrack } = useMusicPlayer()
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [searchDone, setSearchDone] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    loadTrendingSaavn().then(setTrending).catch(() => setTrending([])).finally(() => setTrendingLoading(false))
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const fetchAutocomplete = useCallback((q) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true)
      try {
        const res = await fetchSuggestions(q.trim())
        setSuggestions(res)
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
      setSuggestionLoading(false)
    }, 300)
  }, [])

  const handleQueryChange = useCallback((e) => {
    const val = e.target.value
    setQuery(val)
    fetchAutocomplete(val)
  }, [fetchAutocomplete])

  const handleSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim()
    if (!q) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setShowSuggestions(false)
    setLoading(true)
    setSearchDone(false)
    setQuery(q)
    try {
      const results = await searchSaavn(q)
      setTracks(results)
    } catch {
      setTracks([])
    }
    setLoading(false)
    setSearchDone(true)
  }, [query])

  const handleSelectSuggestion = useCallback((title) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setQuery(title)
    setSuggestions([])
    setShowSuggestions(false)
    handleSearch(title)
  }, [handleSearch])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false)
      handleSearch()
    }
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  const handlePlay = useCallback((track) => {
    const list = searchDone ? tracks : trending
    playTrack(track, list)
  }, [searchDone, tracks, trending, playTrack])

  const displayTracks = searchDone ? tracks : trending

  return (
    <div className={cn(
      'h-full flex flex-col relative overflow-hidden transition-all duration-1000',
      hasTrack && isPlaying ? 'music-bg-active' : ''
    )} style={{ paddingBottom: hasTrack ? '140px' : '0' }}>
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-[120px]" />
        {hasTrack && isPlaying && (
          <>
            <div className="absolute top-1/3 left-1/2 w-64 h-64 bg-primary/8 rounded-full blur-[100px] glow-pulse" />
            <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-accent/8 rounded-full blur-[80px] glow-pulse" style={{ animationDelay: '1s' }} />
          </>
        )}
      </div>

      <FloatingParticles isPlaying={hasTrack && isPlaying} />

      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {/* Search */}
        <div className="shrink-0 px-4 sm:px-6 pt-6 pb-2">
          <div className="max-w-xl mx-auto relative" ref={wrapperRef}>
            <motion.div
              className="relative group"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-700" />
              <div className="relative flex items-center">
                <Search className="absolute left-4 h-5 w-5 text-text-tertiary group-focus-within:text-primary transition-colors duration-300" />
                <input
                  ref={inputRef}
                  type="text" value={query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="Search songs, artists, lyrics..."
                  className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-white/[0.05] border border-white/10 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-white/[0.08] backdrop-blur-sm transition-all duration-300"
                />
                {query ? (
                  <button onClick={() => { setQuery(''); setTracks([]); setSearchDone(false); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus() }}
                    className="absolute right-4 text-text-tertiary hover:text-text-primary transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                ) : (
                  <button onClick={() => handleSearch()}
                    className="absolute right-4 h-8 px-4 flex items-center justify-center rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-all duration-300 hover:shadow-lg hover:shadow-primary/25">
                    Search
                  </button>
                )}
              </div>
            </motion.div>
            <AnimatePresence>
              <SuggestionDropdown suggestions={suggestions} onSelect={handleSelectSuggestion} loading={suggestionLoading} />
            </AnimatePresence>
            {!searchDone && !showSuggestions && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap gap-2 mt-3 justify-center"
              >
                {['Arijit Singh', 'Pritam', 'Badshah', 'Shreya Ghoshal', 'Atif Aslam', 'Kishore Kumar'].map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={() => { setQuery(s); handleSearch(s); }}
                    className="px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs text-text-secondary hover:text-white hover:bg-white/[0.08] hover:border-white/20 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
                    {s}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </div>

        {/* Now Playing Hero */}
        <div className="px-4 sm:px-6">
          <div className="max-w-xl mx-auto">
            <AnimatePresence mode="wait">
              {hasTrack && currentTrack && (
                <NowPlayingHero
                  key={currentTrack.id}
                  track={currentTrack}
                  isPlaying={isPlaying}
                  progress={progress}
                  duration={duration}
                  onSeek={seek}
                />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Track list */}
        <div className="px-4 sm:px-6 py-2">
          <div className="max-w-xl mx-auto">
            {loading || trendingLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm text-text-tertiary">Loading vibes...</span>
              </div>
            ) : displayTracks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="relative mb-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <Disc3 className="h-10 w-10 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute -inset-2 bg-primary/10 rounded-3xl blur-xl glow-pulse" />
                </div>
                <p className="text-text-primary font-semibold mb-1 text-lg">
                  {searchDone ? 'No songs found' : 'Ready to vibe?'}
                </p>
                <p className="text-sm text-text-secondary max-w-xs">
                  {searchDone ? `No results for "${query}"` : 'Search for a song or artist to start the vibe'}
                </p>
              </motion.div>
            ) : (
              <div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 mb-3"
                >
                  {searchDone ? (
                    <>
                      <Sparkles className="h-4 w-4 text-accent" />
                      <span className="text-sm text-text-secondary font-medium">{displayTracks.length} songs found</span>
                    </>
                  ) : (
                    <>
                      <div className="relative">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm" />
                      </div>
                      <span className="text-sm font-semibold text-text-primary">Trending right now</span>
                    </>
                  )}
                </motion.div>
                <div className="space-y-1">
                  {displayTracks.map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i}
                      isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
