'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Submission {
  id: string
  denomination: number
  status: string
  createdAt: string
  cardType: { name: string }
  payout?: { amount: number; currency: string } | null
}

interface Rate {
  id: string
  cardTypeId: string
  denomination: number
  ratePerDollar: number
  currency: string
  cardType: { name: string; logoUrl?: string | null }
}

interface TopRate {
  cardType: string
  logoUrl?: string | null
  avgRate: number
  color: string
}

const statusStyle: Record<string, { bg: string; text: string; dotColor: string; pulse?: boolean }> = {
  PENDING: { bg: '#fffbeb', text: '#92400e', dotColor: '#f59e0b', pulse: true },
  UNDER_REVIEW: { bg: '#eff6ff', text: '#1d4ed8', dotColor: '#3b82f6' },
  APPROVED: { bg: '#eff6ff', text: '#3730a3', dotColor: '#6366f1' },
  REJECTED: { bg: '#fef2f2', text: '#b91c1c', dotColor: '#ef4444' },
  PAID: { bg: '#f0fdf4', text: '#15803d', dotColor: '#22c55e' },
}

function StatusChip({ status }: { status: string }) {
  const s = statusStyle[status] ?? { bg: '#f1f5f9', text: '#475569', dotColor: '#94a3b8' }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ backgroundColor: s.bg, color: s.text, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
      <span className={`w-1.5 h-1.5 rounded-full${s.pulse ? ' animate-pulse' : ''}`} style={{ backgroundColor: s.dotColor }} />
      {status.replace('_', ' ')}
    </span>
  )
}

export default function SellerDashboardPage() {
  const router = useRouter()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [topRates, setTopRates] = useState<TopRate[]>([])
  const [loading, setLoading] = useState(true)
  const [ratesLoading, setRatesLoading] = useState(true)

  useEffect(() => {
    fetch('/api/submissions').then(r => r.json()).then(d => { if (d.success) setSubmissions(d.data) }).finally(() => setLoading(false))

    fetch('/api/rates').then(r => r.json()).then(d => {
      if (d.success) {
        const rates: Rate[] = d.data
        // Group by card type and calculate average rate
        const grouped = rates.reduce<Record<string, Rate[]>>((acc, r) => {
          const name = r.cardType?.name ?? 'Unknown'
          if (!acc[name]) acc[name] = []
          acc[name].push(r)
          return acc
        }, {})

        // Get top 3 card types with colors
        const colors = ['#fed7aa', '#bfdbfe', '#bbf7d0', '#fde68a', '#e9d5ff']
        const top = Object.entries(grouped)
          .map(([name, ratesArr], idx) => ({
            cardType: name,
            logoUrl: ratesArr[0].cardType.logoUrl,
            avgRate: ratesArr.reduce((sum, r) => sum + r.ratePerDollar, 0) / ratesArr.length,
            color: colors[idx % colors.length],
          }))
          .slice(0, 3)
        setTopRates(top)
      }
    }).finally(() => setRatesLoading(false))
  }, [])

  const total = submissions.length
  const pending = submissions.filter(s => s.status === 'PENDING' || s.status === 'UNDER_REVIEW').length
  const approved = submissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length
  const earned = submissions.filter(s => s.payout).reduce((sum, s) => sum + (s.payout?.amount ?? 0), 0)
  const recent = submissions.slice(0, 5)

  const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-indigo-950 mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Welcome back
          </h1>
          <p style={{ color: '#4c4451', fontSize: '14px', fontFamily: 'Inter, sans-serif' }}>Your market operations are running smoothly.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-green-700 text-xs font-bold uppercase tracking-widest" style={{ fontFamily: 'Inter, sans-serif' }}>System: Secure</span>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Main earnings card */}
        <div className="md:col-span-8 bg-white border border-gray-100 rounded-2xl p-8 relative overflow-hidden" style={{ boxShadow: cardShadow }}>
          <div className="absolute top-0 right-0 w-56 h-56 bg-indigo-50/50 rounded-full -mr-16 -mt-16 z-0" />
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-1" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Total Net Earnings</p>
            <div className="flex items-end gap-4 mb-8">
              <h2 className="text-indigo-900" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                GHS {earned.toFixed(2)}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Total Submitted', value: String(total) },
                { label: 'Pending Review', value: String(pending) },
                { label: 'Approved', value: String(approved) },
              ].map(({ label, value }) => (
                <div key={label} className="p-4 rounded-xl border" style={{ backgroundColor: '#f6f3f2', borderColor: '#cec3d3' }}>
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.03em' }}>{label}</p>
                  <p className="font-bold text-indigo-950 text-xl" style={{ fontFamily: 'Manrope, sans-serif' }}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Card */}
        <div className="md:col-span-4 rounded-2xl p-8 flex flex-col justify-between text-white relative overflow-hidden" style={{ backgroundColor: '#4b0082', boxShadow: '0 8px 24px rgba(75,0,130,0.3)' }}>
          <div className="relative z-10">
            <h3 className="mb-3 leading-tight" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px', fontWeight: 600 }}>Liquidate Assets Instantly</h3>
            <p className="mb-8 opacity-80 text-sm leading-relaxed">Exchange your premium gift cards for secure MoMo transfers within minutes.</p>
            <Link
              href="/seller/submit"
              className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:bg-indigo-50 active:scale-[0.98]"
              style={{ backgroundColor: 'white', color: '#1e1b4b', fontFamily: 'Manrope, sans-serif', fontSize: '15px' }}
            >
              Sell a Card →
            </Link>
            <button
              onClick={() => router.push('/seller/messages')}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] border border-white/30 hover:bg-white/10"
              style={{ color: 'white', fontFamily: 'Manrope, sans-serif', fontSize: '14px', marginTop: '10px' }}
            >
              💬 Chat with Admin
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 opacity-50 text-xs font-bold tracking-widest uppercase">
            <span>🛡️</span> Secured by Trade Nest Escrow
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full opacity-10 bg-white" />
        </div>

        {/* Recent Activity */}
        <div className="md:col-span-8 bg-white border border-gray-100 rounded-2xl p-8" style={{ boxShadow: cardShadow }}>
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-indigo-950 font-bold" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px' }}>Recent Activity</h3>
            <Link href="/seller/history" className="text-sm font-semibold hover:underline" style={{ color: '#4b0082' }}>View all history</Link>
          </div>
          {loading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading...</div>
          ) : recent.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No submissions yet. <Link href="/seller/submit" style={{ color: '#4b0082' }} className="font-semibold hover:underline">Submit your first card</Link></div>
          ) : (
            <div className="space-y-2">
              {recent.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-xl transition-colors border border-transparent hover:border-indigo-50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#f0edec' }}>
                      <span className="text-indigo-900 font-bold text-xs">{s.cardType.name.slice(0, 2).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-indigo-950 text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{s.cardType.name} Gift Card</p>
                      <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="font-bold text-indigo-950 text-sm">${s.denomination}</p>
                    <StatusChip status={s.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Market Rates */}
        <div className="md:col-span-4 bg-white border border-gray-100 rounded-2xl p-6" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center justify-between mb-5">
            <h4 className="font-bold text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>Market Rates</h4>
            <Link href="/seller/rates" className="text-xs font-bold hover:underline" style={{ color: '#4b0082', fontFamily: 'Inter, sans-serif' }}>
              View All →
            </Link>
          </div>
          {ratesLoading ? (
            <div className="py-8 text-center text-slate-400 text-sm">Loading rates...</div>
          ) : topRates.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">No rates available</div>
          ) : (
            <div className="space-y-4">
              {topRates.map(({ cardType, logoUrl, avgRate, color }) => (
                <div key={cardType} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden bg-slate-50 border border-slate-100 p-1">
                      {logoUrl ? (
                        <img
                          src={logoUrl}
                          alt={`${cardType} logo`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="text-xs font-bold" style={{ backgroundColor: color, color: 'white', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.25rem' }}>
                          {cardType[0]}
                        </span>
                      )}
                    </div>
                    <span className="font-semibold text-indigo-900">{cardType}</span>
                  </div>
                  <span className="font-bold" style={{ color: '#006e2a' }}>
                    {avgRate.toFixed(2)} GHS/$
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-slate-400 text-center" style={{ fontFamily: 'Inter, sans-serif' }}>Rates update in real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}
