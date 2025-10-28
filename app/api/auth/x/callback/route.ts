import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { exchangeCodeForToken, getUserInfo } from '@/lib/x'
import { encrypt } from '@/lib/crypto'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Completes OAuth 2.0 PKCE flow with X
 * Exchanges code for token, creates/updates user, redirects to done page
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    
    // Log each step
    console.log('OAuth callback started')
    console.log('Code received:', code ? 'yes' : 'no')
    console.log('State valid:', state === 'skimbox-auth')
    console.log('Error param:', error || 'none')
    
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/?error=oauth_denied', request.url))
    }
    
    if (!code || state !== 'skimbox-auth') {
      console.error('Invalid callback params:', { code: !!code, state })
      return NextResponse.redirect(new URL('/?error=invalid_callback', request.url))
    }
    
    // Get code verifier from cookie
    const cookieStore = cookies()
    const codeVerifier = cookieStore.get('code_verifier')?.value
    
    console.log('Code verifier:', codeVerifier ? 'found' : 'missing')
    console.log('Code verifier length:', codeVerifier?.length || 0)
    console.log('All cookies:', cookieStore.getAll().map(c => c.name))
    
    if (!codeVerifier) {
      return NextResponse.redirect(new URL('/?error=missing_verifier', request.url))
    }
    
    // Exchange code for access token
    console.log('Exchanging code for token...')
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    console.log('Token exchange successful')
    
    // Get user info from X
    console.log('Getting user info...')
    const userInfo = await getUserInfo(tokenResponse.access_token)
    console.log('User info:', userInfo.id, userInfo.username)
    
    // Detect timezone from request headers
    const timezone = detectTimezone(request)
    
    // Encrypt access token
    console.log('Encrypting token...')
    const encryptedToken = encrypt(tokenResponse.access_token)
    
    // Upsert user in database
    console.log('Saving user to database...')
    await prisma.user.upsert({
      where: { xUserId: userInfo.id },
      update: {
        email: userInfo.email || `${userInfo.username}@x.local`,
        xAccessToken: encryptedToken,
        active: true
      },
      create: {
        email: userInfo.email || `${userInfo.username}@x.local`,
        xUserId: userInfo.id,
        xAccessToken: encryptedToken,
        tz: timezone,
        sendCountDefault: 5
      }
    })
    
    console.log('User saved successfully')
    
    // Clear the code verifier cookie
    cookieStore.delete('code_verifier')
    
    return NextResponse.redirect(new URL('/done', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    // Log the full error details
    console.error('Error details:', error instanceof Error ? error.message : error)
    return NextResponse.redirect(new URL(`/?error=callback_failed&details=${encodeURIComponent(error instanceof Error ? error.message : String(error))}`, request.url))
  }
}

/**
 * Detects user timezone from request headers
 * Falls back to America/New_York if detection fails
 */
function detectTimezone(request: NextRequest): string {
  // Try to get timezone from Accept-Language header or other sources
  const acceptLanguage = request.headers.get('accept-language')
  
  // Simple heuristic: if user is likely in Europe, use Europe/London
  if (acceptLanguage?.includes('en-GB') || acceptLanguage?.includes('en-EU')) {
    return 'Europe/London'
  }
  
  // Default to Eastern Time
  return 'America/New_York'
}
