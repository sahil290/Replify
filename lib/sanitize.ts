import 'server-only'

// Strip HTML tags and dangerous characters
export function stripHtml(str: string): string {
  return str
    .replace(/<[^>]*>/g, '')           // remove all HTML tags
    .replace(/&[a-z]+;/gi, ' ')        // remove HTML entities
    .replace(/javascript:/gi, '')       // remove js: protocol
    .replace(/on\w+\s*=/gi, '')        // remove event handlers
    .trim()
}

// Sanitize a plain text field — strips HTML, trims, limits length
export function sanitizeText(
  val: unknown,
  maxLength = 5000
): string {
  if (typeof val !== 'string') return ''
  return stripHtml(val).slice(0, maxLength)
}

// Sanitize an email address
export function sanitizeEmail(val: unknown): string {
  if (typeof val !== 'string') return ''
  return val
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._+-]/g, '')
    .slice(0, 254)
}

// Sanitize a short label/name field
// Sanitize a short field (titles, labels) — strips newlines too
export function sanitizeField(val: unknown, maxLength = 500): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/[\0\r\n]/g, ' ')
    .trim()
    .slice(0, maxLength)
}

export function sanitizeName(val: unknown, maxLength = 100): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/[<>'"`;]/g, '')
    .trim()
    .slice(0, maxLength)
}

// Sanitize a URL — only allow http/https
export function sanitizeUrl(val: unknown): string {
  if (typeof val !== 'string') return ''
  const trimmed = val.trim()
  if (!/^https?:\/\//i.test(trimmed)) return ''
  try {
    const url = new URL(trimmed)
    if (!['http:', 'https:'].includes(url.protocol)) return ''
    return url.toString().slice(0, 2048)
  } catch {
    return ''
  }
}

// Sanitize a numeric value
export function sanitizeInt(
  val: unknown,
  min = 0,
  max = Number.MAX_SAFE_INTEGER
): number | null {
  const n = parseInt(String(val), 10)
  if (isNaN(n)) return null
  return Math.min(max, Math.max(min, n))
}

// Sanitize a role string
export function sanitizeRole(val: unknown): 'admin' | 'agent' | null {
  if (val === 'admin' || val === 'agent') return val
  return null
}

// Sanitize an entire object's string values (shallow)
export function sanitizeObject(
  obj: Record<string, unknown>,
  maxLength = 500
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') {
      out[k] = sanitizeText(v, maxLength)
    }
  }
  return out
}

// Validate UUID format
export function isValidUuid(val: unknown): boolean {
  if (typeof val !== 'string') return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)
}

// Rate limit helper — checks if string looks like an injection attempt
export function isSuspicious(val: string): boolean {
  const lower = val.toLowerCase()
  const patterns = [
    /union\s+select/i,
    /drop\s+table/i,
    /insert\s+into/i,
    /delete\s+from/i,
    /<script/i,
    /javascript:/i,
    /data:text\/html/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location/i,
  ]
  return patterns.some(p => p.test(lower))
}