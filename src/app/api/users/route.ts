import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET /api/users?role=SELLER|ADMIN — list users by role
// Sellers can only query ADMIN list; admins can query SELLER list
export async function GET(request: Request) {
  const session = await getServerSession()
  if (!session) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') as 'SELLER' | 'ADMIN' | null

  // Sellers can only look up admins (to start a chat)
  if (session.user.role === 'SELLER' && role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  // Admins can look up sellers
  if (session.user.role === 'ADMIN' && role !== 'SELLER') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: role ? { role } : undefined,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json({ success: true, data: users })
}
