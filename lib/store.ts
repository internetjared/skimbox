/**
 * Database operations for bookmarks and sends
 * Handles upserting bookmarks, recording sends, and user management
 */

import { prisma } from './prisma'
import { XBookmark } from './x'
import { decrypt } from './crypto'

/**
 * Upserts bookmarks from X API into database
 * Only stores tweetId, authorId, and firstSeenAt
 */
export async function upsertBookmarks(userId: string, bookmarks: XBookmark[]): Promise<void> {
  if (bookmarks.length === 0) return
  
  // Prepare upsert data
  const upsertData = bookmarks.map(bookmark => ({
    tweetId: bookmark.id,
    userId,
    authorId: bookmark.authorId
  }))
  
  // Use transaction for atomic upsert
  await prisma.$transaction(
    upsertData.map(data =>
      prisma.bookmark.upsert({
        where: { tweetId: data.tweetId },
        update: {}, // Don't update existing bookmarks
        create: data
      })
    )
  )
}

/**
 * Records a send action in the database
 */
export async function recordSend(
  userId: string,
  tweetId: string,
  action: 'sent' | 'pin' | 'hide' | 'open' | 'snooze' | 'pause' | 'more'
): Promise<void> {
  await prisma.send.create({
    data: {
      userId,
      tweetId,
      action
    }
  })
}

/**
 * Gets the last send date for a user
 * Used for idempotency in cron jobs
 */
export async function getLastSendDate(userId: string): Promise<Date | null> {
  const lastSend = await prisma.send.findFirst({
    where: {
      userId,
      action: 'sent'
    },
    orderBy: {
      sentAt: 'desc'
    }
  })
  
  return lastSend?.sentAt || null
}

/**
 * Checks if user has been snoozed today
 */
export async function isUserSnoozedToday(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastSnoozedAt: true }
  })
  
  if (!user?.lastSnoozedAt) return false
  
  const today = new Date()
  const snoozeDate = new Date(user.lastSnoozedAt)
  
  return snoozeDate.toDateString() === today.toDateString()
}

/**
 * Sets user as snoozed for today
 */
export async function snoozeUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastSnoozedAt: new Date() }
  })
}

/**
 * Pauses a user (sets active = false)
 */
export async function pauseUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { active: false }
  })
}

/**
 * Gets active users for cron processing
 */
export async function getActiveUsers(): Promise<Array<{
  id: string
  email: string
  tz: string
  sendCountDefault: number
  xUserId: string
  xAccessToken: string
}>> {
  const users = await prisma.user.findMany({
    where: { active: true },
    select: {
      id: true,
      email: true,
      tz: true,
      sendCountDefault: true,
      xUserId: true,
      xAccessToken: true
    }
  })
  
  return users
}

/**
 * Gets decrypted access token for a user
 */
export function getDecryptedToken(encryptedToken: string): string {
  return decrypt(encryptedToken)
}

/**
 * Checks if a bookmark has been hidden by user
 */
export async function isBookmarkHidden(userId: string, tweetId: string): Promise<boolean> {
  const hiddenSend = await prisma.send.findFirst({
    where: {
      userId,
      tweetId,
      action: 'hide'
    }
  })
  
  return !!hiddenSend
}

/**
 * Gets bookmarks that have never been sent
 */
export async function getNeverSentBookmarks(userId: string): Promise<string[]> {
  const bookmarks = await prisma.bookmark.findMany({
    where: {
      userId,
      NOT: {
        sends: {
          some: {
            userId,
            action: 'sent'
          }
        }
      }
    },
    select: {
      tweetId: true
    }
  })
  
  return bookmarks.map(b => b.tweetId)
}
