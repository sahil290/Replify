import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeTicket } from '@/lib/ai'
import { getTicketLimit } from '@/lib/razorpay'
import { sendUrgentTicketAlert } from '@/lib/email'
import { sendSlackFrustrationAlert } from '@/lib/slack'
import { logUsage, getMonthlyUsage, hasExceededLimit } from '@/lib/usage-tracker'
import { sanitizeText, isSuspicious, rateLimiters, rateLimitResponse, getClientIp } from '@/lib/security'
import { getCachedAnalysis, cacheAnalysis } from '@/lib/cache'
import type { AnalyzeTicketRequest } from '@/types'

// Inline frustration analysis (avoid circular import)
function getFrustrationScore(text: string, sentiment: string, urgency: string) {
  const t = text.toLowerCase(); const signals: string[] = []; let score = 0
  if (sentiment === 'Frustrated') score += 30
  if (urgency   === 'Urgent')     score += 15
  if (/\b(again|third|multiple times?|keep|still|same issue)\b/.test(t)) { score += 20; signals.push('Repeated issue') }
  if (/\b(escalat|manager|legal|sue|unacceptable|ridiculous)\b/.test(t)) { score += 25; signals.push('Escalation language') }
  if (/\b(terrible|awful|horrible|worst|useless|fraud|scam)\b/.test(t)) { score += 20; signals.push('Strong negative language') }
  if (/\b(cancel(ling|ed)?|leaving|switching|competitor|moving to)\b/.test(t)) { score += 25; signals.push('Churn risk signal') }
  if ((text.match(/\b[A-Z]{3,}\b/g) ?? []).length >= 2) { score += 10; signals.push('Shouting (caps)') }
  score = Math.min(100, score)
  const risk = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'
  return { score, risk, signals }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit — 20 analyses per minute per user
    const rl = rateLimiters.analyze(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body: AnalyzeTicketRequest = await request.json()

    // Sanitize input
    const ticketText = sanitizeText(body.ticket_text, 5000)
    if (!ticketText) return NextResponse.json({ error: 'ticket_text is required' }, { status: 400 })
    if (isSuspicious(ticketText)) return NextResponse.json({ error: 'Invalid input detected' }, { status: 400 })

    // Plan & trial enforcement
    const { data: profile } = await supabase
      .from('users')
      .select('plan, plan_expires_at, created_at, full_name, notify_urgent, notify_digest')
      .eq('id', user.id)
      .single()

    const plan       = profile?.plan ?? 'starter'
    const createdAt  = new Date(profile?.created_at ?? user.created_at)
    const trialEnd   = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
    const now        = new Date()
    const trialOver  = now > trialEnd
    const planActive = profile?.plan_expires_at ? now <= new Date(profile.plan_expires_at) : false

    if (trialOver && plan === 'starter' && !planActive) {
      return NextResponse.json(
        { error: 'Your free trial has ended. Please upgrade to continue.', code: 'TRIAL_EXPIRED' },
        { status: 403 }
      )
    }

    const limit = getTicketLimit(plan)
    if (limit !== Infinity) {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const { count } = await supabase
        .from('tickets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', monthStart)
      if ((count ?? 0) >= limit) {
        return NextResponse.json(
          { error: `You have reached your ${limit} ticket limit for this month.`, code: 'LIMIT_REACHED', limit, current: count },
          { status: 403 }
        )
      }
    }

    // Check AI usage limits for this month
    const monthlyUsage = await getMonthlyUsage(supabase, user.id)
    if (monthlyUsage && hasExceededLimit(monthlyUsage.analyze_requests, plan)) {
      return NextResponse.json(
        {
          error:        `You've used all ${monthlyUsage.analyze_requests} AI analyses this month.`,
          code:         'USAGE_LIMIT_EXCEEDED',
          used:         monthlyUsage.analyze_requests,
          limit:        getTicketLimit(plan),
          reset_date:   new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
          upgrade_url:  '/settings#upgrade',
        },
        { status: 429 }
      )
    }

    // ── Cache check — skip AI call if we've seen this ticket before ──
    const cached = await getCachedAnalysis(ticketText)
    let result: Awaited<ReturnType<typeof analyzeTicket>>

    if (cached) {
      console.log(`[cache] HIT — skipping Groq call`)
      result = {
        category:          cached.category          as any,
        urgency:           cached.urgency            as any,
        sentiment:         cached.sentiment          as any,
        confidence:        cached.confidence,
        summary:           cached.summary,
        suggested_reply:   cached.suggested_reply,
        frustration_score: cached.frustration_score,
        churn_risk:        cached.churn_risk         as any,
        signals:           cached.signals,
        // No _usage on cache hits — don't log AI cost
      }
    } else {
      // ── Cache miss — call Groq AI ───────────────────────────────
      result = await analyzeTicket(ticketText)

      // Store in cache for future identical tickets (non-blocking)
      cacheAnalysis(ticketText, {
        category:          result.category,
        urgency:           result.urgency,
        sentiment:         result.sentiment,
        confidence:        result.confidence,
        summary:           result.summary,
        suggested_reply:   result.suggested_reply,
        frustration_score: (result as any).frustration_score ?? 0,
        churn_risk:        (result as any).churn_risk         ?? 'low',
        signals:           (result as any).signals            ?? [],
      }).catch(console.error)
    }

    // Log AI usage — only on cache misses (real AI calls)
    if (!cached) {
      const usageData = result._usage ?? {
        model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        prompt_tokens: 500, completion_tokens: 150, total_tokens: 650, cost_usd: 0.0004, latency_ms: 0,
      }
      logUsage(supabase, user.id, {
        endpoint:          'analyze_ticket',
        model:             usageData.model,
        prompt_tokens:     usageData.prompt_tokens,
        completion_tokens: usageData.completion_tokens,
        total_tokens:      usageData.total_tokens,
        cost_usd:          usageData.cost_usd,
        latency_ms:        usageData.latency_ms,
        success:           true,
      }).catch(err => console.error('[usage] log failed:', err))
    }

    // Detect frustration signals
    const frustration = getFrustrationScore(body.ticket_text, result.sentiment, result.urgency)

    // Save ticket to DB with frustration data
    const { data: ticket, error: dbError } = await supabase
      .from('tickets')
      .insert({
        user_id:           user.id,
        ticket_text:       ticketText,
        category:          result.category,
        ai_response:       result.suggested_reply,
        urgency:           result.urgency,
        sentiment:         result.sentiment,
        confidence:        result.confidence,
        summary:           result.summary,
        frustration_score: frustration.score,
        churn_risk:        frustration.risk,
        signals:           frustration.signals,
      })
      .select()
      .single()

    if (dbError) console.error('DB insert error:', dbError)

    // Run frustration detection in background (non-blocking)
    if (ticket?.id && body.ticket_text) {
      fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/frustration`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
        body:    JSON.stringify({
          ticket_id:      ticket.id,
          ticket_text:    body.ticket_text,
          sentiment:      result.sentiment,
          customer_email: null,
        }),
      }).catch(() => {}) // non-blocking
    }

    // Create frustration alert if high/critical
    if (frustration.risk === 'high' || frustration.risk === 'critical') {
      supabase.from('frustration_alerts').insert({
        user_id:           user.id,
        ticket_id:         ticket?.id ?? null,
        frustration_score: frustration.score,
        risk_level:        frustration.risk,
        signals:           frustration.signals,
        category:          result.category,
        customer_email:    null,
      }).then(() => {}).catch(console.error)

      // Send Slack alert if configured
      const slackProfile = await supabase
        .from('users')
        .select('slack_webhook_url, slack_alerts_enabled, frustration_threshold')
        .eq('id', user.id)
        .single()

      const slackData = slackProfile.data
      if (
        slackData?.slack_alerts_enabled &&
        slackData?.slack_webhook_url &&
        frustration.score >= (slackData.frustration_threshold ?? 70)
      ) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'

        // Throttle — only alert once per hour per ticket category
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
        const { count } = await supabase
          .from('slack_alert_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('alerted_at', oneHourAgo)

        if ((count ?? 0) < 10) {
          sendSlackFrustrationAlert({
            webhookUrl:        slackData.slack_webhook_url,
            ticketId:          ticket?.id,
            ticketSummary:     result.summary,
            category:          result.category,
            urgency:           result.urgency,
            frustrationScore:  frustration.score,
            churnRisk:         frustration.risk,
            signals:           frustration.signals,
            appUrl,
          })
          .then(() => {
            supabase.from('slack_alert_log').insert({
              user_id:   user.id,
              ticket_id: ticket?.id ?? null,
            }).then(() => {}).catch(console.error)
          })
          .catch(err => console.error('[slack] alert failed:', err))
        }
      }
    }

    // Send urgent email alert if enabled (non-blocking)
    const notifyUrgent = profile?.notify_urgent ?? true
    if (result.urgency === 'Urgent' && notifyUrgent && user.email) {
      sendUrgentTicketAlert({
        to:           user.email,
        userName:     profile?.full_name ?? user.email.split('@')[0],
        ticketId:     ticket?.id ?? 'unknown',
        summary:      result.summary,
        ticketText:   ticketText,
        category:     result.category,
        urgency:      result.urgency,
        sentiment:    result.sentiment,
        confidence:   result.confidence,
        aiReply:      result.suggested_reply,
        dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app',
      }).catch(err => console.error('[email] urgent alert failed:', err))
    }

    return NextResponse.json({
      ...result,
      ticket_id:         ticket?.id ?? null,
      frustration_score: frustration.score,
      churn_risk:        frustration.risk,
      signals:           frustration.signals,
      _cached:           !!cached,
    })

  } catch (err: any) {
    console.error('[analyze-ticket]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}