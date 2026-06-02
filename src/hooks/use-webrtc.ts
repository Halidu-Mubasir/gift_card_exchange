'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type CallState = 'idle' | 'calling' | 'incoming' | 'active' | 'ended'

interface Signal {
  id: string
  type: string
  payload: string
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

export function useWebRTC(myId: string | undefined, peerId: string | undefined) {
  const [callState, setCallState] = useState<CallState>('idle')
  const [isMuted, setIsMuted] = useState(false)
  const [duration, setDuration] = useState(0) // seconds since call connected

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStateRef = useRef<CallState>('idle')

  // Keep ref in sync
  useEffect(() => { callStateRef.current = callState }, [callState])

  // Ensure a remote audio element exists
  function getRemoteAudio(): HTMLAudioElement {
    if (!remoteAudioRef.current) {
      const audio = new Audio()
      audio.autoplay = true
      remoteAudioRef.current = audio
    }
    return remoteAudioRef.current
  }

  function createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })

    pc.onicecandidate = async (e) => {
      if (e.candidate && peerId) {
        await sendSignal('ice-candidate', JSON.stringify(e.candidate))
      }
    }

    pc.ontrack = (e) => {
      const audio = getRemoteAudio()
      audio.srcObject = e.streams[0]
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'connected') {
        setCallState('active')
        startDuration()
      }
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall(false)
      }
    }

    return pc
  }

  async function sendSignal(type: string, payload: string) {
    if (!peerId) return
    await fetch('/api/call/signal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toId: peerId, type, payload }),
    })
  }

  async function getLocalStream(): Promise<MediaStream> {
    if (localStreamRef.current) return localStreamRef.current
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    localStreamRef.current = stream
    return stream
  }

  function startDuration() {
    setDuration(0)
    if (durationRef.current) clearInterval(durationRef.current)
    durationRef.current = setInterval(() => setDuration(d => d + 1), 1000)
  }

  function stopDuration() {
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null }
    setDuration(0)
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  function cleanup() {
    stopPolling()
    stopDuration()
    if (pcRef.current) { pcRef.current.close(); pcRef.current = null }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop())
      localStreamRef.current = null
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null
    }
  }

  // ── Initiate call ──────────────────────────────────────────────────────────
  const startCall = useCallback(async () => {
    if (!peerId || !myId) return
    try {
      const stream = await getLocalStream()
      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      await sendSignal('offer', JSON.stringify(offer))

      setCallState('calling')
      startPolling()
    } catch (err) {
      console.error('startCall error:', err)
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, myId])

  // ── Accept incoming call ───────────────────────────────────────────────────
  const acceptCall = useCallback(async (offerPayload: string) => {
    if (!peerId) return
    try {
      const stream = await getLocalStream()
      const pc = createPeerConnection()
      pcRef.current = pc
      stream.getTracks().forEach(t => pc.addTrack(t, stream))

      const offer = JSON.parse(offerPayload) as RTCSessionDescriptionInit
      await pc.setRemoteDescription(offer)
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      await sendSignal('answer', JSON.stringify(answer))

      setCallState('active')
      startDuration()
      startPolling()
    } catch (err) {
      console.error('acceptCall error:', err)
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId])

  // ── Decline incoming call ──────────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    await sendSignal('decline', '{}')
    setCallState('idle')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId])

  // ── End active call ────────────────────────────────────────────────────────
  const endCall = useCallback(async (sendHangup = true) => {
    if (sendHangup) await sendSignal('hangup', '{}')
    cleanup()
    setCallState('ended')
    setTimeout(() => setCallState('idle'), 2000)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId])

  // ── Mute toggle ────────────────────────────────────────────────────────────
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = isMuted })
      setIsMuted(m => !m)
    }
  }, [isMuted])

  // ── Signal polling ─────────────────────────────────────────────────────────
  function startPolling() {
    if (pollRef.current) return
    pollRef.current = setInterval(pollSignals, 1500)
  }

  const [pendingOffer, setPendingOffer] = useState<string | null>(null)

  async function pollSignals() {
    if (!peerId) return
    const res = await fetch(`/api/call/signal?peerId=${peerId}`)
    if (!res.ok) return
    const { data } = (await res.json()) as { data: Signal[] }
    if (!data) return

    for (const sig of data) {
      const pc = pcRef.current

      if (sig.type === 'offer') {
        setPendingOffer(sig.payload)
        setCallState('incoming')
        startPolling()
      }

      if (sig.type === 'answer' && pc) {
        const answer = JSON.parse(sig.payload) as RTCSessionDescriptionInit
        if (pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(answer)
        }
      }

      if (sig.type === 'ice-candidate' && pc) {
        try {
          const candidate = JSON.parse(sig.payload) as RTCIceCandidateInit
          if (pc.remoteDescription) await pc.addIceCandidate(candidate)
        } catch { /* ignore */ }
      }

      if (sig.type === 'hangup') {
        cleanup()
        setCallState('ended')
        setTimeout(() => setCallState('idle'), 2000)
      }

      if (sig.type === 'decline') {
        cleanup()
        setCallState('idle')
      }
    }
  }

  // Poll for incoming calls even when idle (so we can show incoming UI)
  useEffect(() => {
    if (!peerId || !myId) return
    const interval = setInterval(async () => {
      if (callStateRef.current !== 'idle') return // already polling in startPolling
      const res = await fetch(`/api/call/signal?peerId=${peerId}`)
      if (!res.ok) return
      const { data } = (await res.json()) as { data: Signal[] }
      if (!data) return
      for (const sig of data) {
        if (sig.type === 'offer') {
          setPendingOffer(sig.payload)
          setCallState('incoming')
          startPolling()
        }
      }
    }, 3000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peerId, myId])

  // Cleanup on unmount
  useEffect(() => () => { cleanup() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    callState,
    isMuted,
    duration,
    pendingOffer,
    startCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute,
  }
}
