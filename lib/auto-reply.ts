import 'server-only'
import type { AnalyzeTicketResponse } from '@/types'

export interface PlatformCredentials {
  platform:     string
  subdomain?:   string
  api_key?:     string
  api_token?:   string
  admin_email?: string
  access_token?: string
}

export interface AutoReplyResult {
  sent:        boolean
  platform:    string
  external_id: string
  error?:      string
}

// ── Zendesk ──────────────────────────────────────────────────────
async function replyZendesk(
  ticketId: string,
  reply:    string,
  creds:    PlatformCredentials
): Promise<AutoReplyResult> {
  const { subdomain, admin_email, api_token } = creds
  if (!subdomain || !admin_email || !api_token) {
    return { sent: false, platform: 'zendesk', external_id: ticketId, error: 'Missing credentials' }
  }

  const encoded = Buffer.from(`${admin_email}/token:${api_token}`).toString('base64')

  const res = await fetch(
    `https://${subdomain}.zendesk.com/api/v2/tickets/${ticketId}/comments`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${encoded}`,
      },
      body: JSON.stringify({
        ticket: {
          comment: {
            body:   reply,
            public: true,
          },
        },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return {
      sent:        false,
      platform:    'zendesk',
      external_id: ticketId,
      error:       err?.error ?? `HTTP ${res.status}`,
    }
  }

  return { sent: true, platform: 'zendesk', external_id: ticketId }
}

// ── Intercom ─────────────────────────────────────────────────────
async function replyIntercom(
  conversationId: string,
  reply:          string,
  creds:          PlatformCredentials
): Promise<AutoReplyResult> {
  const { access_token } = creds
  if (!access_token) {
    return { sent: false, platform: 'intercom', external_id: conversationId, error: 'Missing access_token' }
  }

  const res = await fetch(
    `https://api.intercom.io/conversations/${conversationId}/reply`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${access_token}`,
        'Accept':        'application/json',
      },
      body: JSON.stringify({
        message_type: 'comment',
        type:         'admin',
        body:         reply,
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return {
      sent:        false,
      platform:    'intercom',
      external_id: conversationId,
      error:       err?.errors?.[0]?.message ?? `HTTP ${res.status}`,
    }
  }

  return { sent: true, platform: 'intercom', external_id: conversationId }
}

// ── Freshdesk ────────────────────────────────────────────────────
async function replyFreshdesk(
  ticketId: string,
  reply:    string,
  creds:    PlatformCredentials
): Promise<AutoReplyResult> {
  const { subdomain, api_key } = creds
  if (!subdomain || !api_key) {
    return { sent: false, platform: 'freshdesk', external_id: ticketId, error: 'Missing credentials' }
  }

  const encoded = Buffer.from(`${api_key}:X`).toString('base64')

  const res = await fetch(
    `https://${subdomain}.freshdesk.com/api/v2/tickets/${ticketId}/reply`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Basic ${encoded}`,
      },
      body: JSON.stringify({ body: reply }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return {
      sent:        false,
      platform:    'freshdesk',
      external_id: ticketId,
      error:       err?.description ?? `HTTP ${res.status}`,
    }
  }

  return { sent: true, platform: 'freshdesk', external_id: ticketId }
}

// ── Help Scout ───────────────────────────────────────────────────
async function replyHelpScout(
  conversationId: string,
  reply:          string,
  creds:          PlatformCredentials
): Promise<AutoReplyResult> {
  const { api_key } = creds
  if (!api_key) {
    return { sent: false, platform: 'helpscout', external_id: conversationId, error: 'Missing api_key' }
  }

  const res = await fetch(
    `https://api.helpscout.net/v2/conversations/${conversationId}/reply`,
    {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${api_key}`,
      },
      body: JSON.stringify({ text: reply }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return {
      sent:        false,
      platform:    'helpscout',
      external_id: conversationId,
      error:       err?.message ?? `HTTP ${res.status}`,
    }
  }

  return { sent: true, platform: 'helpscout', external_id: conversationId }
}

// ── Generic webhook reply ────────────────────────────────────────
async function replyWebhook(
  externalId:  string,
  reply:       string,
  replyWebhookUrl: string
): Promise<AutoReplyResult> {
  const res = await fetch(replyWebhookUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({
      external_id: externalId,
      reply,
      source:      'Replify_auto_reply',
      timestamp:   new Date().toISOString(),
    }),
  })

  return {
    sent:        res.ok,
    platform:    'webhook',
    external_id: externalId,
    error:       res.ok ? undefined : `HTTP ${res.status}`,
  }
}

// ── Main dispatcher ──────────────────────────────────────────────
export async function sendAutoReply({
  platform,
  externalId,
  reply,
  credentials,
  replyWebhookUrl,
}: {
  platform:        string
  externalId:      string
  reply:           string
  credentials:     PlatformCredentials
  replyWebhookUrl?: string
}): Promise<AutoReplyResult> {
  try {
    switch (platform) {
      case 'zendesk':
        return await replyZendesk(externalId, reply, credentials)
      case 'intercom':
        return await replyIntercom(externalId, reply, credentials)
      case 'freshdesk':
        return await replyFreshdesk(externalId, reply, credentials)
      case 'helpscout':
        return await replyHelpScout(externalId, reply, credentials)
      case 'webhook':
        if (!replyWebhookUrl) {
          return { sent: false, platform, external_id: externalId, error: 'No reply webhook URL configured' }
        }
        return await replyWebhook(externalId, reply, replyWebhookUrl)
      default:
        return { sent: false, platform, external_id: externalId, error: `Unknown platform: ${platform}` }
    }
  } catch (err: any) {
    return { sent: false, platform, external_id: externalId, error: err.message }
  }
}