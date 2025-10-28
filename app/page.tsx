export default function HomePage({ searchParams }: { searchParams: { error?: string, details?: string } }) {
  return (
    <div>
      {searchParams.error && (
        <div style={{ background: '#fee', padding: '1rem', marginBottom: '1rem', borderRadius: '4px' }}>
          <strong>Error:</strong> {searchParams.error}
          {searchParams.details && <p>{searchParams.details}</p>}
        </div>
      )}
      <h1>Skimbox</h1>
      <p>Your X bookmarks, delivered daily.</p>
      <a href="/api/auth/x">Sign in with X</a>
    </div>
  )
}
