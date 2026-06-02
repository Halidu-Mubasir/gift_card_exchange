import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/call/signal?peerId=xxx — poll for unconsumed signals addressed to me from peer
export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const peerId = searchParams.get('peerId')
  if (!peerId) return NextResponse.json({ success: false, error: 'Missing peerId' }, { status: 400 })

  const signals = await prisma.callSignal.findMany({
    where: {
      toId: session.user.id,
      fromId: peerId,
      consumed: false,
    },
    orderBy: { createdAt: 'asc' },
  })

  // Mark all fetched signals as consumed
  if (signals.length > 0) {
    await prisma.callSignal.updateMany({
      where: { id: { in: signals.map(s => s.id) } },
      data: { consumed: true },
    })
  }

  return NextResponse.json({ success: true, data: signals })
}

const signalSchema = z.object({
  toId: z.string(),
  type: z.enum(['offer', 'answer', 'ice-candidate', 'hangup', 'decline']),
  payload: z.string(),
})

// POST /api/call/signal — send a signal
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { toId, type, payload } = signalSchema.parse(body)

    const signal = await prisma.callSignal.create({
      data: { fromId: session.user.id, toId, type, payload },
    })

    return NextResponse.json({ success: true, data: signal }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
