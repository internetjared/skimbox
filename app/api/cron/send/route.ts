import { NextRequest, NextResponse } from 'next/server'
import { fetchBookmarks, fetchTweetDetails } from '@/lib/x'
import { pickForSend } from '@/lib/select'
import { composeEmail } from '@/lib/email'
import { sendEmail } from '@/lib/mailer'
import { 
  getActiveUsers, 
  upsertBookmarks, 
  recordSend, 
  getLastSendDate,
  isUserSnoozedToday,
  getDecryptedToken
} from '@/lib/store'
import { isNewDayForUser } from '@/lib/time'

/**
 * Daily cron job that sends bookmarks to all active users
 * Idempotent: only sends once per calendar day per user
 */
export async function POST(request: NextRequest) {
  try {
    // Verify this is a cron request (optional security check)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const results = {
      processed: 0,
      sent: 0,
      skipped: 0,
      errors: 0,
      details: [] as Array<{
        userId: string
        email: string
        status: 'sent' | 'skipped' | 'error'
        reason?: string
        bookmarkCount?: number
      }>
    }
    
    // Get all active users
    const users = await getActiveUsers()
    results.processed = users.length
    
    for (const user of users) {
      try {
        // Check if user is snoozed today
        if (await isUserSnoozedToday(user.id)) {
          results.skipped++
          results.details.push({
            userId: user.id,
            email: user.email,
            status: 'skipped',
            reason: 'User snoozed today'
          })
          continue
        }
        
        // Check if we already sent today (idempotency)
        const lastSendDate = await getLastSendDate(user.id)
        if (!isNewDayForUser(user.tz, lastSendDate)) {
          results.skipped++
          results.details.push({
            userId: user.id,
            email: user.email,
            status: 'skipped',
            reason: 'Already sent today'
          })
          continue
        }
        
        // Get decrypted access token
        const accessToken = getDecryptedToken(user.xAccessToken)
        
        // Fetch latest bookmarks from X
        const bookmarks = await fetchBookmarks(accessToken, user.xUserId)
        
        // Upsert bookmarks to database
        await upsertBookmarks(user.id, bookmarks)
        
        // Pick bookmarks for sending
        const selectedTweetIds = await pickForSend(user.id, user.sendCountDefault)
        
        if (selectedTweetIds.length === 0) {
          results.skipped++
          results.details.push({
            userId: user.id,
            email: user.email,
            status: 'skipped',
            reason: 'No bookmarks available'
          })
          continue
        }
        
        // Fetch full tweet details for selected bookmarks
        const selectedBookmarks = await fetchTweetDetails(accessToken, selectedTweetIds)
        
        // Compose email
        const { subject, body } = composeEmail({
          bookmarks: selectedBookmarks,
          userId: user.id,
          userEmail: user.email
        })
        
        // Send email
        await sendEmail({
          to: user.email,
          subject,
          body
        })
        
        // Record sends
        for (const tweetId of selectedTweetIds) {
          await recordSend(user.id, tweetId, 'sent')
        }
        
        results.sent++
        results.details.push({
          userId: user.id,
          email: user.email,
          status: 'sent',
          bookmarkCount: selectedTweetIds.length
        })
        
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.errors++
        results.details.push({
          userId: user.id,
          email: user.email,
          status: 'error',
          reason: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
