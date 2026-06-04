'use client'

import { AuthGuard } from '@/components/shared/auth-guard'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

const navItems = [
  { href: '/seller/dashboard', label: 'Dashboard', icon: '⊞' },
  { href: '/seller/submit', label: 'Sell Card', icon: '＋' },
  { href: '/seller/history', label: 'Transactions', icon: '≡' },
  { href: '/seller/messages', label: 'Messages', icon: '💬' },
]

function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const initials = session?.user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '??'

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
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all duration-200"
              style={{
                fontFamily: 'Manrope, sans-serif',
                backgroundColor: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#1e1b4b' : '#475569',
                borderRight: isActive ? '4px solid #1e1b4b' : '4px solid transparent',
                borderRadius: isActive ? '8px 0 0 8px' : '8px',
              }}
            >
              <span className="text-lg w-5 text-center">{icon}</span>
              <span>{label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Sell CTA */}
      <div className="px-4 py-3">
        <Link
          href="/seller/submit"
          onClick={onClose}
          className="w-full py-3 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
        >
          <span>+</span> Sell Gift Card
        </Link>
      </div>

      {/* User Profile */}
      <div className="border-t border-gray-100 p-4">
        <Link
          href="/seller/profile"
          onClick={onClose}
          className="flex items-center gap-3 mb-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: '#4b0082' }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-indigo-900 truncate" style={{ fontFamily: 'Manrope, sans-serif' }}>{session?.user?.name}</p>
            <p className="text-xs text-slate-400 truncate">{session?.user?.email}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left text-xs font-bold text-slate-400 hover:text-red-500 transition-colors px-1 py-1 uppercase tracking-wider"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <AuthGuard allowedRole="SELLER">
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#fcf9f8' }}>
        {/* Desktop Sidebar */}
        <aside className="hidden w-64 shrink-0 md:block h-screen">
          <Sidebar />
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
            <div className="relative w-64 h-full z-10">
              <Sidebar onClose={() => setMobileOpen(false)} />
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
