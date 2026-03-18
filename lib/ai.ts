import type { AnalyzeTicketResponse } from '@/types'
import { calculateCost, extractGroqUsage } from '@/lib/usage-tracker'

const SYSTEM_PROMPT = `You are an expert customer support AI analyst.
Analyze the given support ticket and return ONLY a valid JSON object (no markdown, no extra text) with these exact keys:
- category: one of "Account" | "Billing" | "Technical" | "How-to" | "Feature Request" | "Other"
- urgency: one of "Urgent" | "Medium" | "Low"
- sentiment: one of "Frustrated" | "Neutral" | "Positive"
- confidence: integer 0-100 representing your confidence in the suggested reply
- summary: one concise sentence summarising the issue
- suggested_reply: a professional, empathetic 2-4 sentence support reply
- frustration_score: integer 0-100 measuring how frustrated the customer is (0=calm, 100=extremely frustrated/churn risk)
- frustration_signals: array of strings — specific phrases or patterns that indicate frustration (empty array if none)
- churn_risk: one of "high" | "medium" | "low" — based on language, issue severity, and repetition clues

Rules:
- Urgent = customer is blocked, losing money, or has a time-sensitive deadline
- Medium = customer is affected but can work around the issue
- Low = general question, feature request, or minor inconvenience
- frustration_score > 70 = highly frustrated (multiple complaints, threats to cancel, repeated issues, all caps)
- frustration_score 40-70 = moderately frustrated (clearly unhappy but not threatening)
- frustration_score < 40 = low frustration (neutral or positive tone)
- churn_risk "high" if customer mentions cancelling, switching, or expresses strong anger
- The suggested_reply must be warm, actionable, and include a clear next step`

function parseAIResponse(raw: string): AnalyzeTicketResponse {
  const cleaned = raw.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Could not parse AI response as JSON')
  }
}

export async function analyzeWithGroq(ticketText: string): Promise<AnalyzeTicketResponse> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not set')

  const model     = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'
  const startTime = Date.now()

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model:       process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
      max_tokens:  1024,
      temperature: 0.3,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `Support ticket:\n\n${ticketText}` },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`)
  const data       = await res.json()
  const latency_ms = Date.now() - startTime
  const usage      = extractGroqUsage(data)
  const cost_usd   = calculateCost(model, usage.prompt_tokens, usage.completion_tokens)

  const result = parseAIResponse(data?.choices?.[0]?.message?.content ?? '')

  return {
    ...result,
    _usage: {
      ...usage,
      cost_usd,
      latency_ms,
      model,
    },
  }
}

export async function analyzeWithOllama(ticketText: string): Promise<AnalyzeTicketResponse> {
  const baseUrl = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434'

  const res = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model:   process.env.OLLAMA_MODEL ?? 'llama3',
      stream:  false,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: `Support ticket:\n\n${ticketText}` },
      ],
    }),
  })

  if (!res.ok) throw new Error(`Ollama error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return parseAIResponse(data?.message?.content ?? '')
}

export async function analyzeTicket(ticketText: string): Promise<AnalyzeTicketResponse> {
  if (process.env.GROQ_API_KEY) {
    try { return await analyzeWithGroq(ticketText) }
    catch (e) { console.warn('Groq failed, trying Ollama:', e) }
  }
  if (process.env.OLLAMA_BASE_URL || process.env.OLLAMA_MODEL) {
    try { return await analyzeWithOllama(ticketText) }
    catch (e) { console.warn('Ollama also failed:', e) }
  }
  throw new Error('No AI provider configured. Set GROQ_API_KEY in .env.local')
}