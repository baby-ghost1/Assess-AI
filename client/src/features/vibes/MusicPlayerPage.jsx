import { useState, useRef, useEffect, useCallback } from 'react'
import { Search, Play, Music, Heart, Loader2, X, Radio, Disc3 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMusicPlayer } from './musicPlayerContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

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
  return String(n)
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

function TrackRow({ track, index, isActive, isPlaying, onPlay }) {
  return (
    <div
      onClick={() => onPlay(track)}
      className={cn(
        'group flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-2.5 rounded-xl cursor-pointer transition-all duration-200',
        isActive
          ? 'bg-primary/10 border border-primary/20'
          : 'hover:bg-bg-tertiary/70 border border-transparent'
      )}
    >
      <div className="w-7 sm:w-8 text-center shrink-0">
        {isActive && isPlaying ? (
          <div className="flex items-center justify-center gap-0.5 h-4">
            <span className="w-0.5 h-3 bg-primary animate-pulse rounded-full" />
            <span className="w-0.5 h-4 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.15s' }} />
            <span className="w-0.5 h-2 bg-primary animate-pulse rounded-full" style={{ animationDelay: '0.3s' }} />
          </div>
        ) : (
          <span className="text-sm text-text-tertiary group-hover:hidden">{index + 1}</span>
        )}
        {!isActive && (
          <Play className="h-4 w-4 text-text-primary hidden group-hover:block mx-auto fill-current" />
        )}
      </div>

      <div className="h-10 w-10 rounded-lg overflow-hidden bg-bg-tertiary shrink-0">
        {track.image ? (
          <img src={track.image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Music className="h-5 w-5 text-text-tertiary" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium truncate leading-tight', isActive ? 'text-primary' : 'text-text-primary')}>
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
        <Heart className="h-4 w-4 text-text-tertiary opacity-0 group-hover:opacity-100 hover:text-danger transition-all cursor-pointer" />
        <span className="text-xs text-text-tertiary w-10 text-right">{formatTime(track.duration)}</span>
      </div>
    </div>
  )
}

function SuggestionDropdown({ suggestions, onSelect, loading }) {
  if (!suggestions.length && !loading) return null

  return (
    <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-bg-card/95 backdrop-blur-2xl border border-border shadow-2xl shadow-black/40 overflow-hidden max-h-80 overflow-y-auto">
      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : (
        suggestions.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.title)}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-bg-tertiary/70 transition-colors text-left"
          >
            {s.image ? (
              <div className="h-9 w-9 rounded-lg overflow-hidden bg-bg-tertiary shrink-0">
                <img src={s.image} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-9 w-9 rounded-lg bg-bg-tertiary flex items-center justify-center shrink-0">
                <Music className="h-4 w-4 text-text-tertiary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate font-medium">{s.title}</p>
              <p className="text-xs text-text-secondary truncate">{s.artist}</p>
            </div>
            {s.type === 'album' && (
              <span className="text-[10px] text-text-tertiary bg-bg-tertiary px-2 py-0.5 rounded-full shrink-0">Album</span>
            )}
          </button>
        ))
      )}
    </div>
  )
}

export default function MusicPlayerPage() {
  const { currentTrack, isPlaying, playTrack, hasTrack } = useMusicPlayer()
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
    <div className="h-full flex flex-col" style={{ paddingBottom: hasTrack ? '140px' : '0' }}>
      <div className="shrink-0 px-4 sm:px-6 pt-6 pb-2">
        <div className="max-w-xl mx-auto relative" ref={wrapperRef}>
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center">
              <Search className="absolute left-4 h-5 w-5 text-text-tertiary group-focus-within:text-primary transition-colors" />
              <input
                ref={inputRef}
                type="text" value={query}
                onChange={handleQueryChange}
                onKeyDown={handleKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Search songs, artists, lyrics..."
                className="w-full pl-12 pr-12 py-3.5 rounded-2xl bg-bg-tertiary border border-border/50 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 focus:bg-bg-elevated transition-all duration-300"
              />
              {query ? (
                <button onClick={() => { setQuery(''); setTracks([]); setSearchDone(false); setSuggestions([]); setShowSuggestions(false); inputRef.current?.focus() }}
                  className="absolute right-4 text-text-tertiary hover:text-text-primary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              ) : (
                <button onClick={() => handleSearch()}
                  className="absolute right-4 h-8 px-4 flex items-center justify-center rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-dark transition-colors">
                  Search
                </button>
              )}
            </div>
          </div>
          <SuggestionDropdown suggestions={suggestions} onSelect={handleSelectSuggestion} loading={suggestionLoading} />
          {!searchDone && !showSuggestions && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {['Arijit Singh', 'Pritam', 'Badshah', 'Shreya Ghoshal', 'Atif Aslam', 'Kishore Kumar'].map((s) => (
                <button key={s} onClick={() => { setQuery(s); handleSearch(s); }}
                  className="px-3 py-1.5 rounded-full bg-bg-tertiary/70 border border-border/50 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-tertiary transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading || trendingLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : displayTracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Disc3 className="h-8 w-8 text-primary animate-spin" style={{ animationDuration: '3s' }} />
            </div>
            <p className="text-text-primary font-medium mb-1">
              {searchDone ? 'No songs found' : 'Discover music'}
            </p>
            <p className="text-sm text-text-secondary max-w-xs">
              {searchDone ? `No results for "${query}"` : 'Search above or pick a suggestion to start listening'}
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-3">
              {searchDone ? (
                <span className="text-sm text-text-secondary">{displayTracks.length} songs found</span>
              ) : (
                <>
                  <Radio className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-text-primary">Trending right now</span>
                </>
              )}
            </div>
            <div className="space-y-0.5">
              {displayTracks.map((track, i) => (
                <TrackRow key={track.id} track={track} index={i}
                  isActive={currentTrack?.id === track.id} isPlaying={isPlaying} onPlay={handlePlay} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
