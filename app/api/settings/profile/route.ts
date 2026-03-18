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
    const full_name = sanitizeName(body.full_name, 100)
    const company   = sanitizeName(body.company ?? '', 100)

    if (!full_name) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

    const { error } = await supabase
      .from('users')
      .update({ full_name, ...(company ? { company } : {}) })
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}