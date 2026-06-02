'use client'

import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

interface Submission {
  id: string
  denomination: number
  status: string
  createdAt: string
  seller: { name: string; email: string }
  cardType: { name: string }
  payout?: { amount: number } | null
}

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

const statusStyle: Record<string, { bg: string; text: string; dot: string }> = {
  PENDING: { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' },
  UNDER_REVIEW: { bg: '#eff6ff', text: '#3730a3', dot: '#6366f1' },
  APPROVED: { bg: '#eff6ff', text: '#3730a3', dot: '#6366f1' },
  PAID: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  REJECTED: { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444' },
}

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/submissions').then(r => r.json()).then(d => { if (d.success) setSubmissions(d.data) }).finally(() => setLoading(false))
  }, [])

  const today = new Date().toDateString()
  const todayCount = submissions.filter(s => new Date(s.createdAt).toDateString() === today).length
  const pendingCount = submissions.filter(s => s.status === 'PENDING').length
  const totalPaidOut = submissions.filter(s => s.payout).reduce((sum, s) => sum + (s.payout?.amount ?? 0), 0)
  const uniqueSellers = new Set(submissions.map(s => s.seller?.email)).size

  const chartData = Object.entries(
    submissions.reduce<Record<string, number>>((acc, s) => {
      const name = s.cardType?.name ?? 'Unknown'
      acc[name] = (acc[name] ?? 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name, count }))

  const recent = submissions.slice(0, 8)

  return (
    <div className="space-y-8 max-w-6xl" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-indigo-900 mb-1" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            Platform Overview
          </h1>
          <p style={{ color: '#4c4451', fontSize: '14px' }}>Real-time performance metrics and operational status.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold" style={{ borderColor: '#cec3d3', color: '#4c4451', fontFamily: 'Inter, sans-serif' }}>
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            System: Secure
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Submissions Today', value: String(todayCount), icon: '📊', iconBg: '#eff6ff', trend: null },
          { label: 'Pending Review', value: String(pendingCount), icon: '⏳', iconBg: '#fffbeb', trend: 'High Priority' },
          { label: 'Total Paid Out', value: `GHS ${totalPaidOut.toFixed(2)}`, icon: '💸', iconBg: '#f0fdf4', trend: null },
          { label: 'Active Sellers', value: String(uniqueSellers), icon: '👥', iconBg: '#f0fdf4', trend: null },
        ].map(({ label, value, icon, iconBg, trend }) => (
          <div key={label} className="bg-white border border-gray-100 rounded-xl p-6" style={{ boxShadow: cardShadow }}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-lg text-lg" style={{ backgroundColor: iconBg }}>{icon}</div>
              {trend && <span className="text-xs font-bold" style={{ color: '#92400e', fontFamily: 'Inter, sans-serif' }}>{trend}</span>}
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ letterSpacing: '0.05em' }}>{label}</p>
            <p className="font-bold text-indigo-900" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '22px' }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts + Table Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6" style={{ boxShadow: cardShadow }}>
          <div className="flex items-center justify-between mb-6">
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>Submissions by Card Type</h2>
          </div>
          {loading ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Loading chart...</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: 'Inter' }} />
                <Tooltip contentStyle={{ fontFamily: 'Inter', fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} />
                <Bar dataKey="count" fill="#4b0082" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Market Rates Quick View */}
        <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-6" style={{ boxShadow: cardShadow }}>
          <h2 className="mb-4" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: 'Approval Rate', value: submissions.length > 0 ? `${Math.round(submissions.filter(s => s.status === 'APPROVED' || s.status === 'PAID').length / submissions.length * 100)}%` : '—', color: '#15803d' },
              { label: 'Pending Rate', value: submissions.length > 0 ? `${Math.round(submissions.filter(s => s.status === 'PENDING').length / submissions.length * 100)}%` : '—', color: '#92400e' },
              { label: 'Rejection Rate', value: submissions.length > 0 ? `${Math.round(submissions.filter(s => s.status === 'REJECTED').length / submissions.length * 100)}%` : '—', color: '#b91c1c' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #f9fafb' }}>
                <span style={{ fontSize: '13px', color: '#475569', fontFamily: 'Inter, sans-serif' }}>{label}</span>
                <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px', color }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
          <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>Recent Submissions</h2>
          <a href="/admin/submissions" className="text-sm font-semibold hover:underline" style={{ color: '#4b0082' }}>View All →</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: 'rgba(248,250,252,0.5)', borderBottom: '1px solid #f1f5f9' }}>
              <tr>
                {['Seller', 'Card Type', 'Value', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[11px] font-bold text-slate-500 uppercase" style={{ letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-400">Loading...</td></tr>
              ) : recent.map(s => {
                const st = statusStyle[s.status] ?? { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8' }
                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors" style={{ borderBottom: '1px solid #f9fafb' }}>
                    <td className="px-6 py-4">
                      <p className="font-bold text-sm text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>{s.seller?.name}</p>
                      <p className="text-xs text-slate-400">{s.seller?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{s.cardType?.name}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#1e1b4b' }}>${s.denomination}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase" style={{ backgroundColor: st.bg, color: st.text, letterSpacing: '0.04em' }}>
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
