import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeUrl, sanitizeField, sanitizeInt } from '@/lib/security'
import { rateLimiters, rateLimitResponse } from '@/lib/security'

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data } = await supabase
      .from('users')
      .select('slack_webhook_url, slack_channel, slack_alerts_enabled, frustration_threshold')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      slack_webhook_url:    data?.slack_webhook_url    ?? '',
      slack_channel:        data?.slack_channel        ?? '',
      slack_alerts_enabled: data?.slack_alerts_enabled ?? false,
      frustration_threshold: data?.frustration_threshold ?? 70,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const rl = rateLimiters.general(user.id)
    if (!rl.success) return rateLimitResponse(rl)

    const body = await request.json()

    const slack_webhook_url    = sanitizeUrl(body.slack_webhook_url ?? '') ?? ''
    const slack_channel        = sanitizeField(body.slack_channel ?? '', 100)
    const slack_alerts_enabled = body.slack_alerts_enabled === true
    const frustration_threshold = sanitizeInt(body.frustration_threshold, 0, 100) ?? 70

    // Validate webhook URL is a Slack URL
    if (slack_webhook_url && !slack_webhook_url.includes('hooks.slack.com')) {
      return NextResponse.json({ error: 'Must be a valid Slack webhook URL (hooks.slack.com)' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({
        slack_webhook_url:    slack_webhook_url || null,
        slack_channel:        slack_channel     || null,
        slack_alerts_enabled: slack_webhook_url ? slack_alerts_enabled : false,
        frustration_threshold,
      })
      .eq('id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}