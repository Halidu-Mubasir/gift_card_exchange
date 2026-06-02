'use client'

import { useEffect, useState } from 'react'

interface Submission {
  id: string
  denomination: number
  cardCode: string
  status: string
  createdAt: string
  adminNote?: string | null
  cardType: { name: string }
  payout?: { amount: number; currency: string } | null
}

const STATUS_OPTIONS = ['ALL', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID']

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
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase" style={{ backgroundColor: s.bg, color: s.text, fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
      <span className={`w-1.5 h-1.5 rounded-full${s.pulse ? ' animate-pulse' : ''}`} style={{ backgroundColor: s.dotColor }} />
      {status.replace('_', ' ')}
    </span>
  )
}

export default function HistoryPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    const url = statusFilter !== 'ALL' ? `/api/submissions?status=${statusFilter}` : '/api/submissions'
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    fetch(url).then(r => r.json()).then(d => { if (d.success) setSubmissions(d.data) }).finally(() => setLoading(false))
  }, [statusFilter])

  const totalEarned = submissions.filter(s => s.payout).reduce((sum, s) => sum + (s.payout?.amount ?? 0), 0)
  const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

  return (
    <div className="max-w-6xl space-y-8" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5" style={{ backgroundColor: '#f0fdf4', color: '#15803d', fontFamily: 'Inter, sans-serif' }}>
              <span style={{ fontSize: '12px' }}>✓</span> SECURELY VERIFIED
            </span>
          </div>
          <h2 className="text-indigo-950 mb-2" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>Transaction History</h2>
          <p style={{ color: '#4c4451', fontSize: '14px' }}>Monitor your gift card sales, track pending verifications, and manage your earnings.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center gap-4" style={{ boxShadow: cardShadow }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#eff6ff' }}>
            <span style={{ color: '#4b0082' }}>💰</span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest" style={{ letterSpacing: '0.05em' }}>TOTAL EARNED</p>
            <p className="font-bold text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '20px' }}>GHS {totalEarned.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 bg-white border border-gray-100 rounded-xl p-4" style={{ boxShadow: cardShadow }}>
          <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">FILTER BY STATUS</label>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value ?? 'ALL')}
            className="w-full py-2.5 px-3 rounded-lg text-sm outline-none"
            style={{ border: '1px solid #e5e7eb', fontFamily: 'Inter, sans-serif' }}
          >
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: 'rgba(248,250,252,0.5)' }}>
                {['Transaction Date', 'Gift Card Brand', 'Card Value', 'Status', 'Amount Earned', 'Admin Note'].map(h => (
                  <th key={h} className="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest" style={{ letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody style={{ borderTop: 'none' }}>
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : submissions.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">No submissions found.</td></tr>
              ) : submissions.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/80 transition-colors" style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td className="px-6 py-5">
                    <p className="font-semibold text-indigo-950 text-sm">{new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center bg-indigo-50 text-xs font-bold text-indigo-900">{s.cardType.name.slice(0, 2).toUpperCase()}</div>
                      <span className="font-semibold text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>{s.cardType.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-sm text-slate-600">${s.denomination}</td>
                  <td className="px-6 py-5"><StatusChip status={s.status} /></td>
                  <td className="px-6 py-5">
                    <p className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', color: s.payout ? '#15803d' : '#94a3b8' }}>
                      {s.payout ? `${s.payout.currency} ${s.payout.amount.toFixed(2)}` : '—'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs text-slate-400 max-w-xs truncate block">{s.adminNote ?? '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
