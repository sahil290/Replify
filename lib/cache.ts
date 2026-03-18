import 'server-only'

// ── Cache configuration ──────────────────────────────────────────
// Uses the same Upstash Redis instance as the job queue.
// Cache keys are hashed from ticket text so identical/near-identical
// tickets return the same AI response without calling Groq again.

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7  // 7 days
const CACHE_PREFIX      = 'replify:cache:v1:'

// ── Simple hash function ──────────────────────────────────────────
// Normalises ticket text before hashing so minor differences
// (extra spaces, punctuation, case) still hit the cache.
function normaliseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // remove punctuation
    .replace(/\s+/g, ' ')       // collapse whitespace
    .trim()
    .slice(0, 500)               // only hash first 500 chars
}

async function hashText(text: string): Promise<string> {
  // Use Web Crypto API (available in Node 18+ and Edge runtime)
  const encoder = new TextEncoder()
  const data     = encoder.encode(normaliseText(text))
  const hashBuf  = await crypto.subtle.digest('SHA-256', data)
  const hashArr  = Array.from(new Uint8Array(hashBuf))
  return hashArr.map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32)
}

// ── Redis helpers (same pattern as queue.ts) ─────────────────────
function getRedisConfig() {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  return { url, token }
}

async function redisGet(key: string): Promise<string | null> {
  const config = getRedisConfig()
  if (!config) return null
  try {
    const res = await fetch(`${config.url}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${config.token}` },
      // Don't cache the cache request itself
      cache: 'no-store',
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.result ?? null
  } catch {
    return null
  }
}

async function redisSetEx(key: string, value: string, ttl: number): Promise<void> {
  const config = getRedisConfig()
  if (!config) return
  try {
    await fetch(`${config.url}/setex/${encodeURIComponent(key)}/${ttl}/${encodeURIComponent(value)}`, {
      method:  'GET',
      headers: { Authorization: `Bearer ${config.token}` },
    })
  } catch {
    // Cache write failure is non-fatal
  }
}

// ── Public API ───────────────────────────────────────────────────

export interface CachedAnalysis {
  category:          string
  urgency:           string
  sentiment:         string
  confidence:        number
  summary:           string
  suggested_reply:   string
  frustration_score: number
  churn_risk:        string
  signals:           string[]
  _cached:           true
  _cache_key:        string
}

/**
 * Get cached AI analysis for a ticket.
 * Returns null on miss or if Redis is not configured.
 */
export async function getCachedAnalysis(
  ticketText: string
): Promise<CachedAnalysis | null> {
  try {
    const hash = await hashText(ticketText)
    const key  = `${CACHE_PREFIX}${hash}`
    const raw  = await redisGet(key)
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return { ...parsed, _cached: true, _cache_key: hash }
  } catch {
    return null
  }
}

/**
 * Cache an AI analysis result for future identical tickets.
 * Non-blocking — never throws.
 */
export async function cacheAnalysis(
  ticketText: string,
  result:     Omit<CachedAnalysis, '_cached' | '_cache_key'>
): Promise<void> {
  try {
    const hash = await hashText(ticketText)
    const key  = `${CACHE_PREFIX}${hash}`
    await redisSetEx(key, JSON.stringify(result), CACHE_TTL_SECONDS)
    console.log(`[cache] Stored analysis for key ${hash.slice(0, 8)}…`)
  } catch {
    // Cache write failure is non-fatal
  }
}

/**
 * Invalidate a cached analysis (e.g. if user reports it was wrong).
 */
export async function invalidateCache(ticketText: string): Promise<void> {
  const config = getRedisConfig()
  if (!config) return
  try {
    const hash = await hashText(ticketText)
    const key  = `${CACHE_PREFIX}${hash}`
    await fetch(`${config.url}/del/${encodeURIComponent(key)}`, {
      method:  'GET',
      headers: { Authorization: `Bearer ${config.token}` },
    })
  } catch {}
}

/**
 * Returns true if Redis caching is configured and available.
 */
export function isCacheEnabled(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}