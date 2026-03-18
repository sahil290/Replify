'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import TicketForm from '@/components/analyzer/TicketForm'
import AIResultCard from '@/components/analyzer/AIResultCard'
import type { AnalyzeTicketResponse } from '@/types'

export default function AnalyzeTicketPage() {
  const [result, setResult] = useState<AnalyzeTicketResponse | null>(null)

  async function handleSave(r: AnalyzeTicketResponse) {
    await fetch('/api/save-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category:      r.category,
        urgency:       r.urgency,
        response_text: r.suggested_reply,
        title:         `${r.category} — AI Reply`,
      }),
    })
  }

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Analyze Ticket</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a support ticket to get AI-powered analysis and a suggested reply.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TicketForm onResult={setResult} />
        <AIResultCard result={result} onSave={handleSave} />
      </div>
    </AppShell>
  )
}