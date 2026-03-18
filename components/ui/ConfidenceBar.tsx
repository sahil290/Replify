'use client'

import { useEffect, useState } from 'react'

interface ConfidenceBarProps {
  value: number  // 0-100
  showLabel?: boolean
}

export default function ConfidenceBar({ value, showLabel = true }: ConfidenceBarProps) {
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 100)
    return () => clearTimeout(t)
  }, [value])

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-sm font-semibold text-blue-700 w-10 shrink-0">{value}%</span>
      )}
    </div>
  )
}