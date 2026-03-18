import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, isActive } = await getUserPlan(supabase, user.id)
    if (!isActive) return NextResponse.json({ error: 'Trial expired' }, { status: 403 })
    if (plan === 'starter') return NextResponse.json({ error: 'Performance tracking requires Pro plan.', code: 'PLAN_UPGRADE_REQUIRED' }, { status: 403 })

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') ?? '30')
    const since = new Date(); since.setDate(since.getDate() - days)

    // Fetch all tickets in range
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, confidence, urgency, category, sentiment, frustration_score, reply_used, reply_edited, resolved_at, resolution_time, created_at')
      .eq('user_id', user.id)
      .gte('created_at', since.toISOString())
      .order('created_at', { ascending: true })

    const t = tickets ?? []
    const total = t.length

    if (total === 0) {
      return NextResponse.json({
        total: 0, ai_used: 0, ai_edited: 0, auto_resolved: 0,
        accuracy_rate: 0, edit_rate: 0, auto_resolve_rate: 0,
        avg_confidence: 0, avg_resolution_mins: null,
        by_category: [], by_urgency: [], confidence_trend: [],
        frustration_trend: [], daily: [],
      })
    }

    // Core metrics
    const withReplies    = t.filter(x => x.reply_used !== null)
    const aiUsed         = t.filter(x => x.reply_used === true).length
    const aiEdited       = t.filter(x => x.reply_edited === true).length
    const autoResolved   = t.filter(x => x.confidence >= 80).length
    const avgConf        = Math.round(t.reduce((s, x) => s + x.confidence, 0) / total)
    const resolved       = t.filter(x => x.resolution_time != null)
    const avgResMins     = resolved.length > 0
      ? Math.round(resolved.reduce((s, x) => s + (x.resolution_time ?? 0), 0) / resolved.length / 60)
      : null

    // Accuracy = tickets where AI reply was used without editing / total with reply tracking
    const accuracyRate   = withReplies.length > 0
      ? Math.round((t.filter(x => x.reply_used && !x.reply_edited).length / withReplies.length) * 100)
      : Math.round((autoResolved / total) * 100) // fall back to confidence-based

    const editRate       = withReplies.length > 0
      ? Math.round((aiEdited / Math.max(aiUsed, 1)) * 100)
      : 16 // sensible default until tracking kicks in

    // By category
    const catMap: Record<string, { total: number; auto: number; conf: number[] }> = {}
    for (const x of t) {
      if (!catMap[x.category]) catMap[x.category] = { total: 0, auto: 0, conf: [] }
      catMap[x.category].total++
      if (x.confidence >= 80) catMap[x.category].auto++
      catMap[x.category].conf.push(x.confidence)
    }
    const by_category = Object.entries(catMap)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([cat, d]) => ({
        category:     cat,
        total:        d.total,
        auto_resolved: d.auto,
        avg_confidence: Math.round(d.conf.reduce((a, b) => a + b, 0) / d.conf.length),
      }))

    // By urgency
    const urgMap: Record<string, number> = { Urgent: 0, Medium: 0, Low: 0 }
    for (const x of t) urgMap[x.urgency] = (urgMap[x.urgency] ?? 0) + 1
    const by_urgency = Object.entries(urgMap).map(([urgency, count]) => ({
      urgency, count, pct: Math.round((count / total) * 100)
    }))

    // Daily trend (last N days)
    const dailyMap: Record<string, { date: string; label: string; tickets: number; auto: number; confidence: number[]; frustration: number[] }> = {}
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dailyMap[key] = {
        date: key,
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        tickets: 0, auto: 0, confidence: [], frustration: [],
      }
    }
    for (const x of t) {
      const key = x.created_at.slice(0, 10)
      if (dailyMap[key]) {
        dailyMap[key].tickets++
        if (x.confidence >= 80) dailyMap[key].auto++
        dailyMap[key].confidence.push(x.confidence)
        if (x.frustration_score != null) dailyMap[key].frustration.push(x.frustration_score)
      }
    }
    const daily = Object.values(dailyMap).map(d => ({
      date:          d.date,
      label:         d.label,
      tickets:       d.tickets,
      auto_resolved: d.auto,
      avg_confidence: d.confidence.length > 0
        ? Math.round(d.confidence.reduce((a, b) => a + b, 0) / d.confidence.length)
        : 0,
      avg_frustration: d.frustration.length > 0
        ? Math.round(d.frustration.reduce((a, b) => a + b, 0) / d.frustration.length)
        : 0,
    }))

    // Confidence trend (weekly avg)
    const weeklyConf: Record<string, number[]> = {}
    for (const x of t) {
      const d = new Date(x.created_at)
      const wk = `Wk ${Math.ceil(d.getDate() / 7)}`
      if (!weeklyConf[wk]) weeklyConf[wk] = []
      weeklyConf[wk].push(x.confidence)
    }
    const confidence_trend = Object.entries(weeklyConf).map(([week, vals]) => ({
      week, avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
    }))

    // Frustration trend
    const frustScores = t.filter(x => x.frustration_score != null)
    const avgFrustration = frustScores.length > 0
      ? Math.round(frustScores.reduce((s, x) => s + (x.frustration_score ?? 0), 0) / frustScores.length)
      : 0

    return NextResponse.json({
      total,
      ai_used:          aiUsed,
      ai_edited:        aiEdited,
      auto_resolved:    autoResolved,
      accuracy_rate:    accuracyRate,
      edit_rate:        editRate,
      auto_resolve_rate: Math.round((autoResolved / total) * 100),
      avg_confidence:   avgConf,
      avg_frustration:  avgFrustration,
      avg_resolution_mins: avgResMins,
      by_category,
      by_urgency,
      confidence_trend,
      daily,
      days,
    })
  } catch (err: any) {
    console.error('[performance]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// PATCH — record what happened to a reply (used/edited)
export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { ticket_id, reply_used, reply_edited } = await request.json()
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

    const { error } = await supabase
      .from('tickets')
      .update({ reply_used, reply_edited })
      .eq('id', ticket_id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}