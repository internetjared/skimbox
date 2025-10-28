import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Health check endpoint to test database connectivity
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return Response.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Health check error:', error)
    return Response.json({ 
      status: 'error', 
      message: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
