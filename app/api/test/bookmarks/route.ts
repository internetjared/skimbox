import { NextRequest, NextResponse } from 'next/server'
import { fetchBookmarks } from '@/lib/x'
import { getDecryptedToken, getActiveUsers } from '@/lib/store'

export const dynamic = 'force-dynamic'

/**
 * Test endpoint to manually fetch bookmarks for debugging
 * Fetches bookmarks for the first active user (or all users)
 */
export async function GET(request: NextRequest) {
  try {
    const users = await getActiveUsers()
    
    if (users.length === 0) {
      return NextResponse.json({ 
        error: 'No active users found',
        hint: 'Complete OAuth flow first to create a user'
      }, { status: 404 })
    }
    
    const results = []
    
    for (const user of users) {
      try {
        const accessToken = getDecryptedToken(user.xAccessToken)
        
        console.log(`Fetching bookmarks for user ${user.xUserId}...`)
        const bookmarks = await fetchBookmarks(accessToken, user.xUserId, 50) // Limit to 50 for testing
        
        results.push({
          userId: user.id,
          xUserId: user.xUserId,
          email: user.email,
          bookmarkCount: bookmarks.length,
          bookmarks: bookmarks.slice(0, 5).map(b => ({
            id: b.id,
            text: b.text.substring(0, 100) + '...',
            username: b.username,
            authorId: b.authorId
          })),
          message: `Found ${bookmarks.length} bookmarks (showing first 5)`
        })
      } catch (error) {
        results.push({
          userId: user.id,
          email: user.email,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
    
    return NextResponse.json({
      usersProcessed: results.length,
      results
    })
    
  } catch (error) {
    console.error('Test fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bookmarks', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
