export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createAuthClient } from '@/lib/supabase/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET() {
  try {
    // Auth check
    const authClient = createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Admin-only
    const adminEmail = process.env.ADMIN_EMAIL
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const db  = getServiceClient()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const weekAgo    = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      usersRes,
      ticketsRes,
      thisMonthUsersRes,
      lastMonthUsersRes,
      thisMonthTicketsRes,
      lastMonthTicketsRes,
      plansRes,
      recentUsersRes,
      autoRepliesRes,
      dailySignupsRes,
    ] = await Promise.all([
      // Total users
      db.from('users').select('*', { count: 'exact', head: true }),
      // Total tickets
      db.from('tickets').select('*', { count: 'exact', head: true }),
      // New users this month
      db.from('users').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      // New users last month
      db.from('users').select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth).lt('created_at', monthStart),
      // Tickets this month
      db.from('tickets').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
      // Tickets last month
      db.from('tickets').select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth).lt('created_at', monthStart),
      // Plan distribution
      db.from('users').select('plan, created_at'),
      // Recent 10 users
      db.from('users')
        .select('id, email, full_name, plan, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
      // Auto replies sent
      db.from('auto_replies').select('*', { count: 'exact', head: true }).eq('sent', true),
      // Daily signups last 14 days
      db.from('users')
        .select('created_at')
        .gte('created_at', new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: true }),
    ])

    // Plan breakdown
    const planMap: Record<string, number> = { starter: 0, pro: 0, business: 0 }
    ;(plansRes.data ?? []).forEach((u: any) => {
      planMap[u.plan] = (planMap[u.plan] ?? 0) + 1
    })

    // MRR estimate (INR)
    const MRR_BY_PLAN: Record<string, number> = {
      starter:  4099,
      pro:      12499,
      business: 33299,
    }
    const mrr = Object.entries(planMap).reduce(
      (sum, [plan, count]) => sum + (MRR_BY_PLAN[plan] ?? 0) * count, 0
    )

    // Daily signups chart
    const dailyMap: Record<string, number> = {}
    for (let i = 13; i >= 0; i--) {
      const d   = new Date(now)
      d.setDate(d.getDate() - i)
      dailyMap[d.toISOString().slice(0, 10)] = 0
    }
    ;(dailySignupsRes.data ?? []).forEach((u: any) => {
      const key = u.created_at.slice(0, 10)
      if (key in dailyMap) dailyMap[key]++
    })
    const dailySignups = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      count,
    }))

    const totalUsers   = usersRes.count   ?? 0
    const totalTickets = ticketsRes.count ?? 0
    const newUsersThis = thisMonthUsersRes.count  ?? 0
    const newUsersLast = lastMonthUsersRes.count  ?? 0
    const ticketsThis  = thisMonthTicketsRes.count ?? 0
    const ticketsLast  = lastMonthTicketsRes.count ?? 0

    return NextResponse.json({
      // Headline metrics
      total_users:     totalUsers,
      total_tickets:   totalTickets,
      auto_replies:    autoRepliesRes.count ?? 0,
      mrr_inr:         mrr,

      // Growth
      new_users_this_month: newUsersThis,
      new_users_last_month: newUsersLast,
      user_growth_pct: newUsersLast > 0
        ? Math.round(((newUsersThis - newUsersLast) / newUsersLast) * 100)
        : 0,

      tickets_this_month: ticketsThis,
      tickets_last_month: ticketsLast,
      ticket_growth_pct: ticketsLast > 0
        ? Math.round(((ticketsThis - ticketsLast) / ticketsLast) * 100)
        : 0,

      // Plan breakdown
      plans: planMap,

      // Charts
      daily_signups: dailySignups,

      // Recent users
      recent_users: recentUsersRes.data ?? [],
    })
  } catch (err: any) {
    console.error('[admin/stats]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}