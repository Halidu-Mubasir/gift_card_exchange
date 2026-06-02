import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  momoNumber: z.string().optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Require a verified, non-expired OTP
    const verifiedOtp = await prisma.emailOtp.findFirst({
      where: {
        email: data.email,
        verified: true,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!verifiedOtp) {
      return NextResponse.json(
        { success: false, error: 'Email not verified. Please complete the OTP step.' },
        { status: 400 }
      )
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(data.password, 12)
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        emailVerified: new Date(), // email was verified via OTP
        passwordHash,
        phone: data.phone,
        momoNumber: data.momoNumber,
        role: 'SELLER',
      },
      select: { id: true, name: true, email: true, role: true },
    })

    // Clean up used OTPs
    await prisma.emailOtp.deleteMany({ where: { email: data.email } })

    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: error.issues }, { status: 422 })
    }
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
