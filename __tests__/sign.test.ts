import { describe, it, expect } from 'vitest'
import { sign, verify } from '../lib/sign'

describe('HMAC Signing', () => {
  it('should sign and verify payloads correctly', () => {
    const payload = 'u=user123&t=token456&act=pin&id=tweet789'
    const signature = sign(payload)
    
    expect(signature).toBeDefined()
    expect(signature.length).toBeGreaterThan(0)
    expect(verify(payload, signature)).toBe(true)
  })
  
  it('should reject invalid signatures', () => {
    const payload = 'u=user123&t=token456&act=pin&id=tweet789'
    const invalidSignature = 'invalid_signature'
    
    expect(verify(payload, invalidSignature)).toBe(false)
  })
  
  it('should reject signatures for different payloads', () => {
    const payload1 = 'u=user123&t=token456&act=pin&id=tweet789'
    const payload2 = 'u=user123&t=token456&act=hide&id=tweet789'
    const signature1 = sign(payload1)
    
    expect(verify(payload2, signature1)).toBe(false)
  })
  
  it('should handle empty payloads', () => {
    const emptyPayload = ''
    const signature = sign(emptyPayload)
    
    expect(verify(emptyPayload, signature)).toBe(true)
  })
})
