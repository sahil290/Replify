import 'server-only'
import { analyzeTicket } from '@/lib/ai'
import { sendAutoReply } from '@/lib/auto-reply'
import { sendUrgentTicketAlert } from '@/lib/email'

export interface IncomingTicket {
  externalId:     string
  text:           string
  platform:       string
  customerEmail?: string
  subject?:       string
}

export async function processWebhookTicket(
  ticket:  IncomingTicket,
  userId:  string,
  supabase: any
) {
  const [profileRes, integrationRes] = await Promise.all([
    supabase
      .from('users')
      .select('email, full_name, notify_urgent, auto_reply_enabled, auto_reply_threshold')
      .eq('id', userId)
      .single(),
    supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', ticket.platform)
      .single(),
  ])

  const profile     = profileRes.data
  const integration = integrationRes.data

  // Check ticket limit
  const { data: planData } = await supabase
    .from('users')
    .select('plan, plan_expires_at, created_at')
    .eq('id', userId)
    .single()

  const plan       = planData?.plan ?? 'starter'
  const now        = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', monthStart)

  const limits: Record<string, number> = { starter: 100, pro: 1000, business: Infinity }
  const limit = limits[plan] ?? 100

  if ((count ?? 0) >= limit) {
    console.warn(`[webhook] User ${userId} hit ticket limit (${limit})`)
    return { analyzed: false, reason: 'limit_reached' }
  }

  // Analyze with AI
  const result = await analyzeTicket(ticket.text)

  // Save ticket
  const { data: savedTicket } = await supabase
    .from('tickets')
    .insert({
      user_id:        userId,
      ticket_text:    ticket.text,
      category:       result.category,
      ai_response:    result.suggested_reply,
      urgency:        result.urgency,
      sentiment:      result.sentiment,
      confidence:     result.confidence,
      summary:        result.summary,
      platform:       ticket.platform,
      external_id:    ticket.externalId,
      customer_email: ticket.customerEmail ?? null,
    })
    .select()
    .single()

  // Auto-reply if enabled and confidence meets threshold
  const autoReplyEnabled   = profile?.auto_reply_enabled   ?? false
  const autoReplyThreshold = profile?.auto_reply_threshold ?? 95
  let autoReplySent = false

  if (autoReplyEnabled && result.confidence >= autoReplyThreshold && integration) {
    const credentials = {
      platform:     ticket.platform,
      subdomain:    integration.config?.subdomain,
      api_key:      integration.api_key,
      api_token:    integration.api_token,
      admin_email:  integration.config?.admin_email,
      access_token: integration.access_token,
    }

    const replyResult = await sendAutoReply({
      platform:        ticket.platform,
      externalId:      ticket.externalId,
      reply:           result.suggested_reply,
      credentials,
      replyWebhookUrl: integration.reply_webhook_url,
    })

    autoReplySent = replyResult.sent

    await supabase.from('auto_replies').insert({
      user_id:     userId,
      ticket_id:   savedTicket?.id,
      platform:    ticket.platform,
      external_id: ticket.externalId,
      reply_text:  result.suggested_reply,
      sent:        replyResult.sent,
      error:       replyResult.error ?? null,
      confidence:  result.confidence,
    })

    if (!replyResult.sent) {
      console.error(`[webhook] Auto-reply failed for ${ticket.platform}:`, replyResult.error)
    }
  }

  // Send urgent email alert
  const notifyUrgent = profile?.notify_urgent ?? true
  if (result.urgency === 'Urgent' && notifyUrgent && profile?.email) {
    sendUrgentTicketAlert({
      to:           profile.email,
      userName:     profile.full_name ?? profile.email.split('@')[0],
      ticketId:     savedTicket?.id ?? ticket.externalId,
      summary:      result.summary,
      ticketText:   ticket.text,
      category:     result.category,
      urgency:      result.urgency,
      sentiment:    result.sentiment,
      confidence:   result.confidence,
      aiReply:      result.suggested_reply,
      dashboardUrl: process.env.NEXT_PUBLIC_APP_URL ?? '',
    }).catch(console.error)
  }

  return {
    analyzed:        true,
    ticket_id:       savedTicket?.id,
    category:        result.category,
    urgency:         result.urgency,
    confidence:      result.confidence,
    auto_reply_sent: autoReplySent,
  }
}