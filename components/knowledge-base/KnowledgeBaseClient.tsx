'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Zap, RefreshCw, Check, Trash2, Globe, FileText, AlertTriangle } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'

interface Topic   { query: string; count: number; tickets: any[] }
interface Article { id: string; title: string; status: string; ticket_count: number; category: string; created_at: string }

export default function KnowledgeBaseClient() {
  const [topics,     setTopics]     = useState<Topic[]>([])
  const [articles,   setArticles]   = useState<Article[]>([])
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)
  const [generated,  setGenerated]  = useState<string | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [preview,    setPreview]    = useState<{ title: string; content: string; id: string } | null>(null)
  const [publishing, setPublishing] = useState<string | null>(null)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch('/api/knowledge-base/generate')
      const d   = await res.json()
      if (res.ok) { setTopics(d.topics ?? []); setArticles(d.articles ?? []) }
      else setError(d.error)
    } finally { setLoading(false) }
  }

  async function handleGenerate(topic: Topic) {
    setGenerating(topic.query); setError(null)
    try {
      const res = await fetch('/api/knowledge-base/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: topic.query, ticket_examples: topic.tickets, ticket_count: topic.count }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setGenerated(topic.query)
      setPreview({ title: d.article.title, content: d.article.content, id: d.article.id })
      setTimeout(() => setGenerated(null), 3000)
      fetchData()
    } catch (err: any) { setError(err.message) }
    finally { setGenerating(null) }
  }

  async function handlePublish(id: string) {
    setPublishing(id)
    await fetch('/api/knowledge-base/articles', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'published' }),
    })
    setPublishing(null); fetchData()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this article?')) return
    await fetch(`/api/knowledge-base/articles?id=${id}`, { method: 'DELETE' })
    setArticles(p => p.filter(a => a.id !== id))
    if (preview?.id === id) setPreview(null)
  }

  if (loading) return <div className="flex items-center justify-center h-48"><RefreshCw className="w-5 h-5 text-blue-600 animate-spin" /></div>

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Recurring topics */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-gray-900">Recurring Questions Detected</h2>
          <button onClick={fetchData} className="btn-ghost !py-1 !px-2 !text-xs gap-1"><RefreshCw className="w-3 h-3" />Refresh</button>
        </div>
        <p className="text-xs text-gray-400 mb-5">Based on last 30 days. One click generates a full help article.</p>
        {topics.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-1">No recurring topics detected yet</p>
            <p className="text-xs text-gray-400">Analyze at least 10 tickets to see patterns emerge</p>
          </div>
        ) : (
          <div className="space-y-1">
            {topics.map(topic => {
              const isGen    = generating === topic.query
              const isDone   = generated  === topic.query
              const existing = articles.some(a => a.title.toLowerCase().includes(topic.query.replace(/-/g, ' ')))
              return (
                <div key={topic.query} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 capitalize">{topic.query.replace(/-/g, ' ')}</p>
                    <p className="text-xs text-gray-400">{topic.count} tickets this month</p>
                  </div>
                  <span className="text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">{topic.count}×</span>
                  {existing ? (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-1"><Check className="w-3 h-3" />Article exists</span>
                  ) : (
                    <button onClick={() => handleGenerate(topic)} disabled={!!generating} className="btn-primary !py-1.5 !px-3 !text-xs gap-1.5 shrink-0">
                      {isGen ? <><RefreshCw className="w-3 h-3 animate-spin" />Generating…</> : isDone ? <><Check className="w-3 h-3" />Done!</> : <><Zap className="w-3 h-3" />Generate article</>}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Article preview */}
      {preview && (
        <div className="card p-6 border-blue-200 bg-blue-50/30">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-600" /><h2 className="text-sm font-semibold text-gray-900">Generated Article Preview</h2></div>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(preview.id)} className="btn-ghost !py-1.5 !px-3 !text-xs text-red-600"><Trash2 className="w-3 h-3" />Delete</button>
              <button onClick={() => handlePublish(preview.id)} disabled={publishing === preview.id} className="btn-primary !py-1.5 !px-3 !text-xs gap-1.5">
                {publishing === preview.id ? <><RefreshCw className="w-3 h-3 animate-spin" />Publishing…</> : <><Globe className="w-3 h-3" />Publish</>}
              </button>
            </div>
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-3">{preview.title}</h3>
          <div className="space-y-2">
            {preview.content.split('\n\n').map((para, i) => {
              if (para.startsWith('## ')) return <h4 key={i} className="text-sm font-semibold text-gray-900 mt-4 mb-1">{para.slice(3)}</h4>
              if (para.startsWith('---')) return <hr key={i} className="my-3 border-gray-200" />
              return <p key={i} className="text-sm text-gray-600 leading-relaxed">{para}</p>
            })}
          </div>
        </div>
      )}

      {/* Articles library */}
      {articles.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Articles Library <span className="text-gray-400 font-normal">({articles.length})</span></h2>
          <div className="space-y-1">
            {articles.map(a => (
              <div key={a.id} className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0">
                <div className={cn('w-2 h-2 rounded-full shrink-0', a.status === 'published' ? 'bg-emerald-500' : 'bg-gray-300')} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                  <p className="text-xs text-gray-400">Based on {a.ticket_count} tickets · {formatDate(a.created_at)}</p>
                </div>
                <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full border shrink-0',
                  a.status === 'published' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-500 border-gray-200')}>
                  {a.status === 'published' ? 'Published' : 'Draft'}
                </span>
                <button onClick={() => handleDelete(a.id)} className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}