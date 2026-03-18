'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import {
  Clock, DollarSign, Zap, TrendingUp, AlertTriangle,
  RefreshCw, Users, CheckCircle2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ROIData {
  period_days:         number
  total_tickets:       number
  auto_handled:        number
  auto_sent:           number
  manual_reviewed:     number
  auto_rate:           number
  avg_confidence:      number
  urgent_tickets:      number
  frustrated_tickets:  number
  high_risk_alerts:    number
  acknowledged_alerts: number
  hours_saved:         number
  minutes_saved:       number
  cost_saved_usd:      number
  cost_saved_inr:      number
  churn_prevented_usd: number
  churn_prevented_inr: number
  ai_cost_usd:         number
  ai_cost_inr:         number
  roi_multiple:        number | null
  daily:               { date: string; label: string; total: number; auto: number; manual: number }[]
  categories:          { name: string; count: number; pct: number }[]
  platforms:           { name: string; count: number }[]
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-md px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

function StatCard({
  icon: Icon, label, value, sub, color = 'blue', large = false
}: {
  icon: any; label: string; value: string; sub?: string; color?: string; large?: boolean
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-emerald-50 text-emerald-600',
    amber:  'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600',
    red:    'bg-red-50 text-red-500',
    teal:   'bg-teal-50 text-teal-600',
  }
  return (
    <div className={cn('card p-5', large && 'col-span-2')}>
      <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-3', colors[color])}>
        <Icon className="w-4 h-4" />
      </div>
      <p className={cn('font-bold text-gray-900', large ? 'text-3xl' : 'text-2xl')}>{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const EMPTY_ROI: ROIData = {
  period_days: 30, total_tickets: 0, auto_handled: 0, auto_sent: 0,
  manual_reviewed: 0, auto_rate: 0, avg_confidence: 0, urgent_tickets: 0,
  frustrated_tickets: 0, high_risk_alerts: 0, acknowledged_alerts: 0,
  hours_saved: 0, minutes_saved: 0, cost_saved_usd: 0, cost_saved_inr: 0,
  churn_prevented_usd: 0, churn_prevented_inr: 0, ai_cost_usd: 0, ai_cost_inr: 0,
  roi_multiple: null, daily: [], categories: [], platforms: [],
}

export default function ROIDashboard() {
  const [data,     setData]     = useState<ROIData>(EMPTY_ROI)
  const [days,     setDays]     = useState(30)
  const [currency, setCurrency] = useState<'INR' | 'USD'>('INR')
  const [loading,  setLoading]  = useState(true)

  useEffect(() => { fetchData() }, [days])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/roi?days=${days}`)
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  const d = data
  const isINR = currency === 'INR'
  const sym   = isINR ? '₹' : '$'

  const costSaved      = isINR ? d.cost_saved_inr      : d.cost_saved_usd
  const churnPrevented = isINR ? d.churn_prevented_inr : d.churn_prevented_usd
  const aiCost         = isINR ? d.ai_cost_inr         : d.ai_cost_usd
  const totalValue     = costSaved + churnPrevented

  const hasData = d.total_tickets > 0

  return (
    <div className={cn('space-y-6 transition-opacity', loading && 'opacity-60 pointer-events-none')}>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-gray-500">
          {hasData
            ? `Based on ${d.total_tickets.toLocaleString()} tickets in the last ${days} days`
            : 'Analyze tickets to see your ROI data'}
        </p>
        <div className="flex items-center gap-2">
          {/* Currency toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {(['INR', 'USD'] as const).map(c => (
              <button key={c} onClick={() => setCurrency(c)} className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                currency === c ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}>{c}</button>
            ))}
          </div>
          {/* Period selector */}
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {[7, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className={cn(
                'px-3 py-1.5 rounded-md text-xs font-semibold transition-all',
                days === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              )}>{d}d</button>
            ))}
          </div>
          <button onClick={fetchData} className="btn-ghost !py-1.5 !px-2">
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* ROI highlight banner */}
      {hasData && d.roi_multiple !== null && d.roi_multiple > 1 && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-5 text-white">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium opacity-80 mb-1">Return on investment</p>
              <p className="text-3xl font-bold">{d.roi_multiple}× ROI</p>
              <p className="text-sm opacity-75 mt-1">
                Every {sym}1 spent on Replify saves {sym}{d.roi_multiple} in agent time
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80 mb-1">Total value generated</p>
              <p className="text-3xl font-bold">{sym}{totalValue.toLocaleString()}</p>
              <p className="text-sm opacity-75 mt-1">vs {sym}{aiCost.toLocaleString()} AI cost</p>
            </div>
          </div>
        </div>
      )}

      {/* Primary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Clock}
          label="Agent Time Saved"
          value={d.hours_saved > 0 ? `${d.hours_saved}h` : '—'}
          sub={d.minutes_saved > 0 ? `${d.minutes_saved} minutes total` : `Based on ${d.auto_handled} AI-handled tickets`}
          color="blue"
        />
        <StatCard
          icon={DollarSign}
          label="Cost Saved"
          value={costSaved > 0 ? `${sym}${costSaved.toLocaleString()}` : '—'}
          sub={`${sym}${isINR ? 500 : 25}/hr agent cost benchmark`}
          color="green"
        />
        <StatCard
          icon={Users}
          label="Churn Risk Mitigated"
          value={churnPrevented > 0 ? `${sym}${churnPrevented.toLocaleString()}` : '—'}
          sub={`${d.acknowledged_alerts} high-risk alerts acknowledged`}
          color="amber"
        />
        <StatCard
          icon={Zap}
          label="AI Automation Rate"
          value={d.auto_rate > 0 ? `${d.auto_rate}%` : '—'}
          sub={`${d.auto_sent} of ${d.total_tickets} tickets auto-handled`}
          color="purple"
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Tickets Analyzed"     value={d.total_tickets.toLocaleString()} sub="Total this period"           color="blue"   />
        <StatCard icon={TrendingUp}   label="Avg AI Confidence"    value={d.avg_confidence > 0 ? `${d.avg_confidence}%` : '—'} sub="Across all analyses" color="teal"   />
        <StatCard icon={AlertTriangle} label="Urgent Tickets"      value={d.urgent_tickets.toLocaleString()} sub="Required immediate attention" color="amber"  />
        <StatCard icon={AlertTriangle} label="Churn Risk Alerts"   value={d.high_risk_alerts.toLocaleString()} sub="High/critical frustration"  color="red"    />
      </div>

      {/* Ticket volume chart */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">
          Ticket Volume — Auto vs Manual
        </h2>
        {hasData && d.daily.some(d => d.total > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="autoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="manualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#9CA3AF" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#9CA3AF" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} interval={Math.floor(d.daily.length / 6)} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Area type="monotone" dataKey="auto"   name="Auto-handled" stroke="#2563EB" strokeWidth={2} fill="url(#autoGrad)"   />
              <Area type="monotone" dataKey="manual" name="Manual review" stroke="#9CA3AF" strokeWidth={1.5} fill="url(#manualGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-44 flex items-center justify-center">
            <p className="text-sm text-gray-400">No ticket data yet — start analyzing tickets to see trends</p>
          </div>
        )}
      </div>

      {/* Category breakdown + Cost comparison */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Top Issue Categories</h2>
          {d.categories.length > 0 ? (
            <div className="space-y-3">
              {d.categories.slice(0, 6).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-28 shrink-0 truncate">{cat.name}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width:      `${cat.pct}%`,
                        background: ['#2563EB','#7C3AED','#059669','#D97706','#DC2626','#0891B2'][i] ?? '#2563EB',
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{cat.pct}%</span>
                  <span className="text-xs text-gray-400 w-8 text-right shrink-0">{cat.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-gray-400">No data yet</p>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Cost Breakdown</h2>
          <div className="space-y-4">
            {[
              { label: 'Agent time saved',    value: costSaved,      color: '#059669', desc: `${d.hours_saved}h × ${sym}${isINR ? 500 : 25}/hr`         },
              { label: 'Churn risk mitigated', value: churnPrevented, color: '#2563EB', desc: `${d.acknowledged_alerts} customers at risk`                 },
              { label: 'Replify AI cost',      value: -aiCost,        color: '#DC2626', desc: `${d.total_tickets} tickets × ${sym}${isINR ? 0.034 : 0.0004}` },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-xs text-gray-400">{item.desc}</p>
                  </div>
                </div>
                <span className={cn(
                  'text-sm font-bold',
                  item.value >= 0 ? 'text-emerald-600' : 'text-red-500'
                )}>
                  {item.value >= 0 ? '+' : ''}{sym}{Math.abs(item.value).toLocaleString()}
                </span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm font-semibold text-gray-900">Net value</span>
              <span className={cn(
                'text-base font-bold',
                totalValue - aiCost > 0 ? 'text-emerald-600' : 'text-red-500'
              )}>
                {sym}{Math.max(0, totalValue - aiCost).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Benchmarks note */}
      <div className="card p-5 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-700 mb-2">How these numbers are calculated</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Time saved assumes {isINR ? '₹500' : '$25'}/hr agent cost and 8 minutes average handle time per ticket.
          Churn risk mitigation assumes 30% of acknowledged high-risk alerts result in a prevented churn,
          valued at {isINR ? '₹15,000' : '$500'} per customer. These are conservative industry benchmarks —
          your actual savings may be higher.
        </p>
      </div>
    </div>
  )
}