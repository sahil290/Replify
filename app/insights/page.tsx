import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import InsightsDashboard from '@/components/insights/InsightsDashboard'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'

export default async function InsightsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { plan } = await getUserPlan(supabase, user.id)

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <p className="text-sm text-gray-500 mt-1">
          Analytics and trends across all your support tickets.
        </p>
      </div>
      <PlanGate
        feature="Insights & Analytics"
        requiredPlan="Pro"
        currentPlan={plan}
      >
        <InsightsDashboard />
      </PlanGate>
    </AppShell>
  )
}