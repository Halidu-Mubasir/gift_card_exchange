'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface CardType { id: string; name: string }
interface Rate {
  id: string
  cardTypeId: string
  denomination: number
  ratePerDollar: number
  currency: string
  cardType: { name: string }
}

const DENOMINATIONS = [25, 50, 100, 200]
const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

const inputStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px',
  fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none',
}

export default function AdminRatesPage() {
  const [rates, setRates] = useState<Rate[]>([])
  const [cardTypes, setCardTypes] = useState<CardType[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [showAddType, setShowAddType] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [showAddRate, setShowAddRate] = useState(false)
  const [newRate, setNewRate] = useState({ cardTypeId: '', denomination: '', ratePerDollar: '' })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function load() {
    Promise.all([
      fetch('/api/rates').then(r => r.json()),
      fetch('/api/card-types').then(r => r.json()),
    ]).then(([rData, tData]) => {
      if (rData.success) setRates(rData.data)
      if (tData.success) setCardTypes(tData.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    load()
  }, [])

  async function saveRate(rate: Rate) {
    const val = parseFloat(editValue)
    if (isNaN(val) || val <= 0) { toast.error('Enter a valid rate'); return }
    const res = await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardTypeId: rate.cardTypeId, denomination: rate.denomination, ratePerDollar: val, currency: rate.currency }),
    })
    const json = await res.json()
    if (!json.success) { toast.error('Failed to save rate'); return }
    toast.success('Rate updated!')
    setEditingId(null)
    load()
  }

  async function addCardType() {
    if (!newTypeName.trim()) return
    const res = await fetch('/api/card-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTypeName.trim() }),
    })
    const json = await res.json()
    if (!json.success) { toast.error('Failed to add card type'); return }
    toast.success(`${newTypeName} added!`)
    setShowAddType(false)
    setNewTypeName('')
    load()
  }

  async function addRate() {
    const denom = parseFloat(newRate.denomination)
    const rate = parseFloat(newRate.ratePerDollar)
    if (!newRate.cardTypeId || isNaN(denom) || isNaN(rate)) { toast.error('Fill in all fields'); return }
    const res = await fetch('/api/rates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cardTypeId: newRate.cardTypeId, denomination: denom, ratePerDollar: rate, currency: 'GHS' }),
    })
    const json = await res.json()
    if (!json.success) { toast.error('Failed to add rate'); return }
    toast.success('Rate added!')
    setShowAddRate(false)
    setNewRate({ cardTypeId: '', denomination: '', ratePerDollar: '' })
    load()
  }

  async function deleteRate(rateId: string) {
    const res = await fetch(`/api/rates/${rateId}`, { method: 'DELETE' })
    const json = await res.json()
    if (!json.success) { toast.error('Failed to delete rate'); return }
    toast.success('Rate deleted!')
    setDeleteConfirm(null)
    load()
  }

  const grouped = rates.reduce<Record<string, Rate[]>>((acc, r) => {
    const name = r.cardType?.name ?? 'Unknown'
    if (!acc[name]) acc[name] = []
    acc[name].push(r)
    return acc
  }, {})

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '24px', fontWeight: 600, letterSpacing: '-0.01em', color: '#1e1b4b' }}>Exchange Rates</h1>
          <p style={{ fontSize: '14px', color: '#4c4451' }}>Set and manage payout rates per card type and denomination.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddRate(true)}
            className="flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg transition-colors"
            style={{ border: '1px solid #4b0082', color: '#4b0082', fontFamily: 'Manrope, sans-serif' }}>
            + Add Rate
          </button>
          <button onClick={() => setShowAddType(true)}
            className="flex items-center gap-2 px-4 py-2 font-bold text-sm rounded-lg text-white transition-all active:scale-[0.98]"
            style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif', boxShadow: '0 4px 12px rgba(75,0,130,0.2)' }}>
            + Add Card Type
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-2xl" style={{ boxShadow: cardShadow }}>Loading rates...</div>
      ) : (
        Object.entries(grouped).map(([typeName, typeRates]) => (
          <div key={typeName} className="bg-white border border-gray-100 rounded-2xl overflow-hidden" style={{ boxShadow: cardShadow }}>
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid #f1f5f9', backgroundColor: 'rgba(248,250,252,0.5)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: '#4b0082' }}>
                {typeName.slice(0, 2).toUpperCase()}
              </div>
              <h3 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px', fontWeight: 700, color: '#1e1b4b' }}>{typeName}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: 'rgba(248,250,252,0.3)' }}>
                  <tr>
                    {['Denomination', 'Rate per $1', 'Payout per Card', 'Currency', 'Actions'].map(h => (
                      <th key={h} className="text-left px-6 py-3 text-[11px] font-bold text-slate-400 uppercase" style={{ letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typeRates.sort((a, b) => a.denomination - b.denomination).map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors" style={{ borderTop: '1px solid #f9fafb' }}>
                      <td className="px-6 py-4 font-bold text-indigo-900" style={{ fontFamily: 'Manrope, sans-serif' }}>${r.denomination}</td>
                      <td className="px-6 py-4">
                        {editingId === r.id ? (
                          <input type="number" step="0.01" value={editValue} onChange={e => setEditValue(e.target.value)}
                            style={{ ...inputStyle, width: '100px' }} autoFocus
                            onFocus={e => e.target.style.borderColor = '#4b0082'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                        ) : (
                          <span className="font-semibold text-sm">{r.ratePerDollar} GHS/$</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#15803d', fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                        GHS {(r.denomination * r.ratePerDollar).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">{r.currency}</td>
                      <td className="px-6 py-4">
                        {editingId === r.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => saveRate(r)} className="px-3 py-1.5 text-white text-xs font-bold rounded-lg" style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif' }}>Save</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-bold rounded-lg" style={{ border: '1px solid #e5e7eb', color: '#4c4451' }}>Cancel</button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingId(r.id); setEditValue(String(r.ratePerDollar)) }}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors"
                              style={{ border: '1px solid #cec3d3', color: '#4b0082', fontFamily: 'Inter, sans-serif' }}>
                              ✎ Edit
                            </button>
                            <button onClick={() => setDeleteConfirm(r.id)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg hover:bg-red-50 transition-colors"
                              style={{ border: '1px solid #fecaca', color: '#dc2626', fontFamily: 'Inter, sans-serif' }}>
                              🗑 Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Add Card Type Modal */}
      {showAddType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 20px 60px rgba(75,0,130,0.15)' }}>
            <h3 className="mb-5" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>Add New Card Type</h3>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Card Type Name</label>
            <input value={newTypeName} onChange={e => setNewTypeName(e.target.value)} placeholder="e.g. Visa, Razer Gold..."
              style={{ ...inputStyle, width: '100%', marginBottom: '20px' }}
              onFocus={e => e.target.style.borderColor = '#4b0082'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
            <div className="flex gap-3">
              <button onClick={() => setShowAddType(false)} className="flex-1 py-3 font-bold rounded-xl" style={{ border: '1px solid #cec3d3', color: '#4c4451', fontFamily: 'Manrope, sans-serif' }}>Cancel</button>
              <button disabled={!newTypeName.trim()} onClick={addCardType}
                className="flex-1 py-3 text-white font-bold rounded-xl disabled:opacity-50"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif' }}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Rate Modal */}
      {showAddRate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 20px 60px rgba(75,0,130,0.15)' }}>
            <h3 className="mb-5" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>Add Exchange Rate</h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Card Type</label>
                <select value={newRate.cardTypeId} onChange={e => setNewRate(p => ({ ...p, cardTypeId: e.target.value ?? '' }))}
                  style={{ ...inputStyle, width: '100%' }} onFocus={e => e.target.style.borderColor = '#4b0082'} onBlur={e => e.target.style.borderColor = '#e5e7eb'}>
                  <option value="">Select card type...</option>
                  {cardTypes.map(ct => <option key={ct.id} value={ct.id}>{ct.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Denomination ($)</label>
                <input type="number" step="1" min="1" placeholder="e.g. 25, 50, 100..." value={newRate.denomination}
                  onChange={e => setNewRate(p => ({ ...p, denomination: e.target.value }))}
                  style={{ ...inputStyle, width: '100%' }} onFocus={e => e.target.style.borderColor = '#4b0082'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
                <p className="mt-1 text-[10px] text-slate-400" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Common: ${DENOMINATIONS.join(', $')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>Rate per $1 (GHS)</label>
                <input type="number" step="0.01" placeholder="e.g. 12.50" value={newRate.ratePerDollar}
                  onChange={e => setNewRate(p => ({ ...p, ratePerDollar: e.target.value }))}
                  style={{ ...inputStyle, width: '100%' }} onFocus={e => e.target.style.borderColor = '#4b0082'} onBlur={e => e.target.style.borderColor = '#e5e7eb'} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAddRate(false)} className="flex-1 py-3 font-bold rounded-xl" style={{ border: '1px solid #cec3d3', color: '#4c4451', fontFamily: 'Manrope, sans-serif' }}>Cancel</button>
              <button onClick={addRate}
                className="flex-1 py-3 text-white font-bold rounded-xl"
                style={{ backgroundColor: '#4b0082', fontFamily: 'Manrope, sans-serif' }}>
                Add Rate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm" style={{ boxShadow: '0 20px 60px rgba(75,0,130,0.15)' }}>
            <h3 className="mb-3" style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 700, color: '#1e1b4b' }}>Delete Rate?</h3>
            <p className="mb-6 text-sm" style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif' }}>
              Are you sure you want to delete this denomination? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 font-bold rounded-xl" style={{ border: '1px solid #cec3d3', color: '#4c4451', fontFamily: 'Manrope, sans-serif' }}>Cancel</button>
              <button onClick={() => deleteRate(deleteConfirm)}
                className="flex-1 py-3 text-white font-bold rounded-xl"
                style={{ backgroundColor: '#dc2626', fontFamily: 'Manrope, sans-serif' }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
