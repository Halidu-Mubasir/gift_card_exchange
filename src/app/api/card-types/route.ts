import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'

export async function GET() {
  const cardTypes = await prisma.cardType.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ success: true, data: cardTypes })
}

const createSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }
  try {
    const body = await request.json()
    const data = createSchema.parse(body)
    const cardType = await prisma.cardType.create({ data })
    return NextResponse.json({ success: true, data: cardType }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
