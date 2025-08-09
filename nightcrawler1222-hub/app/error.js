'use client'

export default function Error({ error, reset }) {
  return (
    <div style={{
      background: '#0f0f0f', color: 'white', minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16, textAlign: 'center', padding: 24
    }}>
      <h1 style={{ color: '#00ff88', fontSize: '2rem', margin: 0 }}>Something went wrong</h1>
      <p style={{ color: '#aaa' }}>{error?.message || 'An unexpected error occurred.'}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={() => location.reload()} style={buttonStyle}>Reload</button>
        {reset && (
          <button onClick={() => reset()} style={{ ...buttonStyle, background: '#2563eb' }}>Try Again</button>
        )}
      </div>
    </div>
  )
}

const buttonStyle = {
  background: '#00ff88',
  color: '#000',
  padding: '10px 18px',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  fontWeight: 700
}