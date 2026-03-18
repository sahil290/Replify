import 'server-only'

// ── Groq pricing (as of 2026, llama-3.3-70b-versatile) ───────────
// https://console.groq.com/docs/openai
const COST_PER_1K_TOKENS = {
  'llama-3.3-70b-versatile': { input: 0.00059, output: 0.00079 },
  'llama-3.1-8b-instant':    { input: 0.00005, output: 0.00008 },
  'mixtral-8x7b-32768':      { input: 0.00027, output: 0.00027 },
  default:                   { input: 0.00059, output: 0.00079 },
}

export interface UsageRecord {
  endpoint:          string
  model:             string
  prompt_tokens:     number
  completion_tokens: number
  total_tokens:      number
  cost_usd:          number
  latency_ms?:       number
  success:           boolean
}

// Calculate cost from token counts
export function calculateCost(
  model:             string,
  promptTokens:      number,
  completionTokens:  number
): number {
  const pricing = COST_PER_1K_TOKENS[model as keyof typeof COST_PER_1K_TOKENS]
    ?? COST_PER_1K_TOKENS.default

  const inputCost  = (promptTokens     / 1000) * pricing.input
  const outputCost = (completionTokens / 1000) * pricing.output
  return Math.round((inputCost + outputCost) * 1_000_000) / 1_000_000 // 6 decimal places
}

// Extract usage from Groq API response
export function extractGroqUsage(data: any): {
  prompt_tokens:     number
  completion_tokens: number
  total_tokens:      number
} {
  return {
    prompt_tokens:     data?.usage?.prompt_tokens     ?? 0,
    completion_tokens: data?.usage?.completion_tokens ?? 0,
    total_tokens:      data?.usage?.total_tokens      ?? 0,
  }
}

// Log usage to DB (non-blocking — never throws)
export async function logUsage(
  supabase:  any,
  userId:    string,
  record:    UsageRecord
): Promise<void> {
  try {
    const month = new Date().toISOString().slice(0, 7) // 'YYYY-MM'

    // Insert detailed log
    const { error: logError } = await supabase.from('ai_usage_logs').insert({
      user_id:           userId,
      endpoint:          record.endpoint,
      model:             record.model,
      prompt_tokens:     record.prompt_tokens,
      completion_tokens: record.completion_tokens,
      total_tokens:      record.total_tokens,
      cost_usd:          record.cost_usd,
      latency_ms:        record.latency_ms ?? null,
      success:           record.success,
    })

    if (logError) {
      console.error('[usage-tracker] Insert failed:', logError.message, logError.code)
      return
    }

    // Try RPC first
    const { error: rpcError } = await supabase.rpc('update_usage_monthly', {
      p_user_id:  userId,
      p_month:    month,
      p_tokens:   record.total_tokens,
      p_cost:     record.cost_usd,
      p_endpoint: record.endpoint,
    })

    if (rpcError) {
      // RPC failed — do manual upsert as fallback
      console.warn('[usage-tracker] RPC failed, using manual upsert:', rpcError.message)
      await supabase.from('ai_usage_monthly').upsert({
        user_id:          userId,
        month,
        total_requests:   1,
        total_tokens:     record.total_tokens,
        total_cost_usd:   record.cost_usd,
        analyze_requests: record.endpoint === 'analyze_ticket' ? 1 : 0,
        kb_requests:      record.endpoint === 'kb_generate'    ? 1 : 0,
        updated_at:       new Date().toISOString(),
      }, { onConflict: 'user_id,month', ignoreDuplicates: false })
    }

    console.log(`[usage-tracker] Logged: ${record.endpoint} ${record.total_tokens} tokens $${record.cost_usd}`)
  } catch (err) {
    console.error('[usage-tracker] Failed to log usage:', err)
  }
}

// Get current month usage for a user
export async function getMonthlyUsage(
  supabase: any,
  userId:   string
): Promise<{
  total_requests:   number
  total_tokens:     number
  total_cost_usd:   number
  analyze_requests: number
  kb_requests:      number
  month:            string
} | null> {
  const month = new Date().toISOString().slice(0, 7)

  const { data } = await supabase
    .from('ai_usage_monthly')
    .select('*')
    .eq('user_id', userId)
    .eq('month', month)
    .single()

  return data ?? {
    total_requests:   0,
    total_tokens:     0,
    total_cost_usd:   0,
    analyze_requests: 0,
    kb_requests:      0,
    month,
  }
}

// Check if user has exceeded their AI request limit for the month
export function getRequestLimit(plan: string): number {
  if (plan === 'business') return Infinity
  if (plan === 'pro')      return 1000
  return 100  // starter
}

export function hasExceededLimit(
  currentRequests: number,
  plan:            string
): boolean {
  const limit = getRequestLimit(plan)
  return currentRequests >= limit
}

// Format cost for display
export function formatCost(usd: number): string {
  if (usd === 0)    return '$0.00'
  if (usd < 0.0001) return '<$0.0001'
  if (usd < 0.01)   return `$${usd.toFixed(5)}`
  if (usd < 1)      return `$${usd.toFixed(4)}`
  return `$${usd.toFixed(2)}`
}

// Format tokens for display
export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
  if (tokens >= 1000)      return `${(tokens / 1000).toFixed(1)}k`
  return String(tokens)
}