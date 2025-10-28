import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: '1.6'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        Skimbox
      </h1>
      
      <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
        Your X bookmarks, delivered daily. Plain text emails with 5-10 bookmarks, 
        one-tap actions to pin, hide, pause, or get more.
      </p>
      
      <p style={{ marginBottom: '2rem' }}>
        No dashboard, no clutter. Just your bookmarks when you need them.
      </p>
      
      <Link 
        href="/api/auth/x"
        style={{
          display: 'inline-block',
          backgroundColor: '#1da1f2',
          color: 'white',
          padding: '12px 24px',
          textDecoration: 'none',
          borderRadius: '6px',
          fontWeight: '500'
        }}
      >
        Sign in with X
      </Link>
      
      <div style={{ marginTop: '3rem', fontSize: '0.9rem', color: '#888' }}>
        <p>We respect X's policy. We store only tweet IDs and minimal metadata.</p>
        <p>Full tweet content is fetched fresh when sending emails.</p>
      </div>
    </div>
  )
}
