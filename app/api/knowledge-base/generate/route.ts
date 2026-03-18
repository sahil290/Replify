export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { rateLimiters, rateLimitResponse, sanitizeText, sanitizeField, sanitizeName, sanitizeEmail, sanitizeInt, sanitizeRole, isSuspicious } from '@/lib/security'
import { logUsage, calculateCost, extractGroqUsage } from '@/lib/usage-tracker'

const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

async function callGroq(prompt: string): Promise<{ text: string; usage: any; latency_ms: number }> {
  const start = Date.now()
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify({
      model:       GROQ_MODEL,
      max_tokens:  2000,
      temperature: 0.4,
      messages:    [{ role: 'user', content: prompt }],
    }),
  })
  const data       = await res.json()
  const latency_ms = Date.now() - start
  return {
    text:       data.choices?.[0]?.message?.content ?? '{}',
    usage:      data.usage,
    latency_ms,
  }
}

const PATTERNS = [
  { key: 'cancel subscription',  terms: ['cancel', 'cancellation', 'unsubscribe', 'stop subscription'] },
  { key: 'reset password',       terms: ['password', 'reset password', 'forgot password', 'login issue', "can't login", 'cant login'] },
  { key: 'refund request',       terms: ['refund', 'money back', 'overcharged', 'billing error', 'charge'] },
  { key: 'api integration',      terms: ['api', 'integration', 'webhook', 'connect', 'sdk'] },
  { key: 'export data',          terms: ['export', 'download data', 'csv', 'backup'] },
  { key: 'account access',       terms: ['access', 'locked out', 'two factor', '2fa', 'account disabled'] },
  { key: 'upgrade plan',         terms: ['upgrade', 'plan', 'pricing', 'subscription'] },
  { key: 'feature not working',  terms: ['not working', 'broken', 'bug', 'error', 'issue', 'problem'] },
  { key: 'delete account',       terms: ['delete account', 'close account', 'remove account'] },
  { key: 'team permissions',     terms: ['permission', 'access level', 'admin', 'role', 'invite'] },
]

function detectRecurringTopics(tickets: any[]): { query: string; count: number; tickets: any[] }[] {
  const groups: Record<string, { count: number; tickets: any[] }> = {}
  for (const ticket of tickets) {
    const text = (ticket.summary ?? ticket.ticket_text ?? '').toLowerCase()
    for (const pattern of PATTERNS) {
      if (pattern.terms.some(t => text.includes(t))) {
        if (!groups[pattern.key]) groups[pattern.key] = { count: 0, tickets: [] }
        groups[pattern.key].count++
        if (groups[pattern.key].tickets.length < 5) groups[pattern.key].tickets.push(ticket)
        break
      }
    }
  }
  return Object.entries(groups)
    .filter(([, g]) => g.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .map(([query, g]) => ({ query, ...g }))
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Rate limit — 20 per hour (AI generation is expensive)
    const rl = rateLimiters.kbGenerate(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const { plan, isActive } = await getUserPlan(supabase, user.id)
    if (!isActive) return NextResponse.json({ error: 'Trial expired' }, { status: 403 })
    if (plan === 'starter') return NextResponse.json({ error: 'Knowledge base requires Pro plan.', code: 'PLAN_UPGRADE_REQUIRED' }, { status: 403 })

    const body         = await request.json()
    const query        = sanitizeField(body.query, 200)
    const category     = sanitizeField(body.category ?? '', 100) || null
    const ticket_count = typeof body.ticket_count === 'number' ? body.ticket_count : 0
    const sample_tickets = Array.isArray(body.sample_tickets) ? body.sample_tickets : []

    if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })

    const samplesText = sample_tickets.slice(0, 5)
      .map((t: string, i: number) => `Example ${i + 1}: "${sanitizeText(t, 500)}"`)
      .join('\n')

    const prompt = `You are a technical writer for a SaaS support team. Generate a comprehensive, friendly help center article based on this recurring customer question.

Recurring question: "${query}"
Category: ${category ?? 'General'}
Number of customers asking this: ${ticket_count ?? 'many'}
${samplesText ? `Sample customer messages:\n${samplesText}` : ''}

Return ONLY valid JSON (no markdown, no backticks) with:
- title: string (clear, action-oriented)
- intro: string (1-2 sentences)
- sections: array of { heading: string, content: string, steps?: string[] }
- faq: array of { question: string, answer: string }
- tags: string[] (3-5 tags)
- meta_description: string`

    const groqResult = await callGroq(prompt)
    const raw = groqResult.text
    let article: any
    try { article = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
    catch { return NextResponse.json({ error: 'AI returned invalid response' }, { status: 500 }) }

    // Log usage (non-blocking)
    const usageData = extractGroqUsage({ usage: groqResult.usage })
    logUsage(supabase, user.id, {
      endpoint:          'kb_generate',
      model:             GROQ_MODEL,
      prompt_tokens:     usageData.prompt_tokens,
      completion_tokens: usageData.completion_tokens,
      total_tokens:      usageData.total_tokens,
      cost_usd:          calculateCost(GROQ_MODEL, usageData.prompt_tokens, usageData.completion_tokens),
      latency_ms:        groqResult.latency_ms,
      success:           true,
    }).catch(console.error)

    let md = `# ${article.title}\n\n${article.intro ?? ''}\n\n`
    for (const s of article.sections ?? []) {
      md += `## ${s.heading}\n\n${s.content}\n\n`
      if (s.steps?.length) { s.steps.forEach((st: string, i: number) => { md += `${i+1}. ${st}\n` }); md += '\n' }
    }
    if (article.faq?.length) {
      md += `## Frequently Asked Questions\n\n`
      for (const f of article.faq) md += `**${f.question}**\n\n${f.answer}\n\n`
    }

    const { data: saved, error } = await supabase.from('kb_articles').insert({
      user_id: user.id, title: article.title, content: md,
      sections: article.sections ?? [], category: category ?? null,
      source_query: query, ticket_count: ticket_count ?? 0, status: 'draft',
    }).select().single()

    if (error) throw error
    return NextResponse.json({ ...saved, article })
  } catch (err: any) {
    console.error('[kb/generate]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, isActive } = await getUserPlan(supabase, user.id)
    if (!isActive) return NextResponse.json({ error: 'Trial expired' }, { status: 403 })
    if (plan === 'starter') return NextResponse.json({ error: 'Knowledge Base requires Pro plan.', code: 'PLAN_UPGRADE_REQUIRED' }, { status: 403 })

    // Fetch recent tickets for pattern detection
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, summary, ticket_text, category, urgency, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    const topics = detectRecurringTopics(tickets ?? [])

    // Fetch existing articles
    const { data: articles } = await supabase
      .from('kb_articles')
      .select('id, title, status, ticket_count, category, created_at, published_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      topics,
      articles:      articles ?? [],
      total_tickets: tickets?.length ?? 0,
    })
  } catch (err: any) {
    console.error('[kb/GET]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}