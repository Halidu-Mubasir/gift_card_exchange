'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import { toast } from 'sonner'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({})
  const [validToken, setValidToken] = useState<boolean | null>(null)

  useEffect(() => {
    // Verify token on mount
    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setValidToken(false)
      return
    }

    async function verifyToken() {
      try {
        const res = await fetch(`/api/auth/verify-reset-token?token=${token}`)
        const data = await res.json()
        setValidToken(data.valid)
      } catch {
        setValidToken(false)
      }
    }

    verifyToken()
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validation
    const errs: typeof errors = {}
    if (!password) {
      errs.password = 'Password is required'
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters'
    }
    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password'
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match'
    }

    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password')
        return
      }

      toast.success('Password reset successfully!')
      router.push('/login')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputBase = 'w-full px-4 py-3 rounded-lg outline-none transition-all text-sm'

  if (validToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf9f8' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p style={{ color: '#7d7483' }}>Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (validToken === false) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fcf9f8', fontFamily: 'Inter, sans-serif' }}>
        <main className="flex-grow flex items-center justify-center py-16 px-4">
          <div className="w-full max-w-md bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 4px 40px rgba(75,0,130,0.08)', border: '1px solid #cec3d3' }}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
              <span style={{ fontSize: '32px' }}>❌</span>
            </div>
            <h2 className="mb-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 600, color: '#1c1b1b' }}>
              Invalid or Expired Link
            </h2>
            <p className="mb-6" style={{ fontSize: '14px', color: '#7d7483', lineHeight: '1.6' }}>
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            <Link
              href="/forgot-password"
              className="inline-block px-6 py-3 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98]"
              style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif' }}
            >
              Request New Link
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fcf9f8', fontFamily: 'Inter, sans-serif' }}>
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 40px rgba(75,0,130,0.08)', border: '1px solid #cec3d3' }}>

          {/* Left Hero */}
          <div className="hidden md:flex flex-col justify-center p-12 relative overflow-hidden" style={{ backgroundColor: '#4b0082' }}>
            <div className="relative z-10">
              <h1 className="text-white mb-6" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '40px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Create New Password
              </h1>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: '#ba7ef4' }}>
                Choose a strong password to secure your account. Make it memorable but hard for others to guess.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🔒', text: 'MINIMUM 8 CHARACTERS' },
                  { icon: '💪', text: 'MIX LETTERS & NUMBERS' },
                  { icon: '✓', text: 'UNIQUE & SECURE' },
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
              <h2 className="mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px', fontWeight: 600, color: '#1c1b1b' }}>
                Reset Your Password
              </h2>
              <p style={{ fontSize: '14px', color: '#4c4451' }}>
                Enter your new password below.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{
                    border: errors.password ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputBase}
                  style={{
                    border: errors.confirmPassword ? '1px solid #dc2626' : '1px solid #cec3d3',
                    backgroundColor: '#fcf9f8',
                  }}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em' }}
              >
                {loading ? 'RESETTING...' : 'RESET PASSWORD'}
              </button>

              <div className="text-center">
                <Link href="/login" className="text-sm hover:underline" style={{ color: '#4b0082', fontWeight: 600 }}>
                  ← Back to Login
                </Link>
              </div>
            </form>

            {/* Footer */}
            <p className="mt-12 text-xs text-center" style={{ color: '#7d7483' }}>
              © 2024 Trade Nest Global Inc. All rights reserved.
            </p>
          </div>

        </div>
      </main>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fcf9f8' }}>
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
