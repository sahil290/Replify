import 'server-only'
import { createClient } from '@/lib/supabase/server'

export type WorkspaceRole = 'owner' | 'admin' | 'agent'

export interface WorkspaceMember {
  id:           string
  user_id:      string
  workspace_id: string
  role:         WorkspaceRole
  joined_at:    string
  last_seen_at: string | null
  users: {
    email:     string
    full_name: string | null
  }
}

export interface Workspace {
  id:         string
  name:       string
  owner_id:   string
  plan:       string
  created_at: string
}

export async function getUserWorkspaceId(userId: string): Promise<string | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()
  return data?.workspace_id ?? null
}

export async function getUserWorkspace(userId: string): Promise<{
  workspace: Workspace | null
  role: WorkspaceRole | null
}> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('role, workspace_id, workspaces(id, name, owner_id, plan, created_at)')
    .eq('user_id', userId)
    .order('joined_at', { ascending: true })
    .limit(1)
    .single()

  if (!data?.workspaces) return { workspace: null, role: null }
  return {
    workspace: data.workspaces as any,
    role:      data.role as WorkspaceRole,
  }
}

export async function getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('workspace_members')
    .select('id, workspace_id, role, joined_at, last_seen_at, user_id, users(email, full_name)')
    .eq('workspace_id', workspaceId)
    .order('joined_at', { ascending: true })

  if (error) console.error('[getWorkspaceMembers]', error)
  return (data ?? []) as unknown as WorkspaceMember[]
}

export async function requireRole(
  userId:      string,
  workspaceId: string,
  minRole:     WorkspaceRole
): Promise<boolean> {
  const supabase = createClient()
  const { data } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('user_id', userId)
    .eq('workspace_id', workspaceId)
    .single()

  if (!data) return false
  const hierarchy: Record<WorkspaceRole, number> = { owner: 3, admin: 2, agent: 1 }
  return hierarchy[data.role as WorkspaceRole] >= hierarchy[minRole]
}