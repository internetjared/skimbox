import { describe, it, expect } from 'vitest'
import { sampleWithDiversity, calculateScore } from '../lib/select'

describe('Selection Logic', () => {
  const mockCandidates = [
    {
      tweetId: '1',
      authorId: 'author1',
      firstSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      score: 0
    },
    {
      tweetId: '2',
      authorId: 'author2',
      firstSeenAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), // 35 days ago
      score: 0
    },
    {
      tweetId: '3',
      authorId: 'author1', // Same author as first
      firstSeenAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000), // 75 days ago
      score: 0
    },
    {
      tweetId: '4',
      authorId: 'author3',
      firstSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      score: 0
    }
  ]
  
  it('should calculate scores correctly', () => {
    const bookmark1 = {
      tweetId: '1',
      authorId: 'author1',
      firstSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      sends: [] // Never sent
    }
    
    const bookmark2 = {
      tweetId: '2',
      authorId: 'author2',
      firstSeenAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      sends: [{ action: 'sent' }] // Already sent
    }
    
    const score1 = calculateScore(bookmark1, [])
    const score2 = calculateScore(bookmark2, [])
    
    expect(score1).toBe(2) // +2 for never sent
    expect(score2).toBe(1) // +1 for older than 30 days
  })
  
  it('should ensure diversity in sampling', () => {
    const selected = sampleWithDiversity(mockCandidates, 3)
    
    expect(selected.length).toBeLessThanOrEqual(3)
    expect(selected.length).toBeGreaterThan(0)
    
    // Check that we don't have duplicate tweet IDs
    const tweetIds = selected.map(s => s.tweetId)
    const uniqueTweetIds = new Set(tweetIds)
    expect(uniqueTweetIds.size).toBe(tweetIds.length)
  })
  
  it('should prefer older items when available', () => {
    const selected = sampleWithDiversity(mockCandidates, 2)
    
    // Should include at least one item from 60-90 day range if available
    const hasOldItem = selected.some(item => {
      const daysAgo = Math.floor((Date.now() - item.firstSeenAt.getTime()) / (1000 * 60 * 60 * 24))
      return daysAgo >= 60 && daysAgo <= 90
    })
    
    expect(hasOldItem).toBe(true)
  })
  
  it('should handle empty candidate list', () => {
    const selected = sampleWithDiversity([], 5)
    expect(selected).toEqual([])
  })
  
  it('should respect count limit', () => {
    const selected = sampleWithDiversity(mockCandidates, 1)
    expect(selected.length).toBeLessThanOrEqual(1)
  })
})
