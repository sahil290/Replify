import 'server-only'

// ── Types ────────────────────────────────────────────────────────
export interface UrgentTicketEmailData {
  to:           string
  userName:     string
  ticketId:     string
  summary:      string
  ticketText:   string
  category:     string
  urgency:      string
  sentiment:    string
  confidence:   number
  aiReply:      string
  dashboardUrl: string
}

export interface WeeklyDigestEmailData {
  to:           string
  userName:     string
  totalTickets: number
  autoResolved: number
  topCategory:  string
  avgConfidence: number
  topIssues:    { name: string; count: number }[]
  dashboardUrl: string
}

export interface WelcomeEmailData {
  to:       string
  userName: string
  appUrl:   string
}

// ── Color helpers ────────────────────────────────────────────────
const URGENCY_COLOR: Record<string, string> = {
  Urgent: '#DC2626',
  Medium: '#D97706',
  Low:    '#059669',
}

const CATEGORY_COLOR: Record<string, string> = {
  Account:          '#2563EB',
  Billing:          '#7C3AED',
  Technical:        '#EA580C',
  'How-to':         '#0D9488',
  'Feature Request':'#4F46E5',
  Other:            '#6B7280',
}

// ── Base email wrapper ───────────────────────────────────────────
function baseTemplate(content: string, previewText: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Replify</title>
<meta name="x-apple-disable-message-reformatting" />
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:'Lato',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
      <!-- Logo header -->
      <tr><td style="padding-bottom:24px;">
        <table cellpadding="0" cellspacing="0">
          <tr>
            <td style="background:#2563EB;border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
              <span style="color:#fff;font-size:16px;font-weight:700;line-height:32px;display:block;">S</span>
            </td>
            <td style="padding-left:10px;font-size:16px;font-weight:700;color:#111827;vertical-align:middle;">Replify</td>
          </tr>
        </table>
      </td></tr>

      <!-- Card -->
      <tr><td style="background:#ffffff;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding-top:24px;text-align:center;font-size:12px;color:#9CA3AF;line-height:1.6;">
        Replify · AI-Powered Customer Support<br/>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings" style="color:#9CA3AF;">Manage notifications</a>
        &nbsp;·&nbsp;
        <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#9CA3AF;">Open dashboard</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ── Template: Urgent ticket alert ────────────────────────────────
export function urgentTicketTemplate(data: UrgentTicketEmailData): string {
  const urgencyColor  = URGENCY_COLOR[data.urgency]  ?? '#6B7280'
  const categoryColor = CATEGORY_COLOR[data.category] ?? '#6B7280'

  const content = `
    <!-- Red urgency banner -->
    <tr><td style="background:#FEF2F2;border-bottom:3px solid ${urgencyColor};padding:16px 32px;">
      <table cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td>
            <span style="background:${urgencyColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;text-transform:uppercase;letter-spacing:0.5px;">
              🚨 ${data.urgency} Ticket
            </span>
          </td>
          <td align="right" style="font-size:12px;color:#6B7280;">
            ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </td>
        </tr>
      </table>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:28px 32px;">
      <p style="margin:0 0 4px;font-size:14px;color:#6B7280;">Hi ${data.userName},</p>
      <h1 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;line-height:1.3;">
        A new urgent support ticket needs your attention
      </h1>

      <!-- Badges -->
      <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="padding-right:8px;">
            <span style="background:${urgencyColor}1A;color:${urgencyColor};font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;">
              ${data.urgency}
            </span>
          </td>
          <td style="padding-right:8px;">
            <span style="background:${categoryColor}1A;color:${categoryColor};font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;">
              ${data.category}
            </span>
          </td>
          <td>
            <span style="background:#F3F4F6;color:#374151;font-size:12px;font-weight:600;padding:4px 12px;border-radius:100px;">
              ${data.confidence}% confidence
            </span>
          </td>
        </tr>
      </table>

      <!-- Summary -->
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Summary</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;font-style:italic;">"${data.summary}"</p>
      </div>

      <!-- Original ticket -->
      <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:14px 16px;margin-bottom:20px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Customer Message</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${data.ticketText.slice(0, 400)}${data.ticketText.length > 400 ? '…' : ''}</p>
      </div>

      <!-- AI reply -->
      <div style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;padding:14px 16px;margin-bottom:28px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#2563EB;text-transform:uppercase;letter-spacing:0.5px;">⚡ AI Suggested Reply</p>
        <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${data.aiReply}</p>
      </div>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#2563EB;border-radius:10px;">
            <a href="${data.dashboardUrl}/tickets" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
              View in Dashboard →
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:20px 0 0;font-size:13px;color:#9CA3AF;">
        Ticket ID: <span style="font-family:monospace;">#${data.ticketId.slice(-8).toUpperCase()}</span>
      </p>
    </td></tr>
  `
  return baseTemplate(content, `🚨 Urgent ticket: ${data.summary}`)
}

// ── Template: Weekly digest ──────────────────────────────────────
export function weeklyDigestTemplate(data: WeeklyDigestEmailData): string {
  const issueRows = data.topIssues.slice(0, 5).map(issue => `
    <tr>
      <td style="padding:8px 0;font-size:13px;color:#374151;border-bottom:1px solid #F3F4F6;">${issue.name}</td>
      <td style="padding:8px 0;font-size:13px;color:#6B7280;text-align:right;border-bottom:1px solid #F3F4F6;">${issue.count} tickets</td>
    </tr>
  `).join('')

  const content = `
    <!-- Header -->
    <tr><td style="background:linear-gradient(135deg,#1E40AF,#7C3AED);padding:28px 32px;">
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff;">📊 Your Weekly Support Digest</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">
        ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </td></tr>

    <!-- Body -->
    <tr><td style="padding:28px 32px;">
      <p style="margin:0 0 24px;font-size:14px;color:#6B7280;">Hi ${data.userName}, here's what happened with your support tickets this week.</p>

      <!-- Metrics grid -->
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td width="50%" style="padding-right:8px;">
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Total Tickets</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#111827;">${data.totalTickets.toLocaleString()}</p>
            </div>
          </td>
          <td width="50%" style="padding-left:8px;">
            <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Auto-Resolved</p>
              <p style="margin:0;font-size:28px;font-weight:700;color:#059669;">${data.autoResolved.toLocaleString()}</p>
            </div>
          </td>
        </tr>
        <tr><td colspan="2" style="padding-top:12px;">
          <div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:10px;padding:16px;">
            <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;">Avg AI Confidence</p>
            <p style="margin:0;font-size:28px;font-weight:700;color:#2563EB;">${data.avgConfidence}%</p>
          </div>
        </td></tr>
      </table>

      <!-- Top issues -->
      <h2 style="margin:0 0 12px;font-size:15px;font-weight:700;color:#111827;">Top Issues This Week</h2>
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
        ${issueRows}
      </table>

      <!-- CTA -->
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="background:#2563EB;border-radius:10px;">
            <a href="${data.dashboardUrl}/insights" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
              View Full Insights →
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  `
  return baseTemplate(content, `Your weekly support digest — ${data.totalTickets} tickets analyzed`)
}

// ── Template: Welcome email ──────────────────────────────────────
export function welcomeTemplate(data: WelcomeEmailData): string {
  const content = `
    <tr><td style="background:#2563EB;padding:28px 32px;text-align:center;">
      <h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;">Welcome to Replify! 🚀</h1>
      <p style="margin:8px 0 0;font-size:15px;color:rgba(255,255,255,0.85);">Your AI support assistant is ready</p>
    </td></tr>
    <tr><td style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:14px;color:#374151;line-height:1.7;">
        Hi ${data.userName}, welcome aboard! You're all set to start analyzing support tickets with AI.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.7;">
        Here's how to get started in 3 steps:
      </p>

      ${[
        ['1', '#2563EB', 'Analyze your first ticket', 'Go to Analyze Ticket, paste a real support message, and see the AI response in seconds.'],
        ['2', '#7C3AED', 'Connect your platform', 'Head to Integrations to connect Zendesk, Intercom, or any platform via webhook.'],
        ['3', '#059669', 'Check your Insights', 'After a few tickets, visit Insights to see patterns and knowledge base gaps.'],
      ].map(([num, color, title, desc]) => `
        <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:16px;">
          <tr>
            <td width="36" valign="top">
              <div style="background:${color};width:28px;height:28px;border-radius:50%;text-align:center;line-height:28px;font-size:13px;font-weight:700;color:#fff;">${num}</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:600;color:#111827;">${title}</p>
              <p style="margin:0;font-size:13px;color:#6B7280;line-height:1.6;">${desc}</p>
            </td>
          </tr>
        </table>
      `).join('')}

      <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
        <tr>
          <td style="background:#2563EB;border-radius:10px;">
            <a href="${data.appUrl}/analyze-ticket" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
              Analyze Your First Ticket →
            </a>
          </td>
        </tr>
      </table>
    </td></tr>
  `
  return baseTemplate(content, `Welcome to Replify, ${data.userName}!`)
}

// ── Send email via Resend ────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to:      string
  subject: string
  html:    string
}): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return false
  }

  const from = `${process.env.RESEND_FROM_NAME ?? 'Replify'} <${process.env.RESEND_FROM_EMAIL ?? 'noreply@Replify.app'}>`

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ from, to, subject, html }),
    })

    if (!res.ok) {
      const err = await res.json()
      console.error('[email] Resend error:', err)
      return false
    }

    return true
  } catch (err) {
    console.error('[email] Failed to send:', err)
    return false
  }
}

// ── Convenience senders ──────────────────────────────────────────
export async function sendUrgentTicketAlert(data: UrgentTicketEmailData) {
  return sendEmail({
    to:      data.to,
    subject: `🚨 Urgent ticket: ${data.summary.slice(0, 60)}`,
    html:    urgentTicketTemplate(data),
  })
}

export async function sendWeeklyDigest(data: WeeklyDigestEmailData) {
  return sendEmail({
    to:      data.to,
    subject: `📊 Your weekly support digest — ${data.totalTickets} tickets analyzed`,
    html:    weeklyDigestTemplate(data),
  })
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  return sendEmail({
    to:      data.to,
    subject: `Welcome to Replify 🚀`,
    html:    welcomeTemplate(data),
  })
}