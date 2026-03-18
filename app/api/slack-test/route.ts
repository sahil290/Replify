import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendSlackTestMessage } from '@/lib/slack'
import { sanitizeUrl } from '@/lib/security'
import { rateLimiters, rateLimitResponse } from '@/lib/security'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = rateLimiters.general(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body = await request.json()

    // Use URL from request body if provided, otherwise fall back to saved URL
    let webhookUrl = sanitizeUrl(body.webhook_url ?? '') ?? ''

    if (!webhookUrl) {
      const { data } = await supabase
        .from('users')
        .select('slack_webhook_url')
        .eq('id', user.id)
        .single()
      webhookUrl = data?.slack_webhook_url ?? ''
    }

    if (!webhookUrl) {
      return NextResponse.json({ error: 'No Slack webhook URL provided' }, { status: 400 })
    }

    if (!webhookUrl.includes('hooks.slack.com')) {
      return NextResponse.json({ error: 'Must be a valid Slack webhook URL' }, { status: 400 })
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'
    const result = await sendSlackTestMessage(webhookUrl, appUrl)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}