import { io } from 'socket.io-client'

let socket = null

function getAuthToken() {
  return localStorage.getItem('accessToken')
}

export function getSocket() {
  if (socket?.connected || socket?.active) return socket

  if (!getAuthToken()) return null

  if (!socket) {
    socket = io(window.location.origin, {
      auth: { token: getAuthToken() },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    })

    // Keep auth token fresh across access-token rotation (axios refresh)
    socket.io.on('reconnect_attempt', () => {
      socket.auth = { token: getAuthToken() }
    })

    socket.on('connect_error', (err) => {
      // Auth failures: drop socket so next getSocket() reconnects with new token
      if (String(err?.message || '').toLowerCase().includes('token') ||
          String(err?.message || '').toLowerCase().includes('auth')) {
        const s = socket
        socket = null
        s?.disconnect()
      }
    })
  } else if (!socket.connected) {
    socket.auth = { token: getAuthToken() }
    socket.connect()
  }

  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
