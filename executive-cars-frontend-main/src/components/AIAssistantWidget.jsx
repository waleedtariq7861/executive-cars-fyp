import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MessageCircle, X, Send, Bot } from 'lucide-react'
import api from '../api/api.js'
import { useSearchParams } from 'react-router-dom'
import { useDialogLifecycle } from './ui/Overlays.jsx'

const WELCOME_ID = 'welcome'
const WELCOME = {
  id: WELCOME_ID,
  role: 'assistant',
  content: "Hi! I'm the Executive Cars AI assistant. Ask me anything about buying, selling, auctions, or pricing.",
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 mb-3">
      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-blue-600" />
      </div>
      <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
          <Bot className="w-4 h-4 text-blue-600" />
        </div>
      )}
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {msg.content}
      </div>
    </div>
  )
}

export default function AIAssistantWidget() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const dialogRef = useRef(null)
  const triggerRef = useRef(null)

  useDialogLifecycle(open, () => setOpen(false), dialogRef, inputRef, triggerRef)

  useEffect(() => {
    if (searchParams.get('assistant') !== 'open') return
    setOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('assistant')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg = { id: Date.now(), role: 'user', content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)

    try {
      const payload = next
        .filter(m => m.id !== WELCOME_ID)
        .map(({ role, content }) => ({ role, content }))

      const { data } = await api.post('/chat', { messages: payload })
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, role: 'assistant', content: data.reply },
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          role: 'assistant',
          content: "Sorry, I'm having trouble right now. Please email info@executivecars.pk for help.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const onKey = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const panel = open ? createPortal(
    <div className="fixed inset-0 z-[70] pointer-events-none bg-slate-950/20 sm:bg-transparent">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-assistant-title"
          tabIndex={-1}
          className="pointer-events-auto absolute inset-x-0 bottom-0 h-[min(80dvh,620px)] bg-white border border-gray-200 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(70dvh,480px)] sm:w-80 sm:rounded-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-blue-600 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p id="ai-assistant-title" className="text-white font-semibold text-sm leading-tight">Executive Cars AI</p>
                <p className="text-blue-200 text-xs mt-0.5">Ask about cars and services</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close AI Assistant"
              className="text-blue-200 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4" aria-live="polite" aria-busy={loading}>
            {messages.map(msg => (
              <Message key={msg.id} msg={msg} />
            ))}
            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-gray-100 px-3 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] flex gap-2 items-center sm:pb-3">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder="Ask me anything…"
              disabled={loading}
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 disabled:opacity-50 bg-gray-50 placeholder-gray-400"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              aria-label="Send assistant message"
              className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
    </div>,
    document.body,
  ) : null

  return <>
      {panel}
      {!open && <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 sm:bottom-6 sm:right-6">
      <button
        ref={triggerRef}
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
      </div>}
    </>
}
