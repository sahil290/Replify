import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { full_name } = await request.json()
    if (!full_name?.trim()) return NextResponse.json({ error: 'full_name required' }, { status: 400 })

    const { error } = await supabase
      .from('users')
      .update({ full_name: full_name.trim() })
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}