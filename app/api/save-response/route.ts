export const dynamic = 'force-dynamic'

import { rateLimiters, rateLimitResponse, sanitizeText, sanitizeField, sanitizeName, sanitizeEmail, sanitizeInt, sanitizeRole, isSuspicious } from '@/lib/security'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import type { SaveResponseRequest } from '@/types'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { isActive } = await getUserPlan(supabase, user.id)
    if (!isActive) {
      return NextResponse.json({ error: 'Trial expired. Please upgrade.', code: 'TRIAL_EXPIRED' }, { status: 403 })
    }

    const rl = rateLimiters.general(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body: SaveResponseRequest = await request.json()
    const responseText = sanitizeText(body.response_text, 5000)
    const title        = sanitizeField(body.title ?? '', 200)
    if (!responseText) return NextResponse.json({ error: 'response_text is required' }, { status: 400 })

    // Cap saved replies at 50 for starter, unlimited for pro+
    const { plan } = await getUserPlan(supabase, user.id)
    if (plan === 'starter') {
      const { count } = await supabase
        .from('saved_responses').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      if ((count ?? 0) >= 10) {
        return NextResponse.json(
          { error: 'Starter plan allows up to 10 saved replies. Upgrade to Pro for unlimited.', code: 'PLAN_UPGRADE_REQUIRED' },
          { status: 403 }
        )
      }
    }

    const { data, error } = await supabase.from('saved_responses')
      .insert({
        user_id:       user.id,
        ticket_id:     body.ticket_id ?? null,
        category:      body.category,
        urgency:       body.urgency,
        response_text: responseText,
        title:         title || null,
      }).select().single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    console.error('[save-response]', err)
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('saved_responses').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 })
  }
}