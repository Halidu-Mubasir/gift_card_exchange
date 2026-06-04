'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useWebRTC } from '@/hooks/use-webrtc'

interface Conversation {
  partner: { id: string; name: string; role: string; email: string }
  lastMessage: { content: string; createdAt: string; senderId: string } | null
  unreadCount: number
}

interface Message {
  id: string
  content: string
  createdAt: string
  senderId: string
  sender: { id: string; name: string; role: string }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface Admin {
  id: string
  name: string
  email: string
  role: string
}

export default function SellerMessagesPage() {
  const { data: session } = useSession()
  const myId = session?.user?.id

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(undefined)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [mobileShowChat, setMobileShowChat] = useState(false)
  const [showNewMsgModal, setShowNewMsgModal] = useState(false)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [adminSearch, setAdminSearch] = useState('')

  const bottomRef = useRef<HTMLDivElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Ref mirrors selectedAdminId so callbacks always read the current value (avoids stale closures)
  const selectedAdminIdRef = useRef<string | undefined>(undefined)

  const { callState, isMuted, duration, pendingOffer, startCall, acceptCall, declineCall, endCall, toggleMute } =
    useWebRTC(myId, selectedAdminId)

  // ── Step 1: Restore selectedAdminId from URL on mount ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlWith = params.get('with')
    if (urlWith && !selectedAdminIdRef.current) {
      selectedAdminIdRef.current = urlWith
      setSelectedAdminId(urlWith)
    }
  }, [])

  // ── Step 2: Persist selectedAdminId to URL whenever it changes ─────────
  useEffect(() => {
    if (!selectedAdminId) return
    const url = new URL(window.location.href)
    if (url.searchParams.get('with') !== selectedAdminId) {
      url.searchParams.set('with', selectedAdminId)
      window.history.replaceState({}, '', url.toString())
    }
  }, [selectedAdminId])

  // ── Step 3: Load conversation list ─────────────────────────────────────
  function loadConversations() {
    fetch('/api/messages')
      .then(r => r.json())
      .then(d => {
        if (!d.success) return
        setConversations(d.data)
        // Auto-select: prefer the URL-restored ID, then fall back to first conversation
        if (!selectedAdminIdRef.current && d.data.length > 0) {
          const first = (d.data as Conversation[])[0]
          selectedAdminIdRef.current = first.partner.id
          setSelectedAdminId(first.partner.id)
        }
      })
      .catch(err => console.error('[messages] loadConversations failed', err))
  }

  useEffect(() => {
    loadConversations()
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  // ── Step 4: Fetch + poll messages whenever selectedAdminId is set ──────
  // Fetch is defined INSIDE the effect so selectedAdminId is never stale in the interval
  useEffect(() => {
    if (!selectedAdminId) return
    selectedAdminIdRef.current = selectedAdminId

    let active = true

    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages/conversation?with=${selectedAdminId}`)
        if (!res.ok) {
          console.error('[messages] conversation fetch failed:', res.status, await res.text())
          return
        }
        const d = await res.json()
        if (active && d.success) setMessages(d.data)
      } catch (err) {
        console.error('[messages] fetchMessages error', err)
      }
    }

    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([])
    setLoadingMsgs(true)
    fetchMessages().finally(() => { if (active) setLoadingMsgs(false) })
    pollRef.current = setInterval(fetchMessages, 4000)

    return () => {
      active = false
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [selectedAdminId])

  // ── Scroll to bottom on every messages update ───────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Open new message modal ─────────────────────────────────────────────
  async function openNewMsgModal() {
    const res = await fetch('/api/users?role=ADMIN')
    const d = await res.json()
    if (d.success) setAdmins(d.data)
    setShowNewMsgModal(true)
  }

  // ── Select admin to message ────────────────────────────────────────────
  function selectAdmin(admin: Admin) {
    selectedAdminIdRef.current = admin.id
    setSelectedAdminId(admin.id)
    setShowNewMsgModal(false)
    setMobileShowChat(true)
  }

  // ── Select existing conversation ───────────────────────────────────────
  function selectConversation(conv: Conversation) {
    selectedAdminIdRef.current = conv.partner.id
    setSelectedAdminId(conv.partner.id)
    setMobileShowChat(true)
  }

  // ── Send a message ──────────────────────────────────────────────────────
  async function sendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim() || !selectedAdminId || sending) return
    setSending(true)
    const content = text.trim()
    setText('')
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: selectedAdminId, content }),
      })
      const d = await res.json()
      if (d.success) {
        // Optimistic: append the new message immediately, polling will reconcile
        setMessages(prev => [...prev, d.data])
        loadConversations()
      } else {
        toast.error(d.error ?? 'Failed to send message')
        setText(content)
      }
    } catch {
      toast.error('Failed to send message')
      setText(content)
    } finally { setSending(false) }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(e as unknown as React.FormEvent) }
  }

  function handleTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 128) + 'px'
  }

  // Group messages by calendar date for the date dividers
  const grouped: { date: string; msgs: Message[] }[] = []
  for (const msg of messages) {
    const date = formatDate(msg.createdAt)
    const last = grouped[grouped.length - 1]
    if (last && last.date === date) last.msgs.push(msg)
    else grouped.push({ date, msgs: [msg] })
  }

  const selectedConv = conversations.find(c => c.partner.id === selectedAdminId)

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(adminSearch.toLowerCase())
  )

  return (
    <div className="flex h-[calc(100vh-80px)] -mx-4 -my-6 md:-mx-8 md:-my-8 overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── New Message Modal ───────────────────────────────────────────── */}
      {showNewMsgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl w-96 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '16px', color: '#1e1b4b' }}>New Message</h3>
              <button onClick={() => setShowNewMsgModal(false)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
            </div>
            <div className="p-4">
              <input
                type="text"
                placeholder="Search admins…"
                value={adminSearch}
                onChange={e => setAdminSearch(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none focus:border-indigo-400"
                style={{ borderColor: '#e5e7eb', fontFamily: 'Inter, sans-serif', color: '#1c1b1b' }}
              />
            </div>
            <div className="max-h-72 overflow-y-auto pb-2">
              {filteredAdmins.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-400">No admins found</p>
              ) : filteredAdmins.map(a => (
                <button
                  key={a.id}
                  onClick={() => selectAdmin(a)}
                  className="w-full flex items-center gap-3 px-6 py-3 hover:bg-indigo-50 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#4b0082' }}>
                    {initials(a.name)}
                  </div>
                  <div className="min-w-0">
                    <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px', color: '#1e1b4b' }} className="truncate">{a.name}</p>
                    <p style={{ fontSize: '12px', color: '#7d7483' }} className="truncate">{a.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Incoming call overlay ───────────────────────────────────────── */}
      {callState === 'incoming' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-2xl p-8 w-80 flex flex-col items-center gap-6 shadow-2xl">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: '#4b0082' }}>
              {selectedConv ? initials(selectedConv.partner.name) : 'AD'}
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '18px', color: '#1e1b4b' }}>Incoming Call</p>
              <p style={{ fontSize: '13px', color: '#7d7483' }}>{selectedConv?.partner.name ?? 'Admin'} · Trade Nest Support</p>
            </div>
            <div className="flex gap-4">
              <button onClick={declineCall} className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: '#ba1a1a' }}>✕</button>
              <button onClick={() => pendingOffer && acceptCall(pendingOffer)} className="w-14 h-14 rounded-full flex items-center justify-center text-white text-2xl transition-all hover:scale-105 active:scale-95" style={{ backgroundColor: '#006e2a' }}>✆</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Active call bar ─────────────────────────────────────────────── */}
      {(callState === 'active' || callState === 'calling') && (
        <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 text-white" style={{ backgroundColor: '#1e1b4b' }}>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '14px' }}>
              {callState === 'calling' ? 'Calling…' : `Call · ${formatDuration(duration)}`}
            </span>
          </div>
          <div className="flex gap-3">
            <button onClick={toggleMute} className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all" style={{ backgroundColor: isMuted ? '#ba1a1a' : 'rgba(255,255,255,0.15)' }}>
              {isMuted ? '🔇 Muted' : '🎤 Mute'}
            </button>
            <button onClick={() => endCall()} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-700 transition-all">End Call</button>
          </div>
        </div>
      )}

      {/* ── Left Panel: Conversations ──────────────────────────────────── */}
      <aside
        className={`w-full md:w-72 border-r bg-white flex flex-col flex-shrink-0 ${mobileShowChat ? 'hidden md:flex' : 'flex'}`}
        style={{ borderColor: '#f1f5f9' }}
      >
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Messages</h2>
            <p style={{ fontSize: '12px', color: '#7d7483' }}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</p>
          </div>
          <button
            onClick={openNewMsgModal}
            className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:bg-indigo-100"
            style={{ backgroundColor: '#eff6ff', color: '#4b0082', fontFamily: 'Manrope, sans-serif' }}
          >
            + New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 px-6 text-center">
              <span style={{ fontSize: '32px' }}>💬</span>
              <p style={{ fontSize: '13px', color: '#7d7483', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>No conversations yet</p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>Click &ldquo;+ New&rdquo; to message support</p>
              <button
                onClick={openNewMsgModal}
                className="mt-2 px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif' }}
              >
                Start Chat
              </button>
            </div>
          ) : (
            conversations.map(conv => {
              const isActive = conv.partner.id === selectedAdminId
              return (
                <div
                  key={conv.partner.id}
                  onClick={() => selectConversation(conv)}
                  className="px-5 py-4 cursor-pointer transition-colors"
                  style={{
                    backgroundColor: isActive ? 'rgba(238,242,255,0.6)' : 'white',
                    borderRight: isActive ? '4px solid #1e1b4b' : '4px solid transparent',
                    borderBottom: '1px solid #f9fafb',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#4b0082' }}>
                      {initials(conv.partner.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <span style={{ fontFamily: 'Manrope, sans-serif', fontSize: '14px', fontWeight: 700, color: isActive ? '#1e1b4b' : '#374151' }} className="truncate">
                          {conv.partner.name}
                        </span>
                        {conv.lastMessage && (
                          <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600, flexShrink: 0, marginLeft: '8px' }}>
                            {timeAgo(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: '#7d7483' }} className="truncate">
                        {conv.lastMessage?.content ?? 'Start chatting'}
                      </p>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white flex-shrink-0" style={{ backgroundColor: '#ba1a1a' }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ── Right Panel: Chat ──────────────────────────────────────────── */}
      <section className={`flex-1 flex flex-col bg-white min-w-0 ${!mobileShowChat ? 'hidden md:flex' : 'flex'}`}>
        {!selectedAdminId ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4" style={{ backgroundColor: '#fcf9f8' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
              <span style={{ fontSize: '32px' }}>💬</span>
            </div>
            <div className="text-center">
              <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Chat with Support</p>
              <p style={{ fontSize: '13px', color: '#7d7483', marginTop: '4px' }}>Select a conversation or start a new one.</p>
            </div>
            <button
              onClick={openNewMsgModal}
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
            >
              New Message
            </button>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 flex items-center justify-between bg-white" style={{ borderBottom: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-center gap-4 min-w-0">
                <button onClick={() => setMobileShowChat(false)} className="md:hidden p-1 -ml-1 text-slate-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: '#4b0082' }}>
                  {selectedConv ? initials(selectedConv.partner.name) : 'AD'}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold truncate" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', color: '#1c1b1b' }}>
                    {selectedConv?.partner.name ?? 'Trade Nest Support'}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: '#22c55e' }} />
                    <span style={{ fontSize: '12px', color: '#7d7483', fontWeight: 600 }}>
                      {selectedConv?.partner.email ?? 'Support Team'} · Online
                    </span>
                  </div>
                </div>
              </div>
              {callState === 'idle' && (
                <button
                  onClick={startCall}
                  className="p-2.5 rounded-xl transition-all hover:bg-indigo-50 active:scale-95"
                  style={{ backgroundColor: '#f5f3ff', color: '#4b0082' }}
                  title="Voice call"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
              )}
              {callState === 'ended' && (
                <span style={{ fontSize: '12px', color: '#7d7483', fontWeight: 600 }}>Call ended</span>
              )}
            </div>

            {/* Messages Canvas */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ backgroundColor: '#fcf9f8' }}>
              {loadingMsgs ? (
                <div className="flex items-center justify-center py-12">
                  <span className="w-5 h-5 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <span style={{ fontSize: '40px' }}>👋</span>
                  <p style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', fontWeight: 600, color: '#1e1b4b' }}>Start the conversation</p>
                  <p style={{ fontSize: '13px', color: '#7d7483', textAlign: 'center', maxWidth: '280px' }}>
                    Send a message to the support team. We typically respond within minutes.
                  </p>
                </div>
              ) : (
                grouped.map(({ date, msgs }) => (
                  <div key={date} className="space-y-4">
                    <div className="flex justify-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white px-4 py-1 rounded-full border border-gray-100"
                        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {date}
                      </span>
                    </div>
                    {msgs.map((msg, i) => {
                      const isMine = !!myId && msg.senderId === myId
                      const showAvatar = !isMine && (i === 0 || msgs[i - 1]?.senderId === myId || msgs[i - 1]?.senderId !== msg.senderId)
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                          {!isMine && showAvatar && (
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] text-white font-bold" style={{ backgroundColor: '#1e1b4b' }}>
                                {msg.sender.name.slice(0, 1).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#374151' }}>{msg.sender.name} (Support)</span>
                            </div>
                          )}
                          <div
                            className={`max-w-[70%] p-4 shadow-sm ${isMine ? 'rounded-2xl rounded-tr-none' : 'rounded-2xl rounded-tl-none'}`}
                            style={isMine
                              ? { backgroundColor: '#4b0082', color: 'white', boxShadow: '0 2px 8px rgba(75,0,130,0.2)' }
                              : { backgroundColor: 'white', color: '#1c1b1b', border: '1px solid #e0e7ff' }
                            }
                          >
                            <p style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{msg.content}</p>
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? '' : 'ml-9'}`}>
                            <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>{formatTime(msg.createdAt)}</span>
                            {isMine && <span style={{ fontSize: '12px', color: '#a78bfa' }}>✓✓</span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-white" style={{ borderTop: '1px solid #f1f5f9' }}>
              <form onSubmit={sendMessage}>
                <div className="flex items-end gap-3 rounded-2xl p-2" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e5e7eb' }}>
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Write a message…"
                    rows={1}
                    className="flex-1 bg-transparent outline-none resize-none py-2.5 text-sm"
                    style={{ fontFamily: 'Inter, sans-serif', color: '#1c1b1b', minHeight: '44px', maxHeight: '128px' }}
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || sending}
                    className="mb-1 flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-40"
                    style={{ backgroundColor: '#4b0082', color: 'white', boxShadow: '0 2px 8px rgba(75,0,130,0.3)' }}
                  >
                    {sending ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" /></svg>
                    )}
                  </button>
                </div>
                <p className="flex items-center gap-1.5 mt-2" style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 600 }}>
                  <span>🔒</span> Messages are encrypted and secure · Enter to send
                </p>
              </form>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
