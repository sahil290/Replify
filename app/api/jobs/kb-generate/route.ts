import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setJobStatus, getJobStatus } from '@/lib/queue'
import type { JobPayload } from '@/lib/queue'
import { logUsage } from '@/lib/usage-tracker'

const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function callGroq(prompt: string): Promise<{ text: string; tokens: number }> {
  const start = Date.now()
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: GROQ_MODEL, max_tokens: 2000, temperature: 0.4, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json()
  return {
    text:   data.choices?.[0]?.message?.content ?? '{}',
    tokens: data.usage?.total_tokens ?? 0,
  }
}

export async function POST(request: Request) {
  let jId = 'unknown'
  try {
    const payload: JobPayload = await request.json()
    const { userId, jobId, data } = payload
    jId = jobId

    const query        = data.query       as string
    const ticketCount  = data.ticketCount as number
    const samples      = data.samples     as string[]

    console.log(`[job/kb-generate] Processing job ${jobId} for user ${userId}`)

    const existing = await getJobStatus(jobId)
    await setJobStatus(jobId, {
      ...(existing ?? { createdAt: new Date().toISOString() }),
      jobId, status: 'processing', updatedAt: new Date().toISOString(),
    })

    const supabase   = getServiceClient()
    const sampleText = samples.slice(0, 5).map((t, i) => `Example ${i + 1}: "${t}"`).join('\n')

    const prompt = `You are a technical writer creating a help center article.
Recurring customer question: "${query}"
Example tickets:
${sampleText}

Write a comprehensive help article. Respond ONLY with valid JSON:
{
  "title": "Clear action-oriented title",
  "intro": "One sentence summary",
  "sections": [{ "heading": "string", "body": "string", "steps": ["optional step 1"] }],
  "faq": [{ "question": "string", "answer": "string" }],
  "summary": "One closing tip"
}`

    const { text: raw, tokens } = await callGroq(prompt)

    let article: any
    try { article = JSON.parse(raw.replace(/```json|```/g, '').trim()) }
    catch { throw new Error('AI returned invalid JSON — retrying') }

    let md = `# ${article.title}\n\n${article.intro ?? ''}\n\n`
    for (const s of article.sections ?? []) {
      md += `## ${s.heading}\n\n${s.body}\n\n`
      if (s.steps?.length) { s.steps.forEach((st: string, i: number) => { md += `${i+1}. ${st}\n` }); md += '\n' }
    }
    if (article.faq?.length) {
      md += `## Frequently Asked Questions\n\n`
      for (const f of article.faq) md += `**${f.question}**\n\n${f.answer}\n\n`
    }
    if (article.summary) md += `---\n\n${article.summary}`

    const { data: saved } = await supabase.from('kb_articles').insert({
      user_id: userId, title: article.title, content: md,
      category: null, source_query: query, ticket_count: ticketCount, status: 'draft',
    }).select().single()

    // Log usage
    logUsage(supabase, userId, {
      endpoint: 'kb_generate', model: GROQ_MODEL,
      prompt_tokens: Math.round(tokens * 0.7), completion_tokens: Math.round(tokens * 0.3),
      total_tokens: tokens, cost_usd: tokens * 0.00000079, latency_ms: 0, success: true,
    }).catch(console.error)

    await setJobStatus(jobId, {
      jobId, status: 'done',
      result: { article_id: saved?.id, title: article.title },
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    console.log(`[job/kb-generate] Job ${jobId} completed`)
    return NextResponse.json({ success: true, jobId })

  } catch (err: any) {
    console.error(`[job/kb-generate] Job ${jId} failed:`, err)
    try {
      await setJobStatus(jId, {
        jobId: jId, status: 'failed', error: err.message,
        createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      })
    } catch {}
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}