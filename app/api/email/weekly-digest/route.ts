import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWeeklyDigest } from '@/lib/email'

// Call this from a cron job every Monday morning
// e.g. Vercel Cron: https://vercel.com/docs/cron-jobs
// Schedule: 0 8 * * 1  (8am every Monday)
// Protect with CRON_SECRET header

export async function POST(request: Request) {
  try {
    // Verify cron secret so this can't be called by anyone
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient()

    // Get all users with digest enabled
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, full_name, notify_digest')
      .eq('notify_digest', true)

    if (error) throw error
    if (!users?.length) return NextResponse.json({ sent: 0 })

    const appUrl     = process.env.NEXT_PUBLIC_APP_URL ?? 'https://replify.app'
    const weekAgo    = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    let sent = 0

    for (const user of users) {
      if (!user.email) continue

      // Get this week's tickets for the user
      const { data: tickets } = await supabase
        .from('tickets')
        .select('category, confidence')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo)

      if (!tickets?.length) continue

      const totalTickets  = tickets.length
      const autoResolved  = tickets.filter(t => t.confidence >= 80).length
      const avgConfidence = Math.round(
        tickets.reduce((s, t) => s + t.confidence, 0) / totalTickets
      )

      // Build top issues map
      const categoryMap: Record<string, number> = {}
      tickets.forEach(t => {
        categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1
      })
      const topIssues = Object.entries(categoryMap)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({ name, count }))

      const topCategory = topIssues[0]?.name ?? 'N/A'

      await sendWeeklyDigest({
        to:           user.email,
        userName:     user.full_name ?? user.email.split('@')[0],
        totalTickets,
        autoResolved,
        topCategory,
        avgConfidence,
        topIssues,
        dashboardUrl: appUrl,
      })

      sent++
    }

    return NextResponse.json({ success: true, sent })
  } catch (err: any) {
    console.error('[weekly-digest]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}