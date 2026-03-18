import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import KnowledgeBaseClient from '@/components/knowledge-base/KnowledgeBaseClient'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'

export const metadata = { title: 'Knowledge Base — Replify' }

export default async function KnowledgeBasePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')
  const { plan } = await getUserPlan(supabase, user.id)
  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
        <p className="text-sm text-gray-500 mt-1">Auto-generate help articles from recurring support tickets.</p>
      </div>
      <PlanGate feature="Knowledge Base Builder" requiredPlan="Pro" currentPlan={plan}>
        <KnowledgeBaseClient />
      </PlanGate>
    </AppShell>
  )
}