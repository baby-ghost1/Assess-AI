import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Play, Pause, Music, Heart, Loader2, X,
  TrendingUp, Clock, ListMusic, Sparkles, Mic2, Shuffle,
  History, Globe, Zap, Coffee, Dumbbell, Heart as HeartIcon,
  Moon, Sun, PartyPopper, BookOpen
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusicPlayer } from './musicPlayerContext'
import Equalizer from './Equalizer'

const API_BASE = import.meta.env.VITE_API_URL || ''

const MOOD_CHIPS = [
  { label: 'Bollywood', query: 'bollywood hits', icon: Sparkles },
  { label: 'Romantic', query: 'romantic hindi songs', icon: HeartIcon },
  { label: 'Workout', query: 'workout motivation hindi', icon: Dumbbell },
  { label: 'Chill', query: 'chill lofi hindi', icon: Coffee },
  { label: 'Party', query: 'party bollywood', icon: PartyPopper },
  { label: 'Sad', query: 'sad hindi songs', icon: Moon },
  { label: '90s Hits', query: '90s bollywood songs', icon: Sun },
  { label: 'Classical', query: 'classical hindi ghazal', icon: BookOpen },
  { label: 'Item Songs', query: 'bollywood item song', icon: Zap },
  { label: 'Indie', query: 'indian indie music', icon: Globe },
]

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function formatPlays(n) {
  if (!n) return ''
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr`
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
  return `${n}`
}

async function fetchSuggestions(q) {
  const res = await fetch(`${API_BASE}/api/v1/music/suggest?q=${encodeURIComponent(q)}`)
  const data = await res.json()
  return data.suggestions || []
}

async function fetchSongById(id) {
  const res = await fetch(`${API_BASE}/api/v1/music/songs/${id}`)
  const data = await res.json()
  return data.song || null
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

function SkeletonCard() {
  return (
    <div className="p-3 rounded-lg bg-[#181818] animate-pulse">
      <div className="aspect-square rounded-md bg-[#282828] mb-3 shimmer-bg" />
      <div className="h-4 bg-[#282828] rounded w-3/4 mb-2 shimmer-bg" />
      <div className="h-3 bg-[#282828] rounded w-1/2 shimmer-bg" />
    </div>
  )
}

function SuggestionDropdown({ suggestions, onSelect, loading, playingId }) {
  if (!suggestions.length && !loading) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl bg-[#282828] border border-[#333] overflow-hidden max-h-80 overflow-y-auto shadow-2xl shadow-black/60"
    >
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#1db954]" />
        </div>
      ) : (
        suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#333] transition-colors text-left group"
          >
            <div className="relative shrink-0">
              {s.image ? (
                <div className="h-9 w-9 rounded overflow-hidden bg-[#333]">
                  <img src={s.image} alt="" className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="h-9 w-9 rounded bg-[#333] flex items-center justify-center">
                  <Music className="h-4 w-4 text-[#b3b3b3]" />
                </div>
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                {playingId === s.id ? (
                  <Loader2 className="h-4 w-4 text-white animate-spin" />
                ) : (
                  <Play className="h-4 w-4 text-white fill-current" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate font-medium">{s.title}</p>
              <p className="text-xs text-[#b3b3b3] truncate">{s.artist}</p>
            </div>
            {s.type === 'album' && (
              <span className="text-[10px] text-[#b3b3b3] bg-[#333] px-2 py-0.5 rounded-full shrink-0">Album</span>
            )}
          </button>
        ))
      )}
    </motion.div>
  )
}

function FloatingParticles({ isPlaying }) {
  if (!isPlaying) return null
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-[#1db954]/15"
          style={{
            width: `${3 + Math.random() * 5}px`,
            height: `${3 + Math.random() * 5}px`,
            left: `${10 + Math.random() * 80}%`,
            top: `${20 + Math.random() * 60}%`,
            animation: `float-particle ${5 + Math.random() * 8}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
    </div>
  )
}

function TrackCard({ track, index, isActive, isPlaying, onPlay, onAddToQueue, isLiked, onToggleLike }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
      className="group relative p-3 rounded-lg bg-[#181818] hover:bg-[#282828] transition-all duration-300 cursor-pointer"
      onDoubleClick={() => onPlay(track)}
    >
      <div className="relative mb-3 aspect-square rounded-md overflow-hidden shadow-lg shadow-black/40">
        {track.image ? (
          <img src={track.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-[#282828] flex items-center justify-center">
            <Music className="h-10 w-10 text-[#7f7f7f]" />
          </div>
        )}
        <div className={cn(
          'absolute bottom-2 right-2 transition-all duration-300',
          isActive && isPlaying
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'
        )}>
          <button
            onClick={(e) => { e.stopPropagation(); onPlay(track) }}
            className="h-12 w-12 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/50"
          >
            {isActive && isPlaying ? (
              <Pause className="h-5 w-5 text-black fill-current" />
            ) : (
              <Play className="h-5 w-5 text-black fill-current ml-0.5" />
            )}
          </button>
        </div>
        {isActive && isPlaying && (
          <div className="absolute top-2 left-2">
            <div className="bg-[#1db954]/90 rounded-full px-2 py-0.5">
              <Equalizer isPlaying className="h-2.5" barCount={3} />
            </div>
          </div>
        )}
      </div>
      <div className="min-w-0">
        <p className={cn(
          'text-sm font-semibold truncate leading-tight mb-1 transition-colors',
          isActive ? 'text-[#1db954]' : 'text-white'
        )}>
          {track.title}
        </p>
        <p className="text-xs text-[#b3b3b3] truncate leading-tight">
          {track.artist}
        </p>
      </div>
      {/* Hover actions */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(track) }}
          className={cn(
            'h-7 w-7 flex items-center justify-center rounded-full transition-all',
            isLiked ? 'text-[#1db954] bg-[#1db954]/10' : 'text-[#b3b3b3] hover:text-white bg-black/40 backdrop-blur-sm'
          )}
        >
          <Heart className={cn('h-3.5 w-3.5', isLiked && 'fill-current')} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue(track) }}
          className="h-7 w-7 flex items-center justify-center rounded-full text-[#b3b3b3] hover:text-white bg-black/40 backdrop-blur-sm transition-all"
          title="Add to queue"
        >
          <ListMusic className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  )
}

function TrackListItem({ track, index, isActive, isPlaying, onPlay, onAddToQueue, isLiked, onToggleLike }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.025, duration: 0.3 }}
      onDoubleClick={() => onPlay(track)}
      className={cn(
        'group grid grid-cols-[16px_42px_1fr_minmax(60px,auto)_80px] gap-4 items-center px-4 py-2 rounded-md cursor-pointer transition-colors duration-150',
        isActive ? 'bg-[#282828]' : 'hover:bg-[#ffffff0a]'
      )}
    >
      <div className="w-4 text-center shrink-0">
        {isActive && isPlaying ? (
          <div className="flex items-center justify-center">
            <Equalizer isPlaying className="h-3" barCount={3} />
          </div>
        ) : (
          <>
            <span className="text-sm text-[#b3b3b3] group-hover:hidden">{index + 1}</span>
            <Play className="h-3.5 w-3.5 text-white hidden group-hover:block mx-auto fill-current" />
          </>
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
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            'text-sm truncate leading-tight transition-colors',
            isActive ? 'text-[#1db954]' : 'text-white'
          )}>
            {track.title}
          </p>
          {track.lyricsSnippet && (
            <span className="text-[9px] text-[#7f7f7f] bg-[#282828] px-1.5 py-0.5 rounded shrink-0 hidden sm:inline">Lyrics</span>
          )}
        </div>
        <p className="text-xs text-[#b3b3b3] truncate leading-tight mt-0.5">{track.artist}</p>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLike(track) }}
          className={cn('transition-all', isLiked ? 'text-[#1db954]' : 'text-[#7f7f7f] opacity-0 group-hover:opacity-100 hover:text-white')}
        >
          <Heart className={cn('h-4 w-4', isLiked && 'fill-current')} />
        </button>
        <span className="text-xs text-[#b3b3b3] text-right min-w-[40px]">
          {track.playCount > 0 ? formatPlays(track.playCount) : ''}
        </span>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={(e) => { e.stopPropagation(); onAddToQueue(track) }}
          className="text-[#7f7f7f] opacity-0 group-hover:opacity-100 hover:text-white transition-all"
          title="Add to queue"
        >
          <ListMusic className="h-4 w-4" />
        </button>
        <span className="text-xs text-[#b3b3b3] font-mono">{formatTime(track.duration)}</span>
      </div>
    </motion.div>
  )
}

export default function MusicPlayerPage() {
  const {
    currentTrack, isPlaying, progress, duration, playTrack, seek, hasTrack,
    recentlyPlayed, addToQueue, toggleLike, isLiked, likedSongs,
  } = useMusicPlayer()
  const [query, setQuery] = useState('')
  const [tracks, setTracks] = useState([])
  const [trending, setTrending] = useState([])
  const [loading, setLoading] = useState(false)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [searchDone, setSearchDone] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestionLoading, setSuggestionLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [playingSuggestion, setPlayingSuggestion] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [activeTab, setActiveTab] = useState('discover')
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
    if (!q.trim()) { setSuggestions([]); setShowSuggestions(false); return }
    debounceRef.current = setTimeout(async () => {
      setSuggestionLoading(true)
      try { const res = await fetchSuggestions(q.trim()); setSuggestions(res); setShowSuggestions(true) }
      catch { setSuggestions([]) }
      setSuggestionLoading(false)
    }, 300)
  }, [])

  const handleQueryChange = useCallback((e) => {
    const val = e.target.value; setQuery(val); fetchAutocomplete(val)
  }, [fetchAutocomplete])

  const handleSearch = useCallback(async (searchQuery) => {
    const q = (searchQuery || query).trim()
    if (!q) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setShowSuggestions(false); setLoading(true); setSearchDone(false); setQuery(q)
    try { const results = await searchSaavn(q); setTracks(results) }
    catch { setTracks([]) }
    setLoading(false); setSearchDone(true)
  }, [query])

  const handleSelectSuggestion = useCallback(async (suggestion) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    setSuggestions([]); setShowSuggestions(false)

    if (suggestion.type === 'album') {
      setQuery(suggestion.title); handleSearch(suggestion.title)
      return
    }

    setPlayingSuggestion(suggestion.id)
    try {
      const song = await fetchSongById(suggestion.id)
      if (song && song.streamUrl) {
        playTrack(song, [song])
        setQuery(song.title)
        setPlayingSuggestion(null)
        return
      }
    } catch {}

    // Fallback: search for the song title and play first result
    try {
      setQuery(suggestion.title)
      const results = await searchSaavn(suggestion.title)
      if (results.length > 0 && results[0].streamUrl) {
        playTrack(results[0], results)
      }
    } catch {}
    setPlayingSuggestion(null)
  }, [handleSearch, playTrack])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { setShowSuggestions(false); handleSearch() }
    if (e.key === 'Escape') setShowSuggestions(false)
  }

  const handlePlay = useCallback((track) => {
    const list = searchDone ? tracks : trending
    playTrack(track, list)
  }, [searchDone, tracks, trending, playTrack])

  const handlePlayAll = useCallback(() => {
    const list = activeTab === 'liked' ? likedSongs : (searchDone ? tracks : trending)
    if (list.length > 0) playTrack(list[0], list)
  }, [activeTab, likedSongs, searchDone, tracks, trending, playTrack])

  const handleShuffleAll = useCallback(() => {
    const list = activeTab === 'liked' ? likedSongs : (searchDone ? tracks : trending)
    if (list.length > 0) {
      const shuffled = [...list].sort(() => Math.random() - 0.5)
      playTrack(shuffled[0], shuffled)
    }
  }, [activeTab, likedSongs, searchDone, tracks, trending, playTrack])

  const handleClearSearch = () => {
    setQuery(''); setTracks([]); setSearchDone(false); setSuggestions([]); setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const displayTracks = searchDone ? tracks : trending

  return (
    <div className={cn(
      'h-full flex flex-col relative overflow-hidden transition-all duration-1000',
      hasTrack && isPlaying ? 'music-bg-active' : ''
    )} style={{ paddingBottom: hasTrack ? '100px' : '0' }}>
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none">
        {currentTrack?.image && hasTrack ? (
          <div
            className="absolute inset-0 opacity-20 blur-[80px] scale-150 transition-all duration-[3s]"
            style={{ backgroundImage: `url(${currentTrack.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
        ) : (
          <>
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1db954]/5 rounded-full blur-[150px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#1db954]/3 rounded-full blur-[120px]" />
          </>
        )}
      </div>
      <FloatingParticles isPlaying={hasTrack && isPlaying} />

      <div className="relative z-10 flex-1 overflow-y-auto scrollbar-hide">
        <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-8">

          {/* ─── Search Bar ─── */}
          <div className="max-w-2xl mx-auto mb-6 relative" ref={wrapperRef}>
            <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#b3b3b3]" />
                <input
                  ref={inputRef} type="text" value={query} onChange={handleQueryChange}
                  onKeyDown={handleKeyDown} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  placeholder="What do you want to listen to?"
                  className="w-full pl-12 pr-24 py-3.5 rounded-full bg-[#242424] border-2 border-transparent text-sm text-white placeholder:text-[#7f7f7f] focus:outline-none focus:border-[#1db954] focus:bg-[#2a2a2a] transition-all duration-200"
                />
                {query ? (
                  <button onClick={handleClearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-full bg-[#333] text-[#b3b3b3] hover:text-white hover:bg-[#444] transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={() => handleSearch()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-9 px-5 flex items-center justify-center rounded-full bg-white text-black text-sm font-bold hover:scale-105 active:scale-95 transition-transform">
                    Search
                  </button>
                )}
              </div>
            </motion.div>
            <AnimatePresence>
              <SuggestionDropdown suggestions={suggestions} onSelect={handleSelectSuggestion} loading={suggestionLoading} playingId={playingSuggestion} />
            </AnimatePresence>
          </div>

          {/* ─── Mood Chips ─── */}
          {!searchDone && !showSuggestions && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
              className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#1db954]" />
                <span className="text-sm font-bold text-white">Browse by Mood</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {MOOD_CHIPS.map((chip, i) => {
                  const Icon = chip.icon
                  return (
                    <motion.button
                      key={chip.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.2 + i * 0.03 }}
                      onClick={() => { setQuery(chip.query); handleSearch(chip.query) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-[#d9d9d9] bg-[#232323] border border-[#333] hover:bg-[#2a2a2a] hover:text-white hover:border-[#535353] transition-all duration-200"
                    >
                      <Icon className="h-4 w-4" />
                      {chip.label}
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          )}

          {/* ─── Tabs ─── */}
          {!searchDone && !showSuggestions && (
            <div className="max-w-4xl mx-auto mb-6">
              <div className="flex items-center gap-1 bg-[#1a1a1a] rounded-full p-1 w-fit">
                <button
                  onClick={() => setActiveTab('discover')}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                    activeTab === 'discover' ? 'bg-white text-black' : 'text-[#b3b3b3] hover:text-white'
                  )}
                >
                  Discover
                </button>
                <button
                  onClick={() => setActiveTab('liked')}
                  className={cn(
                    'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 flex items-center gap-2',
                    activeTab === 'liked' ? 'bg-white text-black' : 'text-[#b3b3b3] hover:text-white'
                  )}
                >
                  <Heart className="h-3.5 w-3.5" />
                  Liked Songs
                  {likedSongs.length > 0 && (
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                      activeTab === 'liked' ? 'bg-black/10 text-black/60' : 'bg-[#333] text-[#b3b3b3]'
                    )}>
                      {likedSongs.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ─── Liked Songs View ─── */}
          {activeTab === 'liked' && !searchDone && !showSuggestions && (
            <div className="max-w-4xl mx-auto mb-8">
              {likedSongs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-20 w-20 rounded-full bg-[#282828] flex items-center justify-center mb-4">
                    <Heart className="h-10 w-10 text-[#7f7f7f]" />
                  </div>
                  <p className="text-white font-bold mb-1 text-lg">No liked songs yet</p>
                  <p className="text-sm text-[#b3b3b3]">Tap the heart icon on any song to save it here</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 rounded-lg bg-gradient-to-br from-[#450af5] to-[#c4efd9] flex items-center justify-center">
                        <Heart className="h-7 w-7 text-white fill-current" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white">Liked Songs</h2>
                        <p className="text-sm text-[#b3b3b3]">{likedSongs.length} songs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleShuffleAll}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all shadow-lg"
                      >
                        <Shuffle className="h-5 w-5 text-black" />
                      </button>
                      <button
                        onClick={handlePlayAll}
                        className="h-10 px-6 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all shadow-lg text-black font-bold text-sm"
                      >
                        Play All
                      </button>
                    </div>
                  </div>
                  <div className="bg-[#121212] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[16px_42px_1fr_minmax(60px,auto)_80px] gap-4 items-center px-4 py-2 border-b border-[#282828] text-xs text-[#b3b3b3] uppercase tracking-wider">
                      <span className="text-center">#</span><span>Title</span><span></span>
                      <span className="text-right hidden sm:block">Plays</span>
                      <span className="text-right"><Clock className="h-3.5 w-3.5 inline" /></span>
                    </div>
                    {likedSongs.map((track, i) => (
                      <TrackListItem key={track.id} track={track} index={i}
                        isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={(t) => playTrack(t, likedSongs)}
                        onAddToQueue={addToQueue} isLiked={true} onToggleLike={toggleLike} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ─── Now Playing Hero ─── */}
          <AnimatePresence mode="wait">
            {hasTrack && currentTrack && (
              <motion.div key={currentTrack.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto mb-8">
                <div className="relative rounded-2xl bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] border border-white/5 overflow-hidden">
                  <div className="absolute inset-0 opacity-30 blur-[60px] scale-125"
                    style={{ backgroundImage: currentTrack.image ? `url(${currentTrack.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="relative flex flex-col sm:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8">
                    <div className="relative shrink-0">
                      <div className={cn('h-32 w-32 sm:h-44 sm:w-44 rounded-xl overflow-hidden shadow-2xl shadow-black/60 transition-all duration-500',
                        isPlaying && 'vinyl-spin-slow')}>
                        {currentTrack.image ? (
                          <img src={currentTrack.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-[#282828] flex items-center justify-center">
                            <Music className="h-16 w-16 text-[#7f7f7f]" />
                          </div>
                        )}
                      </div>
                      {isPlaying && <div className="absolute -inset-1 rounded-xl border border-[#1db954]/30 pulse-ring" />}
                    </div>
                    <div className="flex-1 min-w-0 text-center sm:text-left">
                      <div className="flex items-center gap-2 mb-2 justify-center sm:justify-start">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#1db954]">Now Playing</span>
                        {isPlaying && <Equalizer isPlaying className="h-3.5" barCount={4} />}
                      </div>
                      <h1 className="text-3xl sm:text-5xl font-black text-white truncate leading-tight mb-2 drop-shadow-lg">
                        {currentTrack.title}
                      </h1>
                      <p className="text-base sm:text-lg text-[#d9d9d9] truncate mb-1">{currentTrack.artist}</p>
                      {currentTrack.album && (
                        <p className="text-sm text-[#7f7f7f] truncate mb-3">{currentTrack.album}</p>
                      )}

                      {/* Lyrics snippet */}
                      {currentTrack.lyricsSnippet && (
                        <div className="mb-4 p-4 rounded-xl bg-gradient-to-br from-[#1db954]/5 to-[#1db954]/10 border border-[#1db954]/10 max-w-md mx-auto sm:mx-0">
                          <div className="flex items-center gap-1.5 mb-2">
                            <Mic2 className="h-3.5 w-3.5 text-[#1db954]" />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1db954]">Lyrics</span>
                          </div>
                          <p className="text-sm text-[#e0e0e0] leading-relaxed whitespace-pre-line">
                            {currentTrack.lyricsSnippet}
                          </p>
                        </div>
                      )}

                      {/* Progress */}
                      <div className="max-w-md mx-auto sm:mx-0">
                        <div className="relative h-1.5 bg-white/10 rounded-full overflow-hidden group cursor-pointer"
                          onClick={(e) => { const rect = e.currentTarget.getBoundingClientRect(); seek((e.clientX - rect.left) / rect.width) }}>
                          <div className="absolute top-0 left-0 h-full bg-white rounded-full transition-all"
                            style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
                          <div className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{ left: `${duration ? (progress / duration) * 100 : 0}%`, marginLeft: '-7px' }} />
                        </div>
                        <div className="flex justify-between mt-1.5">
                          <span className="text-[11px] text-[#b3b3b3] font-mono">{formatTime(progress)}</span>
                          <span className="text-[11px] text-[#b3b3b3] font-mono">{formatTime(duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Recently Played ─── */}
          {!searchDone && recentlyPlayed.length > 0 && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center gap-2 mb-3">
                <History className="h-4 w-4 text-[#b3b3b3]" />
                <span className="text-sm font-bold text-white">Recently Played</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {recentlyPlayed.slice(0, 8).map((track) => (
                  <button key={track.id} onClick={() => handlePlay(track)}
                    className="flex items-center gap-3 px-3 py-2 rounded-full bg-[#232323] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#1db954]/30 transition-all shrink-0 group">
                    <div className="h-8 w-8 rounded overflow-hidden bg-[#333] shrink-0">
                      {track.image ? (
                        <img src={track.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Music className="h-3 w-3 text-[#7f7f7f]" />
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-[#d9d9d9] group-hover:text-white truncate max-w-[120px]">{track.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ─── Content ─── */}
          {loading || trendingLoading ? (
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            </div>
          ) : displayTracks.length === 0 ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center">
              <div className="relative mb-6">
                <div className="h-24 w-24 rounded-2xl bg-[#282828] flex items-center justify-center">
                  <Mic2 className="h-12 w-12 text-[#7f7f7f]" />
                </div>
              </div>
              <p className="text-white font-bold mb-2 text-xl">{searchDone ? 'No results found' : 'Ready to discover?'}</p>
              <p className="text-sm text-[#b3b3b3] max-w-sm">
                {searchDone ? `We couldn't find anything for "${query}". Try different keywords.` : 'Search for songs, artists, or albums to start listening'}
              </p>
            </motion.div>
          ) : searchDone ? (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-[#1db954]" />
                  <span className="text-sm text-[#b3b3b3] font-medium">Results for "<span className="text-white font-semibold">{query}</span>"</span>
                  <span className="text-xs text-[#7f7f7f]">({displayTracks.length} songs)</span>
                </div>
                <div className="flex items-center gap-2">
                  {displayTracks.length > 0 && (
                    <>
                      <button onClick={handleShuffleAll}
                        className="h-8 w-8 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all"
                        title="Shuffle play">
                        <Shuffle className="h-4 w-4 text-black" />
                      </button>
                      <button onClick={handlePlayAll}
                        className="h-8 px-4 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all text-black font-bold text-xs">
                        Play All
                      </button>
                    </>
                  )}
                  <button onClick={() => setViewMode('grid')}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      viewMode === 'grid' ? 'bg-white text-black' : 'bg-[#232323] text-[#d9d9d9] hover:bg-[#2a2a2a]')}>
                    Grid
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={cn('px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
                      viewMode === 'list' ? 'bg-white text-black' : 'bg-[#232323] text-[#d9d9d9] hover:bg-[#2a2a2a]')}>
                    List
                  </button>
                </div>
              </div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                  {displayTracks.map((track, i) => (
                    <TrackCard key={track.id} track={track} index={i}
                      isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay}
                      onAddToQueue={addToQueue} isLiked={isLiked(track.id)} onToggleLike={toggleLike} />
                  ))}
                </div>
              ) : (
                <div className="bg-[#121212] rounded-lg overflow-hidden">
                  <div className="grid grid-cols-[16px_42px_1fr_minmax(60px,auto)_80px] gap-4 items-center px-4 py-2 border-b border-[#282828] text-xs text-[#b3b3b3] uppercase tracking-wider">
                    <span className="text-center">#</span><span>Title</span><span></span>
                    <span className="text-right hidden sm:block">Plays</span>
                    <span className="text-right"><Clock className="h-3.5 w-3.5 inline" /></span>
                  </div>
                  {displayTracks.map((track, i) => (
                    <TrackListItem key={track.id} track={track} index={i}
                      isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay}
                      onAddToQueue={addToQueue} isLiked={isLiked(track.id)} onToggleLike={toggleLike} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[#1db954]" />
                  <span className="text-sm font-bold text-white">Trending Now</span>
                </div>
                {displayTracks.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={handleShuffleAll}
                      className="h-8 w-8 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all"
                      title="Shuffle play">
                      <Shuffle className="h-4 w-4 text-black" />
                    </button>
                    <button onClick={handlePlayAll}
                      className="h-8 px-4 flex items-center justify-center rounded-full bg-[#1db954] hover:bg-[#1ed760] hover:scale-105 active:scale-95 transition-all text-black font-bold text-xs">
                      Play All
                    </button>
                  </div>
                )}
              </div>
              {displayTracks.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                  <div onClick={() => handlePlay(displayTracks[0])}
                    className="group relative rounded-xl overflow-hidden cursor-pointer bg-gradient-to-r from-[#1a472a] via-[#1db954]/20 to-[#1a472a] border border-[#1db954]/10 hover:border-[#1db954]/30 transition-all duration-300">
                    <div className="flex items-center gap-5 sm:gap-6 p-5">
                      <div className="relative shrink-0">
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                          {displayTracks[0].image ? (
                            <img src={displayTracks[0].image} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full bg-[#282828] flex items-center justify-center">
                              <Music className="h-12 w-12 text-[#7f7f7f]" />
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-8 w-8 flex items-center justify-center rounded-full bg-[#1db954] opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all shadow-lg">
                          <Play className="h-4 w-4 text-black fill-current ml-0.5" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#1db954] mb-1 block">Featured</span>
                        <h3 className="text-xl sm:text-2xl font-black text-white truncate mb-1">{displayTracks[0].title}</h3>
                        <p className="text-sm text-[#d9d9d9] truncate mb-2">{displayTracks[0].artist}</p>
                        <div className="flex items-center gap-3 text-xs text-[#b3b3b3]">
                          {displayTracks[0].playCount > 0 && <span>{formatPlays(displayTracks[0].playCount)} plays</span>}
                          <span>{formatTime(displayTracks[0].duration)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {displayTracks.slice(1).map((track, i) => (
                  <TrackCard key={track.id} track={track} index={i}
                    isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay}
                    onAddToQueue={addToQueue} isLiked={isLiked(track.id)} onToggleLike={toggleLike} />
                ))}
              </div>
              {displayTracks.length > 6 && (
                <div className="mt-8">
                  <div className="flex items-center gap-2 mb-3">
                    <ListMusic className="h-4 w-4 text-[#b3b3b3]" />
                    <span className="text-sm font-bold text-white">All Tracks</span>
                  </div>
                  <div className="bg-[#121212] rounded-lg overflow-hidden">
                    <div className="grid grid-cols-[16px_42px_1fr_minmax(60px,auto)_80px] gap-4 items-center px-4 py-2 border-b border-[#282828] text-xs text-[#b3b3b3] uppercase tracking-wider">
                      <span className="text-center">#</span><span>Title</span><span></span>
                      <span className="text-right hidden sm:block">Plays</span>
                      <span className="text-right"><Clock className="h-3.5 w-3.5 inline" /></span>
                    </div>
                    {displayTracks.map((track, i) => (
                      <TrackListItem key={track.id} track={track} index={i}
                        isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay}
                        onAddToQueue={addToQueue} isLiked={isLiked(track.id)} onToggleLike={toggleLike} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
