'use client'

import { useEffect, useState } from 'react'

interface IssueBarProps {
  name: string
  count: number
  total: number
}

export default function IssueBar({ name, count, total }: IssueBarProps) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), 150)
    return () => clearTimeout(t)
  }, [pct])

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-0">
      <div className="min-w-0 w-36 shrink-0">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400">{count.toLocaleString()} tickets</p>
      </div>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-700 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-8 text-right shrink-0">{pct}%</span>
    </div>
  )
}
