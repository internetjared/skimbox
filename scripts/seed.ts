/**
 * Seed script for creating test data
 * Creates a test user and fake bookmarks for local development
 */

import { PrismaClient } from '@prisma/client'
import { encrypt } from '../lib/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')
  
  // Create test user
  const testUser = await prisma.user.upsert({
    where: { xUserId: 'test_user_123' },
    update: {},
    create: {
      email: 'test@skimbox.local',
      xUserId: 'test_user_123',
      xAccessToken: encrypt('fake_access_token'),
      tz: 'America/New_York',
      sendCountDefault: 5
    }
  })
  
  console.log(`✅ Created test user: ${testUser.email}`)
  
  // Create fake bookmarks
  const fakeBookmarks = [
    {
      tweetId: '1234567890123456789',
      userId: testUser.id,
      authorId: 'author_1',
      firstSeenAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
    },
    {
      tweetId: '1234567890123456790',
      userId: testUser.id,
      authorId: 'author_2',
      firstSeenAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
    },
    {
      tweetId: '1234567890123456791',
      userId: testUser.id,
      authorId: 'author_1',
      firstSeenAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days ago
    },
    {
      tweetId: '1234567890123456792',
      userId: testUser.id,
      authorId: 'author_3',
      firstSeenAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000) // 35 days ago
    },
    {
      tweetId: '1234567890123456793',
      userId: testUser.id,
      authorId: 'author_4',
      firstSeenAt: new Date(Date.now() - 75 * 24 * 60 * 60 * 1000) // 75 days ago
    }
  ]
  
  for (const bookmark of fakeBookmarks) {
    await prisma.bookmark.upsert({
      where: { tweetId: bookmark.tweetId },
      update: {},
      create: bookmark
    })
  }
  
  console.log(`✅ Created ${fakeBookmarks.length} fake bookmarks`)
  
  // Create some fake sends to test the system
  await prisma.send.createMany({
    data: [
      {
        userId: testUser.id,
        tweetId: '1234567890123456789',
        action: 'sent'
      },
      {
        userId: testUser.id,
        tweetId: '1234567890123456790',
        action: 'sent'
      }
    ],
    skipDuplicates: true
  })
  
  console.log('✅ Created fake send records')
  
  console.log('🎉 Seeding completed!')
  console.log(`Test user ID: ${testUser.id}`)
  console.log(`Test user email: ${testUser.email}`)
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
