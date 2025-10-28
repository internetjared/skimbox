export default function DonePage() {
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        All set!
      </h1>
      
      <p style={{ fontSize: '1.1rem', marginBottom: '2rem', color: '#666' }}>
        You'll start receiving your X bookmarks via email tomorrow morning.
      </p>
      
      <p style={{ fontSize: '0.9rem', color: '#888' }}>
        Check your email for action links to pin, hide, pause, or get more bookmarks.
      </p>
    </div>
  )
}
