'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault()
    const errs: typeof errors = {}
    if (!email) errs.email = 'Email required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'Invalid email'
    if (!password) errs.password = 'Password required'
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setLoading(true)
    try {
      const result = await signIn('credentials', { email, password, redirect: false })
      if (result?.error) { toast.error('Invalid email or password'); return }
      const res = await fetch('/api/users/me')
      const json = await res.json()
      router.push(json.data?.role === 'ADMIN' ? '/admin/dashboard' : '/seller/dashboard')
      router.refresh()
    } finally { setLoading(false) }
  }

  async function handleGoogle() {
    setOauthLoading('google')
    try {
      await signIn('google', { callbackUrl: '/seller/dashboard' })
    } catch {
      toast.error('Google sign-in failed')
      setOauthLoading(null)
    }
  }

  function handleApple() {
    toast.info('Apple sign-in is coming soon.')
  }

  const inputBase = 'w-full px-4 py-3 rounded-lg outline-none transition-all text-sm'

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fcf9f8', fontFamily: 'Inter, sans-serif' }}>
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 40px rgba(75,0,130,0.08)', border: '1px solid #cec3d3' }}>

          {/* Left Hero */}
          <div className="hidden md:flex flex-col justify-center p-12 relative overflow-hidden" style={{ backgroundColor: '#4b0082' }}>
            <div className="relative z-10">
              <h1 className="text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Trade with Absolute Confidence
              </h1>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: '#ba7ef4' }}>
                Join thousands of traders liquidating gift cards with bank-grade security and instant local currency payouts.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🛡️', text: 'ESCROW PROTECTED PAYMENTS' },
                  { icon: '⚡', text: 'INSTANT SETTLEMENT ARCHITECTURE' },
                  { icon: '✓', text: 'GLOBAL GIFT CARD VERIFICATION' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-white">
                    <span style={{ color: '#69ff87', fontSize: '16px' }}>{icon}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: 'white' }} />
          </div>

          {/* Right Form */}
          <div className="p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
            {/* Brand */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <img src="/assets/logo.svg" alt="Trade Nest" className="h-10" />
              </div>
              <h2 className="mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 600, color: '#1c1b1b' }}>Welcome Back</h2>
              <p style={{ fontSize: '14px', color: '#4c4451' }}>Sign in to manage your digital assets securely.</p>
            </div>

            {/* Tabs */}
            <div className="flex mb-8" style={{ borderBottom: '1px solid #cec3d3' }}>
              <span className="px-6 py-3 text-xs font-bold uppercase" style={{ color: '#4b0082', borderBottom: '2px solid #4b0082', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>LOGIN</span>
              <Link href="/register" className="px-6 py-3 text-xs font-bold uppercase hover:opacity-70 transition-opacity" style={{ color: '#7d7483', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>REGISTER</Link>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                onClick={handleGoogle}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
                style={{ border: '1px solid #cec3d3', color: '#1c1b1b', fontFamily: 'Inter, sans-serif', backgroundColor: 'white' }}
              >
                {oauthLoading === 'google' ? (
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Google
              </button>
              <button
                onClick={handleApple}
                disabled={!!oauthLoading}
                className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60"
                style={{ border: '1px solid #cec3d3', color: '#1c1b1b', fontFamily: 'Inter, sans-serif', backgroundColor: 'white' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.56-1.32 3.1-2.53 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Apple
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1" style={{ borderTop: '1px solid #cec3d3' }} />
              <span className="text-xs font-bold uppercase" style={{ color: '#7d7483', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>Or email</span>
              <div className="flex-1" style={{ borderTop: '1px solid #cec3d3' }} />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleCredentials} className="space-y-5">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className={inputBase}
                  style={{ border: errors.email ? '1px solid #ba1a1a' : '1px solid #cec3d3' }}
                  onFocus={e => e.target.style.borderColor = '#4b0082'}
                  onBlur={e => e.target.style.borderColor = errors.email ? '#ba1a1a' : '#cec3d3'}
                />
                {errors.email && <p className="text-xs" style={{ color: '#ba1a1a' }}>{errors.email}</p>}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold uppercase" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold cursor-pointer hover:underline" style={{ color: '#4b0082' }}>Forgot?</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{ border: errors.password ? '1px solid #ba1a1a' : '1px solid #cec3d3' }}
                  onFocus={e => e.target.style.borderColor = '#4b0082'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#ba1a1a' : '#cec3d3'}
                />
                {errors.password && <p className="text-xs" style={{ color: '#ba1a1a' }}>{errors.password}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-lg text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', fontSize: '15px', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
              >
                {loading ? 'Signing in...' : 'Sign In to Secure Market'}
              </button>
            </form>

            {/* Trust badges */}
            <div className="mt-8 pt-8 flex items-center justify-center gap-6 opacity-50" style={{ borderTop: '1px solid #cec3d3' }}>
              {[{ icon: '🔒', label: 'SSL Encrypted' }, { icon: '✓', label: 'PCI Compliant' }, { icon: '🛡️', label: 'GDPR Ready' }].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span style={{ fontSize: '12px' }}>{icon}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'Inter, sans-serif', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 text-center">
        <p style={{ fontSize: '12px', color: '#7d7483' }}>© 2024 Trade Nest Global Inc.</p>
      </footer>
    </div>
  )
}
