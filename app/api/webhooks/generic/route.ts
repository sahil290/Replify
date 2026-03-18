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

    const ticketText = (
      body?.message ?? body?.body ?? body?.text ?? body?.description
      ?? body?.content ?? body?.ticket?.body ?? body?.ticket?.description ?? ''
    ).toString().trim()

    if (!ticketText) {
      return NextResponse.json(
        { error: 'No ticket text found. Send a "message", "body", "text", or "description" field.' },
        { status: 400 }
      )
    }

    const externalId    = String(body?.id ?? body?.ticket_id ?? body?.conversation_id ?? Date.now())
    const customerEmail = body?.email ?? body?.customer_email ?? body?.from ?? ''

    const supabase = getServiceClient()
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Invalid uid — user not found' }, { status: 401 })

    const result = await processWebhookTicket(
      { externalId, text: ticketText, platform: 'webhook', customerEmail, subject: body?.subject ?? '' },
      userId,
      supabase
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[webhook/generic]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}