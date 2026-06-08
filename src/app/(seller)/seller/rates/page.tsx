'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Search, Grid3x3, Shield, Zap } from 'lucide-react'
import Link from 'next/link'

interface Rate {
  id: string
  cardTypeId: string
  denomination: number
  ratePerDollar: number
  currency: string
  cardType: { name: string; logoUrl?: string | null }
}

interface CardTypeRates {
  cardType: string
  logoUrl?: string | null
  rates: Array<{
    denomination: number
    ratePerDollar: number
    currency: string
    totalPayout: number
  }>
}

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

export default function SellerRatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRates(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Group rates by card type (keep individual denominations)
  const cardTypeRates: CardTypeRates[] = Object.entries(
    rates.reduce<Record<string, Rate[]>>((acc, r) => {
      const name = r.cardType?.name ?? 'Unknown'
      if (!acc[name]) acc[name] = []
      acc[name].push(r)
      return acc
    }, {})
  ).map(([name, typeRates]) => ({
    cardType: name,
    logoUrl: typeRates[0].cardType.logoUrl,
    rates: typeRates
      .sort((a, b) => a.denomination - b.denomination)
      .map(r => ({
        denomination: r.denomination,
        ratePerDollar: r.ratePerDollar,
        currency: r.currency,
        totalPayout: r.denomination * r.ratePerDollar,
      })),
  }))

  const filteredRates = cardTypeRates.filter(r =>
    r.cardType.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '48px', fontWeight: 700, letterSpacing: '-0.02em', color: '#2e0052', lineHeight: '56px' }}>
          Current Market Rates
        </h1>
        <p style={{ fontSize: '16px', color: '#4c4451', lineHeight: '24px', marginTop: '8px', maxWidth: '600px' }}>
          Our rates are updated in real-time based on global market demand. Different denominations have different rates - higher amounts typically get better rates.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm focus:ring-2 focus:ring-[#4b0082] focus:border-transparent transition-all outline-none"
            style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px' }}
            placeholder="Search by brand name (e.g. Amazon, iTunes)..."
          />
        </div>
        <div className="md:col-span-4 flex gap-3">
          <select className="flex-1 px-4 py-4 rounded-2xl border border-gray-200 bg-white shadow-sm text-sm font-semibold text-slate-600 outline-none"
            style={{ fontFamily: 'Inter, sans-serif' }}>
            <option>All Regions</option>
            <option>USA</option>
            <option>UK</option>
            <option>Europe</option>
          </select>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#4b0082] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-slate-400 text-sm">Loading rates...</p>
        </div>
      ) : filteredRates.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm bg-white rounded-2xl" style={{ boxShadow: cardShadow }}>
          {searchQuery ? 'No cards found matching your search.' : 'No exchange rates available at the moment.'}
        </div>
      ) : (
        <>
          {/* Rates Grid - Card Type Sections */}
          <div className="space-y-6">
            {filteredRates.map((cardGroup) => (
              <div
                key={cardGroup.cardType}
                className="bg-white rounded-[2rem] border border-gray-200 overflow-hidden"
                style={{ boxShadow: cardShadow }}
              >
                {/* Card Type Header */}
                <div className="p-6 flex items-center gap-4 border-b border-gray-100" style={{ backgroundColor: 'rgba(248,250,252,0.5)' }}>
                  <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center p-3 overflow-hidden">
                    {cardGroup.logoUrl ? (
                      <img
                        src={cardGroup.logoUrl}
                        alt={`${cardGroup.cardType} logo`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif', backgroundColor: '#4b0082', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem' }}>
                        {cardGroup.cardType.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.01em', color: '#2e0052' }}>
                      {cardGroup.cardType}
                    </h2>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>
                      {cardGroup.rates.length} denomination{cardGroup.rates.length !== 1 ? 's' : ''} available
                    </p>
                  </div>
                </div>

                {/* Denomination Rates Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead style={{ backgroundColor: 'rgba(248,250,252,0.3)' }}>
                      <tr>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>Card Value</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>Rate per $1</th>
                        <th className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>You Receive</th>
                        <th className="text-right px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardGroup.rates.map((rate, idx) => (
                        <tr key={rate.denomination} className="hover:bg-slate-50/60 transition-colors border-t border-gray-50">
                          <td className="px-6 py-4">
                            <span className="font-bold text-indigo-900 text-lg" style={{ fontFamily: 'Manrope, sans-serif' }}>
                              ${rate.denomination}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm" style={{ color: '#4b0082' }}>
                                {rate.ratePerDollar.toFixed(2)} {rate.currency}/$
                              </span>
                              {idx > 0 && cardGroup.rates[idx - 1].ratePerDollar !== rate.ratePerDollar && (
                                <span className={`text-xs font-semibold ${rate.ratePerDollar > cardGroup.rates[idx - 1].ratePerDollar ? 'text-green-600' : 'text-orange-600'}`}>
                                  {rate.ratePerDollar > cardGroup.rates[idx - 1].ratePerDollar ? (
                                    <TrendingUp size={14} className="inline" />
                                  ) : (
                                    <TrendingDown size={14} className="inline" />
                                  )}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-lg" style={{ color: '#15803d', fontFamily: 'Manrope, sans-serif' }}>
                              {rate.currency} {rate.totalPayout.toFixed(2)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Link href="/seller/submit">
                              <button className="px-4 py-2 rounded-xl border-2 border-[#2e0052] text-[#2e0052] text-sm font-bold hover:bg-[#2e0052] hover:text-white transition-all active:scale-95"
                                style={{ fontFamily: 'Manrope, sans-serif' }}>
                                Sell Now
                              </button>
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Best Rate Badge (if applicable) */}
                {cardGroup.rates.length > 1 && (
                  <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-sm">
                      <Zap size={16} className="text-indigo-600" fill="currentColor" />
                      <span style={{ color: '#4b0082', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                        Best rate: ${Math.max(...cardGroup.rates.map(r => r.denomination))} gets {Math.max(...cardGroup.rates.map(r => r.ratePerDollar)).toFixed(2)} {cardGroup.rates[0].currency}/$
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Help Section */}
          <div className="mt-16 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-10 relative overflow-hidden text-white">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-center md:text-left max-w-xl">
                <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', marginBottom: '16px' }}>
                  Questions about our rates?
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '24px', color: '#bfdbfe' }}>
                  Rates vary by denomination because larger amounts are more valuable to buyers. Our support team can explain why rates change and help with bulk trading.
                </p>
              </div>
              <div className="flex gap-4 flex-shrink-0">
                <Link href="/seller/messages">
                  <button className="px-8 py-4 bg-white text-indigo-950 font-bold rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg"
                    style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Chat with Support
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
