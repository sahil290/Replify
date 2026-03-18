import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const allowed = ['notify_urgent', 'notify_digest']
    const updates: Record<string, boolean> = {}

    for (const key of allowed) {
      if (typeof body[key] === 'boolean') updates[key] = body[key]
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[settings/notifications]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}