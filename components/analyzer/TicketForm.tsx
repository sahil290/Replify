'use client'

import { useState } from 'react'
import { Sparkles, FlaskConical } from 'lucide-react'
import type { AnalyzeTicketResponse } from '@/types'
import { useJobStatus } from '@/lib/hooks/useJobStatus'
import JobStatusCard from '@/components/ui/JobStatusCard'

const SAMPLE_TICKET = `Hi there, I've been trying to log into my account for the last two hours and I keep getting an "Invalid credentials" error. I JUST reset my password 20 minutes ago using the reset email, so I know I'm entering it correctly.

I have an important client presentation in 1 hour and all my files are in the app. This is really urgent. My account email is john.doe@example.com.

Please help ASAP!`

interface TicketFormProps {
  onResult:  (result: AnalyzeTicketResponse) => void
  ticketId?: string
}

export default function TicketForm({ onResult }: TicketFormProps) {
  const [ticketText, setTicketText] = useState('')
  const [tier,       setTier]       = useState('Unknown')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const { state: jobState, enqueue, reset: resetJob } = useJobStatus()

  async function handleAnalyze() {
    if (!ticketText.trim()) { setError('Please enter a ticket before analyzing.'); return }
    setError(null)
    setLoading(true)
    resetJob()

    try {
      const res = await fetch('/api/analyze-ticket', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ ticket_text: ticketText, customer_tier: tier }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Check if it's a rate limit or plan error
        if (res.status === 429) throw new Error('Too many requests — please wait a moment')
        if (data.code === 'LIMIT_EXCEEDED') throw new Error(data.error)
        throw new Error(data.error ?? 'Analysis failed')
      }

      // If API returned a jobId it was queued — poll for result
      if (data.jobId) {
        enqueue(data.jobId)
      } else {
        // Synchronous response — show immediately
        onResult(data as AnalyzeTicketResponse)
      }
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  // When job completes, fetch full result
  async function handleJobDone() {
    if (!jobState.result) return
    const result = jobState.result as unknown as AnalyzeTicketResponse
    onResult(result)
    resetJob()
  }

  return (
    <div className="card p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-5">Support Ticket</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Paste ticket text
        </label>
        <textarea
          className="form-input min-h-[180px] resize-y"
          placeholder="Paste the customer's message here..."
          value={ticketText}
          onChange={e => setTicketText(e.target.value)}
          disabled={loading || jobState.phase === 'processing'}
        />
      </div>

      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Customer tier <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <select
          className="form-input"
          value={tier}
          onChange={e => setTier(e.target.value)}
          disabled={loading}
        >
          {['Unknown', 'Free', 'Pro', 'Business'].map(t => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Job status card — shows when queued */}
      {jobState.phase !== 'idle' && (
        <div className="mb-4">
          <JobStatusCard
            state={jobState}
            label="Ticket analysis"
            onDone={handleJobDone}
          />
        </div>
      )}

      <div className="flex gap-3">
        <button
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={loading || jobState.phase === 'pending' || jobState.phase === 'processing'}
        >
          {loading ? (
            <><div className="spinner !w-4 !h-4" />Analyzing…</>
          ) : (
            <><Sparkles className="w-4 h-4" />Analyze with AI</>
          )}
        </button>
        <button
          className="btn-ghost"
          onClick={() => setTicketText(SAMPLE_TICKET)}
          disabled={loading}
        >
          <FlaskConical className="w-4 h-4" />
          Load sample
        </button>
      </div>
    </div>
  )
}