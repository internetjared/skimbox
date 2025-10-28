export default function NotFound() {
  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '0 auto', 
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      textAlign: 'center'
    }}>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" style={{ color: '#1da1f2' }}>Go back home</a>
    </div>
  )
}
