import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { enabled, threshold } = await request.json()

    if (typeof enabled !== 'boolean') {
      return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 })
    }
    if (typeof threshold !== 'number' || threshold < 0 || threshold > 100) {
      return NextResponse.json({ error: 'threshold must be 0-100' }, { status: 400 })
    }
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