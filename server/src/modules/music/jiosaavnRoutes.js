import { Router } from 'express'
import CryptoJS from 'crypto-js'
import jwt from 'jsonwebtoken'
import { authenticate } from '../../middleware/authenticate.js'
import User from '../users/User.js'
import { logger } from '../../config/logger.js'
import { config } from '../../config/index.js'

const router = Router()
const JIO_API = 'https://www.jiosaavn.com/api.php'
const COMMON = '_format=json&_marker=0&ctx=web6dot0&api_version=4&cc=in'
const UPSTREAM_TIMEOUT_MS = 15000
const ALLOWED_STREAM_HOSTS = ['jiosaavn.com', 'saavncdn.com', 'aac.saavncdn.com']
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://www.jiosaavn.com/',
  Origin: 'https://www.jiosaavn.com',
}

function decryptMediaUrl(encryptedUrl) {
  if (!encryptedUrl) return null
  try {
    const decrypted = CryptoJS.DES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(encryptedUrl) },
      CryptoJS.enc.Utf8.parse('38346591'),
      { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 }
    )
    const url = decrypted.toString(CryptoJS.enc.Utf8)
    return url && url.startsWith('https://') ? url : null
  } catch {
    return null
  }
}

function decodeHtmlEntities(value) {
  if (!value) return value
  return value
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&amp;/g, '&')
}

function parseSong(song) {
  if (!song || typeof song !== 'object' || !song.id) return null
  const info = song.more_info || {}
  return {
    id: String(song.id),
    title: decodeHtmlEntities(song.title) || 'Unknown title',
    artist: info.music || song.subtitle?.split(' - ')?.[1] || song.subtitle || '',
    album: info.album || '',
    image: typeof song.image === 'string' ? song.image.replace('150x150', '500x500').replace('50x50', '500x500') : '',
    duration: Number(info.duration) || 0,
    year: song.year,
    streamUrl: decryptMediaUrl(info.encrypted_media_url),
    language: song.language,
    playCount: Number(song.play_count) || 0,
    lyricsSnippet: info.lyrics_snippet || '',
  }
}

async function fetchUpstream(url, options = {}) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  try {
    const response = await fetch(url, { ...options, redirect: 'manual', signal: controller.signal })
    if (!response.ok) throw new Error(`Upstream responded with ${response.status}`)
    const text = await response.text()
    try {
      return JSON.parse(text)
    } catch {
      throw new Error('Upstream returned invalid JSON')
    }
  } finally {
    clearTimeout(timeout)
  }
}

function upstreamError(res, route, error) {
  logger.error(`${route} error:`, error.message)
  if (!res.headersSent) res.status(502).json({ success: false, message: 'Music service unavailable' })
}

router.get('/search', authenticate, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ success: true, results: [] })
    const url = `${JIO_API}?__call=search.getResults&_format=json&_marker=0&ctx=web6dot0&api_version=4&cc=in&q=${encodeURIComponent(q)}&n=20&p=1`
    const data = await fetchUpstream(url, { headers: HEADERS })
    const results = (Array.isArray(data.results) ? data.results : [])
      .filter((song) => song?.type === 'song')
      .map(parseSong)
      .filter((song) => song?.streamUrl)
    res.json({ success: true, results })
  } catch (error) {
    upstreamError(res, 'JioSaavn search', error)
  }
})

router.get('/suggest', authenticate, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()
    if (!q) return res.json({ success: true, suggestions: [] })
    const url = `${JIO_API}?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(q)}`
    const data = await fetchUpstream(url, { headers: HEADERS })
    const songs = (Array.isArray(data.songs?.data) ? data.songs.data : []).map((song) => ({
      id: song.id,
      title: decodeHtmlEntities(song.title),
      artist: song.description || song.more_info?.music || '',
      image: typeof song.image === 'string' ? song.image.replace('50x50', '500x500') : '',
    })).filter((song) => song.id && song.title)
    const albums = (Array.isArray(data.albums?.data) ? data.albums.data : []).map((album) => ({
      id: album.id,
      title: decodeHtmlEntities(album.title),
      artist: album.description || '',
      image: typeof album.image === 'string' ? album.image.replace('50x50', '500x500') : '',
      type: 'album',
    })).filter((album) => album.id && album.title)
    res.json({ success: true, suggestions: [...songs, ...albums].slice(0, 8) })
  } catch (error) {
    upstreamError(res, 'JioSaavn suggest', error)
  }
})

router.get('/stream', async (req, res) => {
  const audioUrl = req.query.url
  if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.startsWith('https://')) {
    return res.status(400).json({ success: false, message: 'Invalid URL' })
  }

  const token = req.cookies?.mediaToken || req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ success: false, message: 'No token provided' })
  let decoded
  try {
    decoded = jwt.verify(token, config.jwt.accessSecret)
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid token' })
  }
  try {
    const user = await User.findById(decoded.userId).select('isActive')
    if (!user?.isActive) return res.status(401).json({ success: false, message: 'Account is inactive' })
  } catch {
    return res.status(503).json({ success: false, message: 'Authentication service unavailable' })
  }

  let parsedUrl
  try {
    parsedUrl = new URL(audioUrl)
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid URL' })
  }
  const isAllowed = ALLOWED_STREAM_HOSTS.some((host) => parsedUrl.hostname === host || parsedUrl.hostname.endsWith(`.${host}`))
  if (!isAllowed) return res.status(403).json({ success: false, message: 'URL not allowed' })

  const controller = new AbortController()
  let timeout
  const armTimeout = () => {
    clearTimeout(timeout)
    timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)
  }
  const abort = () => controller.abort()
  armTimeout()
  req.once('aborted', abort)
  res.once('close', abort)

  try {
    const headers = { 'User-Agent': HEADERS['User-Agent'] }
    if (req.headers.range) headers.Range = req.headers.range
    const upstream = await fetch(audioUrl, { headers, signal: controller.signal, redirect: 'manual' })
    armTimeout()
    if (upstream.status >= 300 && upstream.status < 400) throw new Error('Upstream redirect blocked')
    if (!upstream.ok) {
      if (!res.headersSent) res.status(upstream.status >= 400 && upstream.status < 600 ? upstream.status : 502).json({ success: false, message: 'Stream unavailable' })
      return
    }
    if (!upstream.body) throw new Error('Upstream returned an empty stream')
    const contentType = upstream.headers.get('content-type') || ''
    if (contentType && !/(audio|video|application\/octet-stream)/i.test(contentType)) {
      if (!res.headersSent) res.status(502).json({ success: false, message: 'Upstream returned an invalid stream' })
      return
    }

    res.status(upstream.status === 206 ? 206 : 200)
    res.setHeader('Content-Type', contentType || 'audio/mp4')
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Access-Control-Allow-Origin', config.clientUrl.split(',')[0].trim())
    res.setHeader('Access-Control-Allow-Credentials', 'true')
    if (upstream.headers.get('content-length')) res.setHeader('Content-Length', upstream.headers.get('content-length'))
    if (upstream.headers.get('content-range')) res.setHeader('Content-Range', upstream.headers.get('content-range'))

    const reader = upstream.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      armTimeout()
      if (done || res.destroyed) break
      if (!res.write(value)) {
        await new Promise((resolve) => {
          const onDrain = () => { res.off('close', onDrain); resolve() }
          res.once('drain', onDrain)
          res.once('close', onDrain)
        })
      }
    }
    if (!res.destroyed) res.end()
  } catch (error) {
    if (!res.headersSent) {
      res.status(502).json({ success: false, message: 'Stream unavailable' })
    } else if (!res.destroyed) {
      res.destroy(error)
    }
  } finally {
    clearTimeout(timeout)
    req.off('aborted', abort)
    res.off('close', abort)
  }
})

router.get('/trending', authenticate, async (req, res) => {
  try {
    const playlists = [
      { id: '34623129', name: 'Top 50 Bollywood' },
      { id: '52497285', name: 'Hindi Top Songs' },
      { id: '1103456', name: 'Bollywood Butter' },
    ]
    const attempts = await Promise.all(playlists.map(async (pick) => {
      try {
        const url = `${JIO_API}?__call=playlist.getDetails&${COMMON}&listid=${pick.id}`
        const data = await fetchUpstream(url, { headers: HEADERS })
        const songs = (Array.isArray(data.songs) ? data.songs : []).map(parseSong).filter((song) => song?.streamUrl)
        return { pick, songs }
      } catch (error) {
        logger.warn(`JioSaavn trending ${pick.id} error:`, error.message)
        return null
      }
    }))
    const successful = attempts.find((attempt) => attempt?.songs.length > 0)
    if (successful) return res.json({ success: true, results: successful.songs.slice(0, 20), playlist: successful.pick.name })
    const fallbackUrl = `${JIO_API}?__call=search.getResults&_format=json&_marker=0&ctx=web6dot0&api_version=4&cc=in&q=${encodeURIComponent('bollywood hits')}&n=20&p=1`
    const fallbackData = await fetchUpstream(fallbackUrl, { headers: HEADERS })
    const fallbackSongs = (Array.isArray(fallbackData.results) ? fallbackData.results : [])
      .filter((song) => song?.type === 'song')
      .map(parseSong)
      .filter((song) => song?.streamUrl)
    if (fallbackSongs.length > 0) return res.json({ success: true, results: fallbackSongs.slice(0, 20), playlist: 'Bollywood Hits' })
    res.status(502).json({ success: false, message: 'Music service unavailable' })
  } catch (error) {
    upstreamError(res, 'JioSaavn trending', error)
  }
})

router.get('/charts', authenticate, async (req, res) => {
  try {
    const playlistIds = ['34623129', '52497285', '1103456']
    const results = []
    for (const playlistId of playlistIds) {
      try {
        const url = `${JIO_API}?__call=playlist.getDetails&${COMMON}&listid=${playlistId}`
        const data = await fetchUpstream(url, { headers: HEADERS })
        const songs = (Array.isArray(data.songs) ? data.songs : []).map(parseSong).filter((song) => song?.streamUrl).slice(0, 10)
        results.push({ id: playlistId, name: data.name || data.title || 'Playlist', songs })
      } catch (error) {
        logger.warn(`JioSaavn chart ${playlistId} error:`, error.message)
      }
    }
    res.json({ success: true, charts: results })
  } catch (error) {
    upstreamError(res, 'JioSaavn charts', error)
  }
})

router.get('/songs/:id', authenticate, async (req, res) => {
  try {
    const songId = String(req.params.id || '').trim()
    if (!songId) return res.status(400).json({ success: false, message: 'Song ID required' })
    const url = `${JIO_API}?__call=songs.getDetails&${COMMON}&pids=${encodeURIComponent(songId)}`
    const data = await fetchUpstream(url, { headers: HEADERS })
    let song = null
    if (Array.isArray(data)) song = data[0]
    else if (Array.isArray(data.songs)) song = data.songs[0]
    else if (data.id) song = data
    if (!song?.id) return res.status(404).json({ success: false, message: 'Song not found' })
    const parsed = parseSong(song)
    if (!parsed?.streamUrl) return res.status(404).json({ success: false, message: 'Stream not available' })
    res.json({ success: true, song: parsed })
  } catch (error) {
    upstreamError(res, 'JioSaavn song detail', error)
  }
})

export default router
