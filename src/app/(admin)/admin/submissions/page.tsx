'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, ZoomIn, ZoomOut, RotateCcw, X } from 'lucide-react'
import { toast } from 'sonner'

interface Submission {
  id: string
  denomination: number
  cardImageUrl?: string | null
  status: string
  adminNote?: string | null
  createdAt: string
  seller: { id: string; name: string; email: string; momoNumber?: string | null }
  cardType: { name: string }
}

const ALL_STATUSES = ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PAID'] as const
const FILTER_OPTIONS = ['ALL', ...ALL_STATUSES]

const STATUS_META: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:      { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', label: 'Pending' },
  UNDER_REVIEW: { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b', label: 'Under Review' },
  APPROVED:     { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'Approved' },
  REJECTED:     { bg: '#fef2f2', text: '#b91c1c', dot: '#ef4444', label: 'Rejected' },
  PAID:         { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e', label: 'Paid' },
}

const cardShadow = '0 4px 20px rgba(75,0,130,0.04)'

function StatusChip({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', label: status }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase"
      style={{ backgroundColor: m.bg, color: m.text, letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: m.dot }} />
      {m.label}
    </span>
  )
}

async function downloadImage(imageUrl: string, fileName: string) {
  try {
    const response = await fetch(imageUrl)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Download failed')
  }
}

// ── Lightbox ─────────────────────────────────────────────────────────────────

function ToolBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title}
      className="flex items-center justify-center w-9 h-9 rounded-lg text-white transition-colors hover:bg-white/20">
      {children}
    </button>
  )
}

function ImageLightbox({
  imageUrl,
  fileName,
  onClose,
}: {
  imageUrl: string
  fileName: string
  onClose: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panAtDragStart = useRef({ x: 0, y: 0 })

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY * -0.001
    setZoom(z => Math.min(5, Math.max(0.5, z + delta * z)))
  }

  function handleMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY }
    panAtDragStart.current = { ...pan }
  }

  function handleMouseMove(e: React.MouseEvent) {
    if (!isDragging) return
    setPan({
      x: panAtDragStart.current.x + (e.clientX - dragStart.current.x) / zoom,
      y: panAtDragStart.current.y + (e.clientY - dragStart.current.y) / zoom,
    })
  }

  function handleMouseUp() { setIsDragging(false) }

  function reset() { setZoom(1); setPan({ x: 0, y: 0 }) }
  const zoomIn  = () => setZoom(z => Math.min(5, z * 1.25))
  const zoomOut = () => setZoom(z => Math.max(0.5, z / 1.25))

  return (
    <div className="fixed inset-0 z-50 bg-black/88 flex flex-col" onClick={onClose}>
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
        onClick={e => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm font-mono truncate max-w-xs">{fileName}</span>
        <div className="flex items-center gap-0.5">
          <ToolBtn onClick={zoomOut} title="Zoom out"><ZoomOut size={17} /></ToolBtn>
          <span className="text-white/50 text-xs w-12 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <ToolBtn onClick={zoomIn} title="Zoom in"><ZoomIn size={17} /></ToolBtn>
          <ToolBtn onClick={reset} title="Reset zoom"><RotateCcw size={17} /></ToolBtn>
          <div className="w-px h-5 mx-1" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
          <ToolBtn onClick={() => downloadImage(imageUrl, fileName)} title="Download"><Download size={17} /></ToolBtn>
          <ToolBtn onClick={onClose} title="Close (Esc)"><X size={17} /></ToolBtn>
        </div>
      </div>

      {/* Image area */}
      <div
        className="flex-1 flex items-center justify-center overflow-hidden"
        onClick={e => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: isDragging ? 'grabbing' : zoom > 1 ? 'grab' : 'zoom-in' }}
      >
        <img
          src={imageUrl}
          alt="Card"
          onDoubleClick={reset}
          draggable={false}
          style={{
            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.12s ease',
            maxWidth: '90vw',
            maxHeight: 'calc(100vh - 100px)',
            objectFit: 'contain',
            userSelect: 'none',
          }}
        />
      </div>

      {/* Hint */}
      <p className="text-center text-white/35 text-xs py-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
        Scroll to zoom · Drag to pan · Double-click to reset · Esc to close
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selected, setSelected] = useState<Submission | null>(null)
  const [noteValue, setNoteValue] = useState('')
  const [lightbox, setLightbox] = useState<{ url: string; fileName: string } | null>(null)

  // Track which submission id the note textarea is editing
  const noteTargetId = useRef<string | null>(null)

  function load() {
    const url = statusFilter !== 'ALL' ? `/api/submissions?status=${statusFilter}` : '/api/submissions'
    fetch(url).then(r => r.json()).then(d => {
      if (d.success) setSubmissions(d.data)
    }).finally(() => setLoading(false))
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    load()
  }, [statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  function openDetail(s: Submission) {
    setSelected(s)
    setNoteValue(s.adminNote ?? '')
  }

  function imageFileName(s: Submission) {
    return `${s.cardType.name.toLowerCase().replace(/\s+/g, '-')}-${s.denomination}-${s.id.slice(-6)}.jpg`
  }

  // ── Status update (optimistic) ──────────────────────────────────────────────

  function updateStatus(id: string, newStatus: string) {
    setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
    setSelected(prev => prev?.id === id ? { ...prev, status: newStatus } : prev)

    fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).then(r => r.json()).then(d => {
      if (!d.success) { toast.error('Failed to update status'); load() }
      else toast.success(`Status → ${STATUS_META[newStatus]?.label ?? newStatus}`)
    }).catch(() => { toast.error('Failed to update status'); load() })
  }

  // ── Note save (on blur) ─────────────────────────────────────────────────────

  function saveNote() {
    const id = noteTargetId.current
    if (!id) return
    const note = noteValue
    fetch(`/api/submissions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminNote: note }),
    }).then(r => r.json()).then(d => {
      if (!d.success) { toast.error('Failed to save note'); return }
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, adminNote: note } : s))
      setSelected(prev => prev?.id === id ? { ...prev, adminNote: note } : prev)
    })
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 14px',
    fontFamily: 'Inter, sans-serif', fontSize: '13px', outline: 'none', width: '100%',
  }

  return (
    <div style={{ fontFamily: 'Inter, sans-serif' }} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#2e0052' }} className="mb-2">
            Verification Queue
          </h1>
          <p style={{ color: '#4c4451', fontSize: '14px' }}>
            Review submitted gift cards and update their status. All payments are handled offline.
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-1 p-1 rounded-xl" style={{ backgroundColor: '#f0edec' }}>
          {FILTER_OPTIONS.map(opt => {
            const isActive = statusFilter === opt
            const meta = STATUS_META[opt]
            return (
              <button key={opt} onClick={() => setStatusFilter(opt)}
                className="px-3 py-1.5 text-xs font-bold transition-all rounded-lg flex items-center gap-1.5"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  backgroundColor: isActive ? 'white' : 'transparent',
                  color: isActive ? (meta?.text ?? '#4b0082') : '#4c4451',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : undefined,
                }}>
                {meta && (
                  <span className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isActive ? meta.dot : '#9ca3af' }} />
                )}
                {opt === 'ALL' ? 'All' : (meta?.label ?? opt)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bento grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* ── Submissions list ── */}
        <section className="col-span-12 lg:col-span-7 space-y-3">
          {/* Column headers */}
          <div className="grid grid-cols-12 px-4 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-widest rounded-xl"
            style={{ backgroundColor: '#f6f3f2' }}>
            <div className="col-span-4">Brand</div>
            <div className="col-span-2">Value</div>
            <div className="col-span-3">Seller</div>
            <div className="col-span-3">Status</div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-xl" style={{ boxShadow: cardShadow }}>
              Loading...
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm bg-white rounded-xl" style={{ boxShadow: cardShadow }}>
              No submissions found.
            </div>
          ) : submissions.map(s => {
            const isActive = selected?.id === s.id
            const meta = STATUS_META[s.status]
            return (
              <div key={s.id}
                onClick={() => openDetail(s)}
                className="grid grid-cols-12 items-center px-4 py-4 bg-white rounded-xl cursor-pointer transition-all hover:-translate-y-0.5"
                style={{
                  border: isActive ? '2px solid #4b0082' : '1px solid #e5e7eb',
                  boxShadow: isActive ? '0 4px 20px rgba(75,0,130,0.12)' : cardShadow,
                }}>
                {/* Brand */}
                <div className="col-span-4 flex items-center gap-2 min-w-0">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs text-indigo-900 flex-shrink-0"
                    style={{ backgroundColor: '#f0edec' }}>
                    {s.cardType.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm truncate"
                      style={{ fontFamily: 'Manrope, sans-serif', color: isActive ? '#4b0082' : '#1e1b4b' }}>
                      {s.cardType.name}
                    </p>
                    <p className="text-[10px] text-slate-400">#{s.id.slice(-6).toUpperCase()}</p>
                  </div>
                </div>

                {/* Value */}
                <div className="col-span-2">
                  <span className="font-bold text-indigo-900"
                    style={{ fontFamily: 'Manrope, sans-serif', fontSize: '16px' }}>
                    ${s.denomination}
                  </span>
                </div>

                {/* Seller */}
                <div className="col-span-3 min-w-0">
                  <p className="text-xs font-semibold text-slate-600 truncate">{s.seller?.name}</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(s.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>

                {/* Inline status select */}
                <div className="col-span-3" onClick={e => e.stopPropagation()}>
                  <select
                    value={s.status}
                    onChange={e => updateStatus(s.id, e.target.value)}
                    className="w-full text-xs font-bold rounded-lg px-2 py-1.5 border-0 outline-none cursor-pointer"
                    style={{
                      backgroundColor: meta?.bg ?? '#f1f5f9',
                      color: meta?.text ?? '#475569',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {ALL_STATUSES.map(st => (
                      <option key={st} value={st}>{STATUS_META[st].label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )
          })}
        </section>

        {/* ── Detail panel ── */}
        <aside className="col-span-12 lg:col-span-5">
          {selected ? (
            <div className="bg-white rounded-2xl border overflow-hidden sticky top-6"
              style={{ borderColor: '#cec3d3', boxShadow: '0 8px 40px rgba(75,0,130,0.08)' }}>
              {/* Panel header */}
              <div className="px-6 py-5 flex justify-between items-center"
                style={{ borderBottom: '1px solid #cec3d3', backgroundColor: '#fcf9f8' }}>
                <div>
                  <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '18px', fontWeight: 600, color: '#4b0082' }}>
                    {selected.cardType.name} Gift Card
                  </h2>
                  <p style={{ fontSize: '12px', color: '#4c4451' }}>Case #{selected.id.slice(-8).toUpperCase()}</p>
                </div>
                <StatusChip status={selected.status} />
              </div>

              {/* Card image */}
              {selected.cardImageUrl && (
                <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <div className="relative group cursor-zoom-in rounded-xl overflow-hidden"
                    onClick={() => setLightbox({ url: selected.cardImageUrl!, fileName: imageFileName(selected) })}>
                    <img src={selected.cardImageUrl} alt="Card"
                      className="w-full h-44 object-cover"
                      style={{ border: '1px solid #e5e7eb', borderRadius: '12px' }} />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl">
                      <ZoomIn className="text-white" size={28} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2.5">
                    <p className="text-xs text-slate-400 italic">Click to view fullscreen</p>
                    <button
                      onClick={() => downloadImage(selected.cardImageUrl!, imageFileName(selected))}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-indigo-50"
                      style={{ color: '#4b0082', fontFamily: 'Inter, sans-serif' }}>
                      <Download size={13} />
                      Download
                    </button>
                  </div>
                </div>
              )}

              <div className="p-6 space-y-5">
                {/* Metadata */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f6f3f2' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Value</p>
                    <p className="font-bold text-xl" style={{ fontFamily: 'Manrope, sans-serif', color: '#4b0082' }}>
                      ${selected.denomination}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl" style={{ backgroundColor: '#f6f3f2' }}>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Submitted</p>
                    <p className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif', color: '#1e1b4b' }}>
                      {new Date(selected.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Seller */}
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ border: '1px solid #cec3d3' }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#4b0082' }}>
                    {selected.seller?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate" style={{ fontFamily: 'Manrope, sans-serif', color: '#1e1b4b' }}>
                      {selected.seller?.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {selected.seller?.momoNumber ?? selected.seller?.email}
                    </p>
                  </div>
                </div>

                {/* Status control */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3"
                    style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                    Update Status
                  </p>
                  <div className="space-y-1.5">
                    {ALL_STATUSES.map(st => {
                      const m = STATUS_META[st]
                      const isSelected = selected.status === st
                      return (
                        <button
                          key={st}
                          onClick={() => updateStatus(selected.id, st)}
                          className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-left transition-all"
                          style={{
                            backgroundColor: isSelected ? m.bg : 'transparent',
                            border: isSelected ? `2px solid ${m.dot}55` : '2px solid transparent',
                            color: isSelected ? m.text : '#4c4451',
                          }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: isSelected ? m.dot : '#d1d5db' }} />
                          <span className="font-bold text-xs uppercase tracking-wider flex-1"
                            style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.04em' }}>
                            {m.label}
                          </span>
                          {isSelected && <span className="text-xs font-bold">✓</span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Admin note */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2"
                    style={{ color: '#4c4451', fontFamily: 'Inter, sans-serif', letterSpacing: '0.05em' }}>
                    Admin Note
                  </p>
                  <textarea
                    value={noteValue}
                    onChange={e => setNoteValue(e.target.value)}
                    onFocus={e => { noteTargetId.current = selected.id; e.target.style.borderColor = '#4b0082' }}
                    onBlur={e => { saveNote(); e.target.style.borderColor = '#e5e7eb' }}
                    placeholder="Add a note (saves on blur)…"
                    rows={3}
                    style={{ ...inputStyle, resize: 'none' }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border flex flex-col items-center justify-center py-16 px-8 text-center"
              style={{ borderColor: '#e5e7eb', minHeight: '400px', boxShadow: cardShadow }}>
              <div className="text-4xl mb-4">📋</div>
              <p className="font-bold text-indigo-900 mb-2" style={{ fontFamily: 'Manrope, sans-serif' }}>
                Select a Submission
              </p>
              <p style={{ fontSize: '13px', color: '#4c4451' }}>
                Click any row to view details and update its status.
              </p>
            </div>
          )}
        </aside>
      </div>

      {/* Image lightbox */}
      {lightbox && (
        <ImageLightbox
          imageUrl={lightbox.url}
          fileName={lightbox.fileName}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  )
}
