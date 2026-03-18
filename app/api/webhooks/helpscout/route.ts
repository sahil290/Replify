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

    const body          = await request.json()
    const eventType     = request.headers.get('x-helpscout-event') ?? body?.event ?? ''

    if (!eventType.includes('conversation') && !eventType.includes('customer')) {
      return NextResponse.json({ skipped: true, event: eventType })
    }

    const conversation  = body?.conversation ?? body
    const convId        = String(conversation?.id ?? '')
    const firstThread   = conversation?.threads?.[0]
    const ticketText    = firstThread?.body ?? conversation?.preview ?? ''
    const customerEmail = conversation?.customer?.email ?? firstThread?.customer?.email ?? ''

    if (!ticketText.trim()) {
      return NextResponse.json({ error: 'No ticket text in payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Invalid uid' }, { status: 401 })

    const result = await processWebhookTicket(
      { externalId: convId, text: ticketText.replace(/<[^>]+>/g, '').trim(), platform: 'helpscout', customerEmail, subject: conversation?.subject ?? '' },
      userId,
      supabase
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[webhook/helpscout]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}