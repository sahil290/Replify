export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserWorkspaceId, requireRole } from '@/lib/workspace'
import { getUserPlan } from '@/lib/get-user-plan'
import { canAccess } from '@/lib/plan-guard'
import { rateLimiters, rateLimitResponse, sanitizeText, sanitizeField, sanitizeName, sanitizeEmail, sanitizeInt, sanitizeRole, isSuspicious } from '@/lib/security'
import { sendEmail } from '@/lib/email'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, isActive } = await getUserPlan(supabase, user.id)
    if (!isActive) {
      return NextResponse.json({ error: 'Trial expired. Please upgrade.', code: 'TRIAL_EXPIRED' }, { status: 403 })
    }
    if (!canAccess(plan, 'team_members')) {
      return NextResponse.json(
        { error: 'Team members are available on the Pro plan and above.', code: 'PLAN_UPGRADE_REQUIRED', current_plan: plan },
        { status: 403 }
      )
    }

    // Rate limit — 10 invites per hour
    const rl = rateLimiters.invite(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body = await request.json()
    const email = sanitizeEmail(body.email)
    const role  = sanitizeRole(body.role) ?? 'agent'

    if (!email) return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 404 })
    }

    // Only owners and admins can invite
    const canInvite = await requireRole(user.id, workspaceId, 'admin')
    if (!canInvite) {
      return NextResponse.json({ error: 'Only admins and owners can invite members' }, { status: 403 })
    }

    // Check if already a member
    const { data: existingMember } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', (
        await supabase.from('users').select('id').eq('email', email).single()
      ).data?.id ?? '')
      .single()

    if (existingMember) {
      return NextResponse.json({ error: 'This person is already a team member' }, { status: 409 })
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('invites')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('email', email.toLowerCase())
      .eq('accepted', false)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (existingInvite) {
      return NextResponse.json({ error: 'An invite has already been sent to this email' }, { status: 409 })
    }

    // Create invite
    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        workspace_id: workspaceId,
        invited_by:   user.id,
        email:        email.toLowerCase(),
        role,
      })
      .select()
      .single()

    if (error) throw error

    // Get workspace name
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', workspaceId)
      .single()

    // Get inviter name
    const { data: inviter } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    const inviteUrl   = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invite.token}`
    const inviterName = inviter?.full_name ?? inviter?.email ?? 'Someone'
    const workspaceName = workspace?.name ?? 'a workspace'

    // Send invite email
    await sendEmail({
      to:      email,
      subject: `${inviterName} invited you to join ${workspaceName} on SupportPilot`,
      html: `
        <!DOCTYPE html>
        <html>
        <body style="font-family:sans-serif;background:#F9FAFB;padding:40px 0;">
          <table width="600" style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #E5E7EB;overflow:hidden;">
            <tr><td style="background:#2563EB;padding:28px 32px;">
              <h1 style="margin:0;font-size:22px;color:#fff;">You're invited to join SupportPilot</h1>
            </td></tr>
            <tr><td style="padding:28px 32px;">
              <p style="color:#374151;font-size:15px;line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join <strong>${workspaceName}</strong> on SupportPilot as a <strong>${role}</strong>.
              </p>
              <p style="color:#6B7280;font-size:14px;line-height:1.6;">
                SupportPilot uses AI to analyze support tickets and automatically generate replies — saving your team hours every day.
              </p>
              <table style="margin-top:24px;">
                <tr><td style="background:#2563EB;border-radius:10px;">
                  <a href="${inviteUrl}" style="display:inline-block;padding:12px 28px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                    Accept invitation →
                  </a>
                </td></tr>
              </table>
              <p style="color:#9CA3AF;font-size:12px;margin-top:20px;">
                This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.
              </p>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ success: true, invite_id: invite.id })
  } catch (err: any) {
    console.error('[team/invite]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to send invite' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) return NextResponse.json([])

    const { data } = await supabase
      .from('invites')
      .select('id, email, role, accepted, expires_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    return NextResponse.json(data ?? [])
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
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const workspaceId = await getUserWorkspaceId(user.id)
    if (!workspaceId) return NextResponse.json({ error: 'No workspace' }, { status: 404 })

    const canManage = await requireRole(user.id, workspaceId, 'admin')
    if (!canManage) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabase.from('invites').delete().eq('id', id).eq('workspace_id', workspaceId)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}