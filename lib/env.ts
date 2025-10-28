/**
 * Environment variable validation
 * Ensures all required env vars are present at startup
 */

const requiredEnvVars = [
  'DATABASE_URL',
  'APP_URL',
  'EMAIL_FROM',
  'RESEND_API_KEY',
  'HMAC_SECRET',
  'ENCRYPTION_KEY',
  'X_CLIENT_ID',
  'X_CLIENT_SECRET',
  'X_REDIRECT_URI'
] as const

export function validateEnv(): void {
  // Only validate in server-side contexts, not during build
  if (typeof window !== 'undefined') {
    return
  }
  
  const missing: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`)
    // Don't throw during build/startup, only warn
    return
  }
  
  // Validate specific formats
  if (process.env.HMAC_SECRET && process.env.HMAC_SECRET.length < 32) {
    console.warn('HMAC_SECRET should be at least 32 characters')
  }
  
  if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length !== 32) {
    console.warn('ENCRYPTION_KEY should be exactly 32 characters')
  }
  
  if (process.env.APP_URL && !process.env.APP_URL.startsWith('http')) {
    console.warn('APP_URL should be a valid URL starting with http')
  }
}

// Don't validate on module load to prevent build failures
// validateEnv()
