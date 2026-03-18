'use client'

import { useState } from 'react'
import { Download, X, FileText, RefreshCw, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORIES = ['Account', 'Billing', 'Technical', 'How-to', 'Feature Request', 'Other']
const URGENCIES  = ['Urgent', 'Medium', 'Low']

export default function ExportButton({ totalTickets }: { totalTickets: number }) {
  const [open,      setOpen]      = useState(false)
  const [exporting, setExporting] = useState(false)
  const [done,      setDone]      = useState(false)

  // Filter state
  const [urgency,   setUrgency]   = useState('all')
  const [category,  setCategory]  = useState('all')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const [search,    setSearch]    = useState('')

  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (urgency  !== 'all') params.set('urgency',   urgency)
      if (category !== 'all') params.set('category',  category)
      if (dateFrom)           params.set('date_from', dateFrom)
      if (dateTo)             params.set('date_to',   dateTo)
      if (search.trim())      params.set('search',    search.trim())

      const res = await fetch(`/api/export?${params.toString()}`)
      if (!res.ok) throw new Error('Export failed')

      // Trigger browser download
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const a        = document.createElement('a')
      a.href         = url
      a.download     = `Replify-tickets-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setDone(true)
      setTimeout(() => {
        setDone(false)
        setOpen(false)
      }, 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setExporting(false)
    }
  }

  function handleReset() {
    setUrgency('all')
    setCategory('all')
    setDateFrom('')
    setDateTo('')
    setSearch('')
  }

  const hasFilters = urgency !== 'all' || category !== 'all' || dateFrom || dateTo || search

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-ghost !py-1.5 !px-3 !text-xs gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        Export CSV
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Export Tickets</p>
                    <p className="text-xs text-gray-400">{totalTickets.toLocaleString()} tickets available</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Filters */}
              <div className="px-6 py-5 space-y-4">
                <p className="text-xs text-gray-500">
                  Filter which tickets to export, or leave all as default to export everything.
                </p>

                {/* Search */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1.5">
                    Search keywords
                  </label>
                  <input
                    type="text"
                    placeholder="Filter by keyword..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="form-input !text-sm"
                  />
                </div>

                {/* Urgency + Category */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Urgency</label>
                    <select
                      value={urgency}
                      onChange={e => setUrgency(e.target.value)}
                      className="form-input !text-sm"
                    >
                      <option value="all">All urgency</option>
                      {URGENCIES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="form-input !text-sm"
                    >
                      <option value="all">All categories</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Date range */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">From date</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                      className="form-input !text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">To date</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                      className="form-input !text-sm"
                    />
                  </div>
                </div>

                {/* What's included */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <p className="text-xs font-medium text-gray-700 mb-2">CSV includes these columns:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {['Ticket ID', 'Date', 'Category', 'Urgency', 'Sentiment', 'Confidence', 'Summary', 'Customer Message', 'AI Reply', 'Platform', 'Customer Email'].map(col => (
                      <span key={col} className="text-[10px] bg-white border border-gray-200 rounded px-2 py-0.5 text-gray-600">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 gap-3">
                {hasFilters && (
                  <button
                    onClick={handleReset}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Reset filters
                  </button>
                )}
                <div className={cn('flex gap-3 ml-auto', !hasFilters && 'w-full justify-end')}>
                  <button
                    onClick={() => setOpen(false)}
                    className="btn-ghost !py-2 !px-4 !text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-primary !py-2 !px-5 !text-xs"
                  >
                    {done ? (
                      <><Check className="w-3.5 h-3.5" /> Downloaded!</>
                    ) : exporting ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Exporting…</>
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Download CSV</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}