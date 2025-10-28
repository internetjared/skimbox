import { createCipher, createDecipher, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

/**
 * Encrypts a string using AES-256-GCM
 * Returns base64 encoded string with format: iv:tag:encrypted
 */
export function encrypt(text: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf8')
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipher(ALGORITHM, key)
  
  cipher.setAAD(Buffer.from('skimbox-token', 'utf8'))
  
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const tag = cipher.getAuthTag()
  
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`
}

/**
 * Decrypts a string encrypted with encrypt()
 */
export function decrypt(encryptedText: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'utf8')
  const [ivBase64, tagBase64, encrypted] = encryptedText.split(':')
  
  if (!ivBase64 || !tagBase64 || !encrypted) {
    throw new Error('Invalid encrypted format')
  }
  
  const iv = Buffer.from(ivBase64, 'base64')
  const tag = Buffer.from(tagBase64, 'base64')
  
  const decipher = createDecipher(ALGORITHM, key)
  decipher.setAAD(Buffer.from('skimbox-token', 'utf8'))
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
