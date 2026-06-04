'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface CardType { id: string; name: string }
interface Rate { cardTypeId: string; denomination: number; ratePerDollar: number; currency: string }

const DRAFT_KEY = 'ep_submit_draft'

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: '#1c1b1b',
  fontFamily: 'Inter, sans-serif',
  marginBottom: '8px',
}

function UploadZone({
  label,
  hint,
  file,
  preview,
  onChange,
}: {
  label: string
  hint: string
  file: File | null
  preview: string | null
  onChange: (f: File, p: string) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [hover, setHover] = useState(false)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => onChange(file, reader.result as string)
    reader.readAsDataURL(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setHover(false)
    const f = e.dataTransfer.files[0]
    if (f && f.type.startsWith('image/')) handleFile(f)
  }

  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={e => { e.preventDefault(); setHover(true) }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      className="border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all"
      style={{
        borderColor: hover || file ? '#4b0082' : '#e5e7eb',
        backgroundColor: hover || file ? '#faf5ff' : 'white',
        minHeight: '160px',
      }}
    >
      {preview ? (
        <img src={preview} alt="preview" className="max-h-28 rounded object-contain" />
      ) : (
        <>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ backgroundColor: hover ? '#ede9fe' : '#f0edec' }}>
            <span style={{ fontSize: '22px' }}>📤</span>
          </div>
          <p className="font-bold text-sm" style={{ color: '#1e1b4b', fontFamily: 'Manrope, sans-serif' }}>{label}</p>
          <p style={{ fontSize: '12px', color: '#4c4451', marginTop: '4px' }}>{hint}</p>
        </>
      )}
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

export default function SubmitCardPage() {
  const router = useRouter()

  const [cardTypes, setCardTypes] = useState<CardType[]>([])
  const [rates, setRates] = useState<Rate[]>([])
  const [loadingData, setLoadingData] = useState(true)

  // Form state
  const [cardTypeId, setCardTypeId] = useState('')
  const [denomination, setDenomination] = useState('')
  const [cardCode, setCardCode] = useState('')

  // Images
  const [frontFile, setFrontFile] = useState<File | null>(null)
  const [frontPreview, setFrontPreview] = useState<string | null>(null)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load data + restore draft
  useEffect(() => {
    Promise.all([
      fetch('/api/card-types').then(r => r.json()),
      fetch('/api/rates').then(r => r.json()),
    ]).then(([ctData, ratesData]) => {
      if (ctData.success) setCardTypes(ctData.data)
      if (ratesData.success) setRates(ratesData.data)

      // Restore draft after card types load
      try {
        const saved = localStorage.getItem(DRAFT_KEY)
        if (saved) {
          const draft = JSON.parse(saved)
          if (draft.cardTypeId) setCardTypeId(draft.cardTypeId)
          if (draft.denomination) setDenomination(draft.denomination)
          if (draft.cardCode) setCardCode(draft.cardCode)
        }
      } catch { /* ignore */ }
    }).finally(() => setLoadingData(false))
  }, [])

  // Available denominations for selected card type
  const availableDenominations = rates
    .filter(r => r.cardTypeId === cardTypeId)
    .sort((a, b) => a.denomination - b.denomination)

  // Estimated payout
  const estimatedPayout = (() => {
    if (!cardTypeId || !denomination) return null
    const rate = rates.find(r => r.cardTypeId === cardTypeId && r.denomination === parseFloat(denomination))
    if (!rate) return null
    return { amount: (parseFloat(denomination) * rate.ratePerDollar).toFixed(2), currency: rate.currency }
  })()

  // Reset denomination when card type changes
  function handleCardTypeChange(id: string) {
    setCardTypeId(id)
    setDenomination('')
    setErrors(e => ({ ...e, cardTypeId: '', denomination: '' }))
  }

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ cardTypeId, denomination, cardCode }))
      toast.success('Draft saved!')
    } catch {
      toast.error('Could not save draft')
    }
  }

  function validate() {
    const errs: Record<string, string> = {}
    if (!cardTypeId) errs.cardTypeId = 'Please select a card brand'
    if (!denomination) errs.denomination = 'Please select a card value'
    if (!cardCode.trim()) errs.cardCode = 'Card code is required'
    return errs
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    setErrors({})
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('cardTypeId', cardTypeId)
      formData.append('denomination', denomination)
      formData.append('cardCode', cardCode.trim())
      if (frontFile) formData.append('cardImageFront', frontFile)

      const res = await fetch('/api/submissions', { method: 'POST', body: formData })
      const json = await res.json()
      if (!json.success) { toast.error('Submission failed. Please try again.'); return }

      // Clear draft on success
      localStorage.removeItem(DRAFT_KEY)
      toast.success('Card submitted successfully!')
      router.push('/seller/history')
    } finally { setIsSubmitting(false) }
  }

  const selectedCard = cardTypes.find(ct => ct.id === cardTypeId)

  // Stepper state
  const step1done = !!cardTypeId
  const step2done = !!denomination
  const step3done = !!cardCode.trim()
  const step4done = !!frontFile

  return (
    <div className="max-w-3xl mx-auto space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div>
        <h2 className="text-indigo-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em' }}>
          Submit Gift Card for Sale
        </h2>
        <p style={{ color: '#4c4451', fontSize: '14px' }}>
          Liquidate your unused gift cards instantly. Our secure verification process ensures competitive rates and rapid payouts.
        </p>
      </div>

      {/* Progress Stepper */}
      <div className="relative">
        <div className="absolute top-5 left-0 w-full h-0.5 z-0" style={{ backgroundColor: '#ebe7e7' }} />
        <div className="flex justify-between relative z-10">
          {[
            { label: 'BRAND', done: step1done, active: !step1done, icon: '🏷️' },
            { label: 'VALUE', done: step2done, active: step1done && !step2done, icon: '💵' },
            { label: 'CODE', done: step3done, active: step1done && step2done && !step3done, icon: '🔑' },
            { label: 'PHOTO', done: step4done, active: step1done && step2done && step3done, icon: '📷' },
          ].map(({ label, done, active, icon }) => (
            <div key={label} className="flex flex-col items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  backgroundColor: done ? '#006e2a' : active ? '#4b0082' : '#ebe7e7',
                  color: done || active ? 'white' : '#4c4451',
                  boxShadow: active ? '0 0 0 4px #f0dbff' : done ? '0 0 0 3px #dcfce7' : undefined,
                }}
              >
                {done ? '✓' : active ? '✎' : icon}
              </div>
              <span className="mt-2 text-[10px] font-bold uppercase tracking-widest"
                style={{ color: done ? '#006e2a' : active ? '#4b0082' : '#7d7483', fontFamily: 'Inter, sans-serif' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit}>
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden" style={{ boxShadow: cardShadow }}>
          <div className="p-8 space-y-8">

            {/* Info Banner */}
            <div className="flex items-start gap-3 p-4 rounded-r-lg" style={{ backgroundColor: '#eff6ff', borderLeft: '4px solid #4b0082' }}>
              <span style={{ color: '#4b0082', fontSize: '18px', lineHeight: 1.4 }}>ℹ</span>
              <div>
                <p className="font-bold text-xs uppercase tracking-wider mb-1" style={{ color: '#4b0082' }}>Verification Tip</p>
                <p style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                  Upload a clear photo of the front of your gift card. Our team will verify the card and process your payout promptly.
                </p>
              </div>
            </div>

            {/* ── Brand + Value + Code ──────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label style={labelStyle}>Selected Brand</label>
                {loadingData ? (
                  <div className="w-full px-4 py-3 rounded-lg text-sm" style={{ border: '1px solid #e5e7eb', color: '#7d7483', fontFamily: 'Inter, sans-serif' }}>
                    Loading brands...
                  </div>
                ) : (
                  <select
                    value={cardTypeId}
                    onChange={e => handleCardTypeChange(e.target.value)}
                    style={{
                      border: errors.cardTypeId ? '1px solid #ba1a1a' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      width: '100%',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: 'white',
                      color: cardTypeId ? '#1c1b1b' : '#7d7483',
                      cursor: 'pointer',
                    }}
                    onFocus={e => e.target.style.borderColor = '#4b0082'}
                    onBlur={e => e.target.style.borderColor = errors.cardTypeId ? '#ba1a1a' : '#e5e7eb'}
                  >
                    <option value="">Select card brand…</option>
                    {cardTypes.map(ct => (
                      <option key={ct.id} value={ct.id}>{ct.name}</option>
                    ))}
                  </select>
                )}
                {errors.cardTypeId && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.cardTypeId}</p>}
                {cardTypes.length === 0 && !loadingData && (
                  <p style={{ color: '#7d7483', fontSize: '12px', marginTop: '4px' }}>No card brands available. Contact support.</p>
                )}
              </div>

              <div>
                <label style={labelStyle}>Card Value</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-sm" style={{ color: '#7d7483' }}>$</span>
                  <select
                    value={denomination}
                    onChange={e => { setDenomination(e.target.value); setErrors(er => ({ ...er, denomination: '' })) }}
                    disabled={!cardTypeId}
                    style={{
                      border: errors.denomination ? '1px solid #ba1a1a' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px 16px 12px 36px',
                      width: '100%',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '14px',
                      outline: 'none',
                      backgroundColor: !cardTypeId ? '#f9fafb' : 'white',
                      color: denomination ? '#1c1b1b' : '#7d7483',
                      cursor: cardTypeId ? 'pointer' : 'not-allowed',
                      opacity: !cardTypeId ? 0.6 : 1,
                    }}
                    onFocus={e => e.target.style.borderColor = '#4b0082'}
                    onBlur={e => e.target.style.borderColor = errors.denomination ? '#ba1a1a' : '#e5e7eb'}
                  >
                    <option value="">{cardTypeId ? (availableDenominations.length ? 'Select amount…' : 'No rates set yet') : 'Select brand first'}</option>
                    {availableDenominations.map(r => (
                      <option key={r.denomination} value={String(r.denomination)}>${r.denomination}</option>
                    ))}
                  </select>
                </div>
                {errors.denomination && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.denomination}</p>}
                {estimatedPayout && (
                  <p className="text-right mt-1.5 font-bold text-xs" style={{ color: '#006e2a' }}>
                    Est. Payout: {estimatedPayout.currency} {estimatedPayout.amount}
                  </p>
                )}
              </div>
            </div>

            {/* ── Card Code ──────────────────────────────────── */}
            <div>
              <label style={labelStyle}>Gift Card Code / PIN</label>
              <input
                type="text"
                value={cardCode}
                onChange={e => { setCardCode(e.target.value); setErrors(er => ({ ...er, cardCode: '' })) }}
                placeholder="Enter the card code (e.g., XXXX-XXXX-XXXX-XXXX)"
                style={{
                  border: errors.cardCode ? '1px solid #ba1a1a' : '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  width: '100%',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: 'white',
                  color: '#1c1b1b',
                  letterSpacing: '0.5px',
                }}
                onFocus={e => e.target.style.borderColor = '#4b0082'}
                onBlur={e => e.target.style.borderColor = errors.cardCode ? '#ba1a1a' : '#e5e7eb'}
              />
              {errors.cardCode && <p style={{ color: '#ba1a1a', fontSize: '12px', marginTop: '4px' }}>{errors.cardCode}</p>}
              <p style={{ fontSize: '12px', color: '#7d7483', marginTop: '6px' }}>
                Enter the redemption code found on the back of your gift card. This is usually a series of numbers/letters.
              </p>
            </div>

            {/* Selected brand chip */}
            {selectedCard && (
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#f5f0ff', border: '1px solid #e9d5ff' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: '#4b0082' }}>
                    {selectedCard.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: '#1e1b4b', fontFamily: 'Manrope, sans-serif' }}>{selectedCard.name} Gift Card</p>
                    {denomination && <p className="text-xs" style={{ color: '#4c4451' }}>Value: ${denomination}</p>}
                  </div>
                </div>
                <button type="button" onClick={() => { handleCardTypeChange(''); setDenomination('') }}
                  className="text-xs font-bold hover:underline" style={{ color: '#4b0082', fontFamily: 'Inter, sans-serif' }}>
                  Change
                </button>
              </div>
            )}

            {/* ── Upload Visual Proof ───────────────────────── */}
            <div className="space-y-5">
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 600, color: '#1e1b4b' }}>Upload Card Image</h3>
              <UploadZone
                label="Front of Card"
                hint="PNG, JPG up to 10MB"
                file={frontFile}
                preview={frontPreview}
                onChange={(f, p) => { setFrontFile(f); setFrontPreview(p) }}
              />
              {frontFile && (
                <p className="text-xs" style={{ color: '#4c4451' }}>{frontFile.name}</p>
              )}
            </div>

          </div>

          {/* ── Footer Actions ─────────────────────────────── */}
          <div className="px-8 py-5 flex flex-col md:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid #f1f5f9', backgroundColor: '#fcf9f8' }}>
            <button
              type="button"
              onClick={saveDraft}
              className="w-full md:w-auto px-8 py-3 font-bold rounded-lg hover:bg-indigo-50 transition-colors"
              style={{ border: '1px solid #1e1b4b', color: '#1e1b4b', fontFamily: 'Manrope, sans-serif', fontSize: '14px' }}
            >
              Save as Draft
            </button>
            <div className="flex gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 font-bold rounded-lg hover:bg-gray-50 transition-colors"
                style={{ color: '#7d7483', fontFamily: 'Manrope, sans-serif', fontSize: '14px' }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 md:flex-none px-10 py-3 text-white font-bold rounded-lg transition-all active:scale-[0.98] disabled:opacity-60"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', fontSize: '14px', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}
              >
                {isSubmitting ? 'Submitting…' : 'Submit for Verification'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { icon: '🛡️', title: 'Escrow Protected', desc: 'Funds held securely during verification', color: '#006e2a' },
          { icon: '⚡', title: 'Instant Processing', desc: 'Automated OCR card validation', color: '#4b0082' },
          { icon: '🎧', title: '24/7 Support', desc: 'Real-time assistance for traders', color: '#7b41b3' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="flex items-center gap-4">
            <span style={{ fontSize: '28px' }}>{icon}</span>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider" style={{ color: '#1e1b4b', fontFamily: 'Inter, sans-serif' }}>{title}</p>
              <p style={{ fontSize: '13px', color: '#4c4451' }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
