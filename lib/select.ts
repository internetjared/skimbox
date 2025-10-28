/**
 * Selection logic for choosing bookmarks to send
 * Implements scoring, weighting, and diversity rules
 */

import { prisma } from './prisma'

export interface BookmarkCandidate {
  tweetId: string
  authorId: string | null
  firstSeenAt: Date
  score: number
}

/**
 * Picks N bookmarks for sending to a user
 * Implements the scoring and diversity rules from the spec
 */
export async function pickForSend(userId: string, count: number): Promise<string[]> {
  // Get all bookmarks from last 90 days + never sent items
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const pool = await prisma.bookmark.findMany({
    where: {
      userId,
      OR: [
        { firstSeenAt: { gte: ninetyDaysAgo } },
        {
          // Never sent items (regardless of age)
          NOT: {
            sends: {
              some: {
                userId,
                action: 'sent'
              }
            }
          }
        }
      ]
    },
    include: {
      sends: {
        where: {
          userId,
          action: 'hide'
        }
      }
    },
    orderBy: {
      firstSeenAt: 'desc'
    }
  })
  
  // Filter out hidden items
  const availableBookmarks = pool.filter(bookmark => bookmark.sends.length === 0)
  
  if (availableBookmarks.length === 0) {
    return []
  }
  
  // Score each bookmark
  const candidates: BookmarkCandidate[] = availableBookmarks.map(bookmark => ({
    tweetId: bookmark.tweetId,
    authorId: bookmark.authorId,
    firstSeenAt: bookmark.firstSeenAt,
    score: calculateScore(bookmark, availableBookmarks)
  }))
  
  // Sort by score (highest first)
  candidates.sort((a, b) => b.score - a.score)
  
  // Sample with diversity rules
  const selected = sampleWithDiversity(candidates, count)
  
  return selected.map(candidate => candidate.tweetId)
}

/**
 * Calculates score for a bookmark based on weighting rules
 */
function calculateScore(bookmark: any, allBookmarks: any[]): number {
  let score = 0
  
  // +2 if never sent
  const hasBeenSent = bookmark.sends.some((send: any) => send.action === 'sent')
  if (!hasBeenSent) {
    score += 2
  }
  
  // +1 if older than 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  if (bookmark.firstSeenAt < thirtyDaysAgo) {
    score += 1
  }
  
  return score
}

/**
 * Samples bookmarks ensuring diversity
 * Ensures at least one item from 60-90 day range if available
 */
function sampleWithDiversity(candidates: BookmarkCandidate[], count: number): BookmarkCandidate[] {
  const selected: BookmarkCandidate[] = []
  const usedAuthors = new Set<string>()
  
  // Find items from 60-90 day range
  const sixtyDaysAgo = new Date()
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)
  
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  
  const oldItems = candidates.filter(candidate => 
    candidate.firstSeenAt >= ninetyDaysAgo && 
    candidate.firstSeenAt < sixtyDaysAgo
  )
  
  // Ensure at least one old item if available and we have space
  if (oldItems.length > 0 && count > 1) {
    const oldItem = oldItems[0]
    selected.push(oldItem)
    if (oldItem.authorId) {
      usedAuthors.add(oldItem.authorId)
    }
  }
  
  // Fill remaining slots with diversity
  for (const candidate of candidates) {
    if (selected.length >= count) break
    
    // Skip if already selected
    if (selected.some(s => s.tweetId === candidate.tweetId)) continue
    
    // Apply author diversity penalty
    let finalScore = candidate.score
    if (candidate.authorId && usedAuthors.has(candidate.authorId)) {
      finalScore -= 1
    }
    
    // Only add if score is still positive or it's the only option
    if (finalScore > 0 || selected.length < count) {
      selected.push(candidate)
      if (candidate.authorId) {
        usedAuthors.add(candidate.authorId)
      }
    }
  }
  
  return selected.slice(0, count)
}

/**
 * Gets the age category of a bookmark for diversity
 */
export function getAgeCategory(firstSeenAt: Date): 'recent' | 'medium' | 'old' {
  const now = new Date()
  const daysAgo = Math.floor((now.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysAgo <= 7) return 'recent'
  if (daysAgo <= 30) return 'medium'
  return 'old'
}
