import Badge from '@/components/ui/Badge'
import { urgencyColors, categoryColors, timeAgo } from '@/lib/utils'
import type { Ticket } from '@/types'

interface TicketRowProps {
  ticket: Ticket
}

export default function TicketRow({ ticket }: TicketRowProps) {
  const urgencyVariant = ticket.urgency === 'Urgent' ? 'urgent'
    : ticket.urgency === 'Medium' ? 'medium' : 'low'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-400 font-mono w-14 shrink-0">
        #{ticket.id.slice(-4)}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-800 truncate">{ticket.summary || ticket.ticket_text}</p>
        <p className="text-xs text-gray-400 mt-0.5">{ticket.category} · {timeAgo(ticket.created_at)}</p>
      </div>
      <Badge variant={urgencyVariant}>{ticket.urgency}</Badge>
    </div>
  )
}
