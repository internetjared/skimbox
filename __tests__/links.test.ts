import { describe, it, expect } from 'vitest'
import { createActionLink, createTweetUrl } from '../lib/links'

describe('Link Generation', () => {
  it('should create stable signed URLs', () => {
    const userId = 'user123'
    const tweetId = 'tweet456'
    
    const pinLink1 = createActionLink(userId, 'pin', tweetId)
    const pinLink2 = createActionLink(userId, 'pin', tweetId)
    
    // URLs should be different due to random tokens, but structure should be consistent
    expect(pinLink1).toContain('/api/a?')
    expect(pinLink1).toContain('u=user123')
    expect(pinLink1).toContain('t=')
    expect(pinLink1).toContain('act=pin')
    expect(pinLink1).toContain('id=tweet456')
    expect(pinLink1).toContain('sig=')
    
    expect(pinLink2).toContain('/api/a?')
    expect(pinLink2).toContain('u=user123')
    expect(pinLink2).toContain('t=')
    expect(pinLink2).toContain('act=pin')
    expect(pinLink2).toContain('id=tweet456')
    expect(pinLink2).toContain('sig=')
    
    // But the actual URLs should be different due to random tokens
    expect(pinLink1).not.toBe(pinLink2)
  })
  
  it('should create URLs without tweet ID for global actions', () => {
    const userId = 'user123'
    
    const pauseLink = createActionLink(userId, 'pause')
    const snoozeLink = createActionLink(userId, 'snooze')
    const moreLink = createActionLink(userId, 'more')
    
    expect(pauseLink).toContain('act=pause')
    expect(pauseLink).not.toContain('id=')
    
    expect(snoozeLink).toContain('act=snooze')
    expect(snoozeLink).not.toContain('id=')
    
    expect(moreLink).toContain('act=more')
    expect(moreLink).not.toContain('id=')
  })
  
  it('should create tweet URLs correctly', () => {
    const username = 'testuser'
    const tweetId = '1234567890123456789'
    
    const tweetUrl = createTweetUrl(username, tweetId)
    
    expect(tweetUrl).toBe('https://x.com/testuser/status/1234567890123456789')
  })
  
  it('should handle special characters in usernames', () => {
    const username = 'test_user-123'
    const tweetId = '1234567890123456789'
    
    const tweetUrl = createTweetUrl(username, tweetId)
    
    expect(tweetUrl).toBe('https://x.com/test_user-123/status/1234567890123456789')
  })
  
  it('should create all action types', () => {
    const userId = 'user123'
    const tweetId = 'tweet456'
    
    const actions = ['pin', 'hide', 'pause', 'snooze', 'more', 'open'] as const
    
    for (const action of actions) {
      const link = createActionLink(userId, action, tweetId)
      expect(link).toContain(`act=${action}`)
      expect(link).toContain('sig=')
    }
  })
})
