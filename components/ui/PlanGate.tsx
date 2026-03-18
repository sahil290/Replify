'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PlanGateProps {
  feature:     string           // human-readable feature name
  requiredPlan?: string         // 'Pro' | 'Business'
  currentPlan:  string
  children?:   React.ReactNode  // content to show if unlocked
  className?:  string
}

// Map plan IDs to display names
function planLabel(plan: string) {
  if (plan === 'pro')      return 'Pro'
  if (plan === 'business') return 'Business'
  return 'Starter'
}

export default function PlanGate({
  feature,
  requiredPlan = 'Pro',
  currentPlan,
  children,
  className,
}: PlanGateProps) {
  const label = planLabel(currentPlan)
  const isLocked = label === 'Starter' && requiredPlan !== 'Starter'

  if (!isLocked) return <>{children}</>

  return (
    <div className={cn('card p-8 text-center', className)}>
      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
        <Lock className="w-5 h-5 text-gray-400" />
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{feature}</h3>
      <p className="text-xs text-gray-500 mb-5 max-w-xs mx-auto">
        This feature is available on the <span className="font-semibold text-gray-700">{requiredPlan}</span> plan and above.
        You're currently on the <span className="font-semibold">{label}</span> plan.
      </p>
      <Link href="/settings#upgrade" className="btn-primary !text-xs !py-2 inline-flex">
        Upgrade to {requiredPlan}
      </Link>
    </div>
  )
}

// Inline lock badge for nav items or feature labels
export function PlanBadge({ plan }: { plan: string }) {
  if (plan !== 'starter') return null
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full ml-1">
      <Lock className="w-2.5 h-2.5" />
      Pro
    </span>
  )
}