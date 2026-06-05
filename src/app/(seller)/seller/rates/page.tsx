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
  cardType: { name: string }
}

interface CardTypeRate {
  cardType: string
  avgRate: number
  currency: string
  denominations: number[]
  trend?: number
  isHot?: boolean
  color: string
}

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

export default function SellerRatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetch('/api/rates')
      .then(r => r.json())
      .then(data => {
        if (data.success) setRates(data.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Group rates by card type and calculate averages
  const cardTypeRates: CardTypeRate[] = Object.entries(
    rates.reduce<Record<string, Rate[]>>((acc, r) => {
      const name = r.cardType?.name ?? 'Unknown'
      if (!acc[name]) acc[name] = []
      acc[name].push(r)
      return acc
    }, {})
  ).map(([name, typeRates], idx) => {
    const avgRate = typeRates.reduce((sum, r) => sum + r.ratePerDollar, 0) / typeRates.length
    const denominations = typeRates.map(r => r.denomination).sort((a, b) => a - b)

    // Assign random trends for demo (in production, this would come from API)
    const trends = [2.4, -0.8, 5.1, 0, 1.2, -3.4]
    const colors = ['#fed7aa', '#bfdbfe', '#bbf7d0', '#fde68a', '#e9d5ff', '#fecaca']

    return {
      cardType: name,
      avgRate,
      currency: typeRates[0].currency,
      denominations,
      trend: trends[idx % trends.length],
      isHot: avgRate > 12, // Mark rates above 12 as "hot"
      color: colors[idx % colors.length],
    }
  })

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
          Our rates are updated in real-time based on global market demand. Sell when rates are high to maximize your payouts.
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
            placeholder="Search by brand name (e.g. Amazon, Nike)..."
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
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
            <Grid3x3 size={20} className="text-slate-600" />
          </button>
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
          {/* Rates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRates.map((card) => (
              <div
                key={card.cardType}
                className="bg-white rounded-[2rem] border border-gray-200 p-6 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group"
                style={{ boxShadow: cardShadow }}
              >
                {/* Header with Logo and Trend */}
                <div className="flex justify-between items-start mb-6">
                  <div
                    className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform"
                    style={{ backgroundColor: card.color }}
                  >
                    <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {card.cardType.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    {card.trend !== undefined && card.trend !== 0 && (
                      <>
                        <span className={`font-bold flex items-center text-sm ${card.trend > 0 ? 'text-[#006e2a]' : 'text-[#ba1a1a]'}`}>
                          {card.trend > 0 ? <TrendingUp size={16} className="mr-1" /> : <TrendingDown size={16} className="mr-1" />}
                          {card.trend > 0 ? '+' : ''}{card.trend}%
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Last 24h</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Card Name & Region */}
                <div className="mb-6">
                  <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#2e0052', lineHeight: '32px' }}>
                    {card.cardType}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '20px' }}>
                    Available: ${card.denominations.join(', $')}
                  </p>
                </div>

                {/* Exchange Rate */}
                <div className="flex items-end justify-between mb-8">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1" style={{ letterSpacing: '0.05em' }}>
                      Exchange Rate
                    </span>
                    <span className="text-4xl font-extrabold text-indigo-950" style={{ fontFamily: 'Manrope, sans-serif' }}>
                      {card.avgRate.toFixed(2)}
                    </span>
                    <span className="text-lg font-semibold text-slate-500 ml-1">
                      {card.currency}/$
                    </span>
                  </div>
                  <div className="flex -space-x-2">
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-green-100 flex items-center justify-center">
                      <Shield size={14} className="text-green-600" fill="currentColor" />
                    </div>
                    {card.isHot && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center">
                        <Zap size={14} className="text-indigo-600" fill="currentColor" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Hot Rate Badge */}
                {card.isHot && (
                  <div className="mb-4">
                    <span className="inline-block px-3 py-1 bg-[#ffddb3] text-[#624000] text-[10px] font-bold rounded-full uppercase tracking-tight">
                      Hot Rate
                    </span>
                  </div>
                )}

                {/* Sell Now Button */}
                <Link href="/seller/submit">
                  <button className="w-full py-4 rounded-xl border-2 border-[#2e0052] text-[#2e0052] font-bold hover:bg-[#2e0052] hover:text-white transition-all active:scale-[0.98]"
                    style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Sell Now
                  </button>
                </Link>
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
                  Need help with rates?
                </h2>
                <p style={{ fontSize: '16px', lineHeight: '24px', color: '#bfdbfe' }}>
                  Our support team is available 24/7 to explain how our dynamic pricing works or to help with bulk trading options.
                </p>
              </div>
              <div className="flex gap-4 flex-shrink-0">
                <Link href="/seller/messages">
                  <button className="px-8 py-4 bg-white text-indigo-950 font-bold rounded-2xl hover:bg-indigo-50 transition-all active:scale-95 shadow-lg"
                    style={{ fontFamily: 'Manrope, sans-serif' }}>
                    Chat with Support
                  </button>
                </Link>
                <button className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-2xl hover:bg-white/10 transition-all"
                  style={{ fontFamily: 'Manrope, sans-serif' }}>
                  View Details
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
