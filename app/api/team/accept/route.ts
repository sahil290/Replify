export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { token } = await request.json()
    if (!token?.trim()) return NextResponse.json({ error: 'Token required' }, { status: 400 })

    console.log('[accept] user:', user.email, 'token:', token.slice(0, 12) + '...')

    // Use service client if available, fall back to regular client
    let queryClient = supabase
    const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (serviceKey && serviceUrl) {
      const { createClient: createSC } = await import('@supabase/supabase-js')
      queryClient = createSC(serviceUrl, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      }) as any
      console.log('[accept] using service client')
    } else {
      console.log('[accept] SUPABASE_SERVICE_ROLE_KEY not set — using anon client')
    }

    // Look up invite by token
    const { data: invite, error: inviteError } = await queryClient
      .from('invites')
      .select('*')
      .eq('token', token.trim())
      .single()

    console.log('[accept] invite lookup result:', {
      found:    !!invite,
      accepted: invite?.accepted,
      email:    invite?.email,
      expires:  invite?.expires_at,
      error:    inviteError?.message,
      code:     inviteError?.code,
    })

    if (inviteError || !invite) {
      // Try to give a helpful message based on error code
      if (inviteError?.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Invite not found. The link may be incorrect or already used. Please ask your admin to send a new invite.' },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { error: `Could not find invite: ${inviteError?.message ?? 'unknown error'}` },
        { status: 404 }
      )
    }

    // Check expiry
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite expired. Invites are valid for 7 days — ask your admin to send a new one.' },
        { status: 410 }
      )
    }

    // Check email matches
    if (invite.email.toLowerCase() !== user.email?.toLowerCase()) {
      return NextResponse.json(
        { error: `This invite was sent to ${invite.email} but you are signed in as ${user.email}. Please sign in with the invited email address.` },
        { status: 403 }
      )
    }

    // If already accepted, check if they're actually in the workspace
    if (invite.accepted) {
      const { data: existing } = await queryClient
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', invite.workspace_id)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        return NextResponse.json({ success: true, already_member: true })
      }
      // Accepted but not a member — re-add them below
      console.log('[accept] invite was accepted but user not in workspace, re-adding...')
    }

    // Ensure user exists in public.users
    const { data: publicUser } = await queryClient
      .from('users').select('id').eq('id', user.id).single()

    if (!publicUser) {
      console.log('[accept] creating missing public.users row')
      await queryClient.from('users').insert({
        id:        user.id,
        email:     user.email,
        full_name: user.user_metadata?.full_name ?? null,
        plan:      'starter',
      })
    }

    // Remove any solo workspace the invited user auto-created
    const { data: ownedWorkspaces } = await queryClient
      .from('workspaces')
      .select('id')
      .eq('owner_id', user.id)

    for (const ws of ownedWorkspaces ?? []) {
      if (ws.id === invite.workspace_id) continue // Don't delete the target workspace
      const { count } = await queryClient
        .from('workspace_members')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', ws.id)

      if ((count ?? 0) <= 1) {
        await queryClient.from('workspace_members').delete().eq('workspace_id', ws.id)
        await queryClient.from('workspaces').delete().eq('id', ws.id)
        console.log('[accept] removed solo workspace:', ws.id)
      }
    }

    // Add user to invited workspace
    const { error: memberError } = await queryClient
      .from('workspace_members')
      .upsert(
        { workspace_id: invite.workspace_id, user_id: user.id, role: invite.role },
        { onConflict: 'workspace_id,user_id' }
      )

    if (memberError) {
      console.error('[accept] member upsert failed:', memberError)
      throw new Error(`Failed to add to workspace: ${memberError.message}`)
    }

    // Mark invite accepted
    await queryClient
      .from('invites')
      .update({ accepted: true })
      .eq('id', invite.id)

    console.log('[accept] success:', user.email, '→ workspace', invite.workspace_id, 'as', invite.role)

    return NextResponse.json({ success: true, workspace_id: invite.workspace_id })

  } catch (err: any) {
    console.error('[team/accept] unexpected error:', err)
    return NextResponse.json(
      { error: err.message ?? 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}