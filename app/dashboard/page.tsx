import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import MetricCard from '@/components/ui/MetricCard'
import TicketRow from '@/components/dashboard/TicketRow'
import IssueBar from '@/components/dashboard/IssueBar'
import VolumeChart from '@/components/dashboard/VolumeChart'
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist'
import Link from 'next/link'
import { ScanSearch, BarChart3 } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [ticketsRes, profileRes, integrationsRes] = await Promise.all([
    supabase
      .from('tickets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('users')
      .select('full_name, plan, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('integrations')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .limit(1),
  ])

  const tickets        = ticketsRes.data ?? []
  const hasIntegration = (integrationsRes.data?.length ?? 0) > 0
  const totalTickets   = tickets.length

  // Metrics from real data only
  const avgConf      = totalTickets > 0
    ? Math.round(tickets.reduce((s, t) => s + t.confidence, 0) / totalTickets)
    : null
  const autoResolved = tickets.filter(t => t.confidence >= 80).length

  // Top issues from real data
  const issueMap: Record<string, number> = {}
  tickets.forEach((t: any) => { issueMap[t.category] = (issueMap[t.category] ?? 0) + 1 })
  const topIssues = Object.entries(issueMap)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, total: totalTickets }))

  const userName = profileRes.data?.full_name
    ?? user.user_metadata?.full_name
    ?? user.email?.split('@')[0]
    ?? 'there'

  const showOnboarding = totalTickets < 5

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Good {getTimeOfDay()}, {userName.split(' ')[0]}. Here's your support overview.
        </p>
      </div>

      {showOnboarding && (
        <OnboardingChecklist
          ticketCount={totalTickets}
          hasIntegration={hasIntegration}
          userName={userName}
        />
      )}

      {/* Metrics — only show real numbers, no fake data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Tickets Analyzed"
          value={totalTickets > 0 ? totalTickets.toLocaleString() : '—'}
          change={totalTickets > 0 ? 'All time total' : 'Analyze your first ticket'}
          trend="up"
          icon="📋"
        />
        <MetricCard
          label="AI Auto-Resolved"
          value={totalTickets > 0 ? autoResolved.toString() : '—'}
          change={totalTickets > 0 ? `${totalTickets > 0 ? Math.round((autoResolved / totalTickets) * 100) : 0}% automation rate` : 'Based on 80%+ confidence'}
          trend="up"
          icon="🤖"
        />
        <MetricCard
          label="Avg Confidence"
          value={avgConf !== null ? `${avgConf}%` : '—'}
          change={avgConf !== null ? 'AI analysis accuracy' : 'Appears after first ticket'}
          trend="up"
          icon="🎯"
        />
        <MetricCard
          label="Urgent Tickets"
          value={totalTickets > 0 ? tickets.filter((t: any) => t.urgency === 'Urgent').length.toString() : '—'}
          change={totalTickets > 0 ? 'Requiring immediate attention' : 'No tickets yet'}
          trend={tickets.filter((t: any) => t.urgency === 'Urgent').length > 3 ? 'down' : 'up'}
          icon="🚨"
        />
      </div>

      <div className="grid lg:grid-cols-5 gap-5 mb-5">
        {/* Recent tickets */}
        <div className="lg:col-span-3 card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-gray-900">Recent Tickets</h2>
            <Link href="/analyze-ticket" className="btn-primary !py-1.5 !px-3 !text-xs gap-1.5">
              <ScanSearch className="w-3 h-3" /> Analyze new
            </Link>
          </div>
          {tickets.length > 0 ? (
            <div>
              {tickets.slice(0, 6).map((t: any) => (
                <TicketRow key={t.id} ticket={t} />
              ))}
              {totalTickets > 6 && (
                <Link href="/tickets" className="block text-center text-xs text-blue-600 hover:text-blue-800 mt-4 font-medium">
                  View all {totalTickets} tickets →
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <ScanSearch className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">No tickets yet</p>
              <p className="text-xs text-gray-400 mb-4">Analyze your first support ticket to get started</p>
              <Link href="/analyze-ticket" className="btn-primary !text-xs !py-2 inline-flex">
                Analyze a ticket
              </Link>
            </div>
          )}
        </div>

        {/* Top issues */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-5">Top Issue Categories</h2>
          {topIssues.length > 0 ? (
            topIssues.map((issue: any) => (
              <IssueBar key={issue.name} name={issue.name} count={issue.count} total={issue.total} />
            ))
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-8 h-8 text-gray-200 mx-auto mb-3" />
              <p className="text-xs text-gray-400">Category breakdown appears after you analyze tickets</p>
            </div>
          )}
        </div>
      </div>

      {/* Volume chart */}
      <div className="card p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-5">Ticket Volume — Last 7 Days</h2>
        <VolumeChart userId={user.id} />
      </div>
    </AppShell>
  )
}

function getTimeOfDay() {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}