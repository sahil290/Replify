'use client'

import { Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { JobState } from '@/lib/hooks/useJobStatus'

interface JobStatusCardProps {
  state:      JobState
  label?:     string    // e.g. "Analyzing ticket"
  onDone?:    () => void
  className?: string
}

function formatElapsed(ms: number): string {
  if (ms < 1000)  return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
}

const MESSAGES: Record<string, string[]> = {
  analyze_ticket: [
    'Reading the ticket…',
    'Detecting category and urgency…',
    'Generating suggested reply…',
    'Almost done…',
  ],
  kb_generate: [
    'Scanning ticket patterns…',
    'Structuring the article…',
    'Writing sections…',
    'Finalising…',
  ],
}

export default function JobStatusCard({
  state,
  label = 'Processing',
  onDone,
  className,
}: JobStatusCardProps) {
  if (state.phase === 'idle') return null

  const msgSet = MESSAGES.analyze_ticket
  const msgIdx = Math.min(
    Math.floor(state.elapsed / 2000),
    msgSet.length - 1
  )
  const message = msgSet[msgIdx]

  return (
    <div className={cn(
      'card p-5 border transition-all',
      state.phase === 'done'   && 'border-emerald-200 bg-emerald-50/40',
      state.phase === 'failed' && 'border-red-200    bg-red-50/40',
      (state.phase === 'pending' || state.phase === 'processing') && 'border-blue-200 bg-blue-50/40',
      className
    )}>
      <div className="flex items-start gap-3">

        {/* Icon */}
        <div className="mt-0.5 shrink-0">
          {(state.phase === 'pending' || state.phase === 'processing') && (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          )}
          {state.phase === 'done' && (
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          )}
          {state.phase === 'failed' && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Title */}
          <p className="text-sm font-semibold text-gray-900">
            {state.phase === 'done'   && `${label} complete`}
            {state.phase === 'failed' && `${label} failed`}
            {state.phase === 'pending'    && `${label} queued…`}
            {state.phase === 'processing' && message}
          </p>

          {/* Sub text */}
          {(state.phase === 'pending' || state.phase === 'processing') && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatElapsed(state.elapsed)} elapsed · running in background
            </p>
          )}
          {state.phase === 'done' && (
            <p className="text-xs text-emerald-700 mt-1">
              Finished in {formatElapsed(state.elapsed)}
            </p>
          )}
          {state.phase === 'failed' && state.error && (
            <p className="text-xs text-red-600 mt-1">{state.error}</p>
          )}

          {/* Progress bar */}
          {(state.phase === 'pending' || state.phase === 'processing') && (
            <div className="mt-3 h-1.5 bg-blue-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{
                  width: state.phase === 'pending'
                    ? '15%'
                    : `${Math.min(90, 20 + (state.elapsed / 8000) * 70)}%`,
                }}
              />
            </div>
          )}

          {/* Done action */}
          {state.phase === 'done' && onDone && (
            <button
              onClick={onDone}
              className="btn-primary !py-1.5 !px-3 !text-xs mt-3"
            >
              View result
            </button>
          )}
        </div>
      </div>
    </div>
  )
}