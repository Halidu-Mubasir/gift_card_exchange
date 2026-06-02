import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/messages/unread-count — total unread for current user
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const count = await prisma.message.count({
    where: { receiverId: session.user.id, isRead: false },
  })

  return NextResponse.json({ success: true, data: { count } })
}
