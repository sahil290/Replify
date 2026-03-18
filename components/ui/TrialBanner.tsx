'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Zap, X } from 'lucide-react'

interface TrialBannerProps {
  signupDate: string   // ISO date string from user metadata
  plan: string
}

export default function TrialBanner({ signupDate, plan }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Remember dismissal per session
    if (sessionStorage.getItem('trial_banner_dismissed') === 'true') {
      setDismissed(true)
    }
  }, [])

  function dismiss() {
    setDismissed(true)
    sessionStorage.setItem('trial_banner_dismissed', 'true')
  }

  // Only show on free/starter plan
  if (plan !== 'starter' && plan !== 'free') return null
  if (dismissed) return null

  const signup    = new Date(signupDate)
  const trialEnd  = new Date(signup.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now       = new Date()
  const msLeft    = trialEnd.getTime() - now.getTime()
  const daysLeft  = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)))
  const trialOver = msLeft <= 0

  if (trialOver) {
    return (
      <div className="bg-red-600 text-white px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm font-medium">
          <Zap className="w-4 h-4 shrink-0" />
          <span>Your free trial has ended. Upgrade now to continue analyzing tickets.</span>
        </div>
        <Link
          href="/settings#upgrade"
          className="shrink-0 bg-white text-red-600 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
        >
          Upgrade to Pro
        </Link>
      </div>
    )
  }

  const urgentColor = daysLeft <= 2
    ? 'bg-amber-500'
    : 'bg-blue-600'

  return (
    <div className={`${urgentColor} text-white px-6 py-2.5 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-3 text-sm">
        <Zap className="w-4 h-4 shrink-0" />
        <span>
          <span className="font-semibold">{daysLeft} day{daysLeft !== 1 ? 's' : ''} left</span>
          {' '}on your free trial.
          {daysLeft <= 3 && ' Don\'t lose access to your data!'}
        </span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/settings#upgrade"
          className="bg-white text-blue-700 text-xs font-semibold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
        >
          Upgrade — from $79/mo
        </Link>
        <button onClick={dismiss} className="text-white/70 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}