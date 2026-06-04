'use client'

import Link from 'next/link'
import { useState } from 'react'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validate email
    if (!email) {
      setError('Email is required')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Invalid email format')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Failed to send reset email')
        return
      }

      setEmailSent(true)
      toast.success('Password reset email sent!')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
                Secure Account Recovery
              </h1>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: '#ba7ef4' }}>
                We&apos;ll send you a temporary password and a secure link to reset your account credentials.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🔒', text: 'BANK-GRADE SECURITY' },
                  { icon: '⚡', text: 'INSTANT PASSWORD RESET' },
                  { icon: '✓', text: 'EMAIL VERIFICATION' },
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
                Forgot Password?
              </h2>
              <p style={{ fontSize: '14px', color: '#4c4451' }}>
                Enter your email address and we&apos;ll send you a temporary password.
              </p>
            </div>

            {!emailSent ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block mb-2 text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: 'Inter, sans-serif' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className={inputBase}
                    style={{
                      border: error ? '1px solid #dc2626' : '1px solid #cec3d3',
                      backgroundColor: '#fcf9f8',
                    }}
                    disabled={loading}
                  />
                  {error && (
                    <p className="mt-1 text-xs text-red-600">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-lg text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em' }}
                >
                  {loading ? 'SENDING...' : 'SEND RESET EMAIL'}
                </button>

                <div className="text-center">
                  <Link href="/login" className="text-sm hover:underline" style={{ color: '#4b0082', fontWeight: 600 }}>
                    ← Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac' }}>
                  <div className="flex items-start gap-3">
                    <span style={{ fontSize: '20px' }}>✉️</span>
                    <div>
                      <p className="font-bold text-sm mb-1" style={{ color: '#15803d' }}>
                        Check Your Email
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: '#166534' }}>
                        We&apos;ve sent a temporary password and reset link to <strong>{email}</strong>.
                        You can login with the temporary password or click the link to set a new one.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    href="/login"
                    className="block w-full py-3.5 rounded-lg text-sm font-bold text-white text-center transition-all active:scale-[0.98]"
                    style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', letterSpacing: '0.03em' }}
                  >
                    GO TO LOGIN
                  </Link>

                  <button
                    onClick={() => {
                      setEmailSent(false)
                      setEmail('')
                    }}
                    className="w-full text-sm hover:underline"
                    style={{ color: '#7d7483', fontWeight: 600 }}
                  >
                    Try Different Email
                  </button>
                </div>
              </div>
            )}

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
