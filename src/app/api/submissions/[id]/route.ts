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

    // If marking as PAID, create payout record automatically
    if (data.status === 'PAID') {
      // Get submission to calculate payout
      const submission = await prisma.submission.findUnique({
        where: { id },
        select: { denomination: true, cardTypeId: true, status: true },
      })

      if (!submission) {
        return NextResponse.json({ success: false, error: 'Submission not found' }, { status: 404 })
      }

      // Check if already paid (avoid duplicate payouts)
      if (submission.status === 'PAID') {
        return NextResponse.json({ success: false, error: 'Submission already marked as paid' }, { status: 400 })
      }

      // Get the exchange rate for this card type and denomination
      const rate = await prisma.exchangeRate.findFirst({
        where: {
          cardTypeId: submission.cardTypeId,
          denomination: submission.denomination,
        },
      })

      if (!rate) {
        return NextResponse.json(
          { success: false, error: 'No exchange rate found for this card type and denomination' },
          { status: 400 }
        )
      }

      // Calculate payout amount
      const payoutAmount = submission.denomination * rate.ratePerDollar

      // Use a transaction to create payout and update submission status
      const result = await prisma.$transaction(async (tx) => {
        // Create payout record
        const payout = await tx.payout.create({
          data: {
            submissionId: id,
            amount: payoutAmount,
            currency: rate.currency,
            method: 'MoMo',
            reference: `AUTO-${Date.now()}`,
          },
        })

        // Update submission status
        const updatedSubmission = await tx.submission.update({
          where: { id },
          data: {
            status: data.status,
            adminNote: data.adminNote,
          },
          include: {
            cardType: true,
            seller: { select: { id: true, name: true, email: true } },
            payout: true,
          },
        })

        return updatedSubmission
      })

      return NextResponse.json({ success: true, data: result })
    }

    // For other status updates, just update the submission
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status: data.status,
        adminNote: data.adminNote,
      },
      include: {
        cardType: true,
        seller: { select: { id: true, name: true, email: true } },
        payout: true,
      },
    })

    return NextResponse.json({ success: true, data: submission })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    console.error('PATCH submission error:', error)
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
