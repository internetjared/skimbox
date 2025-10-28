import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Signs a payload using HMAC-SHA256
 * Returns base64 encoded signature
 */
export function sign(payload: string): string {
  const secret = process.env.HMAC_SECRET!
  const hmac = createHmac('sha256', secret)
  hmac.update(payload)
  return hmac.digest('base64')
}

/**
 * Verifies a signature against a payload
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verify(payload: string, signature: string): boolean {
  const expectedSignature = sign(payload)
  
  if (expectedSignature.length !== signature.length) {
    return false
  }
  
  try {
    return timingSafeEqual(
      Buffer.from(expectedSignature, 'base64'),
      Buffer.from(signature, 'base64')
    )
  } catch {
    return false
  }
}
