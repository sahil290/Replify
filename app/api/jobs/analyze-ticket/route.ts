import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { analyzeTicket } from '@/lib/ai'
import { logUsage } from '@/lib/usage-tracker'
import { setJobStatus, getJobStatus } from '@/lib/queue'
import type { JobPayload } from '@/lib/queue'

// Verify request is from QStash
function verifyQStash(request: Request): boolean {
  const token = process.env.QSTASH_CURRENT_SIGNING_KEY
  if (!token) return true // Skip verification in development

  const signature = request.headers.get('upstash-signature')
  if (!signature) return false

  // In production, verify using @upstash/qstash receiver
  // For now, check the token is present
  return !!signature
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function getFrustrationScore(text: string, sentiment: string, urgency: string) {
  const t = text.toLowerCase(); const signals: string[] = []; let score = 0
  if (sentiment === 'Frustrated') score += 30
  if (urgency   === 'Urgent')     score += 15
  if (/\b(again|third|multiple times?|keep|still|same issue)\b/.test(t)) { score += 20; signals.push('Repeated issue') }
  if (/\b(escalat|manager|legal|sue|unacceptable|ridiculous)\b/.test(t)) { score += 25; signals.push('Escalation language') }
  if (/\b(terrible|awful|horrible|worst|useless|fraud|scam)\b/.test(t)) { score += 20; signals.push('Strong negative language') }
  if (/\b(cancel(ling|ed)?|leaving|switching|competitor|moving to)\b/.test(t)) { score += 25; signals.push('Churn risk signal') }
  score = Math.min(100, score)
  const risk = score >= 80 ? 'critical' : score >= 60 ? 'high' : score >= 40 ? 'medium' : 'low'
  return { score, risk, signals }
}

export async function POST(request: Request) {
  const jobId = 'unknown'

  try {
    // Parse job payload
    const payload: JobPayload = await request.json()
    const { userId, jobId: jId, data } = payload
    const ticketText = data.ticketText as string

    console.log(`[job/analyze-ticket] Processing job ${jId} for user ${userId}`)

    // Mark as processing
    const existing = await getJobStatus(jId)
    await setJobStatus(jId, {
      ...(existing ?? { createdAt: new Date().toISOString() }),
      jobId:     jId,
      status:    'processing',
      updatedAt: new Date().toISOString(),
    })

    const supabase = getServiceClient()

    // Run AI analysis
    const result = await analyzeTicket(ticketText)

    // Log usage
    const usageData = result._usage ?? {
      model: process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      prompt_tokens: 500, completion_tokens: 150, total_tokens: 650, cost_usd: 0.0004, latency_ms: 0,
    }
    logUsage(supabase, userId, {
      endpoint: 'analyze_ticket', model: usageData.model,
      prompt_tokens: usageData.prompt_tokens, completion_tokens: usageData.completion_tokens,
      total_tokens: usageData.total_tokens, cost_usd: usageData.cost_usd,
      latency_ms: usageData.latency_ms, success: true,
    }).catch(console.error)

    // Detect frustration
    const frustration = getFrustrationScore(ticketText, result.sentiment, result.urgency)

    // Save ticket
    const { data: ticket } = await supabase.from('tickets').insert({
      user_id:           userId,
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
      platform:          (data.platform as string) ?? null,
      external_id:       (data.externalId as string) ?? null,
    }).select().single()

    // Create frustration alert if high/critical
    if (frustration.risk === 'high' || frustration.risk === 'critical') {
      void Promise.resolve(supabase.from('frustration_alerts').insert({
        user_id: userId, ticket_id: ticket?.id ?? null,
        frustration_score: frustration.score, risk_level: frustration.risk,
        signals: frustration.signals, category: result.category,
      })).catch(console.error)
    }

    // Mark job as done
    await setJobStatus(jId, {
      jobId:     jId,
      status:    'done',
      result:    {
        ticket_id:         ticket?.id,
        category:          result.category,
        urgency:           result.urgency,
        sentiment:         result.sentiment,
        confidence:        result.confidence,
        summary:           result.summary,
        suggested_reply:   result.suggested_reply,
        frustration_score: frustration.score,
        churn_risk:        frustration.risk,
      },
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log(`[job/analyze-ticket] Job ${jId} completed successfully`)
    return NextResponse.json({ success: true, jobId: jId })

  } catch (err: any) {
    console.error(`[job/analyze-ticket] Job ${jobId} failed:`, err)

    // Mark job as failed
    try {
      await setJobStatus(jobId, {
        jobId,
        status:    'failed',
        error:     err.message,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    } catch {}

    // Return 500 so QStash retries
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}