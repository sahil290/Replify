import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import FrustrationDashboard from '@/components/frustration/FrustrationDashboard'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'

export const metadata = { title: 'Frustration Alerts — Replify' }

export default async function FrustrationPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { plan } = await getUserPlan(supabase, user.id)

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Frustration Alerts</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-time detection of at-risk customers. Prevent churn before it happens.
        </p>
      </div>
      <PlanGate feature="Customer Frustration Detector" requiredPlan="Pro" currentPlan={plan}>
        <FrustrationDashboard />
      </PlanGate>
    </AppShell>
  )
}