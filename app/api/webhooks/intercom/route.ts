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

    const topic = body?.topic ?? ''
    if (!topic.includes('conversation') && !topic.includes('message')) {
      return NextResponse.json({ skipped: true, topic })
    }

    const conversation   = body?.data?.item
    const conversationId = String(conversation?.id ?? '')
    const firstPart      = conversation?.conversation_parts?.conversation_parts?.[0] ?? conversation?.source
    const ticketText     = firstPart?.body ?? conversation?.conversation_message?.body ?? conversation?.source?.body ?? ''
    const customerEmail  = conversation?.contacts?.contacts?.[0]?.email ?? conversation?.user?.email ?? ''

    if (!conversationId || !ticketText.trim()) {
      return NextResponse.json({ error: 'Could not extract conversation data' }, { status: 400 })
    }

    const supabase = getServiceClient()
    const { data: user } = await supabase.from('users').select('id').eq('id', userId).single()
    if (!user) return NextResponse.json({ error: 'Invalid uid' }, { status: 401 })

    const result = await processWebhookTicket(
      { externalId: conversationId, text: ticketText.replace(/<[^>]+>/g, '').trim(), platform: 'intercom', customerEmail },
      userId,
      supabase
    )

    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[webhook/intercom]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}