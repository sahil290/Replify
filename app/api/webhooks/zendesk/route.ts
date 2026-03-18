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

    const ticketId      = String(body?.ticket?.id ?? body?.id ?? '')
    const ticketText    = body?.ticket?.description
      ?? body?.ticket?.latest_comment?.value
      ?? body?.comment?.body
      ?? body?.description
      ?? ''
    const customerEmail = body?.ticket?.requester?.email ?? body?.requester?.email ?? ''

    if (!ticketText.trim()) {
      return NextResponse.json({ error: 'No ticket text found in payload' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Invalid uid' }, { status: 401 })

    const result = await processWebhookTicket(
      { externalId: ticketId, text: ticketText, platform: 'zendesk', customerEmail, subject: body?.ticket?.subject ?? '' },
      userId,
      supabase
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[webhook/zendesk]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}