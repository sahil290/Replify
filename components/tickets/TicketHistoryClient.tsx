'use client'

import { useState, useCallback, useRef } from 'react'
import {
  Search, SlidersHorizontal, ChevronLeft, ChevronRight,
  Trash2, Copy, Check, X, RefreshCw, FileText, ExternalLink,
} from 'lucide-react'
import { cn, formatDate, timeAgo, urgencyColors, categoryColors } from '@/lib/utils'
import type { Ticket, UrgencyLevel, TicketCategory } from '@/types'

const PAGE_SIZE  = 20
const CATEGORIES = ['Account', 'Billing', 'Technical', 'How-to', 'Feature Request', 'Other']
const URGENCIES  = ['Urgent', 'Medium', 'Low']

interface Props {
  initialTickets: Ticket[]
  initialTotal:   number
}

// ── Ticket detail slide-over ─────────────────────────────────────
function TicketDetail({
  ticket,
  onClose,
  onDelete,
}: {
  ticket: Ticket
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(ticket.ai_response)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  async function handleDelete() {
    if (!confirm('Delete this ticket? This cannot be undone.')) return
    await fetch(`/api/tickets?id=${ticket.id}`, { method: 'DELETE' })
    onDelete(ticket.id)
    onClose()
  }

  const urgencyClass  = urgencyColors[ticket.urgency]  ?? 'bg-gray-100 text-gray-600'
  const categoryClass = categoryColors[ticket.category] ?? 'bg-gray-100 text-gray-600'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-lg bg-white shadow-2xl z-50 flex flex-col animate-slide-up overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-0.5">#{ticket.id.slice(-8).toUpperCase()}</p>
            <p className="text-sm font-semibold text-gray-900">{ticket.summary || 'Ticket Detail'}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', urgencyClass)}>
              {ticket.urgency}
            </span>
            <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', categoryClass)}>
              {ticket.category}
            </span>
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              ticket.sentiment === 'Frustrated' ? 'bg-red-100 text-red-700'
                : ticket.sentiment === 'Positive' ? 'bg-emerald-100 text-emerald-700'
                : 'bg-gray-100 text-gray-600'
            )}>
              {ticket.sentiment}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
              {ticket.confidence}% confidence
            </span>
          </div>

          {/* Confidence bar */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">AI Confidence</p>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full"
                style={{ width: `${ticket.confidence}%` }}
              />
            </div>
          </div>

          {/* Original ticket */}
          <div>
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Original Ticket</p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {ticket.ticket_text || ticket.summary}
            </div>
          </div>

          {/* AI Response */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">AI Suggested Reply</p>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-gray-700 leading-relaxed">
              {ticket.ai_response}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Analyzed</p>
              <p className="text-sm text-gray-700">{formatDate(ticket.created_at)}</p>
              <p className="text-xs text-gray-400">{timeAgo(ticket.created_at)}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Ticket ID</p>
              <p className="text-sm text-gray-700 font-mono">#{ticket.id.slice(-8).toUpperCase()}</p>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 shrink-0">
          <button onClick={handleCopy} className="btn-primary flex-1 justify-center !py-2 !text-xs">
            {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Reply</>}
          </button>
          <button
            onClick={handleDelete}
            className="btn-ghost !py-2 !px-3 !text-xs !text-red-600 hover:!bg-red-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function TicketHistoryClient({ initialTickets, initialTotal }: Props) {
  const [tickets,    setTickets]    = useState<Ticket[]>(initialTickets)
  const [total,      setTotal]      = useState(initialTotal)
  const [page,       setPage]       = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialTotal / PAGE_SIZE))
  const [search,     setSearch]     = useState('')
  const [urgency,    setUrgency]    = useState('all')
  const [category,   setCategory]   = useState('all')
  const [sort,       setSort]       = useState('newest')
  const [loading,    setLoading]    = useState(false)
  const [selected,   setSelected]   = useState<Ticket | null>(null)
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function fetchTickets(params: {
    page?: number; search?: string; urgency?: string
    category?: string; sort?: string
  }) {
    setLoading(true)
    const p = {
      page:     params.page     ?? page,
      search:   params.search   ?? search,
      urgency:  params.urgency  ?? urgency,
      category: params.category ?? category,
      sort:     params.sort     ?? sort,
    }
    const qs = new URLSearchParams({
      page:     String(p.page),
      limit:    String(PAGE_SIZE),
      search:   p.search,
      urgency:  p.urgency,
      category: p.category,
      sort:     p.sort,
    }).toString()

    try {
      const res  = await fetch(`/api/tickets?${qs}`)
      const data = await res.json()
      setTickets(data.tickets ?? [])
      setTotal(data.total ?? 0)
      setTotalPages(data.totalPages ?? 1)
      setPage(p.page)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(val: string) {
    setSearch(val)
    if (searchRef.current) clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => {
      fetchTickets({ search: val, page: 1 })
    }, 350)
  }

  function handleFilter(key: string, val: string) {
    if (key === 'urgency')  { setUrgency(val);  fetchTickets({ urgency: val,  page: 1 }) }
    if (key === 'category') { setCategory(val); fetchTickets({ category: val, page: 1 }) }
    if (key === 'sort')     { setSort(val);     fetchTickets({ sort: val,     page: 1 }) }
  }

  function handleDelete(id: string) {
    setTickets(prev => prev.filter(t => t.id !== id))
    setTotal(prev => prev - 1)
  }

  function handlePageChange(newPage: number) {
    fetchTickets({ page: newPage })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const hasFilters = search || urgency !== 'all' || category !== 'all'

  function clearFilters() {
    setSearch('')
    setUrgency('all')
    setCategory('all')
    setSort('newest')
    fetchTickets({ search: '', urgency: 'all', category: 'all', sort: 'newest', page: 1 })
  }

  return (
    <div>
      {/* ── Search + filters bar ── */}
      <div className="card p-4 mb-5">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search tickets…"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              className="form-input !pl-9"
            />
            {search && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Urgency filter */}
          <select
            value={urgency}
            onChange={e => handleFilter('urgency', e.target.value)}
            className="form-input !w-auto !py-2 text-sm"
          >
            <option value="all">All urgency</option>
            {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
          </select>

          {/* Category filter */}
          <select
            value={category}
            onChange={e => handleFilter('category', e.target.value)}
            className="form-input !w-auto !py-2 text-sm"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => handleFilter('sort', e.target.value)}
            className="form-input !w-auto !py-2 text-sm"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="confidence_high">Highest confidence</option>
            <option value="confidence_low">Lowest confidence</option>
          </select>

          {/* Clear filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="btn-ghost !py-2 !px-3 !text-xs text-gray-500 flex items-center gap-1.5"
            >
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results summary ── */}
      <div className="flex items-center justify-between mb-3 px-1">
        <p className="text-sm text-gray-500">
          {loading ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Loading…
            </span>
          ) : (
            <><span className="font-semibold text-gray-900">{total.toLocaleString()}</span> tickets found</>
          )}
        </p>
        {totalPages > 1 && (
          <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
        )}
      </div>

      {/* ── Ticket list ── */}
      {tickets.length === 0 && !loading ? (
        <div className="card p-16 text-center">
          <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-gray-500 mb-1">No tickets found</p>
          <p className="text-xs text-gray-400">
            {hasFilters ? 'Try adjusting your filters.' : 'Analyze your first ticket to see it here.'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="btn-ghost !py-1.5 !px-4 !text-xs mt-4">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className={cn('space-y-2 transition-opacity duration-150', loading && 'opacity-50 pointer-events-none')}>
          {tickets.map(ticket => {
            const urgencyClass  = urgencyColors[ticket.urgency]  ?? 'bg-gray-100 text-gray-600'
            const categoryClass = categoryColors[ticket.category] ?? 'bg-gray-100 text-gray-600'

            return (
              <div
                key={ticket.id}
                onClick={() => setSelected(ticket)}
                className="card p-4 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 group"
              >
                {/* Urgency color bar */}
                <div className={cn(
                  'w-1 self-stretch rounded-full shrink-0',
                  ticket.urgency === 'Urgent' ? 'bg-red-400'
                    : ticket.urgency === 'Medium' ? 'bg-amber-400'
                    : 'bg-emerald-400'
                )} />

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {ticket.summary || ticket.ticket_text?.slice(0, 80) || 'Untitled ticket'}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">{timeAgo(ticket.created_at)}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', urgencyClass)}>
                      {ticket.urgency}
                    </span>
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', categoryClass)}>
                      {ticket.category}
                    </span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      #{ticket.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[11px] text-gray-400">
                      {ticket.confidence}% confidence
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>
            )
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="btn-ghost !py-2 !px-3 disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Page numbers */}
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            let pageNum: number
            if (totalPages <= 7) {
              pageNum = i + 1
            } else if (page <= 4) {
              pageNum = i + 1
            } else if (page >= totalPages - 3) {
              pageNum = totalPages - 6 + i
            } else {
              pageNum = page - 3 + i
            }
            return (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                disabled={loading}
                className={cn(
                  'w-9 h-9 rounded-lg text-sm font-medium transition-all',
                  page === pageNum
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {pageNum}
              </button>
            )
          })}

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="btn-ghost !py-2 !px-3 disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Ticket detail slide-over ── */}
      {selected && (
        <TicketDetail
          ticket={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}