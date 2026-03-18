'use client'

import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import ConfidenceBar from '@/components/ui/ConfidenceBar'
import { Layers, Copy, BookmarkPlus, Check, AlertTriangle, ThumbsUp, ThumbsDown, Edit3 } from 'lucide-react'
import type { AnalyzeTicketResponse } from '@/types'

interface AIResultCardProps {
  result:    AnalyzeTicketResponse | null
  onSave?:   (result: AnalyzeTicketResponse) => void
  ticketId?: string
}

function urgencyVariant(u: string) {
  if (u === 'Urgent') return 'urgent' as const
  if (u === 'Medium') return 'medium' as const
  return 'low' as const
}

function sentimentVariant(s: string) {
  if (s === 'Frustrated') return 'urgent' as const
  if (s === 'Positive')   return 'low'    as const
  return 'blue' as const
}

const RISK_CONFIG = {
  critical: { label: 'Critical churn risk',   color: 'bg-red-100    border-red-200    text-red-800'    },
  high:     { label: 'High frustration',       color: 'bg-orange-100 border-orange-200 text-orange-800' },
  medium:   { label: 'Moderate frustration',   color: 'bg-amber-100  border-amber-200  text-amber-800'  },
  low:      { label: 'Low frustration',        color: 'bg-gray-100   border-gray-200   text-gray-700'   },
}

export default function AIResultCard({ result, onSave, ticketId }: AIResultCardProps) {
  const [copied,        setCopied]       = useState(false)
  const [saved,         setSaved]        = useState(false)
  const [feedbackSent,  setFeedbackSent] = useState(false)
  const [editedReply,   setEditedReply]  = useState<string | null>(null)
  const [isEditing,     setIsEditing]    = useState(false)

  if (!result) return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-10 text-center text-sm text-gray-400">
      Your AI analysis will appear here
    </div>
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(editedReply ?? result!.suggested_reply)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  async function handleSave() {
    if (!result || saved) return
    const res = await fetch('/api/save-response', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        response_text: editedReply ?? result.suggested_reply,
        category:      result.category,
        urgency:       result.urgency,
        ticket_id:     ticketId ?? null,
        title:         result.summary,
      }),
    })
    if (res.ok) { setSaved(true); onSave?.(result) }
  }

  async function sendFeedback(type: 'used_as_is' | 'edited' | 'discarded') {
    if (feedbackSent || !ticketId) return
    const was_edited = type === 'edited' && !!editedReply
    await fetch('/api/performance', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        ticket_id:      ticketId,
        original_reply: result!.suggested_reply,
        edited_reply:   was_edited ? editedReply : null,
        was_sent:       type !== 'discarded',
        feedback:       type === 'discarded' ? 'negative' : 'positive',
      }),
    })
    setFeedbackSent(true)
  }

  const churnRisk  = (result as any).churn_risk as keyof typeof RISK_CONFIG | undefined
  const signals    = (result as any).signals as string[] | undefined
  const showAlert  = churnRisk && (churnRisk === 'high' || churnRisk === 'critical')
  const riskConf   = churnRisk ? RISK_CONFIG[churnRisk] : null

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 space-y-5 animate-slide-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-semibold text-gray-900">AI Analysis</span>
          {(result as any)._cached && (
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
              ⚡ Cached
            </span>
          )}
        </div>
        <span className="inline-flex items-center bg-blue-600 text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
          {result.confidence}% confident
        </span>
      </div>

      {/* Frustration Alert */}
      {showAlert && riskConf && (
        <div className={`flex items-start gap-2.5 border rounded-xl px-3.5 py-3 ${riskConf.color}`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-0.5">⚠ {riskConf.label} detected</p>
            {signals && signals.length > 0 && (
              <p className="text-xs opacity-80">Signals: {signals.join(' · ')}</p>
            )}
          </div>
        </div>
      )}

      {/* Badges */}
      <div>
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Category & Urgency</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="blue">{result.category}</Badge>
          <Badge variant={urgencyVariant(result.urgency)}>{result.urgency}</Badge>
          <Badge variant={sentimentVariant(result.sentiment)}>{result.sentiment}</Badge>
        </div>
      </div>

      {/* Summary */}
      <div>
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Issue Summary</p>
        <p className="text-sm text-gray-700 bg-white border border-blue-200 rounded-lg px-3 py-2.5 italic">
          "{result.summary}"
        </p>
      </div>

      {/* Confidence */}
      <div>
        <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Confidence Score</p>
        <ConfidenceBar value={result.confidence} />
      </div>

      {/* Suggested reply — editable */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide">Suggested Reply</p>
          <button
            onClick={() => { setIsEditing(!isEditing); if (!isEditing) setEditedReply(result!.suggested_reply) }}
            className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
          >
            <Edit3 className="w-3 h-3" />{isEditing ? 'View' : 'Edit'}
          </button>
        </div>
        {isEditing ? (
          <textarea
            value={editedReply ?? result.suggested_reply}
            onChange={e => setEditedReply(e.target.value)}
            rows={5}
            className="w-full text-sm text-gray-700 bg-white border border-blue-300 rounded-lg px-3 py-2.5 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="text-sm text-gray-700 bg-white border border-blue-200 rounded-lg px-3 py-3 leading-relaxed">
            {editedReply ?? result.suggested_reply}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button className="btn-primary !py-2 !px-4 !text-xs" onClick={handleSave} disabled={saved}>
          {saved ? <><Check className="w-3 h-3" />Saved!</> : <><BookmarkPlus className="w-3 h-3" />Save reply</>}
        </button>
        <button className="btn-ghost !py-2 !px-4 !text-xs" onClick={handleCopy}>
          {copied ? <><Check className="w-3 h-3" />Copied!</> : <><Copy className="w-3 h-3" />Copy text</>}
        </button>
      </div>

      {/* Performance feedback */}
      {ticketId && !feedbackSent && (
        <div className="pt-1 border-t border-blue-200">
          <p className="text-[10px] text-blue-500 mb-2 font-medium uppercase tracking-wide">Was this reply helpful?</p>
          <div className="flex gap-2">
            <button onClick={() => { sendFeedback('used_as_is'); handleCopy() }}
              className="btn-ghost !py-1.5 !px-3 !text-xs gap-1 text-emerald-600 hover:bg-emerald-50">
              <ThumbsUp className="w-3 h-3" />Used as-is
            </button>
            <button onClick={() => sendFeedback('edited')}
              className="btn-ghost !py-1.5 !px-3 !text-xs gap-1 text-amber-600 hover:bg-amber-50">
              <Edit3 className="w-3 h-3" />Edited it
            </button>
            <button onClick={() => sendFeedback('discarded')}
              className="btn-ghost !py-1.5 !px-3 !text-xs gap-1 text-red-500 hover:bg-red-50">
              <ThumbsDown className="w-3 h-3" />Not useful
            </button>
          </div>
        </div>
      )}
      {feedbackSent && (
        <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1 pt-1 border-t border-blue-200">
          <Check className="w-3 h-3" />Thanks — this improves AI accuracy tracking
        </p>
      )}
    </div>
  )
}