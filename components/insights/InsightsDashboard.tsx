'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts'
import MetricCard from '@/components/ui/MetricCard'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const CATEGORY_COLORS: Record<string, string> = {
  'Account':         '#2563EB',
  'Billing':         '#7C3AED',
  'Technical':       '#EA580C',
  'How-to':          '#0D9488',
  'Feature Request': '#4F46E5',
  'Other':           '#6B7280',
}

const URGENCY_COLORS: Record<string, string> = {
  Urgent: '#DC2626',
  Medium: '#D97706',
  Low:    '#059669',
}

const SENTIMENT_COLORS: Record<string, string> = {
  Frustrated: '#DC2626',
  Neutral:    '#6B7280',
  Positive:   '#059669',
}

const KNOWLEDGE_GAPS: { topic: string; count: number }[] = []

// Knowledge gaps are derived from real ticket summaries in the API
// This empty array is a fallback — real data comes from d.knowledge_gaps if available

const PERIODS = [
  { label: '7d',  days: 7  },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
]

// Safe array normalizer — handles null, undefined, object, or array
function toArr(val: any): { name: string; count: number; pct: number }[] {
  if (!val) return []
  if (Array.isArray(val)) return val
  return Object.entries(val as Record<string, number>).map(([name, count]) => ({
    name, count: count ?? 0, pct: 0,
  }))
}

// Empty state chart placeholder
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-40 flex items-center justify-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}

// Custom tooltip
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? '#2563EB' }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// Safe defaults so nothing ever blows up
const EMPTY: InsightsData = {
  total: 0, total_change: 0, auto_resolved: 0, auto_rate: 0,
  avg_confidence: 0, conf_change: 0,
  volume_trend: [], categories: [], urgency: [],
  sentiment: [], confidence_trend: [], peak_hours: [], days: 30,
}

interface InsightsData {
  total:            number
  total_change:     number
  auto_resolved:    number
  auto_rate:        number
  avg_confidence:   number
  conf_change:      number
  volume_trend:     { date: string; label: string; tickets: number }[]
  categories:       { name: string; count: number; pct: number }[]
  urgency:          { name: string; count: number; pct: number }[]
  sentiment:        { name: string; count: number; pct: number }[]
  confidence_trend: { week: string; avg: number }[]
  peak_hours:       { hour: number; label: string; count: number }[]
  days:             number
}

export default function InsightsDashboard() {
  const [data,    setData]    = useState<InsightsData>(EMPTY)
  const [days,    setDays]    = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [days])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/insights?days=${days}`)
      if (!res.ok) return
      const json = await res.json()

      const total = json.total ?? 0

      // Normalize all array fields — handle object or array from API
      const categories = toArr(json.categories)
      const urgency    = toArr(json.urgency)
      const sentiment  = toArr(json.sentiment)

      // Recalculate pct
      const withPct = (arr: any[]) => arr.map(item => ({
        ...item,
        pct: total > 0 ? Math.round(((item.count ?? 0) / total) * 100) : 0,
      }))

      setData({
        total,
        total_change:     json.total_change     ?? 0,
        auto_resolved:    json.auto_resolved     ?? 0,
        auto_rate:        json.auto_rate         ?? 0,
        avg_confidence:   json.avg_confidence    ?? 0,
        conf_change:      json.conf_change       ?? 0,
        volume_trend:     Array.isArray(json.volume_trend)     ? json.volume_trend     : [],
        confidence_trend: Array.isArray(json.confidence_trend) ? json.confidence_trend : [],
        peak_hours:       Array.isArray(json.peak_hours)       ? json.peak_hours       : [],
        categories:       withPct(categories),
        urgency:          withPct(urgency),
        sentiment:        withPct(sentiment),
        days,
      })
    } catch (err) {
      console.error('[insights]', err)
    } finally {
      setLoading(false)
    }
  }

  const d       = data
  const hasData = d.total > 0

  // Slim volume data for readability
  const volumeData = (d.volume_trend ?? []).filter((_, i) => {
    if (days <= 7)  return true
    if (days <= 30) return i % 2 === 0
    return i % 5 === 0
  })

  const peakData = (d.peak_hours ?? []).filter(h => h.hour >= 6 && h.hour <= 23)

  const urgentItem    = (d.urgency    ?? []).find(u => u.name === 'Urgent')
  const busiest       = peakData.length > 0
    ? peakData.reduce((a, b) => a.count > b.count ? a : b)
    : null
  const maxPeak       = peakData.length > 0 ? Math.max(...peakData.map(h => h.count)) : 0

  return (
    <div className={cn('space-y-5 transition-opacity duration-200', loading && 'opacity-60 pointer-events-none')}>

      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {loading ? 'Loading…' : hasData
            ? `${d.total.toLocaleString()} tickets in last ${days} days`
            : 'No tickets yet — analyze some tickets to see insights'}
        </p>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {PERIODS.map(p => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-semibold transition-all',
                days === p.days ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Tickets"
          value={hasData ? d.total.toLocaleString() : '—'}
          change={d.total_change !== 0 ? `${d.total_change > 0 ? '↑' : '↓'} ${Math.abs(d.total_change)}% vs prev` : 'No prev data'}
          trend={d.total_change >= 0 ? 'up' : 'down'}
          icon="📋"
        />
        <MetricCard
          label="AI Auto-Resolved"
          value={hasData ? d.auto_resolved.toLocaleString() : '—'}
          change={hasData ? `${d.auto_rate}% automation rate` : '—'}
          trend="up"
          icon="🤖"
        />
        <MetricCard
          label="Avg Confidence"
          value={hasData ? `${d.avg_confidence}%` : '—'}
          change={d.conf_change !== 0 ? `${d.conf_change > 0 ? '↑' : '↓'} ${Math.abs(d.conf_change)} pts` : 'No prev data'}
          trend={d.conf_change >= 0 ? 'up' : 'down'}
          icon="🎯"
        />
        <MetricCard
          label="Urgent Tickets"
          value={hasData ? (urgentItem?.count ?? 0).toString() : '—'}
          change={hasData ? `${urgentItem?.pct ?? 0}% of all tickets` : '—'}
          trend={(urgentItem?.pct ?? 0) > 30 ? 'down' : 'up'}
          icon="🚨"
        />
      </div>

      {/* Volume trend */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-900">Ticket Volume Trend</h2>
          <span className="text-xs text-gray-400">Last {days} days</span>
        </div>
        {hasData && volumeData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={volumeData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Area type="monotone" dataKey="tickets" name="Tickets" stroke="#2563EB" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart message="No ticket data yet" />
        )}
      </div>

      {/* Category + Urgency/Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Category Breakdown</h2>
          {hasData && d.categories.length > 0 ? (
            <div className="flex gap-6">
              <ResponsiveContainer width={140} height={140}>
                <PieChart>
                  <Pie data={d.categories} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={2}>
                    {d.categories.map(cat => (
                      <Cell key={cat.name} fill={CATEGORY_COLORS[cat.name] ?? '#6B7280'} />
                    ))}
                  </Pie>
                  <Tooltip content={<Tip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5 self-center">
                {d.categories.map(cat => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: CATEGORY_COLORS[cat.name] ?? '#6B7280' }} />
                    <span className="text-xs text-gray-700 flex-1 truncate">{cat.name}</span>
                    <span className="text-xs font-semibold text-gray-900">{cat.pct}%</span>
                    <span className="text-xs text-gray-400 w-8 text-right">{cat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="No category data yet" />
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Urgency & Sentiment</h2>
          {hasData ? (
            <div className="space-y-5">
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Urgency</p>
                {d.urgency.map(u => (
                  <div key={u.name} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{u.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${u.pct}%`, background: URGENCY_COLORS[u.name] ?? '#6B7280' }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{u.pct}%</span>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Sentiment</p>
                {d.sentiment.map(s => (
                  <div key={s.name} className="flex items-center gap-3 mb-2">
                    <span className="text-xs text-gray-600 w-20 shrink-0">{s.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: SENTIMENT_COLORS[s.name] ?? '#6B7280' }} />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-8 text-right">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyChart message="No data yet" />
          )}
        </div>
      </div>

      {/* Confidence trend + Peak hours */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">AI Confidence Trend</h2>
          {hasData && d.confidence_trend.length > 1 ? (
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={d.confidence_trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Line type="monotone" dataKey="avg" name="Avg Confidence" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart message="Need more data for trend" />
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Peak Support Hours</h2>
          {hasData && peakData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={peakData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="count" name="Tickets" radius={[3, 3, 0, 0]} maxBarSize={20}>
                    {peakData.map(entry => (
                      <Cell key={entry.hour} fill={entry.count === maxPeak ? '#2563EB' : '#BFDBFE'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {busiest && (
                <p className="text-xs text-gray-400 mt-3 text-center">
                  Busiest hour: <span className="font-semibold text-gray-700">{busiest.label}</span>
                </p>
              )}
            </>
          ) : (
            <EmptyChart message="No hour data yet" />
          )}
        </div>
      </div>

      {/* Knowledge gaps — only show if we have real data */}
      {hasData && (d as any).knowledge_gaps?.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Recurring Topics</h2>
            <span className="text-xs text-gray-400">Most common ticket themes</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {((d as any).knowledge_gaps ?? []).map((g: any) => (
              <div key={g.topic} className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-900 truncate">{g.topic}</p>
                  <p className="text-xs text-amber-700 mt-0.5">{g.count} tickets about this</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-amber-700">{g.count}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}