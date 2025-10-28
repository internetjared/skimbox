import { sign } from './sign'

export type ActionType = 'pin' | 'hide' | 'pause' | 'snooze' | 'more' | 'open'

/**
 * Creates a signed action link for the magic endpoint
 * All links must be signed with HMAC to prevent tampering
 */
export function createActionLink(
  userId: string,
  action: ActionType,
  tweetId?: string
): string {
  const baseUrl = process.env.APP_URL!
  const token = generateToken()
  
  // Build query params in fixed order for consistent signing
  const params = new URLSearchParams({
    u: userId,
    t: token,
    act: action,
    ...(tweetId && { id: tweetId })
  })
  
  const payload = params.toString()
  const signature = sign(payload)
  
  return `${baseUrl}/api/a?${payload}&sig=${signature}`
}

/**
 * Generates a random token for action links
 * This provides additional entropy beyond the HMAC signature
 */
function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 16; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Creates a direct X status URL
 * Format: https://x.com/{username}/status/{tweetId}
 */
export function createTweetUrl(username: string, tweetId: string): string {
  return `https://x.com/${username}/status/${tweetId}`
}
