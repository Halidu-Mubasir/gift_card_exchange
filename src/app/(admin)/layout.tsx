'use client'

import { AuthGuard } from '@/components/shared/auth-guard'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: '⊞', badgeType: null },
  { href: '/admin/submissions', label: 'Verification Queue', icon: '✓', badgeType: 'pending' },
  { href: '/admin/rates', label: 'Exchange Rates', icon: '⚙', badgeType: null },
  { href: '/admin/messages', label: 'Messages', icon: '💬', badgeType: 'unread' },
]

function Sidebar({ onClose, pendingCount, unreadCount }: { onClose?: () => void; pendingCount: number; unreadCount: number }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const initials = session?.user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? 'AD'

  return (
    <div className="flex h-full flex-col bg-white border-r border-gray-200" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Brand */}
      <div className="px-6 py-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <img src="/assets/logo.svg" alt="Trade Nest" className="h-10" />
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon, badgeType }) => {
          const isActive = pathname === href || pathname.startsWith(href)
          const badgeCount = badgeType === 'pending' ? pendingCount : badgeType === 'unread' ? unreadCount : 0
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all duration-200"
              style={{
                fontFamily: 'Manrope, sans-serif',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#1e1b4b' : '#475569',
                borderRight: isActive ? '4px solid #1e1b4b' : '4px solid transparent',
                borderRadius: isActive ? '8px 0 0 8px' : '8px',
              }}
            >
              <span className="text-base w-5 text-center">{icon}</span>
              <span className="flex-1">{label}</span>
              {badgeCount > 0 && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-black text-white" style={{ backgroundColor: '#ba1a1a' }}>
                  {badgeCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style={{ backgroundColor: '#4b0082' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{session?.user?.name}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#4b0082' }}>Administrator</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-1 py-1 uppercase tracking-wider"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    function loadCounts() {
      fetch('/api/submissions?status=PENDING')
        .then(r => r.json())
        .then(d => { if (d.success) setPendingCount(d.data.length) })
      fetch('/api/messages/unread-count')
        .then(r => r.json())
        .then(d => { if (d.success) setUnreadCount(d.data.count) })
    }
    loadCounts()
    const interval = setInterval(loadCounts, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <AuthGuard allowedRole="ADMIN">
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fcf9f8' }}>
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block h-screen">
          <Sidebar pendingCount={pendingCount} unreadCount={unreadCount} />
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 h-full z-10">
              <Sidebar onClose={() => setMobileOpen(false)} pendingCount={pendingCount} unreadCount={unreadCount} />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Mobile Header */}
          <header className="flex items-center gap-3 bg-white border-b border-gray-100 px-4 py-3 md:hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <button onClick={() => setMobileOpen(true)} className="p-2 text-slate-500 hover:text-indigo-900 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <img src="/assets/logo.svg" alt="Trade Nest" className="h-8" />
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8" style={{ backgroundColor: '#fcf9f8' }}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  )
}
