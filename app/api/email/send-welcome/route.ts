import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userName = user.user_metadata?.full_name
      ?? user.email.split('@')[0]

    await sendWelcomeEmail({
      to:       user.email,
      userName,
      appUrl:   process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app',
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[send-welcome]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}