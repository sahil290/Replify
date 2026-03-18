'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { RefreshCw, Zap, AlertTriangle, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface UsageData {
  plan:              string
  analyze_requests:  number
  kb_requests:       number
  total_requests:    number
  total_tokens:      number
  total_cost_usd:    number
  limit:             number
  limit_display:     string
  usage_pct:         number
  tokens_display:    string
  cost_display:      string
  avg_latency_ms:    number | null
  daily:             { date: string; label: string; requests: number; tokens: number }[]
  reset_date:        string
}

export default function UsageDashboard() {
  const [data,    setData]    = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchUsage() }, [])

  async function fetchUsage() {
    setLoading(true)
    try {
      const res = await fetch('/api/usage')
      if (res.ok) setData(await res.json())
    } finally { setLoading(false) }
  }

  if (loading) return (
    <div className="card p-6 flex items-center justify-center h-32">
      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    </div>
  )

  if (!data) return null

  const isNearLimit = data.usage_pct >= 80 && data.limit !== Infinity
  const isAtLimit   = data.usage_pct >= 100 && data.limit !== Infinity

  const barColor = (req: number) => {
    const maxReq = Math.max(...data.daily.map(d => d.requests), 1)
    return req === maxReq ? '#2563EB' : '#BFDBFE'
  }

  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            isAtLimit   ? 'bg-red-100'    :
            isNearLimit ? 'bg-amber-100'  : 'bg-blue-50'
          )}>
            <Zap className={cn(
              'w-4 h-4',
              isAtLimit   ? 'text-red-600'   :
              isNearLimit ? 'text-amber-600' : 'text-blue-600'
            )} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">AI Usage This Month</p>
            <p className="text-xs text-gray-400">Resets {data.reset_date}</p>
          </div>
        </div>
        <button onClick={fetchUsage} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
          <RefreshCw className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Usage progress bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-700">
              {data.analyze_requests.toLocaleString()} / {data.limit_display} analyses
            </span>
            <span className={cn(
              'text-xs font-semibold',
              isAtLimit   ? 'text-red-600'   :
              isNearLimit ? 'text-amber-600' : 'text-gray-500'
            )}>
              {data.limit === Infinity ? 'Unlimited' : `${data.usage_pct}%`}
            </span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700',
                isAtLimit   ? 'bg-red-500'    :
                isNearLimit ? 'bg-amber-500'  : 'bg-blue-600'
              )}
              style={{ width: `${Math.min(100, data.usage_pct)}%` }}
            />
          </div>

          {/* Warning banners */}
          {isAtLimit && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 text-xs text-red-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-red-500" />
              <span>
                You've reached your monthly limit. AI analysis is paused until your plan resets or you upgrade.{' '}
                <Link href="/settings#upgrade" className="font-semibold underline">Upgrade now →</Link>
              </span>
            </div>
          )}
          {isNearLimit && !isAtLimit && (
            <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>
                You're at {data.usage_pct}% of your monthly limit.{' '}
                <Link href="/settings#upgrade" className="font-semibold underline">Upgrade to Pro</Link> for 10× more.
              </span>
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Analyses',       value: data.analyze_requests.toLocaleString() },
            { label: 'Tokens used',    value: data.tokens_display },
            { label: 'Est. cost',      value: data.cost_display },
            { label: 'Avg speed',      value: data.avg_latency_ms ? `${data.avg_latency_ms}ms` : '—' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-base font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Daily bar chart */}
        {data.daily.some(d => d.requests > 0) && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Daily usage — last 7 days</p>
            <ResponsiveContainer width="100%" height={80}>
              <BarChart data={data.daily} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false}
                  tickFormatter={v => v.split(',')[0]} />
                <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: any) => [v, 'requests']}
                  labelFormatter={(l) => l}
                />
                <Bar dataKey="requests" radius={[3, 3, 0, 0]} maxBarSize={28}>
                  {data.daily.map((d, i) => (
                    <Cell key={i} fill={barColor(d.requests)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* KB usage if any */}
        {data.kb_requests > 0 && (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3" />
            Also used {data.kb_requests} knowledge base generation{data.kb_requests > 1 ? 's' : ''} this month
          </p>
        )}
      </div>
    </div>
  )
}