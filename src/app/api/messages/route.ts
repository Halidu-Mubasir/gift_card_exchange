import { getServerSession } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import {
  adminReplyHtml,
  adminReplySubject,
  newMessageFromSellerHtml,
  newMessageFromSellerSubject,
} from '@/lib/email-templates'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET /api/messages  — returns conversations list for current user
export async function GET() {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  // Find all users this user has exchanged messages with
  const [sent, received] = await Promise.all([
    prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    }),
    prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    }),
  ])

  const partnerIds = Array.from(new Set([
    ...sent.map(m => m.receiverId),
    ...received.map(m => m.senderId),
  ]))

  // Fetch partner user details + last message + unread count for each
  const conversations = await Promise.all(
    partnerIds.map(async partnerId => {
      const [partner, lastMessage, unreadCount] = await Promise.all([
        prisma.user.findUnique({
          where: { id: partnerId },
          select: { id: true, name: true, role: true, email: true },
        }),
        prisma.message.findFirst({
          where: {
            OR: [
              { senderId: userId, receiverId: partnerId },
              { senderId: partnerId, receiverId: userId },
            ],
          },
          orderBy: { createdAt: 'desc' },
          select: { content: true, createdAt: true, senderId: true },
        }),
        prisma.message.count({
          where: { senderId: partnerId, receiverId: userId, isRead: false },
        }),
      ])

      return { partner, lastMessage, unreadCount }
    })
  )

  // Sort by latest message
  conversations.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt?.getTime() ?? 0
    const bTime = b.lastMessage?.createdAt?.getTime() ?? 0
    return bTime - aTime
  })

  return NextResponse.json({ success: true, data: conversations })
}

const sendSchema = z.object({
  receiverId: z.string(),
  content: z.string().min(1).max(2000),
})

// POST /api/messages  — send a message
export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await request.json()
    const { receiverId, content } = sendSchema.parse(body)

    // Sellers can only message admins; admins can message any seller
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } })
    if (!receiver) return NextResponse.json({ success: false, error: 'Recipient not found' }, { status: 404 })

    if (session.user.role === 'SELLER' && receiver.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Sellers can only message admins' }, { status: 403 })
    }
    if (session.user.role === 'ADMIN' && receiver.role !== 'SELLER') {
      return NextResponse.json({ success: false, error: 'Admins can only message sellers' }, { status: 403 })
    }

    const message = await prisma.message.create({
      data: { senderId: session.user.id, receiverId, content },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        receiver: { select: { id: true, name: true, role: true } },
      },
    })

    // ── Email notification (fire-and-forget, never throws) ─────────────
    void sendMessageNotification({
      senderName: session.user.name ?? 'User',
      senderRole: session.user.role,
      receiverId,
      receiverName: receiver.name,
      receiverEmail: receiver.email,
      senderId: session.user.id,
      content,
    })

    return NextResponse.json({ success: true, data: message }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// ── Notification helper ────────────────────────────────────────────────────
const ACTIVE_WINDOW_MS = 2 * 60 * 1000 // 2 minutes

async function sendMessageNotification({
  senderName,
  senderRole,
  receiverId,
  receiverName,
  receiverEmail,
  senderId,
  content,
}: {
  senderName: string
  senderRole: string
  receiverId: string
  receiverName: string
  receiverEmail: string
  senderId: string
  content: string
}) {
  try {
    // Spam guard — skip email if recipient viewed this conversation within 2 min
    const presence = await prisma.conversationPresence.findUnique({
      where: { userId_partnerId: { userId: receiverId, partnerId: senderId } },
    })
    if (presence) {
      const elapsed = Date.now() - presence.seenAt.getTime()
      if (elapsed < ACTIVE_WINDOW_MS) return
    }

    if (senderRole === 'SELLER') {
      // Seller → Admin: notify admin
      await sendEmail({
        to: receiverEmail,
        subject: newMessageFromSellerSubject(senderName),
        html: newMessageFromSellerHtml(senderName, content),
      })
    } else {
      // Admin → Seller: notify seller
      await sendEmail({
        to: receiverEmail,
        subject: adminReplySubject(),
        html: adminReplyHtml(receiverName, content),
      })
    }
  } catch (err) {
    console.error('[email-notify] Failed to send message notification', err)
  }
}
