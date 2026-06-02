import { getServerSession } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import { prisma } from '@/lib/prisma'
import { SubmissionStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  cardTypeId: z.string(),
  denomination: z.number().positive(),
  cardCode: z.string().min(1),
})

export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') as string | null

  const where =
    session.user.role === 'ADMIN'
      ? status ? { status: status as SubmissionStatus } : {}
      : { sellerId: session.user.id, ...(status ? { status: status as SubmissionStatus } : {}) }

  const submissions = await prisma.submission.findMany({
    where,
    include: {
      seller: { select: { id: true, name: true, email: true } },
      cardType: true,
      payout: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: submissions })
}

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'SELLER') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const formData = await request.formData()
    const cardTypeId = formData.get('cardTypeId') as string
    const denomination = parseFloat(formData.get('denomination') as string)
    const cardCode = formData.get('cardCode') as string
    const imageFront = formData.get('cardImageFront') as File | null
    const imageBack = formData.get('cardImageBack') as File | null

    const parsed = createSchema.safeParse({ cardTypeId, denomination, cardCode })
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error.issues }, { status: 422 })
    }

    let cardImageUrl: string | undefined
    let cardImageBackUrl: string | undefined
    if (imageFront && imageFront.size > 0) cardImageUrl = await uploadImage(imageFront)
    if (imageBack && imageBack.size > 0) cardImageBackUrl = await uploadImage(imageBack)

    const submission = await prisma.submission.create({
      data: {
        sellerId: session.user.id,
        cardTypeId: parsed.data.cardTypeId,
        denomination: parsed.data.denomination,
        cardCode: parsed.data.cardCode,
        cardImageUrl,
        cardImageBackUrl,
        status: 'PENDING',
      },
      include: { cardType: true },
    })

    return NextResponse.json({ success: true, data: submission }, { status: 201 })
  } catch (error) {
    console.error('Submission error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
