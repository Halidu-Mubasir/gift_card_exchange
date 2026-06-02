import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']),
  adminNote: z.string().optional(),
})

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = updateSchema.parse(body)

    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        adminNote: data.adminNote,
      },
      include: { cardType: true, seller: { select: { id: true, name: true, email: true } } },
    })

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      seller: { select: { id: true, name: true, email: true, momoNumber: true } },
      cardType: true,
      payout: true,
    },
  })

  if (!submission) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  // Sellers can only view their own submissions
  if (session.user.role === 'SELLER' && submission.sellerId !== session.user.id) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: submission })
}
