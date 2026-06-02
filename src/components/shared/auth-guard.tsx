'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface AuthGuardProps {
  children: React.ReactNode
  allowedRole?: 'SELLER' | 'ADMIN'
}

export function AuthGuard({ children, allowedRole }: AuthGuardProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
      return
    }
    if (allowedRole && session.user.role !== allowedRole) {
      const dest = session.user.role === 'ADMIN' ? '/admin/dashboard' : '/seller/dashboard'
      router.push(dest)
    }
  }, [session, status, allowedRole, router])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!session) return null
  if (allowedRole && session.user.role !== allowedRole) return null

  return <>{children}</>
}
