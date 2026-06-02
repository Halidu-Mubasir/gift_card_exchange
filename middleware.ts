import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const { pathname } = request.nextUrl

  // Not authenticated — redirect to login
  if (!token) {
    if (pathname.startsWith('/seller') || pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next()
  }

  // Authenticated — redirect away from auth pages
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    const dest = token.role === 'ADMIN' ? '/admin/dashboard' : '/seller/dashboard'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  // Role guard: SELLER cannot access /admin
  if (pathname.startsWith('/admin') && token.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/seller/dashboard', request.url))
  }

  // Role guard: ADMIN cannot access /seller
  if (pathname.startsWith('/seller') && token.role !== 'SELLER') {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/seller/:path*', '/admin/:path*', '/login', '/register'],
}
