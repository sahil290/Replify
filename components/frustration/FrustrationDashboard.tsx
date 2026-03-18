'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Check, RefreshCw, Flame, TrendingUp } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import TimeAgo from '@/components/ui/TimeAgo'

interface Alert {
  id:               string
  frustration_score: number
  risk_level:       'low' | 'medium' | 'high' | 'critical'
  signals:          string[]
  customer_email:   string | null
  acknowledged:     boolean
  created_at:       string
  tickets?: { summary: string; category: string; urgency: string }
}

const RISK_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-100    text-red-800',    bar: 'bg-red-500',    icon: '🔴' },
  high:     { label: 'High',     color: 'bg-orange-100 text-orange-800', bar: 'bg-orange-500', icon: '🟠' },
  medium:   { label: 'Medium',   color: 'bg-amber-100  text-amber-800',  bar: 'bg-amber-500',  icon: '🟡' },
  low:      { label: 'Low',      color: 'bg-gray-100   text-gray-600',   bar: 'bg-gray-400',   icon: '⚪' },
}

export default function FrustrationDashboard() {
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [acking,  setAcking]  = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/frustration')
      setData(await res.json())
    } finally {
      setLoading(false)
    }
  }

  async function acknowledge(alertId: string) {
    setAcking(alertId)
    await fetch('/api/frustration', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'acknowledge', alert_id: alertId }),
    })
    setData((prev: any) => ({
      ...prev,
      alerts: prev.alerts.map((a: Alert) =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
      unacknowledged: Math.max(0, (prev.unacknowledged ?? 1) - 1),
    }))
    setAcking(null)
  }

  async function acknowledgeAll() {
    await fetch('/api/frustration', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'acknowledge_all' }),
    })
    setData((prev: any) => ({
      ...prev,
      alerts: prev.alerts.map((a: Alert) => ({ ...a, acknowledged: true })),
      unacknowledged: 0,
    }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
    </div>
  )

  const alerts           = data?.alerts ?? []
  const unacknowledged   = data?.unacknowledged ?? 0
  const spike            = data?.spike ?? {}
  const categorySpikes   = data?.category_spikes ?? {}
  const criticalAlerts   = alerts.filter((a: Alert) => a.risk_level === 'critical' && !a.acknowledged)
  const highAlerts       = alerts.filter((a: Alert) => a.risk_level === 'high'     && !a.acknowledged)

  return (
    <div className="space-y-5">
      {/* Spike banner */}
      {spike.pct_change > 50 && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
          <Flame className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-red-800">Customer frustration spike detected</p>
            <p className="text-xs text-red-700 mt-0.5">
              {spike.today} frustrated tickets today vs {spike.yesterday} yesterday
              — a <strong>{spike.pct_change}% increase</strong>.
              Check the alerts below to identify the cause.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Unacknowledged',   value: unacknowledged,                                    color: unacknowledged > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'Critical today',   value: criticalAlerts.length,                             color: criticalAlerts.length > 0 ? 'text-red-600' : 'text-gray-900' },
          { label: 'High risk today',  value: highAlerts.length,                                 color: highAlerts.length > 0 ? 'text-orange-600' : 'text-gray-900' },
          { label: 'Total alerts',     value: alerts.length,                                     color: 'text-gray-900' },
        ].map(stat => (
          <div key={stat.label} className="card p-4">
            <p className={cn('text-2xl font-bold mb-0.5', stat.color)}>{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Category spikes */}
      {Object.keys(categorySpikes).length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Frustration by category</h3>
          <div className="space-y-2">
            {Object.entries(categorySpikes)
              .sort((a, b) => (b[1] as number) - (a[1] as number))
              .map(([cat, count]) => (
                <div key={cat} className="flex items-center gap-3">
                  <span className="text-xs text-gray-600 w-32 shrink-0">{cat}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-400 rounded-full"
                      style={{ width: `${Math.min(100, ((count as number) / alerts.length) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-700 w-6 text-right">{count as number}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Alerts list */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            Frustration alerts
            {unacknowledged > 0 && (
              <span className="ml-2 text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                {unacknowledged} new
              </span>
            )}
          </h3>
          {unacknowledged > 0 && (
            <button onClick={acknowledgeAll} className="btn-ghost !text-xs !py-1.5 !px-3 gap-1">
              <Check className="w-3 h-3" /> Acknowledge all
            </button>
          )}
        </div>

        {alerts.length === 0 ? (
          <div className="text-center py-10">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No frustrated customers</p>
            <p className="text-xs text-gray-400">Frustration alerts will appear here when tickets show signs of churn risk, anger, or repeated issues.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert: Alert) => {
              const conf = RISK_CONFIG[alert.risk_level]
              return (
                <div
                  key={alert.id}
                  className={cn(
                    'border rounded-xl p-4 transition-all',
                    alert.acknowledged
                      ? 'border-gray-100 bg-gray-50 opacity-60'
                      : alert.risk_level === 'critical'
                        ? 'border-red-200 bg-red-50'
                        : alert.risk_level === 'high'
                          ? 'border-orange-200 bg-orange-50'
                          : 'border-amber-200 bg-amber-50'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full', conf.color)}>
                          {conf.icon} {conf.label} risk
                        </span>
                        <span className="text-xs font-semibold text-gray-600">
                          Score: {alert.frustration_score}/100
                        </span>
                        {alert.customer_email && (
                          <span className="text-xs text-gray-500 truncate">{alert.customer_email}</span>
                        )}
                        <TimeAgo date={alert.created_at} className="text-xs text-gray-400" />
                      </div>

                      {/* Score bar */}
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden mb-2.5 max-w-48">
                        <div className={cn('h-full rounded-full', conf.bar)} style={{ width: `${alert.frustration_score}%` }} />
                      </div>

                      {/* Ticket summary */}
                      {alert.tickets?.summary && (
                        <p className="text-xs text-gray-700 font-medium mb-2 truncate">
                          "{alert.tickets.summary}"
                        </p>
                      )}

                      {/* Signals */}
                      <div className="flex flex-wrap gap-1">
                        {(alert.signals ?? []).map((signal: string) => (
                          <span key={signal} className="text-[10px] bg-white/70 text-gray-600 px-2 py-0.5 rounded-full border border-white/50">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>

                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledge(alert.id)}
                        disabled={acking === alert.id}
                        className="btn-ghost !py-1.5 !px-3 !text-xs shrink-0 gap-1"
                      >
                        {acking === alert.id
                          ? <RefreshCw className="w-3 h-3 animate-spin" />
                          : <><Check className="w-3 h-3" /> Ack</>}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}