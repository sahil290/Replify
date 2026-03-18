import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TeamManager from '@/components/team/TeamManager'
import PlanGate from '@/components/ui/PlanGate'
import { getUserPlan } from '@/lib/get-user-plan'
import { getWorkspaceMembers } from '@/lib/workspace'

async function getOrCreateWorkspace(userId: string, userEmail: string, supabase: any) {
  const { data: existing } = await supabase
    .from('workspace_members')
    .select('role, workspace_id, workspaces(id, name, owner_id, plan, created_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()

  if (existing?.workspaces) return { workspace: existing.workspaces, role: existing.role }

  const { data: newWorkspace, error } = await supabase
    .from('workspaces')
    .insert({ name: userEmail.split('@')[1] ?? 'My Workspace', owner_id: userId, plan: 'starter' })
    .select().single()

  if (error || !newWorkspace) return { workspace: null, role: null }

  await supabase.from('workspace_members')
    .insert({ workspace_id: newWorkspace.id, user_id: userId, role: 'owner' })

  return { workspace: newWorkspace, role: 'owner' }
}

export default async function TeamPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ plan }, { workspace, role }] = await Promise.all([
    getUserPlan(supabase, user.id),
    getOrCreateWorkspace(user.id, user.email ?? '', supabase),
  ])

  // Fetch workspace data only if plan allows
  const canAccessTeam = plan === 'pro' || plan === 'business'
  const members    = canAccessTeam && workspace ? await getWorkspaceMembers(workspace.id) : []
  const invitesRes = canAccessTeam && workspace
    ? await supabase.from('invites').select('id, email, role, accepted, expires_at, created_at')
        .eq('workspace_id', workspace.id).order('created_at', { ascending: false })
    : { data: [] }

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Team</h1>
        <p className="text-sm text-gray-500 mt-1">
          {workspace
            ? <>Manage members of <span className="font-medium text-gray-700">{workspace.name}</span></>
            : 'Manage your support team'}
        </p>
      </div>
      <PlanGate feature="Team Members" requiredPlan="Pro" currentPlan={plan}>
        {workspace ? (
          <TeamManager
            members={members}
            invites={invitesRes.data ?? []}
            currentRole={role ?? 'owner'}
            currentUserId={user.id}
            workspaceName={workspace.name}
          />
        ) : (
          <div className="card p-8 text-center text-sm text-gray-500">
            Could not load workspace. Please refresh.
          </div>
        )}
      </PlanGate>
    </AppShell>
  )
}