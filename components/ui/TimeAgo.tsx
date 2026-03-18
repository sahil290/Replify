'use client'

import { useEffect, useState } from 'react'
import { timeAgo, formatDate } from '@/lib/utils'

interface TimeAgoProps {
  date: string
  className?: string
}

export default function TimeAgo({ date, className }: TimeAgoProps) {
  // Start with formatted date (same on server + client = no hydration mismatch)
  const [label, setLabel] = useState(formatDate(date))

  useEffect(() => {
    // After hydration, switch to timeAgo
    setLabel(timeAgo(date))

    // Update every minute
    const interval = setInterval(() => setLabel(timeAgo(date)), 60_000)
    return () => clearInterval(interval)
  }, [date])

  return <span className={className}>{label}</span>
}