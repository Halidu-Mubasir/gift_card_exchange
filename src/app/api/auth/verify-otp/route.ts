import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, code } = schema.parse(body)

    const codeHash = hashCode(code)

    // Find valid, unverified OTP
    const otp = await prisma.emailOtp.findFirst({
      where: {
        email,
        codeHash,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!otp) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired code. Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark as verified
    await prisma.emailOtp.update({
      where: { id: otp.id },
      data: { verified: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
