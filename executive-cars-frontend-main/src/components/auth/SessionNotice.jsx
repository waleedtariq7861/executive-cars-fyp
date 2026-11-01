import React from 'react'
import { useAuth } from '../../context/authContext.js'
import { Alert } from '../ui/Feedback.jsx'

const copy = {
  expired: {
    title: 'Your session expired',
    body: 'For your security you are signed out after a period of inactivity. Sign in again to continue.',
  },
  revoked: {
    title: 'You were signed out',
    body: 'This session was ended, usually because the password was changed or you signed out on another device. Sign in again to continue.',
  },
}

// Explains an unrequested sign-out once, right where the person lands to sign in again.
export default function SessionNotice({ className = '' }) {
  const { sessionNotice } = useAuth()
  const message = copy[sessionNotice]
  if (!message) return null
  return <Alert tone="warning" title={message.title} className={className}>{message.body}</Alert>
}
