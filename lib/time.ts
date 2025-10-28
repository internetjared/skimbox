/**
 * Timezone-aware utilities for Skimbox
 * Handles user timezone detection and scheduling
 */

/**
 * Gets the current date in a user's timezone
 */
export function getCurrentDateInTimezone(timezone: string): Date {
  const now = new Date()
  return new Date(now.toLocaleString('en-US', { timeZone: timezone }))
}

/**
 * Checks if it's a new day for a user based on their timezone
 * Used to determine if we should send a daily email
 */
export function isNewDayForUser(timezone: string, lastSendDate?: Date): boolean {
  const today = getCurrentDateInTimezone(timezone)
  const todayStr = today.toISOString().split('T')[0]
  
  if (!lastSendDate) {
    return true // First time sending
  }
  
  const lastSendStr = lastSendDate.toISOString().split('T')[0]
  return todayStr !== lastSendStr
}

/**
 * Gets the next run window for cron jobs
 * Returns the time range when users should receive their daily email
 */
export function getNextRunWindow(): { start: Date; end: Date } {
  const now = new Date()
  const start = new Date(now)
  start.setHours(6, 0, 0, 0) // 6 AM
  
  const end = new Date(now)
  end.setHours(10, 0, 0, 0) // 10 AM
  
  // If we're past 10 AM, schedule for tomorrow
  if (now > end) {
    start.setDate(start.getDate() + 1)
    end.setDate(end.getDate() + 1)
  }
  
  return { start, end }
}

/**
 * Checks if a user is in their email window
 * Users get emails between 6-10 AM in their local timezone
 */
export function isInEmailWindow(timezone: string): boolean {
  const now = new Date()
  const userTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  const hour = userTime.getHours()
  return hour >= 6 && hour < 10
}

/**
 * Formats a date for display in emails
 * Shows relative time like "2 days ago" or "1 week ago"
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'today'
  } else if (diffDays === 1) {
    return '1 day ago'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`
  } else {
    const months = Math.floor(diffDays / 30)
    return months === 1 ? '1 month ago' : `${months} months ago`
  }
}
