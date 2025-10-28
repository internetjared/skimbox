/**
 * Plain text email composer for Skimbox
 * Keeps emails under 30KB to avoid Gmail clipping
 */

import { XBookmark } from './x'
import { createActionLink, createTweetUrl } from './links'
import { formatRelativeTime } from './time'

export interface EmailData {
  bookmarks: XBookmark[]
  userId: string
  userEmail: string
}

/**
 * Composes a plain text email with bookmarks
 * Returns subject and body as strings
 */
export function composeEmail(data: EmailData): { subject: string; body: string } {
  const today = new Date()
  const dayName = today.toLocaleDateString('en-US', { weekday: 'short' })
  
  const subject = `Skimbox for ${dayName}`
  
  let body = `Your X bookmarks for today:\n\n`
  
  // Add each bookmark
  for (const bookmark of data.bookmarks) {
    const snippet = truncateText(bookmark.text, 140)
    const tweetUrl = createTweetUrl(bookmark.username, bookmark.id)
    const pinUrl = createActionLink(data.userId, 'pin', bookmark.id)
    const hideUrl = createActionLink(data.userId, 'hide', bookmark.id)
    
    body += `• ${bookmark.username} @${bookmark.username}\n`
    body += `${snippet}\n`
    body += `${tweetUrl}\n`
    body += `Pin  ${pinUrl}\n`
    body += `Hide ${hideUrl}\n\n`
  }
  
  // Add footer actions
  const snoozeUrl = createActionLink(data.userId, 'snooze')
  const pauseUrl = createActionLink(data.userId, 'pause')
  const moreUrl = createActionLink(data.userId, 'more')
  
  body += `—\n`
  body += `Snooze ${snoozeUrl}\n`
  body += `Pause  ${pauseUrl}\n`
  body += `More   ${moreUrl}\n`
  
  return { subject, body }
}

/**
 * Truncates text to specified length
 * Replaces newlines with spaces and collapses whitespace
 */
function truncateText(text: string, maxLength: number): string {
  // Replace newlines with spaces and collapse whitespace
  let cleaned = text.replace(/\s+/g, ' ').trim()
  
  if (cleaned.length <= maxLength) {
    return cleaned
  }
  
  // Truncate and add ellipsis
  return cleaned.substring(0, maxLength - 3) + '...'
}

/**
 * Estimates email size in bytes
 * Used to ensure we stay under 30KB limit
 */
export function estimateEmailSize(body: string): number {
  // Rough estimation: UTF-8 encoding
  return Buffer.byteLength(body, 'utf8')
}

/**
 * Validates that email stays under size limit
 * Returns true if email is within limits
 */
export function validateEmailSize(body: string, maxSizeKB: number = 30): boolean {
  const sizeBytes = estimateEmailSize(body)
  const maxSizeBytes = maxSizeKB * 1024
  
  return sizeBytes <= maxSizeBytes
}
