'use client'

import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import { Zap, TrendingUp, DollarSign, Clock, AlertTriangle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface UsageData {
  plan:             string
  month:            string
  analyze_requests: number
  kb_requests:      number
  total_requests:   number
  total_tokens:     number
  total_cost_usd:   number
  limit:            number
  limit_display:    string
  usage_pct:        number
  tokens_display:   string
  cost_display:     string
  avg_latency_ms:   number | null
  reset_date:       string
  daily:            { date: string; label: string; requests: number; tokens: number; cost: number }[]
}

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
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function UsagePage() {
  const [data,    setData]    = useState<UsageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/usage')
      if (!res.ok) throw new Error('Failed to load usage data')
      setData(await res.json())
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isUnlim = !data || data.limit > 999999
  const isCrit  = (data?.usage_pct ?? 0) >= 95
  const isHigh  = (data?.usage_pct ?? 0) >= 80

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Usage</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your AI requests, tokens used, and estimated costs.
          </p>
        </div>
        <button onClick={fetchData} className="btn-ghost !py-1.5 !px-3 !text-xs gap-1.5">
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="card p-6 text-center text-red-600 text-sm mb-5">{error}</div>
      )}

      {loading && !data && (
        <div className="flex items-center justify-center h-48">
          <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
        </div>
      )}

      {data && (
        <div className="space-y-5">

          {/* Limit warning */}
          {(isCrit || isHigh) && !isUnlim && (
            <div className={cn(
              'flex items-center justify-between rounded-xl px-5 py-4 border',
              isCrit
                ? 'bg-red-50 border-red-200'
                : 'bg-amber-50 border-amber-200'
            )}>
              <div className="flex items-center gap-3">
                <AlertTriangle className={cn('w-5 h-5 shrink-0', isCrit ? 'text-red-500' : 'text-amber-500')} />
                <div>
                  <p className={cn('text-sm font-semibold', isCrit ? 'text-red-800' : 'text-amber-800')}>
                    {isCrit ? 'You\'re almost at your limit' : 'Usage at 80% of monthly limit'}
                  </p>
                  <p className={cn('text-xs', isCrit ? 'text-red-600' : 'text-amber-700')}>
                    {data.analyze_requests} of {data.limit_display} requests used this month.
                    Resets {data.reset_date}.
                  </p>
                </div>
              </div>
              <Link href="/settings#upgrade" className="btn-primary !text-xs !py-2 shrink-0">
                Upgrade plan
              </Link>
            </div>
          )}

          {/* Metric cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={Zap}
              label="AI Requests This Month"
              value={data.total_requests.toLocaleString()}
              sub={isUnlim
                ? `${data.plan} plan · unlimited`
                : `${data.usage_pct}% of ${data.limit_display} limit`}
              color="blue"
            />
            <StatCard
              icon={TrendingUp}
              label="Tokens Used"
              value={data.tokens_display}
              sub="Prompt + completion tokens"
              color="purple"
            />
            <StatCard
              icon={DollarSign}
              label="Estimated Cost"
              value={data.cost_display}
              sub="Based on Groq pricing"
              color="green"
            />
            <StatCard
              icon={Clock}
              label="Avg Response Time"
              value={data.avg_latency_ms ? `${data.avg_latency_ms}ms` : '—'}
              sub="AI inference latency"
              color="amber"
            />
          </div>

          {/* Monthly progress */}
          {!isUnlim && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-900">Monthly Quota</h2>
                <span className="text-xs text-gray-400">Resets {data.reset_date}</span>
              </div>
              <div className="flex items-end justify-between mb-2">
                <div>
                  <span className="text-3xl font-bold text-gray-900">{data.analyze_requests.toLocaleString()}</span>
                  <span className="text-sm text-gray-400 ml-2">/ {data.limit_display} requests</span>
                </div>
                <span className={cn(
                  'text-lg font-bold',
                  isCrit ? 'text-red-600' : isHigh ? 'text-amber-600' : 'text-blue-600'
                )}>{data.usage_pct}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-1000',
                    isCrit ? 'bg-red-500' : isHigh ? 'bg-amber-500' : 'bg-blue-600'
                  )}
                  style={{ width: `${Math.min(100, data.usage_pct)}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Ticket analysis</p>
                  <p className="font-semibold text-gray-900">{data.analyze_requests.toLocaleString()} requests</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Knowledge base generation</p>
                  <p className="font-semibold text-gray-900">{data.kb_requests.toLocaleString()} requests</p>
                </div>
              </div>
            </div>
          )}

          {/* Daily requests chart */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Daily Requests — Last 7 Days</h2>
            {data.daily.some(d => d.requests > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="requests" name="Requests" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {data.daily.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.requests === Math.max(...data.daily.map(d => d.requests)) ? '#2563EB' : '#BFDBFE'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-44 flex items-center justify-center">
                <p className="text-sm text-gray-400">No requests in the last 7 days</p>
              </div>
            )}
          </div>

          {/* Cost breakdown */}
          <div className="card p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-5">Daily Cost — Last 7 Days</h2>
            {data.daily.some(d => d.cost > 0) ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toFixed(3)}`} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="cost" name="Cost ($)" radius={[4, 4, 0, 0]} fill="#059669" maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-40 flex items-center justify-center">
                <p className="text-sm text-gray-400">No cost data yet</p>
              </div>
            )}
          </div>

          {/* Pricing reference */}
          <div className="card p-5 bg-gray-50/50">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Groq Pricing Reference</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-xs text-gray-500">
              <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">llama-3.3-70b-versatile</p>
                <p>Input: $0.59 / 1M tokens</p>
                <p>Output: $0.79 / 1M tokens</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">Avg per ticket analysis</p>
                <p>~600 tokens total</p>
                <p>~$0.0004 per request</p>
              </div>
              <div className="bg-white rounded-lg px-3 py-2.5 border border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">1,000 analyses</p>
                <p>~600k tokens</p>
                <p>~$0.40 total cost</p>
              </div>
            </div>
          </div>

        </div>
      )}
    </AppShell>
  )
}