'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Step = 'email' | 'otp' | 'profile'

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('email')
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null)

  // Step 1 — email
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [sendingOtp, setSendingOtp] = useState(false)

  // Step 2 — OTP (6 individual inputs)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])
  const [otpError, setOtpError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Step 3 — profile
  const [profile, setProfile] = useState({ name: '', phone: '', momoNumber: '', password: '', confirmPassword: '' })
  const [profileErrors, setProfileErrors] = useState<Partial<typeof profile>>({})
  const [submitting, setSubmitting] = useState(false)

  // ─── OAuth ────────────────────────────────────────────────────────────────

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

  // ─── Step 1: Send OTP ─────────────────────────────────────────────────────

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address')
      return
    }
    setEmailError('')
    setSendingOtp(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Failed to send code'); return }
      toast.success('Verification code sent!')
      setStep('otp')
      startResendCooldown()
    } finally { setSendingOtp(false) }
  }

  function startResendCooldown() {
    setResendCooldown(60)
    const interval = setInterval(() => {
      setResendCooldown(c => {
        if (c <= 1) { clearInterval(interval); return 0 }
        return c - 1
      })
    }, 1000)
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setSendingOtp(true)
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error ?? 'Failed to send code'); return }
      toast.success('New code sent!')
      setOtp(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
      startResendCooldown()
    } finally { setSendingOtp(false) }
  }

  // ─── Step 2: Verify OTP ───────────────────────────────────────────────────

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    setOtpError('')
    if (value && index < 5) otpRefs.current[index + 1]?.focus()
    // Auto-submit when all 6 digits filled
    if (next.every(d => d) && next.join('').length === 6) {
      verifyOtp(next.join(''))
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length === 6) {
      const digits = pasted.split('')
      setOtp(digits)
      otpRefs.current[5]?.focus()
      verifyOtp(pasted)
    }
  }

  async function verifyOtp(code: string) {
    setVerifying(true)
    setOtpError('')
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      })
      const json = await res.json()
      if (!json.success) { setOtpError(json.error ?? 'Invalid code'); return }
      toast.success('Email verified!')
      setStep('profile')
    } finally { setVerifying(false) }
  }

  async function handleVerifyClick(e: React.FormEvent) {
    e.preventDefault()
    const code = otp.join('')
    if (code.length !== 6) { setOtpError('Please enter all 6 digits'); return }
    await verifyOtp(code)
  }

  // ─── Step 3: Create account ───────────────────────────────────────────────

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    const errs: Partial<typeof profile> = {}
    if (!profile.name.trim() || profile.name.trim().length < 2) errs.name = 'Name must be at least 2 characters'
    if (!profile.password || profile.password.length < 8) errs.password = 'Password must be at least 8 characters'
    if (profile.password !== profile.confirmPassword) errs.confirmPassword = 'Passwords do not match'
    if (Object.keys(errs).length) { setProfileErrors(errs); return }
    setProfileErrors({})
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, email, password: profile.password, phone: profile.phone, momoNumber: profile.momoNumber }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(typeof json.error === 'string' ? json.error : 'Registration failed'); return }

      // Auto sign-in after registration
      const result = await signIn('credentials', { email, password: profile.password, redirect: false })
      if (result?.error) {
        toast.success('Account created! Please sign in.')
        router.push('/login')
      } else {
        router.push('/seller/dashboard')
        router.refresh()
      }
    } finally { setSubmitting(false) }
  }

  // ─── Shared styles ────────────────────────────────────────────────────────

  const inputStyle = (hasError?: boolean) => ({
    border: `1px solid ${hasError ? '#ba1a1a' : '#cec3d3'}`,
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    borderRadius: '8px',
    padding: '12px 16px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s',
  })

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#4c4451',
    fontFamily: 'Inter, sans-serif',
    marginBottom: '6px',
  }

  // ─── Stepper ──────────────────────────────────────────────────────────────

  const steps: Step[] = ['email', 'otp', 'profile']
  const stepLabels = ['Email', 'Verify', 'Profile']
  const currentStepIdx = steps.indexOf(step)

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#fcf9f8', fontFamily: 'Inter, sans-serif' }}>
      <main className="flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-5xl grid md:grid-cols-2 rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 40px rgba(75,0,130,0.08)', border: '1px solid #cec3d3' }}>

          {/* Left Hero */}
          <div className="hidden md:flex flex-col justify-center p-12 relative overflow-hidden" style={{ backgroundColor: '#4b0082' }}>
            <div className="relative z-10">
              <h1 className="text-white mb-4" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '36px', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Join the Secure Exchange
              </h1>
              <p className="mb-8 text-sm leading-relaxed" style={{ color: '#ba7ef4' }}>
                Create your account and start liquidating unused gift cards for instant MoMo payouts.
              </p>
              <div className="space-y-4">
                {[
                  { icon: '🎁', text: 'SUBMIT ANY MAJOR GIFT CARD BRAND' },
                  { icon: '💸', text: 'INSTANT MOMO PAYOUTS' },
                  { icon: '📊', text: 'REAL-TIME PAYOUT TRACKING' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-3 text-white">
                    <span style={{ color: '#69ff87', fontSize: '16px' }}>{icon}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em' }}>{text}</span>
                  </div>
                ))}
              </div>
              {/* Progress indicator on hero */}
              <div className="mt-12 flex items-center gap-3">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        backgroundColor: i <= currentStepIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.15)',
                        color: i <= currentStepIdx ? '#4b0082' : 'rgba(255,255,255,0.5)',
                        fontFamily: 'Manrope, sans-serif',
                      }}
                    >
                      {i < currentStepIdx ? '✓' : i + 1}
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: i <= currentStepIdx ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.35)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                      {stepLabels[i].toUpperCase()}
                    </span>
                    {i < steps.length - 1 && (
                      <div className="w-6 h-px ml-1" style={{ backgroundColor: i < currentStepIdx ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-20 -right-20 w-72 h-72 rounded-full opacity-10" style={{ backgroundColor: 'white' }} />
          </div>

          {/* Right Panel */}
          <div className="p-8 md:p-10 lg:p-12 flex flex-col justify-center bg-white">
            {/* Brand */}
            <div className="flex items-center gap-2 mb-5">
              <img src="/assets/logo.svg" alt="Trade Nest" className="h-10" />
            </div>

            {/* Tabs */}
            <div className="flex mb-7" style={{ borderBottom: '1px solid #cec3d3' }}>
              <Link href="/login" className="px-6 py-3 text-xs font-bold uppercase hover:opacity-70 transition-opacity" style={{ color: '#7d7483', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>LOGIN</Link>
              <span className="px-6 py-3 text-xs font-bold uppercase" style={{ color: '#4b0082', borderBottom: '2px solid #4b0082', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>REGISTER</span>
            </div>

            {/* ── STEP 1: Email + OAuth ─────────────────────────────────────── */}
            {step === 'email' && (
              <>
                {/* OAuth buttons */}
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
                    Continue with Google
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
                    Continue with Apple
                  </button>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1" style={{ borderTop: '1px solid #cec3d3' }} />
                  <span className="text-xs font-bold uppercase" style={{ color: '#7d7483', letterSpacing: '0.05em', fontFamily: 'Inter, sans-serif' }}>Or with email</span>
                  <div className="flex-1" style={{ borderTop: '1px solid #cec3d3' }} />
                </div>

                {/* Email form */}
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setEmailError('') }}
                      placeholder="you@example.com"
                      style={inputStyle(!!emailError)}
                      onFocus={e => e.target.style.borderColor = '#4b0082'}
                      onBlur={e => e.target.style.borderColor = emailError ? '#ba1a1a' : '#cec3d3'}
                    />
                    {emailError && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{emailError}</p>}
                  </div>
                  <button
                    type="submit"
                    disabled={sendingOtp}
                    className="w-full py-4 rounded-lg text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                    style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', fontSize: '15px', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
                  >
                    {sendingOtp ? 'Sending code...' : 'Send Verification Code →'}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP 2: OTP Verification ──────────────────────────────────── */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyClick}>
                <div className="mb-6">
                  <h2 className="mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 600, color: '#1c1b1b' }}>Check your inbox</h2>
                  <p style={{ fontSize: '14px', color: '#4c4451', lineHeight: '1.6' }}>
                    We sent a 6-digit code to <strong style={{ color: '#1c1b1b' }}>{email}</strong>.<br />
                    Enter it below to verify your email.
                  </p>
                </div>

                {/* 6-box OTP input */}
                <div className="flex gap-2 mb-3" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="flex-1 text-center font-bold text-lg rounded-lg outline-none transition-all"
                      style={{
                        height: '44px',
                        minWidth: 0,
                        border: otpError ? '2px solid #ba1a1a' : digit ? '2px solid #4b0082' : '2px solid #cec3d3',
                        fontFamily: 'Manrope, sans-serif',
                        color: '#1e1b4b',
                        backgroundColor: digit ? '#f5f0ff' : 'white',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#4b0082'; e.target.style.backgroundColor = '#f5f0ff' }}
                      onBlur={e => { e.target.style.borderColor = digit ? '#4b0082' : otpError ? '#ba1a1a' : '#cec3d3'; e.target.style.backgroundColor = digit ? '#f5f0ff' : 'white' }}
                    />
                  ))}
                </div>
                {otpError && <p style={{ color: '#ba1a1a', fontSize: '12px', marginBottom: '12px' }}>{otpError}</p>}

                <p className="text-sm mb-6" style={{ color: '#4c4451' }}>
                  Didn&apos;t receive it?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || sendingOtp}
                    className="font-bold hover:underline disabled:opacity-40 disabled:no-underline"
                    style={{ color: '#4b0082', fontFamily: 'Inter, sans-serif' }}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </p>

                <button
                  type="submit"
                  disabled={verifying || otp.join('').length < 6}
                  className="w-full py-4 rounded-lg text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', fontSize: '15px', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
                >
                  {verifying ? 'Verifying...' : 'Verify Code →'}
                </button>
                <button type="button" onClick={() => setStep('email')} className="w-full mt-3 py-2 text-sm font-semibold hover:underline" style={{ color: '#7d7483', fontFamily: 'Inter, sans-serif' }}>
                  ← Change email
                </button>
              </form>
            )}

            {/* ── STEP 3: Profile Completion ────────────────────────────────── */}
            {step === 'profile' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: '#f0fdf4', color: '#15803d' }}>✓</span>
                    <span style={{ fontSize: '13px', color: '#15803d', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>Email verified: {email}</span>
                  </div>
                  <h2 className="mt-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 600, color: '#1c1b1b' }}>Complete your profile</h2>
                  <p style={{ fontSize: '14px', color: '#4c4451' }}>Just a few more details to get you started.</p>
                </div>

                <div>
                  <label style={labelStyle}>Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                    placeholder="John Doe"
                    style={inputStyle(!!profileErrors.name)}
                    onFocus={e => e.target.style.borderColor = '#4b0082'}
                    onBlur={e => e.target.style.borderColor = profileErrors.name ? '#ba1a1a' : '#cec3d3'}
                  />
                  {profileErrors.name && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{profileErrors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label style={labelStyle}>Phone <span style={{ opacity: 0.5 }}>(opt)</span></label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+233200000000"
                      style={inputStyle()}
                      onFocus={e => e.target.style.borderColor = '#4b0082'}
                      onBlur={e => e.target.style.borderColor = '#cec3d3'}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>MoMo No. <span style={{ opacity: 0.5 }}>(opt)</span></label>
                    <input
                      type="tel"
                      value={profile.momoNumber}
                      onChange={e => setProfile(p => ({ ...p, momoNumber: e.target.value }))}
                      placeholder="+233200000000"
                      style={inputStyle()}
                      onFocus={e => e.target.style.borderColor = '#4b0082'}
                      onBlur={e => e.target.style.borderColor = '#cec3d3'}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password"
                    value={profile.password}
                    onChange={e => setProfile(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min. 8 characters"
                    style={inputStyle(!!profileErrors.password)}
                    onFocus={e => e.target.style.borderColor = '#4b0082'}
                    onBlur={e => e.target.style.borderColor = profileErrors.password ? '#ba1a1a' : '#cec3d3'}
                  />
                  {profileErrors.password && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{profileErrors.password}</p>}
                </div>

                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input
                    type="password"
                    value={profile.confirmPassword}
                    onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))}
                    placeholder="••••••••"
                    style={inputStyle(!!profileErrors.confirmPassword)}
                    onFocus={e => e.target.style.borderColor = '#4b0082'}
                    onBlur={e => e.target.style.borderColor = profileErrors.confirmPassword ? '#ba1a1a' : '#cec3d3'}
                  />
                  {profileErrors.confirmPassword && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{profileErrors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-lg text-white font-bold transition-all active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', fontSize: '15px', boxShadow: '0 4px 12px rgba(75,0,130,0.2)', marginTop: '8px' }}
                >
                  {submitting ? 'Creating account...' : 'Create Account →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <footer className="py-6 text-center">
        <p style={{ fontSize: '12px', color: '#7d7483' }}>© 2024 Trade Nest Global Inc.</p>
      </footer>
    </div>
  )
}
