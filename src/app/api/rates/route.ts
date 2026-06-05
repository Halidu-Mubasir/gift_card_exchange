import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const rates = await prisma.exchangeRate.findMany({
    include: { cardType: true },
    orderBy: [{ cardType: { name: 'asc' } }, { denomination: 'asc' }],
  })
  return NextResponse.json({ success: true, data: rates })
}

const rateSchema = z.object({
  cardTypeId: z.string(),
  denomination: z.number().positive(),
  ratePerDollar: z.number().positive(),
  currency: z.string().default('GHS'),
})

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const data = rateSchema.parse(body)

    const rate = await prisma.exchangeRate.upsert({
      where: { cardTypeId_denomination: { cardTypeId: data.cardTypeId, denomination: data.denomination } },
      update: { ratePerDollar: data.ratePerDollar, currency: data.currency },
      create: data,
    })

    return NextResponse.json({ success: true, data: rate }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
