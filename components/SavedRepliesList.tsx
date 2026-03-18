'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import { Copy, Trash2, Check, BookMarked } from 'lucide-react'
import type { SavedResponse } from '@/types'

const DEMO_REPLIES: SavedResponse[] = [
  {
    id: 'demo-1',
    user_id: '',
    ticket_id: null,
    category: 'Account',
    urgency: 'Low',
    title: 'Password Reset — Standard Reply',
    response_text: "Hi there! I'd be happy to help you with your password reset. Please check your spam/junk folder first. If you still don't see the email after 5 minutes, try requesting another reset from our login page. If the issue persists, reply with your account email and I'll manually trigger a reset.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-2',
    user_id: '',
    ticket_id: null,
    category: 'Billing',
    urgency: 'Medium',
    title: 'Double Charge — Billing Resolution',
    response_text: "I sincerely apologize for the double charge — that should never happen. I've flagged your account and initiated a full refund for the duplicate charge. You should see it back in 3–5 business days depending on your bank. I've also applied a $10 credit to your account as an apology.",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
]

interface SavedRepliesListProps {
  initialReplies: SavedResponse[]
}

export default function SavedRepliesList({ initialReplies }: SavedRepliesListProps) {
  const [replies, setReplies] = useState<SavedResponse[]>(
    initialReplies.length > 0 ? initialReplies : DEMO_REPLIES
  )
  const [copied, setCopied] = useState<string | null>(null)

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 1800)
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this saved reply?')) return
    setReplies(prev => prev.filter(r => r.id !== id))
    if (!id.startsWith('demo-')) {
      await fetch(`/api/save-response?id=${id}`, { method: 'DELETE' })
    }
  }

  if (replies.length === 0) {
    return (
      <div className="card p-12 text-center">
        <BookMarked className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No saved replies yet.</p>
        <p className="text-xs text-gray-400 mt-1">
          Analyze a ticket and click "Save reply" to add it here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {replies.map(r => {
        const urgencyVariant = r.urgency === 'Urgent' ? 'urgent'
          : r.urgency === 'Medium' ? 'medium' : 'low'

        return (
          <div key={r.id} className="card p-6">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1.5">{r.title}</p>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="blue">{r.category}</Badge>
                  <Badge variant={urgencyVariant as any}>{r.urgency}</Badge>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => handleCopy(r.id, r.response_text)}
                  className="btn-ghost !py-1.5 !px-3 !text-xs gap-1.5"
                >
                  {copied === r.id
                    ? <><Check className="w-3 h-3" /> Copied!</>
                    : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="btn-ghost !py-1.5 !px-3 !text-xs gap-1.5 !text-red-600 hover:!bg-red-50"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-4 py-3 leading-relaxed">
              {r.response_text}
            </p>
          </div>
        )
      })}
    </div>
  )
}
