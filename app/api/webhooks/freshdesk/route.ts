import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { processWebhookTicket } from '@/lib/webhook-processor'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('uid')
    if (!userId) return NextResponse.json({ error: 'Missing uid' }, { status: 400 })

    const body = await request.json()

    const ticketId      = String(body?.freshdesk_webhook?.ticket_id ?? body?.id ?? '')
    const ticketText    = body?.freshdesk_webhook?.ticket_description
      ?? body?.freshdesk_webhook?.ticket_latest_public_comment
      ?? body?.description ?? ''
    const customerEmail = body?.freshdesk_webhook?.requester_email ?? ''

    if (!ticketText.trim()) {
      return NextResponse.json({ error: 'No ticket text in payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Invalid uid' }, { status: 401 })

    const result = await processWebhookTicket(
      { externalId: ticketId, text: ticketText.replace(/<[^>]+>/g, '').trim(), platform: 'freshdesk', customerEmail, subject: body?.freshdesk_webhook?.ticket_subject ?? '' },
      userId,
      supabase
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[webhook/freshdesk]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}