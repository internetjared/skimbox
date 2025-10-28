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
    
    if (error) {
      console.error('OAuth error:', error)
      return NextResponse.redirect(new URL('/?error=oauth_denied', request.url))
    }
    
    if (!code || state !== 'skimbox-auth') {
      return NextResponse.redirect(new URL('/?error=invalid_callback', request.url))
    }
    
    // Get code verifier from cookie
    const cookieStore = cookies()
    const codeVerifier = cookieStore.get('code_verifier')?.value
    
    if (!codeVerifier) {
      return NextResponse.redirect(new URL('/?error=missing_verifier', request.url))
    }
    
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier)
    
    // Get user info from X
    const userInfo = await getUserInfo(tokenResponse.access_token)
    
    // Detect timezone from request headers
    const timezone = detectTimezone(request)
    
    // Encrypt access token
    const encryptedToken = encrypt(tokenResponse.access_token)
    
    // Upsert user in database
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
    
    // Clear the code verifier cookie
    cookieStore.delete('code_verifier')
    
    return NextResponse.redirect(new URL('/done', request.url))
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url))
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
