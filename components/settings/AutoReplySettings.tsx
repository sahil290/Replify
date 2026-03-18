'use client'

import { useState } from 'react'
import {
  Zap, Shield, Check, Info,
  ChevronDown, ChevronUp, RefreshCw, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AutoReplySettingsProps {
  enabled:    boolean
  threshold:  number
  platforms:  string[]
}

const THRESHOLD_OPTIONS = [
  { value: 70, label: '70%', desc: 'More replies sent, some may be less accurate' },
  { value: 75, label: '75%', desc: 'Balanced — good for common, predictable tickets' },
  { value: 80, label: '80%', desc: 'Recommended for most teams' },
  { value: 85, label: '85%', desc: 'High quality — fewer but more accurate replies' },
  { value: 90, label: '90%', desc: 'Very conservative — only very clear-cut tickets' },
  { value: 95, label: '95%', desc: 'Maximum safety — almost never fires incorrectly' },
]

export default function AutoReplySettings({
  enabled:   initialEnabled,
  threshold: initialThreshold,
  platforms,
}: AutoReplySettingsProps) {
  const [enabled,   setEnabled]   = useState(initialEnabled)
  const [threshold, setThreshold] = useState(initialThreshold || 0)
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [expanded,  setExpanded]  = useState(true)

  // Only block if no threshold selected — platform is optional (generic webhook works without one)
  const noThreshold = threshold === 0
  const canEnable   = !noThreshold

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/settings/auto-reply', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ enabled, threshold }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to save')
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function handleToggle() {
    if (!enabled && noThreshold) {
      setError('Please select a confidence threshold first before enabling auto-reply.')
      return
    }
    setError(null)
    setEnabled(!enabled)
  }

  const selectedOption = THRESHOLD_OPTIONS.find(o => o.value === threshold)
  const noPlatforms    = platforms.length === 0

  return (
    <div className="card mb-5 overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-6 py-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
            enabled ? 'bg-blue-600' : 'bg-gray-200'
          )}>
            <Zap className={cn('w-4 h-4', enabled ? 'text-white' : 'text-gray-400')} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-gray-900">Auto-Reply</p>
              <span className={cn(
                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide',
                enabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-gray-100 text-gray-500'
              )}>
                {enabled ? 'Active' : 'Off'}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              {enabled && threshold > 0
                ? `Sending replies automatically when confidence ≥ ${threshold}%`
                : 'Configure below to enable automatic replies'}
            </p>
          </div>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-6">

          {/* How it works */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-800 leading-relaxed space-y-1">
              <p className="font-semibold">How auto-reply works</p>
              <p>When a ticket arrives via webhook, Replify analyzes it instantly. If confidence meets your threshold, the AI reply is sent back to the customer automatically.</p>
              <p>Tickets below the threshold are saved for manual review. You can use the <strong>generic webhook</strong> to test without connecting a platform.</p>
            </div>
          </div>

          {/* No platform info — warning only, not a blocker */}
          {noPlatforms && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
              <span>
                No platforms connected yet. Auto-reply will work with the{' '}
                <strong>generic webhook</strong> for testing.{' '}
                <a href="/integrations" className="underline font-medium">Connect a platform</a>
                {' '}to enable replies on Zendesk, Intercom, or Freshdesk.
              </span>
            </div>
          )}

          {/* Step 1 — Set threshold */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">1</div>
              <p className="text-sm font-semibold text-gray-900">Set confidence threshold <span className="text-red-500">*</span></p>
            </div>
            <p className="text-xs text-gray-500 mb-3 ml-7">
              Only tickets where the AI is <span className="font-semibold">at least this confident</span> will be auto-replied.
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 ml-7">
              {THRESHOLD_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => { setThreshold(opt.value); setError(null) }}
                  className={cn(
                    'flex flex-col items-center py-2.5 px-1 rounded-xl border-2 transition-all text-center',
                    threshold === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  <span className="text-base font-bold">{opt.label}</span>
                </button>
              ))}
            </div>

            {selectedOption && (
              <div className="ml-7 mt-3 flex items-center gap-2 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5 text-gray-400" />
                {selectedOption.desc}
              </div>
            )}

            {/* Live preview */}
            {threshold > 0 && (
              <div className="ml-7 mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 mb-3">With this threshold, here's what would happen:</p>
                <div className="space-y-2">
                  {[
                    { label: 'Password reset question',     conf: 97 },
                    { label: 'How to export data',          conf: 91 },
                    { label: 'Billing dispute',             conf: 78 },
                    { label: 'Complex API bug',             conf: 62 },
                  ].map(ex => {
                    const wouldSend = ex.conf >= threshold
                    return (
                      <div key={ex.label} className="flex items-center gap-3">
                        <div className={cn(
                          'w-4 h-4 rounded-full flex items-center justify-center shrink-0',
                          wouldSend ? 'bg-emerald-500' : 'bg-gray-300'
                        )}>
                          {wouldSend
                            ? <Check className="w-2.5 h-2.5 text-white" />
                            : <span className="text-white text-[8px] font-bold">–</span>}
                        </div>
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={cn('h-full rounded-full', wouldSend ? 'bg-emerald-500' : 'bg-gray-400')}
                              style={{ width: `${ex.conf}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-gray-600 w-8 text-right">{ex.conf}%</span>
                        <span className={cn(
                          'text-[10px] font-semibold w-24 shrink-0',
                          wouldSend ? 'text-emerald-600' : 'text-gray-400'
                        )}>
                          {wouldSend ? '✓ Auto-reply' : 'Manual review'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Step 2 — Enable toggle */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">2</div>
              <p className="text-sm font-semibold text-gray-900">Enable auto-reply</p>
            </div>

            <div className="ml-7 flex items-center justify-between bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {enabled ? 'Auto-reply is active' : 'Auto-reply is off'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {enabled
                    ? `Replies sent automatically when confidence ≥ ${threshold}%`
                    : noThreshold
                      ? 'Select a threshold above first'
                      : 'Toggle on to start sending replies automatically'}
                </p>
              </div>
              <button
                onClick={handleToggle}
                className={cn(
                  'relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4',
                  enabled ? 'bg-blue-600' : noThreshold ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-300'
                )}
              >
                <span className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
                  enabled && 'translate-x-6'
                )} />
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Save */}
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving || noThreshold}
              className="btn-primary !py-2 !text-xs disabled:opacity-50"
            >
              {saving
                ? <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                : saved
                  ? <><Check className="w-3.5 h-3.5" /> Saved!</>
                  : 'Save settings'}
            </button>
            <p className="text-xs text-gray-400">
              {noThreshold
                ? 'Select a threshold to save'
                : 'Changes apply immediately to new incoming tickets.'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}