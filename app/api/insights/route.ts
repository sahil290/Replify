import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { canAccess } from '@/lib/plan-guard'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, isActive } = await getUserPlan(supabase, user.id)

    if (!isActive) {
      return NextResponse.json(
        { error: 'Your free trial has ended. Please upgrade to continue.', code: 'TRIAL_EXPIRED' },
        { status: 403 }
      )
    }

    if (!canAccess(plan, 'insights')) {
      return NextResponse.json(
        { error: 'Insights are available on the Pro plan and above.', code: 'PLAN_UPGRADE_REQUIRED', current_plan: plan },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(); since.setDate(since.getDate() - days)
    const prev  = new Date(since); prev.setDate(prev.getDate() - days)

    const [currentRes, prevRes] = await Promise.all([
      supabase.from('tickets').select('category, urgency, sentiment, confidence, created_at')
        .eq('user_id', user.id).gte('created_at', since.toISOString()).order('created_at', { ascending: true }),
      supabase.from('tickets').select('confidence, created_at')
        .eq('user_id', user.id).gte('created_at', prev.toISOString()).lt('created_at', since.toISOString()),
    ])

    const tickets     = currentRes.data ?? []
    const prevTickets = prevRes.data     ?? []
    const total       = tickets.length
    const prevTotal   = prevTickets.length

    const autoResolved = tickets.filter(t => t.confidence >= 80).length
    const avgConf      = total > 0 ? Math.round(tickets.reduce((s, t) => s + t.confidence, 0) / total) : 0
    const prevAvgConf  = prevTickets.length > 0 ? Math.round(prevTickets.reduce((s, t) => s + t.confidence, 0) / prevTickets.length) : 0

    // Daily volume
    const dailyMap: Record<string, number> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    tickets.forEach(t => { const k = t.created_at.slice(0, 10); if (k in dailyMap) dailyMap[k]++ })
    const volume_trend = Object.entries(dailyMap).map(([date, count]) => ({
      date, count,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tickets: count,
    }))

    // Category
    const catMap: Record<string, number> = {}
    tickets.forEach(t => { catMap[t.category] = (catMap[t.category] ?? 0) + 1 })
    const categories = Object.entries(catMap).sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0 }))

    // Urgency
    const urgMap: Record<string, number> = { Urgent: 0, Medium: 0, Low: 0 }
    tickets.forEach(t => { urgMap[t.urgency] = (urgMap[t.urgency] ?? 0) + 1 })
    const urgency = Object.entries(urgMap).map(([name, count]) => ({
      name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0
    }))

    // Sentiment
    const sentMap: Record<string, number> = { Frustrated: 0, Neutral: 0, Positive: 0 }
    tickets.forEach(t => { sentMap[t.sentiment] = (sentMap[t.sentiment] ?? 0) + 1 })
    const sentiment = Object.entries(sentMap).map(([name, count]) => ({
      name, count, pct: total > 0 ? Math.round((count / total) * 100) : 0
    }))

    // Confidence trend (weekly)
    const weeklyConf: Record<string, number[]> = {}
    tickets.forEach(t => {
      const d = new Date(t.created_at)
      const week = `Week ${Math.ceil(d.getDate() / 7)}`
      if (!weeklyConf[week]) weeklyConf[week] = []
      weeklyConf[week].push(t.confidence)
    })
    const confidence_trend = Object.entries(weeklyConf).map(([week, vals]) => ({
      week, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
    }))

    // Peak hours
    const hourMap: Record<number, number> = {}
    for (let h = 0; h < 24; h++) hourMap[h] = 0
    tickets.forEach(t => { hourMap[new Date(t.created_at).getHours()]++ })
    const peak_hours = Object.entries(hourMap).map(([hour, count]) => ({
      hour: parseInt(hour),
      label: `${parseInt(hour) % 12 || 12}${parseInt(hour) < 12 ? 'am' : 'pm'}`,
      count,
    }))

    return NextResponse.json({
      total, auto_resolved: autoResolved,
      auto_rate: total > 0 ? Math.round((autoResolved / total) * 100) : 0,
      avg_confidence: avgConf,
      conf_change: avgConf - prevAvgConf,
      total_change: prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : 0,
      volume_trend, categories, urgency, sentiment, confidence_trend, peak_hours, days,
    })
  } catch (err: any) {
    console.error('[insights]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}