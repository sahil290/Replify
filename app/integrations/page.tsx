import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import IntegrationsClient from '@/components/IntegrationsClient'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'

export default async function IntegrationsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { plan } = await getUserPlan(supabase, user.id)

  const { data: integrations } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', user.id)

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect your support platforms to analyze tickets automatically.
        </p>
      </div>
      <PlanGate
        feature="Platform Integrations & Webhooks"
        requiredPlan="Pro"
        currentPlan={plan}
      >
        <IntegrationsClient connections={integrations ?? []} userId={user.id} />
      </PlanGate>
    </AppShell>
  )
}