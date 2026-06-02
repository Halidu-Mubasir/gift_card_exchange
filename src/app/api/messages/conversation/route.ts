import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/messages/conversation?with=userId
export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const partnerId = searchParams.get('with')
  if (!partnerId) return NextResponse.json({ success: false, error: 'Missing ?with= param' }, { status: 400 })

  const userId = session.user.id

  // Verify the partner exists and access is appropriate
  const partner = await prisma.user.findUnique({
    where: { id: partnerId },
    select: { id: true, name: true, role: true },
  })
  if (!partner) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

  // Sellers can only read their conversation with admins
  if (session.user.role === 'SELLER' && partner.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    include: {
      sender: { select: { id: true, name: true, role: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Mark incoming messages as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: userId, isRead: false },
    data: { isRead: true },
  })

  // Update presence — this user is actively viewing this conversation right now
  // Used by the email spam guard to suppress notifications during active sessions
  await prisma.conversationPresence.upsert({
    where: { userId_partnerId: { userId, partnerId } },
    create: { userId, partnerId, seenAt: new Date() },
    update: { seenAt: new Date() },
  })

  return NextResponse.json({ success: true, data: messages })
}
