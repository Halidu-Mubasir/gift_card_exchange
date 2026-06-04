import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createPayoutSchema = z.object({
  submissionId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('GHS'),
  method: z.string().default('MoMo'),
  reference: z.string().optional(),
})

export async function GET(_request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const payouts =
    session.user.role === 'ADMIN'
      ? await prisma.payout.findMany({
          include: { submission: { include: { seller: { select: { id: true, name: true, email: true } }, cardType: true } } },
          orderBy: { paidAt: 'desc' },
        })
      : await prisma.payout.findMany({
          where: { submission: { sellerId: session.user.id } },
          include: { submission: { include: { cardType: true } } },
          orderBy: { paidAt: 'desc' },
        })

  return NextResponse.json({ success: true, data: payouts })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = createPayoutSchema.parse(body)

    // Run in a transaction: create payout + update submission status to PAID
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const payout = await tx.payout.create({ data })
      const submission = await tx.submission.update({
        where: { id: data.submissionId },
        data: { status: 'PAID' },
      })
      return { payout, submission }
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
