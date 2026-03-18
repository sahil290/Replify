import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import TicketHistoryClient from '@/components/tickets/TicketHistoryClient'
import ExportButton from '@/components/tickets/ExportButton'

export default async function TicketsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: tickets, count } = await supabase
    .from('tickets')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(0, 19)

  return (
    <AppShell>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ticket History</h1>
          <p className="text-sm text-gray-500 mt-1">
            Browse, search and filter all your analyzed tickets.
          </p>
        </div>
        <ExportButton totalTickets={count ?? 0} />
      </div>
      <TicketHistoryClient
        initialTickets={tickets ?? []}
        initialTotal={count ?? 0}
      />
    </AppShell>
  )
}