import { sendOtpEmail } from '@/lib/email'
import { prisma } from '@/lib/prisma'
import { createHash, randomInt } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
})

function hashCode(code: string) {
  return createHash('sha256').update(code).digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = schema.parse(body)

    // Rate limit: max 3 OTP requests per email in the last 10 minutes
    const recentCount = await prisma.emailOtp.count({
      where: {
        email,
        createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) },
      },
    })
    if (recentCount >= 3) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please wait before requesting a new code.' },
        { status: 429 }
      )
    }

    // Block if email is already fully registered
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists. Please sign in.' },
        { status: 400 }
      )
    }

    // Clean up expired/old OTPs for this email
    await prisma.emailOtp.deleteMany({
      where: { email, expiresAt: { lt: new Date() } },
    })

    // Generate a 6-digit code
    const code = String(randomInt(100000, 999999))
    const codeHash = hashCode(code)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    await prisma.emailOtp.create({
      data: { email, codeHash, expiresAt },
    })

    await sendOtpEmail(email, code)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'Invalid email address' }, { status: 422 })
    }
    console.error('send-otp error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send verification email. Please try again.' },
      { status: 500 }
    )
  }
}
