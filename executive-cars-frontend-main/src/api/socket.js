import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin

let socket = null

export const getSocket = (token) => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
    })
  }
  return socket
}

export const connectSocket = (token) => {
  const s = getSocket(token)
  if (s.connected && s.auth?.token !== token) s.disconnect()
  s.auth = { token }
  if (!s.connected) {
    s.connect()
  }
  return s
}

export const disconnectSocket = () => {
  if (socket?.connected) socket.disconnect()
  socket = null
}
