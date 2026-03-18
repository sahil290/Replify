import 'server-only'

export interface SlackAlertPayload {
  webhookUrl:        string
  ticketId?:         string
  ticketSummary:     string
  category:          string
  urgency:           string
  frustrationScore:  number
  churnRisk:         string
  signals:           string[]
  customerEmail?:    string
  appUrl:            string
}

// Risk level → Slack color sidebar
const RISK_COLOR: Record<string, string> = {
  critical: '#DC2626',  // red
  high:     '#EA580C',  // orange
  medium:   '#D97706',  // amber
  low:      '#6B7280',  // gray
}

const RISK_EMOJI: Record<string, string> = {
  critical: '🚨',
  high:     '⚠️',
  medium:   '📋',
  low:      '💬',
}

export async function sendSlackFrustrationAlert(
  payload: SlackAlertPayload
): Promise<{ success: boolean; error?: string }> {
  const {
    webhookUrl, ticketId, ticketSummary, category,
    urgency, frustrationScore, churnRisk, signals,
    customerEmail, appUrl,
  } = payload

  const color = RISK_COLOR[churnRisk] ?? RISK_COLOR.medium
  const emoji = RISK_EMOJI[churnRisk] ?? '⚠️'
  const riskLabel = churnRisk.charAt(0).toUpperCase() + churnRisk.slice(1)
  const ticketUrl = ticketId ? `${appUrl}/tickets?highlight=${ticketId}` : `${appUrl}/frustration`

  const signalText = signals.length > 0
    ? signals.map(s => `• ${s}`).join('\n')
    : '• Elevated frustration detected'

  const message = {
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${emoji} *${riskLabel} frustration detected* — score ${frustrationScore}/100`,
        },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Category*\n${category}` },
          { type: 'mrkdwn', text: `*Urgency*\n${urgency}` },
          { type: 'mrkdwn', text: `*Frustration score*\n${frustrationScore}/100` },
          { type: 'mrkdwn', text: `*Churn risk*\n${riskLabel}` },
          ...(customerEmail ? [{ type: 'mrkdwn', text: `*Customer*\n${customerEmail}` }] : []),
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Ticket summary*\n_${ticketSummary}_`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Frustration signals*\n${signalText}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View ticket →' },
            url:   ticketUrl,
            style: churnRisk === 'critical' ? 'danger' : 'primary',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'All alerts →' },
            url:  `${appUrl}/frustration`,
          },
        ],
      },
      { type: 'divider' },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Replify · <${appUrl}|replify.app> · <${appUrl}/settings#slack|Manage alerts>`,
          },
        ],
      },
    ],
    // Fallback attachment for color sidebar
    attachments: [
      {
        color,
        fallback: `${emoji} ${riskLabel} frustration detected — score ${frustrationScore}/100 — ${category} ticket`,
      },
    ],
  }

  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(message),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Slack returned ${res.status}: ${text}` }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

// Send a plain test message to verify webhook works
export async function sendSlackTestMessage(
  webhookUrl: string,
  appUrl:     string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(webhookUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '✅ *Replify Slack integration working!*\nYou\'ll receive alerts here when high-frustration tickets are detected.',
            },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `Configure alerts at <${appUrl}/settings#slack|Replify Settings>` },
            ],
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      return { success: false, error: `Slack returned ${res.status}: ${text}` }
    }

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}