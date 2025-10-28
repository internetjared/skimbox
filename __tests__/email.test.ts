import { describe, it, expect } from 'vitest'
import { composeEmail, estimateEmailSize, validateEmailSize } from '../lib/email'
import { XBookmark } from '../lib/x'

describe('Email Composition', () => {
  const mockBookmarks: XBookmark[] = [
    {
      id: '1234567890123456789',
      text: 'This is a test tweet with some content that should be truncated if it gets too long. We want to make sure our email stays under the 30KB limit for Gmail.',
      authorId: 'author1',
      username: 'testuser1',
      created_at: '2024-01-01T12:00:00Z'
    },
    {
      id: '1234567890123456790',
      text: 'Another test tweet with different content.',
      authorId: 'author2',
      username: 'testuser2',
      created_at: '2024-01-01T13:00:00Z'
    }
  ]
  
  const mockEmailData = {
    bookmarks: mockBookmarks,
    userId: 'user123',
    userEmail: 'test@example.com'
  }
  
  it('should compose email with correct structure', () => {
    const { subject, body } = composeEmail(mockEmailData)
    
    expect(subject).toContain('Skimbox for')
    expect(body).toContain('Your X bookmarks for today:')
    expect(body).toContain('testuser1')
    expect(body).toContain('testuser2')
    expect(body).toContain('Pin')
    expect(body).toContain('Hide')
    expect(body).toContain('Snooze')
    expect(body).toContain('Pause')
    expect(body).toContain('More')
  })
  
  it('should include tweet URLs', () => {
    const { body } = composeEmail(mockEmailData)
    
    expect(body).toContain('https://x.com/testuser1/status/1234567890123456789')
    expect(body).toContain('https://x.com/testuser2/status/1234567890123456790')
  })
  
  it('should include action links', () => {
    const { body } = composeEmail(mockEmailData)
    
    expect(body).toContain('/api/a?')
    expect(body).toContain('u=user123')
    expect(body).toContain('act=pin')
    expect(body).toContain('act=hide')
    expect(body).toContain('act=snooze')
    expect(body).toContain('act=pause')
    expect(body).toContain('act=more')
  })
  
  it('should stay under 30KB limit', () => {
    // Create a larger set of bookmarks to test size limit
    const largeBookmarks: XBookmark[] = Array.from({ length: 10 }, (_, i) => ({
      id: `123456789012345678${i}`,
      text: 'This is a test tweet with some content that should be truncated if it gets too long. We want to make sure our email stays under the 30KB limit for Gmail. '.repeat(3),
      authorId: `author${i}`,
      username: `testuser${i}`,
      created_at: '2024-01-01T12:00:00Z'
    }))
    
    const { body } = composeEmail({
      bookmarks: largeBookmarks,
      userId: 'user123',
      userEmail: 'test@example.com'
    })
    
    expect(validateEmailSize(body, 30)).toBe(true)
  })
  
  it('should estimate email size correctly', () => {
    const testBody = 'This is a test email body with some content.'
    const size = estimateEmailSize(testBody)
    
    expect(size).toBeGreaterThan(0)
    expect(size).toBeLessThan(testBody.length * 2) // UTF-8 shouldn't be more than 2x
  })
  
  it('should handle empty bookmarks', () => {
    const { subject, body } = composeEmail({
      bookmarks: [],
      userId: 'user123',
      userEmail: 'test@example.com'
    })
    
    expect(subject).toContain('Skimbox for')
    expect(body).toContain('Your X bookmarks for today:')
    expect(body).toContain('Snooze')
    expect(body).toContain('Pause')
    expect(body).toContain('More')
  })
})
