import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import PerformanceDashboard from '@/components/performance/PerformanceDashboard'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'

export const metadata = { title: 'AI Performance — Replify' }

export default async function PerformancePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { plan } = await getUserPlan(supabase, user.id)
  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">AI Performance</h1>
        <p className="text-sm text-gray-500 mt-1">Track how well the AI replies are performing for your team.</p>
      </div>
      <PlanGate feature="AI Performance Tracking" requiredPlan="Pro" currentPlan={plan}>
        <PerformanceDashboard />
      </PlanGate>
    </AppShell>
  )
}