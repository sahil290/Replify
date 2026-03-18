'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { RefreshCw, ThumbsUp, Edit3, Send, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PerfData {
  total_feedback:      number
  accuracy_rate:       number | null
  edit_rate:           number | null
  sent_rate:           number | null
  auto_total:          number
  auto_sent:           number
  auto_failed:         number
  auto_success_pct:    number | null
  avg_auto_confidence: number | null
  accuracy_trend:      { week: string; accuracy: number; total: number }[]
  confidence_buckets:  { range: string; count: number }[]
  platform_stats:      { platform: string; sent: number; total: number; success_pct: number }[]
  total_tickets:       number
  days:                number
}

const EMPTY: PerfData = {
  total_feedback: 0, accuracy_rate: null, edit_rate: null, sent_rate: null,
  auto_total: 0, auto_sent: 0, auto_failed: 0, auto_success_pct: null,
  avg_auto_confidence: null, accuracy_trend: [], confidence_buckets: [],
  platform_stats: [], total_tickets: 0, days: 30,
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color ?? '#2563EB' }} className="font-medium">{p.name}: {p.value}{typeof p.value === 'number' && p.name.includes('%') ? '%' : ''}</p>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub, color = 'blue' }: any) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="card p-5">
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function PerformanceDashboard() {
  const [data,    setData]    = useState<PerfData>(EMPTY)
  const [days,    setDays]    = useState(30)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchData() }, [days])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/performance?days=${days}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  const d = data
  const hasReplyData  = d.total_feedback > 0
  const hasAutoData   = d.auto_total > 0

  const noDataMsg = (
    <div className="text-center py-10">
      <p className="text-sm text-gray-400">No data yet — this populates as your team uses AI replies</p>
    </div>
  )

  return (
    <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60 pointer-events-none')}>

      {/* Period selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {d.total_tickets > 0 ? `${d.total_tickets.toLocaleString()} tickets analyzed` : 'Start analyzing tickets to see performance data'}
        </p>
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)} className={cn(
              'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
              days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}>{d}d</button>
          ))}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ThumbsUp} label="AI Accuracy Rate"
          value={d.accuracy_rate !== null ? `${d.accuracy_rate}%` : '—'}
          sub={hasReplyData ? `${d.total_feedback} replies tracked` : 'Tracks when replies are used as-is'}
          color="green" />
        <StatCard icon={Edit3} label="Human Edit Rate"
          value={d.edit_rate !== null ? `${d.edit_rate}%` : '—'}
          sub={hasReplyData ? 'Of tracked replies were modified' : 'Tracks when teams edit AI replies'}
          color="amber" />
        <StatCard icon={Send} label="Auto-Reply Success"
          value={d.auto_success_pct !== null ? `${d.auto_success_pct}%` : '—'}
          sub={hasAutoData ? `${d.auto_sent} of ${d.auto_total} sent successfully` : 'Requires auto-reply enabled'}
          color="blue" />
        <StatCard icon={Zap} label="Avg Auto Confidence"
          value={d.avg_auto_confidence !== null ? `${d.avg_auto_confidence}%` : '—'}
          sub={hasAutoData ? 'When auto-reply fired' : 'Appears when auto-reply is used'}
          color="purple" />
      </div>

      {/* Accuracy trend + Confidence distribution */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">AI Accuracy Trend</h2>
          {hasReplyData && d.accuracy_trend.length > 1 ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={d.accuracy_trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#059669" strokeWidth={2} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : noDataMsg}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Confidence Score Distribution</h2>
          {d.total_tickets > 0 && d.confidence_buckets.some(b => b.count > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.confidence_buckets} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="count" name="Tickets" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {d.confidence_buckets.map((b, i) => (
                    <Cell key={i} fill={
                      b.range === '91-100' ? '#059669' :
                      b.range === '81-90'  ? '#2563EB' :
                      b.range === '71-80'  ? '#7C3AED' :
                      b.range === '61-70'  ? '#D97706' : '#DC2626'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : noDataMsg}
        </div>
      </div>

      {/* Auto-reply platform breakdown */}
      {hasAutoData && d.platform_stats.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Auto-Reply by Platform</h2>
          <div className="space-y-3">
            {d.platform_stats.map(p => (
              <div key={p.platform} className="flex items-center gap-4">
                <span className="text-sm text-gray-700 w-24 capitalize shrink-0">{p.platform}</span>
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${p.success_pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-700 shrink-0">{p.success_pct}%</span>
                <span className="text-xs text-gray-400 shrink-0">{p.sent}/{p.total} sent</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info box when no feedback data */}
      {!hasReplyData && (
        <div className="card p-6 bg-blue-50/50 border-blue-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">How performance tracking works</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            When your team uses the AI reply analyzer, each reply is tracked. When you send it as-is, edit it, or discard it — that feedback trains the accuracy metric. The more your team uses Replify, the richer this data becomes.
          </p>
        </div>
      )}
    </div>
  )
}