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
  const missing: string[] = []
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  }
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  
  // Validate specific formats
  if (process.env.HMAC_SECRET!.length < 32) {
    throw new Error('HMAC_SECRET must be at least 32 characters')
  }
  
  if (process.env.ENCRYPTION_KEY!.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters')
  }
  
  if (!process.env.APP_URL!.startsWith('http')) {
    throw new Error('APP_URL must be a valid URL starting with http')
  }
}

// Validate on module load
validateEnv()
