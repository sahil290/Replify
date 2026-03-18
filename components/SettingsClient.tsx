'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Bell, Download, Trash2, RefreshCw } from 'lucide-react'
import AutoReplySettings from '@/components/settings/AutoReplySettings'
import SlackSettings from '@/components/settings/SlackSettings'
import UsageDashboard from '@/components/ui/UsageDashboard'
import UpgradePlans from '@/components/ui/Upgradeplans'

function DeleteAccountButton() {
  const router   = useRouter()
  const [step,   setStep]    = useState<'idle' | 'confirm' | 'deleting'>('idle')
  const [error,  setError]   = useState<string | null>(null)
  async function handleDelete() {
    setStep('deleting')
    setError(null)
    try {
      const res = await fetch('/api/account/delete', { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to delete account')
      router.push('/?deleted=1')
      router.refresh()
    } catch (err: any) {
      setError(err.message)
      setStep('confirm')
    }
  }

  if (step === 'idle') {
    return (
      <button
        onClick={() => setStep('confirm')}
        className="btn-ghost !py-1.5 !px-3 !text-xs text-red-600 hover:bg-red-50 border-red-200"
      >
        <Trash2 className="w-3 h-3" /> Delete
      </button>
    )
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col gap-2 items-end">
        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-xs text-gray-600 text-right max-w-xs">
          This permanently deletes your account and all data. Are you sure?
        </p>
        <div className="flex gap-2">
          <button onClick={() => setStep('idle')} className="btn-ghost !py-1.5 !px-3 !text-xs">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            className="!py-1.5 !px-3 !text-xs inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
          >
            Yes, delete my account
          </button>
        </div>
      </div>
    )
  }

  return (
    <button disabled className="btn-ghost !py-1.5 !px-3 !text-xs text-red-600 opacity-60">
      <RefreshCw className="w-3 h-3 animate-spin" /> Deleting…
    </button>
  )
}

interface SettingsClientProps {
  user: {
    email:                string
    full_name:            string
    plan:                 string
    notify_urgent:        boolean
    notify_digest:        boolean
    auto_reply_enabled:   boolean
    auto_reply_threshold: number
    connected_platforms:  string[]
  }
}

function Toggle({
  defaultOn = false,
  onChange,
}: {
  defaultOn?: boolean
  onChange?: (val: boolean) => void
}) {
  const [on, setOn] = useState(defaultOn)
  function handleClick() {
    const next = !on
    setOn(next)
    onChange?.(next)
  }
  return (
    <button
      onClick={handleClick}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 focus:outline-none shrink-0 ${on ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
    </button>
  )
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="card p-6 mb-5">
      <h2 className="text-base font-semibold text-gray-900 mb-1">{title}</h2>
      <p className="text-sm text-gray-400 mb-5">{desc}</p>
      {children}
    </div>
  )
}

function Row({ label, desc, action }: { label: string; desc: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-gray-100 last:border-0 gap-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
      </div>
      {action}
    </div>
  )
}

const PLAN_LABELS: Record<string, string> = {
  starter:  'Starter — 100 tickets/month',
  pro:      'Pro — 1,000 tickets/month',
  business: 'Business — Unlimited tickets',
}

async function updateNotificationPref(key: string, value: boolean) {
  await fetch('/api/settings/notifications', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ [key]: value }),
  })
}

export default function SettingsClient({ user }: SettingsClientProps) {
  const [saved, setSaved] = useState(false)
  const [name,  setName]  = useState(user.full_name)

  async function handleSaveName() {
    await fetch('/api/settings/profile', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ full_name: name }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const integrations = [
    { id: 'zendesk',   label: 'Zendesk',   color: 'bg-teal-800',  short: 'ZD' },
    { id: 'intercom',  label: 'Intercom',  color: 'bg-blue-700',  short: 'IC' },
    { id: 'freshdesk', label: 'Freshdesk', color: 'bg-green-700', short: 'FD' },
  ]

  return (
    <div>
      {/* Account */}
      <Section title="Account" desc="Manage your profile and workspace preferences.">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input flex-1"
            />
            <button onClick={handleSaveName} className="btn-primary !py-2 !px-4 !text-xs shrink-0">
              {saved ? <><Check className="w-3 h-3" /> Saved</> : 'Save'}
            </button>
          </div>
        </div>
        <Row label="Email"    desc={user.email}                      action={<button className="btn-ghost !py-1.5 !px-3 !text-xs">Change</button>} />
        <Row label="Plan"     desc={PLAN_LABELS[user.plan] ?? user.plan} action={<button className="btn-primary !py-1.5 !px-3 !text-xs">Upgrade</button>} />
        <Row label="Password" desc="Last changed 3 months ago"       action={<button className="btn-ghost !py-1.5 !px-3 !text-xs">Change</button>} />
      </Section>

      {/* Notifications */}
      <Section
        title="Email Notifications"
        desc="Control which emails SupportPilot sends you."
      >
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 mb-4">
          <Bell className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-xs text-blue-700">
            Emails are sent to <span className="font-semibold">{user.email}</span>
          </p>
        </div>
        <Row
          label="Urgent ticket alerts"
          desc="Get an email immediately when an Urgent ticket is analyzed"
          action={
            <Toggle
              defaultOn={user.notify_urgent}
              onChange={val => updateNotificationPref('notify_urgent', val)}
            />
          }
        />
        <Row
          label="Weekly insights digest"
          desc="Receive a summary of your support trends every Monday morning"
          action={
            <Toggle
              defaultOn={user.notify_digest}
              onChange={val => updateNotificationPref('notify_digest', val)}
            />
          }
        />
      </Section>

      {/* AI Config */}
      <Section title="AI Configuration" desc="Configure how SupportPilot's AI behaves.">
        <Row
          label="Auto-send responses"
          desc="Automatically send AI replies with confidence ≥ 95%"
          action={<Toggle />}
        />
        <Row
          label="AI Model"
          desc="Llama 3.3 70B (via Groq) · Cloud inference"
          action={<button className="btn-ghost !py-1.5 !px-3 !text-xs">Configure</button>}
        />
        <Row
          label="Response tone"
          desc="Professional and empathetic"
          action={
            <select className="form-input !w-auto !py-1.5 !text-xs">
              <option>Professional & empathetic</option>
              <option>Friendly & casual</option>
              <option>Concise & direct</option>
            </select>
          }
        />
        <Row
          label="Confidence threshold"
          desc="Only show suggestions above this score"
          action={
            <select className="form-input !w-auto !py-1.5 !text-xs">
              <option>70%</option><option>80%</option>
              <option selected>85%</option><option>90%</option><option>95%</option>
            </select>
          }
        />
      </Section>

      {/* Integrations quick links */}
      <Section title="Integrations" desc="Connect your customer support platforms.">
        {integrations.map(i => (
          <Row
            key={i.id}
            label={i.label}
            desc="Not connected"
            action={
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${i.color} rounded-lg flex items-center justify-center text-white text-xs font-bold`}>
                  {i.short}
                </div>
                <a href="/integrations" className="btn-primary !py-1.5 !px-3 !text-xs">Connect</a>
              </div>
            }
          />
        ))}
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone" desc="Irreversible actions for your account.">
        <Row
          label="Export all data"
          desc="Download all your tickets and responses as CSV"
          action={
            <a href="/api/export" download className="btn-ghost !py-1.5 !px-3 !text-xs flex items-center gap-1.5">
              <Download className="w-3 h-3" /> Export
            </a>
          }
        />
        <Row
          label="Delete account"
          desc="Permanently delete your account and all data. This cannot be undone."
          action={
            <DeleteAccountButton />
          }
        />
      </Section>

      {/* AI Usage */}
      <UsageDashboard />

      {/* Auto-Reply */}
      <AutoReplySettings
        enabled={user.auto_reply_enabled}
        threshold={user.auto_reply_threshold}
        platforms={user.connected_platforms}
      />

      {/* Slack Alerts */}
      <SlackSettings />

      {/* Upgrade */}
      <div className="card p-6 mb-5">
        <UpgradePlans currentPlan={user.plan} />
      </div>
    </div>
  )
}