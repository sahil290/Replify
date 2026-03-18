export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyUsage, getRequestLimit, formatCost, formatTokens } from '@/lib/usage-tracker'
import { getUserPlan } from '@/lib/get-user-plan'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan } = await getUserPlan(supabase, user.id)
    const usage    = await getMonthlyUsage(supabase, user.id)
    const limit    = getRequestLimit(plan)

    const pct = limit === Infinity
      ? 0
      : Math.min(100, Math.round(((usage?.analyze_requests ?? 0) / limit) * 100))

    // Last 7 days breakdown
    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: logs } = await supabase
      .from('ai_usage_logs')
      .select('created_at, total_tokens, cost_usd, endpoint, latency_ms')
      .eq('user_id', user.id)
      .gte('created_at', since7d)
      .order('created_at', { ascending: false })
      .limit(100)

    // Daily breakdown
    const dailyMap: Record<string, { requests: number; tokens: number; cost: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d   = new Date()
      d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = { requests: 0, tokens: 0, cost: 0 }
    }
    ;(logs ?? []).forEach(l => {
      const key = l.created_at.slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].requests++
        dailyMap[key].tokens += l.total_tokens ?? 0
        dailyMap[key].cost   += parseFloat(l.cost_usd ?? 0)
      }
    })

    const daily = Object.entries(dailyMap).map(([date, v]) => ({
      date,
      label:    new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      requests: v.requests,
      tokens:   v.tokens,
      cost:     Math.round(v.cost * 1_000_000) / 1_000_000,
    }))

    const avgLatency = logs?.length
      ? Math.round(logs.filter(l => l.latency_ms).reduce((s, l) => s + (l.latency_ms ?? 0), 0) / logs.length)
      : null

    return NextResponse.json({
      plan,
      month:              usage?.month,
      analyze_requests:   usage?.analyze_requests   ?? 0,
      kb_requests:        usage?.kb_requests        ?? 0,
      total_requests:     usage?.total_requests      ?? 0,
      total_tokens:       usage?.total_tokens        ?? 0,
      total_cost_usd:     usage?.total_cost_usd      ?? 0,
      limit,
      limit_display:      limit === Infinity ? 'Unlimited' : limit.toLocaleString(),
      usage_pct:          pct,
      tokens_display:     formatTokens(usage?.total_tokens ?? 0),
      cost_display:       formatCost(parseFloat(String(usage?.total_cost_usd ?? 0))),
      avg_latency_ms:     avgLatency,
      daily,
      reset_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        .toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
    })
  } catch (err: any) {
    console.error('[usage]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}