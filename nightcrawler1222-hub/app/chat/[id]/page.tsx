// app/chat/[id]/page.js
export default function ChatRoom() {
  return (
    <div style={{
      background: '#0f0f0f',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      textAlign: 'center',
      padding: '100px 20px',
      minHeight: '100vh'
    }}>
      <h1 style={{
        fontSize: '3rem',
        color: '#00ff88',
        marginBottom: '20px'
      }}>
        🔒 Private Chat
      </h1>
      <p style={{
        fontSize: '1.5rem',
        color: '#ccc',
        marginBottom: '10px'
      }}>
        You're in a secure chat with nightcrawler1222.
      </p>
      <p style={{ color: '#666' }}>
        I’ll join you shortly for your R6 coaching session.
      </p>
    </div>
  );
}