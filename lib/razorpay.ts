// ── CLIENT-SAFE: no server imports, no next/headers ──────────────

export type SupportedCurrency = 'INR' | 'USD'

export const CURRENCY_CONFIG: Record<SupportedCurrency, {
  symbol:     string
  multiplier: number
  locale:     string
}> = {
  INR: { symbol: '₹', multiplier: 100, locale: 'en-IN' },
  USD: { symbol: '$', multiplier: 100, locale: 'en-US' },
}

export const PLANS = {
  starter: {
    id:      'starter',
    name:    'Starter',
    prices:  { INR: 3000, USD: 29 },
    tickets: 100,
    features: [
      '100 tickets / month',
      'AI suggested replies',
      'Ticket history',
      'Up to 10 saved replies',
      'Email support',
    ],
    limitations: [
      'No integrations / webhooks',
      'No auto-reply',
      'No CSV export',
      'No insights / analytics',
      'No team members',
    ],
  },
  pro: {
    id:      'pro',
    name:    'Pro',
    prices:  { INR: 8000, USD: 79 },
    tickets: 1000,
    features: [
      '1,000 tickets / month',
      'AI suggested replies',
      'Webhook integrations (all platforms)',
      'Auto-reply engine',
      'CSV export',
      'Insights & analytics',
      'Unlimited saved replies',
      'Team members (invite agents)',
      'Urgent email alerts',
      'Priority support',
    ],
    limitations: [],
  },
  business: {
    id:      'business',
    name:    'Business',
    prices:  { INR: 19000, USD: 199 },
    tickets: Infinity,
    features: [
      'Unlimited tickets',
      'Everything in Pro',
      'Dedicated account manager',
      'Custom AI configuration',
      'SLA support',
      'Onboarding assistance',
    ],
    limitations: [],
  },
} as const

export type PlanId = keyof typeof PLANS

export function formatPrice(planId: PlanId, currency: SupportedCurrency): string {
  const amount = PLANS[planId].prices[currency]
  const { symbol, locale } = CURRENCY_CONFIG[currency]
  return `${symbol}${amount.toLocaleString(locale)}`
}

export function getAmountInSmallestUnit(planId: PlanId, currency: SupportedCurrency): number {
  return PLANS[planId].prices[currency] * CURRENCY_CONFIG[currency].multiplier
}

export function getTicketLimit(plan: string): number {
  if (plan === 'pro')      return 1000
  if (plan === 'business') return Infinity
  return 100
}

export function detectCurrency(): SupportedCurrency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (tz.startsWith('Asia/Kolkata') || tz.startsWith('Asia/Calcutta')) return 'INR'
    const locale = navigator.language ?? ''
    if (locale.endsWith('-IN') || locale === 'hi' || locale === 'en-IN') return 'INR'
    return 'USD'
  } catch {
    return 'USD'
  }
}

// ── Signature verification (server-side only) ─────────────────
export async function verifyRazorpaySignature(
  body:      string,
  signature: string,
  secret:    string
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig    = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const hex    = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('')
    return hex === signature
  } catch {
    return false
  }
}