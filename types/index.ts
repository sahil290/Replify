export type UrgencyLevel = 'Urgent' | 'Medium' | 'Low'
export type TicketCategory =
  | 'Account'
  | 'Billing'
  | 'Technical'
  | 'How-to'
  | 'Feature Request'
  | 'Other'
export type TicketSentiment = 'Frustrated' | 'Neutral' | 'Positive'

// ── Database row types ───────────────────────────────────────────
export interface User {
  id: string
  email: string
  full_name: string | null
  company: string | null
  plan: 'starter' | 'pro' | 'business'
  created_at: string
}

export interface Ticket {
  id: string
  user_id: string
  ticket_text: string
  category: TicketCategory
  ai_response: string
  urgency: UrgencyLevel
  sentiment: TicketSentiment
  confidence: number
  summary: string
  created_at: string
}

export interface SavedResponse {
  id: string
  user_id: string
  ticket_id: string | null
  category: TicketCategory
  urgency: UrgencyLevel
  response_text: string
  title: string
  created_at: string
}

export interface Insight {
  id: string
  user_id: string
  period_start: string
  period_end: string
  total_tickets: number
  auto_resolved: number
  top_categories: Record<string, number>
  knowledge_gaps: KnowledgeGap[]
  created_at: string
}

export interface KnowledgeGap {
  topic: string
  ticket_count: number
  has_article: boolean
}

// ── API payload / response types ────────────────────────────────
export interface AnalyzeTicketRequest {
  ticket_text: string
  customer_tier?: 'Free' | 'Pro' | 'Business' | 'Unknown'
}

export interface AnalyzeTicketResponse {
  category:             TicketCategory
  urgency:              UrgencyLevel
  sentiment:            TicketSentiment
  confidence:           number
  summary:              string
  suggested_reply:      string
  frustration_score?:   number
  frustration_signals?: string[]
  churn_risk?:          'high' | 'medium' | 'low'
  ticket_id?:           string | null
  _usage?: {
    prompt_tokens:     number
    completion_tokens: number
    total_tokens:      number
    cost_usd:          number
    latency_ms:        number
    model:             string
  }
}

export interface SaveResponseRequest {
  ticket_id?: string
  category: TicketCategory
  urgency: UrgencyLevel
  response_text: string
  title: string
}

// ── UI / component prop types ────────────────────────────────────
export interface MetricCardData {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
  icon: string
}