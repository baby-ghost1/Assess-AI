import { useState, useCallback } from 'react'

/* ═══════════════════════════════════════════
   SPINNER DEFINITIONS
   Each spinner: { id, name, desc, render(size?) }
   render() returns JSX — accepts optional size prop
   ═══════════════════════════════════════════ */

const SPINNERS = [
  {
    id: 'gradient-ring',
    name: 'Gradient Ring',
    desc: 'Conic gradient ring with inner cutout',
    render: (s = 48) => (
      <div style={{ width: s, height: s, borderRadius: '50%', background: 'conic-gradient(from 0deg, transparent 0%, #1db954 25%, #1ed760 50%, transparent 75%)', animation: 'gradient-ring-spin 1s linear infinite', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: '11%', borderRadius: '50%', background: '#0a0a0a' }} />
      </div>
    ),
  },
  {
    id: 'dna-helix',
    name: 'DNA Helix',
    desc: 'Double helix dots weaving left-right',
    render: (s = 48) => (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', width: s * 0.8, height: s * 1.3 }}>
        {[0, 0, 0.15, 0.15, 0.3, 0.3, 0.45, 0.45].map((d, i) => (
          <div key={i} style={{ width: s * 0.2, height: s * 0.2, borderRadius: '50%', background: '#1db954', animation: `dna-${i % 2 === 0 ? 'left' : 'right'} 1.2s ease-in-out ${d}s infinite` }} />
        ))}
      </div>
    ),
  },
  {
    id: 'pulse-dots',
    name: 'Pulse Dots',
    desc: '8 dots in a circle breathing sequentially',
    render: (s = 48) => {
      const r = s * 0.35
      const dotSize = s * 0.17
      return (
        <div style={{ width: s, height: s, position: 'relative' }}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
            const rad = (deg * Math.PI) / 180
            const x = Math.cos(rad) * r
            const y = Math.sin(rad) * r
            return (
              <div key={i} style={{
                position: 'absolute', width: dotSize, height: dotSize, borderRadius: '50%', background: '#1db954',
                left: `calc(50% + ${x}px - ${dotSize / 2}px)`, top: `calc(50% + ${y}px - ${dotSize / 2}px)`,
                animation: `pulse-dot-breathe 1s ease-in-out ${-i * 0.125}s infinite`,
              }} />
            )
          })}
        </div>
      )
    },
  },
  {
    id: 'cube-grid',
    name: 'Cube Grid',
    desc: '3x3 grid of cubes scaling in wave',
    render: (s = 48) => {
      const cell = (s - 8) / 3
      const delays = [0, 0.1, 0.2, 0.1, 0.2, 0.3, 0.2, 0.3, 0.4]
      return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(3, ${cell}px)`, gridTemplateRows: `repeat(3, ${cell}px)`, gap: 4 }}>
          {delays.map((d, i) => (
            <div key={i} style={{ background: '#1db954', borderRadius: 2, animation: `cube-grid-scale 1.3s ease-in-out ${d}s infinite` }} />
          ))}
        </div>
      )
    },
  },
  {
    id: 'wave-bars',
    name: 'Wave Bars',
    desc: 'Audio equalizer-style bars',
    render: (s = 48) => {
      const barW = s * 0.07
      const gap = s * 0.05
      const delays = [0, 0.1, 0.2, 0.3, 0.4, 0.3, 0.2]
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap, height: s * 0.75 }}>
          {delays.map((d, i) => (
            <div key={i} style={{
              width: barW, height: '100%', borderRadius: barW / 2,
              background: 'linear-gradient(to top, #1db954, #1ed760)',
              animation: `wave-bar 0.8s ease-in-out ${d}s infinite`,
              transformOrigin: 'bottom',
            }} />
          ))}
        </div>
      )
    },
  },
  {
    id: 'orbit',
    name: 'Orbit',
    desc: 'Dot orbiting around a center dot',
    render: (s = 48) => (
      <div style={{ width: s, height: s, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, animation: 'gradient-ring-spin 1.2s linear infinite' }}>
          <div style={{ position: 'absolute', width: s * 0.22, height: s * 0.22, borderRadius: '50%', background: '#1db954', top: 0, left: `calc(50% - ${s * 0.11}px)` }} />
        </div>
        <div style={{ position: 'absolute', width: s * 0.28, height: s * 0.28, borderRadius: '50%', background: 'radial-gradient(circle, #1db954, #0a0a0a 70%)', top: `calc(50% - ${s * 0.14}px)`, left: `calc(50% - ${s * 0.14}px)` }} />
      </div>
    ),
  },
  {
    id: 'elastic-line',
    name: 'Elastic Line',
    desc: 'Horizontal line stretching and compressing',
    render: (s = 48) => (
      <div style={{ width: s, height: s * 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: '80%', height: s * 0.12, borderRadius: s,
          background: 'linear-gradient(90deg, #1db954, #1ed760)',
          animation: 'elastic-line-stretch 1s ease-in-out infinite',
        }} />
      </div>
    ),
  },
  {
    id: 'rotating-squares',
    name: 'Rotating Squares',
    desc: 'Nested squares rotating in opposite directions',
    render: (s = 48) => (
      <div style={{ width: s, height: s, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: '70%', height: '70%', border: '2px solid #1db954', borderRadius: 4, animation: 'gradient-ring-spin 2s linear infinite' }} />
        <div style={{ position: 'absolute', width: '45%', height: '45%', border: '2px solid #1ed760', borderRadius: 3, animation: 'gradient-ring-spin 1.4s linear infinite reverse' }} />
        <div style={{ width: s * 0.15, height: s * 0.15, borderRadius: '50%', background: '#1db954' }} />
      </div>
    ),
  },
  {
    id: 'bouncing-ball',
    name: 'Bouncing Ball',
    desc: 'Ball bouncing inside a container',
    render: (s = 48) => (
      <div style={{ width: s, height: s, position: 'relative', border: `2px solid #333`, borderRadius: s * 0.15, overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', width: s * 0.22, height: s * 0.22, borderRadius: '50%', background: '#1db954',
          animation: 'bouncing-ball-move 1s ease-in-out infinite',
          top: '10%', left: '10%',
        }} />
      </div>
    ),
  },
  {
    id: 'morphing-square',
    name: 'Morphing Square',
    desc: 'Square morphing into circle and back',
    render: (s = 48) => (
      <div style={{
        width: s * 0.55, height: s * 0.55, background: '#1db954',
        animation: 'morphing-shape 1.6s ease-in-out infinite',
      }} />
    ),
  },
  {
    id: 'ripple',
    name: 'Ripple',
    desc: 'Expanding rings from center',
    render: (s = 48) => (
      <div style={{ width: s, height: s, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {[0, 0.4, 0.8].map((d, i) => (
          <div key={i} style={{
            position: 'absolute', width: '100%', height: '100%', borderRadius: '50%',
            border: '2px solid #1db954', animation: `ripple-expand 1.6s ease-out ${d}s infinite`,
          }} />
        ))}
        <div style={{ width: s * 0.15, height: s * 0.15, borderRadius: '50%', background: '#1db954', position: 'relative', zIndex: 1 }} />
      </div>
    ),
  },
  {
    id: 'typing-dots',
    name: 'Typing Dots',
    desc: 'Three dots bouncing like a typing indicator',
    render: (s = 48) => (
      <div style={{ display: 'flex', gap: s * 0.1, alignItems: 'center', padding: `${s * 0.25}px ${s * 0.35}px`, background: '#1a1a1a', borderRadius: s * 0.3 }}>
        {[0, 0.15, 0.3].map((d, i) => (
          <div key={i} style={{
            width: s * 0.18, height: s * 0.18, borderRadius: '50%', background: '#1db954',
            animation: `typing-dot-bounce 1s ease-in-out ${d}s infinite`,
          }} />
        ))}
      </div>
    ),
  },
]

/* ═══════════════════════════════════════════
   GET / SET selected spinner (per-user)
   key format: assessai_spinner or assessai_spinner_{userId}
   ═══════════════════════════════════════════ */

function storageKey(userId) {
  return userId ? `assessai_spinner_${userId}` : 'assessai_spinner'
}

export function getSelectedSpinnerId(userId) {
  try {
    return localStorage.getItem(storageKey(userId)) || 'gradient-ring'
  } catch {
    return 'gradient-ring'
  }
}

export function setSelectedSpinnerId(id, userId) {
  try {
    localStorage.setItem(storageKey(userId), id)
  } catch { /* noop */ }
}

export function getSpinnerById(id) {
  return SPINNERS.find((s) => s.id === id) || SPINNERS[0]
}

export function getAllSpinners() {
  return SPINNERS
}

/* ═══════════════════════════════════════════
   useSpinnerSelection(userId?) hook
   Returns [selectedId, selectSpinner]
   ═══════════════════════════════════════════ */

export function useSpinnerSelection(userId) {
  const [selectedId, setSelectedIdState] = useState(() => getSelectedSpinnerId(userId))

  const selectSpinner = useCallback((id) => {
    setSelectedIdState(id)
    setSelectedSpinnerId(id, userId)
  }, [userId])

  return [selectedId, selectSpinner]
}

export { SPINNERS }
