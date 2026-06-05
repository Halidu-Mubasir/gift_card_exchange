'use client'

import { useEffect, useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Rate {
  id: string
  cardTypeId: string
  denomination: number
  ratePerDollar: number
  currency: string
  cardType: { name: string }
}

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

export default function SellerRatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRates(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const grouped = rates.reduce<Record<string, Rate[]>>((acc, r) => {
    const name = r.cardType?.name ?? 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(r)
    return acc
  }, {})

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#4b0082' }}>
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#1e1b4b' }}>
              Current Exchange Rates
            </h1>
            <p style={{ fontSize: '14px', color: '#4c4451' }}>
              Compare rates across different card types and denominations
            </p>
          </div>
        </div>

        {/* Trust badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg w-fit" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1e40af' }}>
            ✓ Rates updated in real-time
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl" style={{ boxShadow: cardShadow }}>
          Loading rates...
        </div>
      ) : Object.keys(grouped).length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl" style={{ boxShadow: cardShadow }}>
          No exchange rates available at the moment.
        </div>
      ) : (
        Object.entries(grouped).map(([typeName, typeRates]) => (
          <div key={typeName} className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
            {/* Card Type Header */}
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: 'rgba(248,250,252,0.5)' }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: '#4b0082' }}>
                {typeName.slice(0, 2).toUpperCase()}
              </div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>
                {typeName}
              </h3>
            </div>

            {/* Rates Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(248,250,252,0.3)' }}>
                  <tr>
                    {['Card Value', 'Rate per $1', 'You Receive', 'Currency'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typeRates.sort((a, b) => a.denomination - b.denomination).map((r, idx) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderTop: idx === 0 ? 'none' : '1px solid #f9fafb' }}>
                      <td className="px-6 py-4 font-bold text-indigo-900" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '15px' }}>
                        ${r.denomination}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-sm" style={{ color: '#4b0082' }}>
                          {r.ratePerDollar} GHS/$
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#15803d', fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '15px' }}>
                        GHS {(r.denomination * r.ratePerDollar).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {r.currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Footer Info */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl p-6 border border-purple-100" style={{ boxShadow: cardShadow }}>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1">
            <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#4b0082', marginBottom: '8px' }}>
              Ready to sell your gift cards?
            </h3>
            <p style={{ fontSize: '13px', color: '#4c4451', lineHeight: '1.6' }}>
              Submit your cards now and receive instant payout estimates based on these current rates.
            </p>
          </div>
          <a href="/seller/submit"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-sm rounded-xl text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', boxShadow: '0 4px 12px rgba(75,0,130,0.2)', whiteSpace: 'nowrap' }}>
            Sell Gift Card →
          </a>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { icon: '🛡️', label: 'Escrow Protected', desc: 'Your cards are secure' },
          { icon: '⚡', label: 'Instant Processing', desc: 'Fast verification' },
          { icon: '🎧', label: '24/7 Support', desc: 'Always here to help' },
        ].map(badge => (
          <div key={badge.label} className="flex items-center gap-3 bg-white rounded-xl p-4" style={{ boxShadow: cardShadow }}>
            <span style={{ fontSize: '24px' }}>{badge.icon}</span>
            <div>
              <div style={{ fontFamily: 'Manrope, sans-serif', fontSize: '13px', fontWeight: 700, color: '#1e1b4b' }}>
                {badge.label}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {badge.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
