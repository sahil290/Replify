'use client'

import { useState, useEffect } from 'react'
import { Slack, CheckCircle2, XCircle, Send, RefreshCw, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SlackSettingsProps {
  initialWebhookUrl?:    string
  initialEnabled?:       boolean
  initialThreshold?:     number
}

export default function SlackSettings({
  initialWebhookUrl    = '',
  initialEnabled       = false,
  initialThreshold     = 70,
}: SlackSettingsProps) {
  const [webhookUrl,  setWebhookUrl]  = useState(initialWebhookUrl)
  const [enabled,     setEnabled]     = useState(initialEnabled)
  const [threshold,   setThreshold]   = useState(initialThreshold)
  const [saving,      setSaving]      = useState(false)
  const [testing,     setTesting]     = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [testResult,  setTestResult]  = useState<'success' | 'error' | null>(null)
  const [error,       setError]       = useState<string | null>(null)

  // Load current settings
  useEffect(() => {
    fetch('/api/settings/slack')
      .then(r => r.json())
      .then(d => {
        if (d.slack_webhook_url)    setWebhookUrl(d.slack_webhook_url)
        if (typeof d.slack_alerts_enabled === 'boolean') setEnabled(d.slack_alerts_enabled)
        if (d.frustration_threshold) setThreshold(d.frustration_threshold)
      })
      .catch(console.error)
  }, [])

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch('/api/settings/slack', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          slack_webhook_url:    webhookUrl,
          slack_alerts_enabled: enabled,
          frustration_threshold: threshold,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleTest() {
    if (!webhookUrl) { setError('Enter a webhook URL first'); return }
    setTesting(true); setTestResult(null); setError(null)
    try {
      const res  = await fetch('/api/slack-test', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ webhook_url: webhookUrl }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTestResult('success')
    } catch (err: any) {
      setTestResult('error')
      setError(err.message)
    } finally {
      setTesting(false)
    }
  }

  const riskColors = ['bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-red-500']
  const riskLabel  = threshold >= 80 ? 'Critical only' : threshold >= 60 ? 'High + Critical' : threshold >= 40 ? 'Medium and above' : 'All frustration'

  return (
    <div className="card p-6 space-y-6" id="slack">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-[#4A154B] rounded-xl flex items-center justify-center shrink-0">
          <Slack className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Slack Alerts</h3>
          <p className="text-xs text-gray-400">Get notified instantly when frustrated customers are detected</p>
        </div>
      </div>

      {/* Webhook URL */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Slack Incoming Webhook URL
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={webhookUrl}
            onChange={e => setWebhookUrl(e.target.value)}
            placeholder="https://hooks.slack.com/services/T.../B.../..."
            className="form-input flex-1 font-mono text-xs"
          />
          <button
            onClick={handleTest}
            disabled={testing || !webhookUrl}
            className="btn-ghost !py-2 !px-3 !text-xs gap-1.5 shrink-0"
          >
            {testing
              ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              : <Send className="w-3.5 h-3.5" />}
            Test
          </button>
        </div>
        {/* Test result */}
        {testResult === 'success' && (
          <p className="mt-2 text-xs text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Test message sent — check your Slack channel
          </p>
        )}
        {testResult === 'error' && (
          <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" />
            {error ?? 'Test failed — check your webhook URL'}
          </p>
        )}
        <p className="mt-1.5 text-xs text-gray-400">
          Create a webhook at{' '}
          <a
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
          >
            api.slack.com/messaging/webhooks <ExternalLink className="w-3 h-3" />
          </a>
        </p>
      </div>

      {/* Enable toggle */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div>
          <p className="text-sm font-medium text-gray-900">Enable Slack alerts</p>
          <p className="text-xs text-gray-400 mt-0.5">Send alerts to Slack when frustration is detected</p>
        </div>
        <button
          onClick={() => setEnabled(!enabled)}
          disabled={!webhookUrl}
          className={cn(
            'relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0',
            enabled && webhookUrl ? 'bg-blue-600' : 'bg-gray-200',
            !webhookUrl && 'opacity-50 cursor-not-allowed'
          )}
        >
          <span className={cn(
            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
            enabled && webhookUrl ? 'translate-x-5' : 'translate-x-0'
          )} />
        </button>
      </div>

      {/* Threshold slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-gray-700">
            Alert threshold
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">{threshold}</span>
            <span className={cn(
              'text-[10px] font-semibold px-2 py-0.5 rounded-full',
              threshold >= 80 ? 'bg-red-100 text-red-700' :
              threshold >= 60 ? 'bg-orange-100 text-orange-700' :
              threshold >= 40 ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {riskLabel}
            </span>
          </div>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={threshold}
          onChange={e => setThreshold(Number(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-gray-400">Alert everything</span>
          <span className="text-[10px] text-gray-400">Critical only</span>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Only send Slack alerts when frustration score ≥ {threshold}. Recommended: 70.
        </p>
      </div>

      {/* What alerts look like */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <p className="text-xs font-semibold text-gray-700 mb-3">Preview — what alerts look like in Slack</p>
        <div className="bg-white rounded-lg border border-gray-200 p-3 font-mono text-xs space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1 h-12 bg-red-500 rounded-full shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">🚨 Critical frustration detected — score 87/100</p>
              <p className="text-gray-500 mt-1">Category: Billing &nbsp;·&nbsp; Urgency: Urgent</p>
              <p className="text-gray-500">Ticket: <span className="italic">"This is the third time my card has been charged..."</span></p>
              <p className="text-gray-500 mt-1">Signals: Repeated issue · Escalation language · Churn risk signal</p>
              <div className="flex gap-2 mt-2">
                <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[10px] font-medium">View ticket →</span>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px]">All alerts →</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save error */}
      {error && testResult !== 'error' && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {/* Save button */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
        {saving
          ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" />Saving…</>
          : saved
          ? <><CheckCircle2 className="w-3.5 h-3.5" />Saved!</>
          : 'Save Slack settings'}
      </button>
    </div>
  )
}