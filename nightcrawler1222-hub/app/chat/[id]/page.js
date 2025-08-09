'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import sodium from 'libsodium-wrappers'
import { db } from '../../../lib/firebase'
import { onValue, push, ref, set, get, child, update } from 'firebase/database'

export default function ChatRoom() {
  const params = useParams()
  const searchParams = useSearchParams()
  const roomId = params?.id
  const role = (searchParams?.get('role') === 'coach') ? 'coach' : 'user'

  const [sodiumReady, setSodiumReady] = useState(false)
  const [joined, setJoined] = useState(role === 'coach')
  const [displayName, setDisplayName] = useState('')
  const [inputValue, setInputValue] = useState('')
  const [messages, setMessages] = useState([])
  const [sessionKey, setSessionKey] = useState(null) // Uint8Array
  const [timerStart, setTimerStart] = useState(null)
  const [ended, setEnded] = useState(false)
  const [durationMinutes, setDurationMinutes] = useState(deriveDurationFromRoomId(roomId))
  const [hasAlerted, setHasAlerted] = useState(false)

  const endRef = useRef(null)

  // Prepare sodium
  useEffect(() => {
    let active = true
    ;(async () => {
      await sodium.ready
      if (active) setSodiumReady(true)
    })()
    return () => { active = false }
  }, [])

  // Derive envelope key for storing session key
  const envelopeKey = useMemo(() => {
    if (!sodiumReady) return null
    const salt = process.env.NEXT_PUBLIC_SESSION_SALT || 'please-set-env-salt'
    const data = new TextEncoder().encode(`${roomId}:${salt}`)
    return sodium.crypto_generichash(32, data)
  }, [sodiumReady, roomId])

  // Load session envelope and room meta
  useEffect(() => {
    if (!roomId || !sodiumReady) return

    const roomRef = ref(db, `rooms/${roomId}`)

    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val() || {}
      // Handle timer and ended state
      if (data.timerStart) setTimerStart(data.timerStart)
      if (typeof data.ended === 'boolean') setEnded(data.ended)
      if (data.durationMinutes) setDurationMinutes(data.durationMinutes)

      // Decrypt session key if present
      if (data.sessionKey && envelopeKey) {
        try {
          const packed = fromBase64(data.sessionKey)
          const nonce = packed.slice(0, 24)
          const cipher = packed.slice(24)
          const sk = sodium.crypto_secretbox_open_easy(cipher, nonce, envelopeKey)
          setSessionKey(sk)
        } catch (e) {
          // ignore corrupt until available
        }
      }
    })

    return () => unsub()
  }, [roomId, sodiumReady, envelopeKey])

  // Load and decrypt messages
  useEffect(() => {
    if (!roomId) return
    const messagesRef = ref(db, `rooms/${roomId}/messages`)
    const unsub = onValue(messagesRef, (snap) => {
      const data = snap.val() || {}
      const list = Object.entries(data)
        .map(([id, m]) => ({ id, ...m }))
        .sort((a, b) => (a.ts || 0) - (b.ts || 0))
      setMessages(list)
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    })
    return () => unsub()
  }, [roomId])

  // Session end alert
  const remainingMs = useRemainingMs(timerStart, durationMinutes, ended)
  useEffect(() => {
    if (remainingMs <= 0 && !hasAlerted && (timerStart || ended)) {
      setHasAlerted(true)
      alert('Chat session ended.')
    }
  }, [remainingMs, hasAlerted, timerStart, ended])

  async function ensureSessionKeyExists() {
    if (!sodiumReady || !envelopeKey) return null
    if (sessionKey) return sessionKey
    // Try to read again from DB
    const roomSnap = await get(ref(db, `rooms/${roomId}`))
    const roomData = roomSnap.val() || {}
    if (roomData.sessionKey) {
      try {
        const packed = fromBase64(roomData.sessionKey)
        const nonce = packed.slice(0, 24)
        const cipher = packed.slice(24)
        const sk = sodium.crypto_secretbox_open_easy(cipher, nonce, envelopeKey)
        setSessionKey(sk)
        return sk
      } catch {}
    }
    // Generate new
    const sk = sodium.crypto_secretbox_keygen()
    const nonce = sodium.randombytes_buf(24)
    const cipher = sodium.crypto_secretbox_easy(sk, nonce, envelopeKey)
    await update(ref(db, `rooms/${roomId}`), {
      sessionKey: toBase64(concatUint8(nonce, cipher)),
      durationMinutes: durationMinutes,
    })
    setSessionKey(sk)
    return sk
  }

  async function handleSend() {
    if (!inputValue.trim() || ended) return
    const sk = await ensureSessionKeyExists()
    if (!sk) return

    const nonce = sodium.randombytes_buf(24)
    const messageBytes = new TextEncoder().encode(inputValue.trim())
    const cipher = sodium.crypto_secretbox_easy(messageBytes, nonce, sk)

    const payload = {
      sender: role,
      nonce: toBase64(nonce),
      ciphertext: toBase64(cipher),
      ts: Date.now(),
      name: role === 'coach' ? 'nightcrawler1222' : (displayName || 'user')
    }

    const messagesRef = ref(db, `rooms/${roomId}/messages`)
    await set(push(messagesRef), payload)

    // Start timer on first coach message
    if (role === 'coach') {
      const roomSnap = await get(ref(db, `rooms/${roomId}`))
      const data = roomSnap.val() || {}
      if (!data.timerStart) {
        await update(ref(db, `rooms/${roomId}`), { timerStart: Date.now() })
      }
    }

    setInputValue('')
  }

  function renderMessage(m) {
    const isCoach = m.sender === 'coach'
    let text = '…'
    try {
      if (sessionKey && m.nonce && m.ciphertext) {
        const nonce = fromBase64(m.nonce)
        const cipher = fromBase64(m.ciphertext)
        const plain = sodium.crypto_secretbox_open_easy(cipher, nonce, sessionKey)
        text = new TextDecoder().decode(plain)
      }
    } catch {
      text = '[unable to decrypt]'
    }

    const bubbleStyle = isCoach ? coachBubble : userBubble
    const alignStyle = { alignSelf: isCoach ? 'flex-end' : 'flex-start' }

    return (
      <div key={m.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, ...alignStyle }}>
        <div style={{ fontSize: 12, color: '#888', margin: isCoach ? '0 8px 2px auto' : '0 auto 2px 8px' }}>
          {m.name || (isCoach ? 'coach' : 'user')}
        </div>
        <div style={{ ...bubbleStyle }}>
          {text}
        </div>
      </div>
    )
  }

  async function handleEndChat() {
    await update(ref(db, `rooms/${roomId}`), { ended: true })
  }

  if (!roomId) return null

  // Join screen for users
  if (!joined) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>🔒 Private Chat</h1>
        <p style={subtitleStyle}>Enter your Discord tag or username to join.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 12 }}>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Discord tag or username"
            style={inputStyle}
          />
          <button
            onClick={() => setJoined(true)}
            style={{ ...buttonStyle, background: '#00ff88', color: '#000' }}
            disabled={!displayName.trim()}
          >
            Join Chat
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={titleStyle}>🔒 Private Chat</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <TimerBadge remainingMs={remainingMs} />
          {role === 'coach' && (
            <button onClick={handleEndChat} style={{ ...buttonStyle, background: '#ef4444' }}>End Chat</button>
          )}
        </div>
      </header>

      <div style={chatBox}>
        {messages.map(renderMessage)}
        <div ref={endRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={ended || remainingMs <= 0 ? 'Chat ended' : 'Type your message'}
          style={{ ...inputStyle, flex: 1, opacity: ended || remainingMs <= 0 ? 0.6 : 1 }}
          disabled={ended || remainingMs <= 0}
        />
        <button onClick={handleSend} style={buttonStyle} disabled={ended || remainingMs <= 0 || !inputValue.trim()}>
          Send
        </button>
      </div>

      <footer style={{ marginTop: 32, color: '#666', fontSize: 12 }}>
        When the coach sends the first message, the session timer begins.
      </footer>
    </div>
  )
}

function TimerBadge({ remainingMs }) {
  if (!remainingMs || remainingMs <= 0) return (
    <div style={{ color: '#ef4444', fontWeight: 700 }}>⏱️ Session ended</div>
  )
  const mm = Math.floor(remainingMs / 60000)
  const ss = Math.floor((remainingMs % 60000) / 1000)
  const text = `${String(mm)}:${String(ss).padStart(2, '0')}`
  return (
    <div style={{ color: '#ccc' }}>⏱️ Session ends in: {text}</div>
  )
}

function useRemainingMs(timerStart, durationMinutes, ended) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!timerStart || ended) return ended ? 0 : null
  const end = timerStart + (durationMinutes || 5) * 60_000
  return Math.max(0, end - now)
}

function deriveDurationFromRoomId(roomId) {
  if (!roomId) return 5
  const id = String(roomId).toLowerCase()
  if (id.includes('20')) return 20
  if (id.includes('5')) return 5
  return 5
}

// Styles
const containerStyle = {
  background: '#0f0f0f',
  color: 'white',
  fontFamily: 'Arial, sans-serif',
  padding: '20px',
  minHeight: '100vh',
  maxWidth: 900,
  margin: '0 auto'
}

const titleStyle = { fontSize: '1.6rem', color: '#00ff88', margin: 0 }
const subtitleStyle = { color: '#aaa', marginTop: 8 }

const chatBox = {
  background: '#111',
  border: '1px solid #222',
  borderRadius: 12,
  padding: 16,
  minHeight: 420,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  overflowY: 'auto'
}

const inputStyle = {
  background: '#1a1a1a',
  color: 'white',
  border: '1px solid #333',
  borderRadius: 10,
  padding: '12px 14px',
  outline: 'none'
}

const buttonStyle = {
  background: '#2563eb',
  color: 'white',
  border: 'none',
  borderRadius: 10,
  padding: '12px 16px',
  fontWeight: 700,
  cursor: 'pointer'
}

const userBubble = {
  background: '#333',
  padding: '10px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  color: '#fff'
}

const coachBubble = {
  background: '#2563eb',
  padding: '10px 12px',
  borderRadius: 12,
  maxWidth: '70%',
  color: '#fff'
}

// helpers
function toBase64(u8) {
  if (typeof window === 'undefined') return ''
  return btoa(String.fromCharCode(...u8))
}
function fromBase64(b64) {
  if (typeof window === 'undefined') return new Uint8Array()
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
function concatUint8(a, b) {
  const out = new Uint8Array(a.length + b.length)
  out.set(a, 0)
  out.set(b, a.length)
  return out
}