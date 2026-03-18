export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWorkspaceId, requireRole } from '@/lib/workspace'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) return NextResponse.json([])

    const { data } = await supabase
      .from('workspace_members')
      .select('id, role, joined_at, last_seen_at, user_id, users(email, full_name)')
      .eq('workspace_id', workspaceId)
      .order('joined_at', { ascending: true })

    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { member_id, role } = await request.json()
    if (!member_id || !role) {
      return NextResponse.json({ error: 'member_id and role required' }, { status: 400 })
    }
    if (!['admin', 'agent'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    const canManage = await requireRole(user.id, workspaceId, 'admin')
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // Can't change owner role
    const { data: target } = await supabase
      .from('workspace_members')
      .select('role')
      .eq('id', member_id)
      .single()

    if (target?.role === 'owner') {
      return NextResponse.json({ error: "Cannot change the owner's role" }, { status: 403 })
    }

    const { error } = await supabase
      .from('workspace_members')
      .update({ role })
      .eq('id', member_id)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('id')
    if (!memberId) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    // Check target isn't the owner
    const { data: target } = await supabase
      .from('workspace_members')
      .select('role, user_id')
      .eq('id', memberId)
      .single()

    if (target?.role === 'owner') {
      return NextResponse.json({ error: 'Cannot remove the workspace owner' }, { status: 403 })
    }

    // Users can remove themselves, admins/owners can remove others
    const isSelf = target?.user_id === user.id
    if (!isSelf) {
      const canManage = await requireRole(user.id, workspaceId, 'admin')
      if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}