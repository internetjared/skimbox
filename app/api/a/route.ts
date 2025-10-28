import { NextRequest, NextResponse } from 'next/server'
import { verify } from '@/lib/sign'
import { recordSend, pauseUser, snoozeUser, getDecryptedToken } from '@/lib/store'
import { pickForSend } from '@/lib/select'
import { fetchTweetDetails } from '@/lib/x'
import { composeEmail } from '@/lib/email'
import { sendEmail } from '@/lib/mailer'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Magic action endpoint for handling email actions
 * Verifies HMAC signatures and processes pin, hide, pause, snooze, more, open actions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract parameters
    const userId = searchParams.get('u')
    const token = searchParams.get('t')
    const action = searchParams.get('act')
    const tweetId = searchParams.get('id')
    const signature = searchParams.get('sig')
    
    // Validate required parameters
    if (!userId || !token || !action || !signature) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }
    
    // Recreate payload for signature verification (fixed order)
    const params = new URLSearchParams()
    params.set('u', userId)
    params.set('t', token)
    params.set('act', action)
    if (tweetId) {
      params.set('id', tweetId)
    }
    
    const payload = params.toString()
    
    // Verify signature
    if (!verify(payload, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // Validate action type
    const validActions = ['pin', 'hide', 'pause', 'snooze', 'more', 'open']
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
    
    // Get user to verify they exist and are active
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, active: true, xAccessToken: true, xUserId: true }
    })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (!user.active) {
      return NextResponse.json({ error: 'User is paused' }, { status: 403 })
    }
    
    // Handle different actions
    switch (action) {
      case 'pin':
      case 'hide':
      case 'open':
        if (!tweetId) {
          return NextResponse.json({ error: 'Tweet ID required for this action' }, { status: 400 })
        }
        await recordSend(userId, tweetId, action as 'pin' | 'hide' | 'open')
        return new NextResponse(null, { status: 204 })
        
      case 'pause':
        await pauseUser(userId)
        return new NextResponse(null, { status: 204 })
        
      case 'snooze':
        await snoozeUser(userId)
        return new NextResponse(null, { status: 204 })
        
      case 'more':
        await handleMoreAction(userId, user.email, user.xAccessToken, user.xUserId)
        return new NextResponse(null, { status: 204 })
        
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Action endpoint error:', error)
    return NextResponse.json(
      { error: 'Action failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Handles the 'more' action by sending 3 additional bookmarks immediately
 */
async function handleMoreAction(
  userId: string,
  userEmail: string,
  encryptedToken: string,
  xUserId: string
): Promise<void> {
  try {
    // Get decrypted access token
    const accessToken = getDecryptedToken(encryptedToken)
    
    // Pick 3 additional bookmarks
    const selectedTweetIds = await pickForSend(userId, 3)
    
    if (selectedTweetIds.length === 0) {
      // Send a "no more bookmarks" email
      await sendEmail({
        to: userEmail,
        subject: 'Skimbox - No more bookmarks',
        body: 'You\'ve seen all your available bookmarks! Check back tomorrow for new ones.'
      })
      return
    }
    
    // Fetch full tweet details
    const selectedBookmarks = await fetchTweetDetails(accessToken, selectedTweetIds)
    
    // Compose email
    const { subject, body } = composeEmail({
      bookmarks: selectedBookmarks,
      userId,
      userEmail
    })
    
    // Send email
    await sendEmail({
      to: userEmail,
      subject: `More ${subject}`,
      body
    })
    
    // Record sends
    for (const tweetId of selectedTweetIds) {
      await recordSend(userId, tweetId, 'more')
    }
  } catch (error) {
    console.error('More action error:', error)
    throw error
  }
}
