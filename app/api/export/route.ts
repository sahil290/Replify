import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/get-user-plan'
import { canAccess } from '@/lib/plan-guard'

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return ''
  const str = String(val)
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}
function rowToCSV(fields: any[]): string { return fields.map(escapeCSV).join(',') }

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { plan, isActive } = await getUserPlan(supabase, user.id)

    if (!isActive) {
      return NextResponse.json({ error: 'Trial expired. Please upgrade.', code: 'TRIAL_EXPIRED' }, { status: 403 })
    }

    if (!canAccess(plan, 'export_csv')) {
      return NextResponse.json(
        { error: 'CSV export is available on the Pro plan and above.', code: 'PLAN_UPGRADE_REQUIRED', current_plan: plan },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const urgency  = searchParams.get('urgency')   ?? ''
    const category = searchParams.get('category')  ?? ''
    const dateFrom = searchParams.get('date_from') ?? ''
    const dateTo   = searchParams.get('date_to')   ?? ''
    const search   = searchParams.get('search')    ?? ''

    let query = supabase.from('tickets')
      .select('id, summary, ticket_text, category, urgency, sentiment, confidence, ai_response, platform, customer_email, created_at')
      .eq('user_id', user.id).order('created_at', { ascending: false }).limit(10000)

    if (urgency  && urgency  !== 'all') query = query.eq('urgency',  urgency)
    if (category && category !== 'all') query = query.eq('category', category)
    if (dateFrom) query = query.gte('created_at', new Date(dateFrom).toISOString())
    if (dateTo)   query = query.lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())
    if (search.trim()) query = query.or(`summary.ilike.%${search}%,ticket_text.ilike.%${search}%`)

    const { data: tickets, error } = await query
    if (error) throw error

    const headers = ['Ticket ID','Date','Category','Urgency','Sentiment','Confidence','Summary','Customer Message','AI Suggested Reply','Platform','Customer Email']
    const rows = (tickets ?? []).map(t => rowToCSV([
      t.id.slice(-8).toUpperCase(),
      new Date(t.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      t.category, t.urgency, t.sentiment, t.confidence + '%',
      t.summary, t.ticket_text, t.ai_response,
      t.platform ?? 'manual', t.customer_email ?? '',
    ]))

    const csv      = [rowToCSV(headers), ...rows].join('\r\n')
    const filename = `replify-tickets-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type':        'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control':       'no-store',
      },
    })
  } catch (err: any) {
    console.error('[export]', err)
    return NextResponse.json({ error: err.message ?? 'Export failed' }, { status: 500 })
  }
}