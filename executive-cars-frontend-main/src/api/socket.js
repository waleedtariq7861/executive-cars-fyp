import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

let socket = null

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      // External Vercel rewrites forward HTTP polling; WebSocket upgrade support is unverified.
      ...(import.meta.env.PROD && !import.meta.env.VITE_SOCKET_URL ? { transports: ['polling'] } : {}),
    })
  }
  return socket
}

export const connectSocket = () => {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect()
  socket = null
}
