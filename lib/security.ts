import 'server-only'

// ── Input Sanitization (re-exported from sanitize.ts) ──────────
export {
  sanitizeText,
  sanitizeField,
  sanitizeName,
  sanitizeEmail,
  sanitizeUrl,
  sanitizeInt,
  sanitizeRole,
  sanitizeObject,
  isValidUuid as isValidUUID,
  isSuspicious,
} from '@/lib/sanitize'

// isValidEmail inline (slightly different signature needed here)
export function isValidEmail(email: unknown): boolean {
  if (typeof email !== 'string') return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 320
}

// ── In-Memory Rate Limiter ───────────────────────────────────────
// For production use Upstash Redis. This works for single-instance deployments.

interface RateLimitEntry {
  count:     number
  resetAt:   number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of Array.from(store.entries())) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success:    boolean
  limit:      number
  remaining:  number
  reset:      number   // Unix timestamp ms
}

/**
 * Rate limit by key (e.g. user ID or IP).
 * @param key      Unique identifier (userId, IP)
 * @param limit    Max requests in the window
 * @param windowMs Time window in milliseconds
 */
export function rateLimit(
  key:      string,
  limit:    number,
  windowMs: number
): RateLimitResult {
  const now    = Date.now()
  const entry  = store.get(key)

  if (!entry || entry.resetAt < now) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)

  return {
    success:   entry.count <= limit,
    limit,
    remaining,
    reset:     entry.resetAt,
  }
}

// Pre-configured rate limiters
export const rateLimiters = {
  // AI analysis — expensive, 20 per minute per user
  analyze: (userId: string) =>
    rateLimit(`analyze:${userId}`, 20, 60_000),

  // Auth attempts — 10 per 15 minutes per IP
  auth: (ip: string) =>
    rateLimit(`auth:${ip}`, 10, 15 * 60_000),

  // Webhook — 100 per minute per user
  webhook: (userId: string) =>
    rateLimit(`webhook:${userId}`, 100, 60_000),

  // Invites — 10 per hour per user
  invite: (userId: string) =>
    rateLimit(`invite:${userId}`, 10, 60 * 60_000),

  // KB generation — 20 per hour per user (Groq is slow)
  kbGenerate: (userId: string) =>
    rateLimit(`kb:${userId}`, 20, 60 * 60_000),

  // Export — 10 per hour per user
  export: (userId: string) =>
    rateLimit(`export:${userId}`, 10, 60 * 60_000),

  // General API — 200 per minute per user
  general: (userId: string) =>
    rateLimit(`general:${userId}`, 200, 60_000),
}

/**
 * Get client IP from request headers.
 */
export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Standard rate limit exceeded response.
 */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED' }),
    {
      status:  429,
      headers: {
        'Content-Type':      'application/json',
        'X-RateLimit-Limit':     String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset':     String(result.reset),
        'Retry-After':           String(Math.ceil((result.reset - Date.now()) / 1000)),
      },
    }
  )
}

// ── Security Headers ─────────────────────────────────────────────

/**
 * Add security headers to a NextResponse.
 */
export function addSecurityHeaders(headers: Headers): void {
  headers.set('X-Content-Type-Options',  'nosniff')
  headers.set('X-Frame-Options',         'DENY')
  headers.set('X-XSS-Protection',        '1; mode=block')
  headers.set('Referrer-Policy',         'strict-origin-when-cross-origin')
  headers.set('Permissions-Policy',      'camera=(), microphone=(), geolocation=()')
}