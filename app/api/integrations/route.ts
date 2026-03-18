export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { platform, fields, webhook_url } = body

    if (!platform) return NextResponse.json({ error: 'platform is required' }, { status: 400 })

    // Store integration — never store raw API keys in plaintext in production,
    // use Supabase Vault or encrypt before saving. This stores a hint only.
    const apiKeyField = fields?.api_key ?? fields?.api_token ?? fields?.access_token ?? null
    const apiKeyHint  = apiKeyField ? `****${apiKeyField.slice(-4)}` : null

    const { error } = await supabase
      .from('integrations')
      .upsert({
        user_id:       user.id,
        platform,
        status:        'connected',
        webhook_url,
        api_key_hint:  apiKeyHint,
        // In production: encrypt fields with Supabase Vault before storing
        config:        JSON.stringify({
          subdomain:    fields?.subdomain    ?? null,
          admin_email:  fields?.admin_email  ?? null,
          // DO NOT store raw keys in production — use Supabase Vault:
          // https://supabase.com/docs/guides/database/vault
        }),
        connected_at:  new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[integrations POST]', err)
    return NextResponse.json({ error: err.message ?? 'Failed to save integration' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data, error } = await supabase
      .from('integrations')
      .select('id, platform, status, webhook_url, api_key_hint, connected_at')
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json(data)
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
    const platform = searchParams.get('platform')
    if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 })

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('user_id', user.id)
      .eq('platform', platform)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}