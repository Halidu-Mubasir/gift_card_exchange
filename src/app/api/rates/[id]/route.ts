import { getServerSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const session = await getServerSession()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  try {
    await prisma.exchangeRate.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Rate deleted successfully' })
  } catch (error) {
    console.error('DELETE rate error:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete rate' }, { status: 500 })
  }
}
