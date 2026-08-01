import { Router } from 'express'
import CryptoJS from 'crypto-js'

const router = Router()

const JIO_API = 'https://www.jiosaavn.com/api.php'
const COMMON = '_format=json&_marker=0&ctx=web6dot0&api_version=4&cc=in'
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://www.jiosaavn.com/',
  'Origin': 'https://www.jiosaavn.com',
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
    return url && url.startsWith('http') ? url : null
  } catch {
    return null
  }
}

function parseSong(s) {
  const mi = s.more_info || {}
  const rawUrl = mi.encrypted_media_url || null
  const streamUrl = decryptMediaUrl(rawUrl)
  return {
    id: s.id,
    title: s.title,
    artist: mi.music || s.subtitle?.split(' - ')?.[1] || s.subtitle || '',
    album: mi.album || '',
    image: s.image?.replace('150x150', '500x500'),
    duration: Number(mi.duration) || 0,
    year: s.year,
    streamUrl,
    language: s.language,
    playCount: Number(s.play_count) || 0,
    lyricsSnippet: mi.lyrics_snippet || '',
  }
}

router.get('/search', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ success: true, results: [] })

    const url = `${JIO_API}?__call=search.getResults&${COMMON}&q=${encodeURIComponent(q)}&n=20&p=1`
    const r = await fetch(url, { headers: HEADERS })
    const data = await r.json()
    const results = (data.results || []).filter((s) => s.type === 'song').map(parseSong)
    res.json({ success: true, results })
  } catch (err) {
    console.error('JioSaavn search error:', err.message)
    res.json({ success: true, results: [] })
  }
})

router.get('/suggest', async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ success: true, suggestions: [] })

    const url = `${JIO_API}?__call=autocomplete.get&_format=json&_marker=0&cc=in&includeMetaTags=1&query=${encodeURIComponent(q)}`
    const r = await fetch(url, { headers: HEADERS })
    const data = await r.json()

    const songs = (data.songs?.data || []).map((s) => ({
      id: s.id,
      title: s.title,
      artist: s.description || '',
      image: s.image?.replace('50x50', '500x500'),
    }))

    const albums = (data.albums?.data || []).map((a) => ({
      id: a.id,
      title: a.title,
      artist: a.description || '',
      image: a.image?.replace('50x50', '500x500'),
      type: 'album',
    }))

    res.json({ success: true, suggestions: [...songs, ...albums].slice(0, 8) })
  } catch (err) {
    console.error('JioSaavn suggest error:', err.message)
    res.json({ success: true, suggestions: [] })
  }
})

router.get('/stream', async (req, res) => {
  try {
    const audioUrl = req.query.url
    if (!audioUrl || !audioUrl.startsWith('https://')) {
      return res.status(400).json({ success: false, message: 'Invalid URL' })
    }

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    }
    if (req.headers.range) headers['Range'] = req.headers.range

    const r = await fetch(audioUrl, { headers })

    res.setHeader('Content-Type', r.headers.get('content-type') || 'audio/mp4')
    res.setHeader('Accept-Ranges', 'bytes')
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (r.headers.get('content-length')) res.setHeader('Content-Length', r.headers.get('content-length'))
    if (r.headers.get('content-range')) res.setHeader('Content-Range', r.headers.get('content-range'))
    if (r.status === 206) res.status(206)

    const reader = r.body.getReader()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      res.write(value)
    }
    res.end()
  } catch (err) {
    console.error('Stream error:', err.message)
    res.status(500).json({ success: false, message: 'Stream failed' })
  }
})

router.get('/trending', async (req, res) => {
  try {
    const playlists = [
      { id: '34623129', name: 'Top 50 Bollywood' },
      { id: '52497285', name: 'Hindi Top Songs' },
      { id: '1103456', name: 'Bollywood Butter' },
    ]
    const pick = playlists[Math.floor(Math.random() * playlists.length)]

    const url = `${JIO_API}?__call=playlist.getDetails&${COMMON}&listid=${pick.id}`
    const r = await fetch(url, { headers: HEADERS })
    const data = await r.json()
    const songs = (data.songs || []).map(parseSong).filter((s) => s.streamUrl)
    res.json({ success: true, results: songs.slice(0, 20), playlist: pick.name })
  } catch (err) {
    console.error('JioSaavn trending error:', err.message)
    res.json({ success: true, results: [], playlist: '' })
  }
})

router.get('/charts', async (req, res) => {
  try {
    const playlistIds = ['34623129', '52497285', '1103456']
    const results = []

    for (const pid of playlistIds) {
      try {
        const url = `${JIO_API}?__call=playlist.getDetails&${COMMON}&listid=${pid}`
        const r = await fetch(url, { headers: HEADERS })
        const data = await r.json()
        const songs = (data.songs || []).map(parseSong).filter((s) => s.streamUrl).slice(0, 10)
        results.push({ id: pid, name: data.name || data.title || 'Playlist', songs })
      } catch {}
    }

    res.json({ success: true, charts: results })
  } catch (err) {
    console.error('JioSaavn charts error:', err.message)
    res.json({ success: true, charts: [] })
  }
})

router.get('/songs/:id', async (req, res) => {
  try {
    const songId = req.params.id
    if (!songId) return res.status(400).json({ success: false, message: 'Song ID required' })

    const url = `${JIO_API}?__call=songs.getDetails&${COMMON}&pids=${songId}`
    const r = await fetch(url, { headers: HEADERS })
    const data = await r.json()

    let song = null
    if (Array.isArray(data)) {
      song = data[0]
    } else if (data.songs && Array.isArray(data.songs)) {
      song = data.songs[0]
    } else if (data.id) {
      song = data
    }

    if (!song || !song.id) return res.status(404).json({ success: false, message: 'Song not found' })

    const parsed = parseSong(song)
    if (!parsed.streamUrl) return res.status(404).json({ success: false, message: 'Stream not available' })

    res.json({ success: true, song: parsed })
  } catch (err) {
    console.error('JioSaavn song detail error:', err.message)
    res.status(500).json({ success: false, message: 'Failed to fetch song' })
  }
})

export default router
