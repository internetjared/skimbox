import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Starts OAuth 2.0 PKCE flow with X
 * Generates code verifier and challenge, redirects to X
 */
export async function GET(request: NextRequest) {
  try {
    // Generate PKCE code verifier and challenge
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    
    // Store code verifier in secure cookie
    const cookieStore = cookies()
    cookieStore.set('code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    })
    
    // Build X OAuth URL
    const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('client_id', process.env.X_CLIENT_ID!)
    authUrl.searchParams.set('redirect_uri', process.env.X_REDIRECT_URI!)
    authUrl.searchParams.set('scope', 'tweet.read users.read bookmark.read')
    authUrl.searchParams.set('state', 'skimbox-auth')
    authUrl.searchParams.set('code_challenge', codeChallenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('OAuth start error:', error)
    return NextResponse.redirect(new URL('/?error=oauth_start_failed', request.url))
  }
}

/**
 * Generates a random code verifier for PKCE
 */
function generateCodeVerifier(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  for (let i = 0; i < 128; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Generates SHA256 code challenge from verifier
 */
async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}
