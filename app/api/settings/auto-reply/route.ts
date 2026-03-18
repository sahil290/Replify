export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimiters, rateLimitResponse, sanitizeText, sanitizeField, sanitizeName, sanitizeEmail, sanitizeInt, sanitizeRole, isSuspicious } from '@/lib/security'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = rateLimiters.general(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body      = await request.json()
    const enabled   = body.enabled === true
    const threshold = sanitizeInt(body.threshold, 0, 100) ?? 0

    if (enabled && threshold === 0) {
      return NextResponse.json({ error: 'Must set a threshold before enabling' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({ auto_reply_enabled: enabled, auto_reply_threshold: threshold })
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[settings/auto-reply]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('users')
      .select('auto_reply_enabled, auto_reply_threshold')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      enabled:   data?.auto_reply_enabled   ?? false,
      threshold: data?.auto_reply_threshold ?? 0,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}