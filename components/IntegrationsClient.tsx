'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, ExternalLink, Copy, Check,
  Webhook, Key, RefreshCw, Trash2, ChevronDown, ChevronUp,
  AlertCircle, Info
} from 'lucide-react'

interface Connection {
  id: string
  user_id: string
  platform: string
  status: 'connected' | 'error' | 'pending'
  webhook_url?: string
  api_key_hint?: string   // last 4 chars only, never full key
  connected_at?: string
}

interface IntegrationsClientProps {
  connections: Connection[]
  userId: string | undefined
}

// ── Platform definitions ─────────────────────────────────────────
const PLATFORMS = [
  {
    id: 'zendesk',
    name: 'Zendesk',
    desc: 'Connect your Zendesk account to auto-analyze new tickets via webhook.',
    color: 'bg-teal-700',
    textColor: 'text-teal-700',
    bgLight: 'bg-teal-50',
    borderColor: 'border-teal-200',
    short: 'ZD',
    docsUrl: 'https://developer.zendesk.com/api-reference/webhooks/webhooks-api/webhooks/',
    steps: [
      'Go to Zendesk Admin → Apps and Integrations → Webhooks',
      'Click "Create webhook" and paste the webhook URL below',
      'Set Trigger to "Ticket Created" and method to POST',
      'Copy your Zendesk API token from Admin → Apps → Zendesk API',
      'Paste the API token below and click Save',
    ],
    fields: [
      { key: 'subdomain',  label: 'Zendesk Subdomain', placeholder: 'yourcompany  (from yourcompany.zendesk.com)', type: 'text' },
      { key: 'api_token',  label: 'Zendesk API Token',  placeholder: 'Paste your API token here',                  type: 'password' },
      { key: 'admin_email',label: 'Admin Email',         placeholder: 'admin@yourcompany.com',                      type: 'email' },
    ],
  },
  {
    id: 'intercom',
    name: 'Intercom',
    desc: 'Sync Intercom conversations and auto-generate AI replies for new messages.',
    color: 'bg-blue-700',
    textColor: 'text-blue-700',
    bgLight: 'bg-blue-50',
    borderColor: 'border-blue-200',
    short: 'IC',
    docsUrl: 'https://developers.intercom.com/docs/build-an-integration/getting-started',
    steps: [
      'Go to Intercom Developer Hub → Your Apps → Create New App',
      'Under Authentication, generate an Access Token',
      'Go to Webhooks, add a new webhook with the URL below',
      'Select "conversation.user.created" as the topic',
      'Paste your Access Token below and click Save',
    ],
    fields: [
      { key: 'access_token', label: 'Access Token', placeholder: 'Paste your Intercom access token', type: 'password' },
    ],
  },
  {
    id: 'freshdesk',
    name: 'Freshdesk',
    desc: 'Automatically pull and analyze tickets from your Freshdesk helpdesk.',
    color: 'bg-green-700',
    textColor: 'text-green-700',
    bgLight: 'bg-green-50',
    borderColor: 'border-green-200',
    short: 'FD',
    docsUrl: 'https://developers.freshdesk.com/api/',
    steps: [
      'Log in to Freshdesk → Profile Settings → API Key',
      'Copy your API key',
      'Go to Admin → Integrations → Webhooks and add the URL below',
      'Set it to trigger on "Ticket Created"',
      'Paste your API key and subdomain below, then click Save',
    ],
    fields: [
      { key: 'subdomain', label: 'Freshdesk Subdomain', placeholder: 'yourcompany  (from yourcompany.freshdesk.com)', type: 'text' },
      { key: 'api_key',   label: 'API Key',              placeholder: 'Paste your Freshdesk API key',                  type: 'password' },
    ],
  },
  {
    id: 'helpscout',
    name: 'Help Scout',
    desc: 'Connect Help Scout mailboxes to analyze and respond to customer emails.',
    color: 'bg-indigo-700',
    textColor: 'text-indigo-700',
    bgLight: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    short: 'HS',
    docsUrl: 'https://developer.helpscout.com/mailbox-api/',
    steps: [
      'Go to Help Scout → Your Profile → API Keys',
      'Create a new API key and copy it',
      'Go to Manage → Apps → Webhooks and add the URL below',
      'Select "New conversation" as the event',
      'Paste your API key below and click Save',
    ],
    fields: [
      { key: 'api_key', label: 'API Key', placeholder: 'Paste your Help Scout API key', type: 'password' },
    ],
  },
  {
    id: 'webhook',
    name: 'Custom Webhook',
    desc: 'Use our generic webhook to connect any platform — Gorgias, Groove, email, or your own system.',
    color: 'bg-gray-700',
    textColor: 'text-gray-700',
    bgLight: 'bg-gray-50',
    borderColor: 'border-gray-200',
    short: '{ }',
    docsUrl: '#',
    steps: [
      'Copy the webhook URL below',
      'In your platform, set up a webhook that POSTs to this URL on new ticket/message creation',
      'Make sure the payload includes a "message" or "body" field with the ticket text',
      'Optionally include "customer_email", "subject", and "priority" fields',
      'Test by sending a POST request — you should see the ticket appear in your dashboard',
    ],
    fields: [],
  },
  {
    id: 'email',
    name: 'Email Forward',
    desc: 'Forward support emails directly to your Replify inbox for instant AI analysis.',
    color: 'bg-orange-600',
    textColor: 'text-orange-700',
    bgLight: 'bg-orange-50',
    borderColor: 'border-orange-200',
    short: '@',
    docsUrl: '#',
    steps: [
      'Copy your unique Replify email address below',
      'In your email client or support inbox, set up a forwarding rule',
      'Forward all incoming support emails to your Replify address',
      'Every forwarded email will be automatically analyzed',
      'Replies will appear in your Replify dashboard',
    ],
    fields: [],
  },
]

// ── Webhook URL helper ───────────────────────────────────────────
function getWebhookUrl(userId: string | undefined, platform: string) {
  const base = typeof window !== 'undefined' ? window.location.origin : 'https://yourapp.com'
  const uid  = userId ?? ''
  return `${base}/api/webhooks/${platform}?uid=${uid.slice(0, 8) || 'YOUR_USER_ID'}`
}

function getEmailAddress(userId: string | undefined) {
  return `support-${(userId ?? '').slice(0, 8) || 'YOUR_ID'}@inbound.replify.app`
}

// ── Copy button ──────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
    >
      {copied ? <><Check className="w-3 h-3" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
    </button>
  )
}

// ── Single platform card ─────────────────────────────────────────
function PlatformCard({
  platform,
  connection,
  userId,
}: {
  platform: typeof PLATFORMS[0]
  connection?: Connection
  userId: string | undefined
}) {
  const [expanded,  setExpanded]  = useState(false)
  const [fields,    setFields]    = useState<Record<string, string>>({})
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const isConnected = !!connection && connection.status === 'connected'
  const webhookUrl  = getWebhookUrl(userId, platform.id)
  const emailAddr   = getEmailAddress(userId)

  function updateField(key: string, value: string) {
    setFields(f => ({ ...f, [key]: value }))
  }

  async function handleSave() {
    // Validate required fields
    for (const f of platform.fields) {
      if (!fields[f.key]?.trim()) {
        setError(`${f.label} is required`)
        return
      }
    }
    setError(null)
    setSaving(true)

    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform.id,
          fields,
          webhook_url: webhookUrl,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      setSaved(true)
      setTimeout(() => { setSaved(false); setExpanded(false) }, 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm(`Disconnect ${platform.name}? This will stop ticket syncing.`)) return
    setDisconnecting(true)
    await fetch(`/api/integrations?platform=${platform.id}`, { method: 'DELETE' })
    setDisconnecting(false)
    window.location.reload()
  }

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition-all ${
      isConnected ? `border-l-4 ${platform.borderColor} border-gray-200` : 'border-gray-200'
    }`}>
      {/* Card header */}
      <div className="flex items-center gap-4 p-5">
        <div className={`w-11 h-11 ${platform.color} rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0`}>
          {platform.short}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-gray-900">{platform.name}</p>
            {isConnected && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-2.5 h-2.5" /> Connected
              </span>
            )}
            {connection?.status === 'error' && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                <XCircle className="w-2.5 h-2.5" /> Error
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 truncate">{platform.desc}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isConnected ? (
            <>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="btn-ghost !py-1.5 !px-3 !text-xs !text-red-600 hover:!bg-red-50"
              >
                <Trash2 className="w-3 h-3" />
                {disconnecting ? 'Removing…' : 'Disconnect'}
              </button>
              <button
                onClick={() => setExpanded(!expanded)}
                className="btn-ghost !py-1.5 !px-3 !text-xs"
              >
                {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                Details
              </button>
            </>
          ) : (
            <button
              onClick={() => setExpanded(!expanded)}
              className="btn-primary !py-1.5 !px-4 !text-xs"
            >
              {expanded ? 'Cancel' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {/* Expanded setup panel */}
      {expanded && (
        <div className={`border-t border-gray-100 ${platform.bgLight} p-5`}>

          {/* Webhook / email URL (always shown) */}
          {platform.id !== 'email' && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Webhook className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-semibold text-gray-700">Your Webhook URL</p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <code className="text-xs text-gray-600 flex-1 truncate">{webhookUrl}</code>
                <CopyButton text={webhookUrl} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 flex items-start gap-1">
                <Info className="w-3 h-3 shrink-0 mt-0.5" />
                Paste this URL into your platform's webhook settings to receive tickets automatically.
              </p>
            </div>
          )}

          {platform.id === 'email' && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1.5">
                <Key className="w-3.5 h-3.5 text-gray-500" />
                <p className="text-xs font-semibold text-gray-700">Your Replify Email Address</p>
              </div>
              <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <code className="text-xs text-gray-600 flex-1">{emailAddr}</code>
                <CopyButton text={emailAddr} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5">
                Forward support emails to this address. Each email will be analyzed automatically.
              </p>
            </div>
          )}

          {/* Step-by-step instructions */}
          <div className="mb-5">
            <p className="text-xs font-semibold text-gray-700 mb-3 flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Setup Steps
            </p>
            <ol className="space-y-2">
              {platform.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600">
                  <span className={`w-5 h-5 rounded-full ${platform.color} text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5`}>
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
            {platform.docsUrl !== '#' && (
              <a
                href={platform.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline mt-3 font-medium"
              >
                <ExternalLink className="w-3 h-3" />
                View official {platform.name} docs
              </a>
            )}
          </div>

          {/* API key / credential fields */}
          {platform.fields.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Your Credentials
              </p>
              {platform.fields.map(f => (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
                  <input
                    type={f.type}
                    placeholder={f.placeholder}
                    value={fields[f.key] ?? ''}
                    onChange={e => updateField(f.key, e.target.value)}
                    className="form-input !text-xs"
                  />
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Save button (for platforms with fields) or Done button for webhook/email */}
          {platform.fields.length > 0 ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary !text-xs !py-2"
            >
              {saving ? <><div className="spinner !w-3.5 !h-3.5" /> Saving…</>
                : saved ? <><Check className="w-3.5 h-3.5" /> Connected!</>
                : `Save & Connect ${platform.name}`}
            </button>
          ) : (
            <button
              onClick={() => setExpanded(false)}
              className="btn-ghost !text-xs !py-2"
            >
              Done — I've set it up
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────
export default function IntegrationsClient({ connections: initialConnections, userId }: IntegrationsClientProps) {
  const connections = initialConnections ?? []

  const getConnection = (platformId: string) =>
    connections.find(c => c.platform === platformId)

  const connectedCount = connections.filter(c => c.status === 'connected').length

  return (
    <div>
      {/* Status bar */}
      {connectedCount > 0 ? (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6 text-sm text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>{connectedCount} platform{connectedCount > 1 ? 's' : ''} connected.</strong>
            {' '}Tickets are being analyzed automatically.
          </span>
        </div>
      ) : (
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <span>
            Connect a platform below to start analyzing tickets automatically.
            You can also use the <strong>Analyze Ticket</strong> page to paste tickets manually.
          </span>
        </div>
      )}

      {/* Platform cards */}
      <div className="space-y-3">
        {PLATFORMS.map(platform => (
          <PlatformCard
            key={platform.id}
            platform={platform}
            connection={getConnection(platform.id)}
            userId={userId}
          />
        ))}
      </div>

      {/* Manual option callout */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-gray-700 mb-1">Don't see your platform?</p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Use the <strong>Custom Webhook</strong> option above — it works with any platform that supports webhooks,
          including Gorgias, Groove, Front, Kayako, LiveAgent, and custom-built systems.
          You can also always paste tickets manually in the{' '}
          <a href="/analyze-ticket" className="text-blue-600 hover:underline">Analyze Ticket</a> page.
        </p>
      </div>
    </div>
  )
}