export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'

// Industry benchmarks used for ROI calculations
const BENCHMARKS = {
  avg_handle_time_minutes: 8,       // avg time a human takes to handle one ticket
  hourly_agent_cost_usd:   25,      // avg support agent cost per hour (USD)
  hourly_agent_cost_inr:   500,     // avg support agent cost per hour (INR)
  churn_cost_usd:          500,     // avg revenue lost per churned customer
  churn_cost_inr:          15000,
}

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const days  = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // Fetch all needed data in parallel
    const [ticketsRes, autoRepliesRes, frustrationsRes, usageRes, feedbackRes] = await Promise.all([
      supabase.from('tickets')
        .select('id, urgency, category, confidence, created_at, sentiment')
        .eq('user_id', user.id)
        .gte('created_at', since),

      supabase.from('auto_replies')
        .select('id, sent, confidence, created_at, platform')
        .eq('user_id', user.id)
        .gte('created_at', since),

      supabase.from('frustration_alerts')
        .select('id, risk_level, acknowledged, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since),

      supabase.from('ai_usage_monthly')
        .select('total_cost_usd, total_requests, analyze_requests')
        .eq('user_id', user.id)
        .eq('month', new Date().toISOString().slice(0, 7))
        .single(),

      supabase.from('reply_feedback')
        .select('was_edited, was_sent, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since),
    ])

    const tickets      = ticketsRes.data      ?? []
    const autoReplies  = autoRepliesRes.data  ?? []
    const frustrations = frustrationsRes.data ?? []
    const usage        = usageRes.data
    const feedback     = feedbackRes.data     ?? []

    // ── Core counts ─────────────────────────────────────────────
    const totalTickets      = tickets.length
    const autoSent          = autoReplies.filter(r => r.sent).length
    const autoAttempted     = autoReplies.length
    const autoSuccessRate   = autoAttempted > 0 ? Math.round((autoSent / autoAttempted) * 100) : 0
    const urgentTickets     = tickets.filter(t => t.urgency === 'Urgent').length
    const frustratedTickets = tickets.filter(t => t.sentiment === 'Frustrated').length
    const highRiskAlerts    = frustrations.filter(f => f.risk_level === 'high' || f.risk_level === 'critical').length
    const avgConfidence     = tickets.length > 0
      ? Math.round(tickets.reduce((s, t) => s + (t.confidence ?? 0), 0) / tickets.length)
      : 0

    // ── Time saved ───────────────────────────────────────────────
    // Each auto-replied ticket saves a full handle time
    // Each AI-suggested reply (used as-is) saves ~70% of handle time
    const repliesUsedAsIs   = feedback.filter(f => f.was_sent && !f.was_edited).length
    const ticketsAutoHandled = autoSent + repliesUsedAsIs
    const minutesSaved      = (autoSent * BENCHMARKS.avg_handle_time_minutes)
                            + (repliesUsedAsIs * BENCHMARKS.avg_handle_time_minutes * 0.7)
    const hoursSaved        = Math.round(minutesSaved / 60 * 10) / 10

    // ── Money saved ──────────────────────────────────────────────
    const costSavedUsd = Math.round((minutesSaved / 60) * BENCHMARKS.hourly_agent_cost_usd)
    const costSavedInr = Math.round((minutesSaved / 60) * BENCHMARKS.hourly_agent_cost_inr)

    // ── Churn prevented ──────────────────────────────────────────
    // High/critical frustration alerts that were acknowledged = potentially saved
    const acknowledgedAlerts = frustrations.filter(f => f.acknowledged).length
    const churnPreventedUsd  = Math.round(acknowledgedAlerts * BENCHMARKS.churn_cost_usd * 0.3) // 30% save rate
    const churnPreventedInr  = Math.round(acknowledgedAlerts * BENCHMARKS.churn_cost_inr * 0.3)

    // ── AI cost ──────────────────────────────────────────────────
    const aiCostUsd   = parseFloat(String(usage?.total_cost_usd ?? 0))
    const aiCostInr   = Math.round(aiCostUsd * 83.5)
    const roiMultiple = costSavedUsd > 0 && aiCostUsd > 0
      ? Math.round((costSavedUsd / aiCostUsd) * 10) / 10
      : null

    // ── Daily trend (tickets handled) ────────────────────────────
    const dailyMap: Record<string, { total: number; auto: number; manual: number }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = { total: 0, auto: 0, manual: 0 }
    }
    tickets.forEach(t => {
      const key = t.created_at.slice(0, 10)
      if (dailyMap[key]) dailyMap[key].total++
    })
    autoReplies.filter(r => r.sent).forEach(r => {
      const key = r.created_at.slice(0, 10)
      if (dailyMap[key]) dailyMap[key].auto++
    })
    Object.values(dailyMap).forEach(d => { d.manual = d.total - d.auto })

    const daily = Object.entries(dailyMap).map(([date, v]) => ({
      date,
      label: new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      ...v,
    }))

    // ── Category breakdown ────────────────────────────────────────
    const catMap: Record<string, number> = {}
    tickets.forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + 1 })
    const categories = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: Math.round((count / totalTickets) * 100) }))

    // ── Platform breakdown ────────────────────────────────────────
    const platformMap: Record<string, number> = {}
    autoReplies.forEach(r => { platformMap[r.platform ?? 'manual'] = (platformMap[r.platform ?? 'manual'] ?? 0) + 1 })
    const platforms = Object.entries(platformMap).map(([name, count]) => ({ name, count }))

    return NextResponse.json({
      period_days:         days,
      // Ticket counts
      total_tickets:       totalTickets,
      auto_handled:        ticketsAutoHandled,
      auto_sent:           autoSent,
      manual_reviewed:     totalTickets - autoSent,
      auto_rate:           totalTickets > 0 ? Math.round((autoSent / totalTickets) * 100) : 0,
      auto_success_rate:   autoSuccessRate,
      avg_confidence:      avgConfidence,
      urgent_tickets:      urgentTickets,
      frustrated_tickets:  frustratedTickets,
      high_risk_alerts:    highRiskAlerts,
      acknowledged_alerts: acknowledgedAlerts,
      // Time & money
      hours_saved:         hoursSaved,
      minutes_saved:       Math.round(minutesSaved),
      cost_saved_usd:      costSavedUsd,
      cost_saved_inr:      costSavedInr,
      churn_prevented_usd: churnPreventedUsd,
      churn_prevented_inr: churnPreventedInr,
      ai_cost_usd:         Math.round(aiCostUsd * 10000) / 10000,
      ai_cost_inr:         aiCostInr,
      roi_multiple:        roiMultiple,
      // Charts
      daily,
      categories,
      platforms,
    })
  } catch (err: any) {
    console.error('[roi]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}