'use client'

import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { createClient } from '@/lib/supabase/client'

interface VolumeChartProps {
  userId?: string
  data?:   { day: string; tickets: number }[]
}

export default function VolumeChart({ userId, data: propData }: VolumeChartProps) {
  const [data, setData] = useState<{ day: string; tickets: number }[]>(propData ?? [])

  useEffect(() => {
    if (propData || !userId) return
    fetchData()
  }, [userId])

  async function fetchData() {
    const supabase = createClient()
    const days: { day: string; tickets: number }[] = []

    // Build last 7 days
    const dayMap: Record<string, { day: string; tickets: number }> = {}
    for (let i = 6; i >= 0; i--) {
      const d   = new Date()
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const lbl = d.toLocaleDateString('en-US', { weekday: 'short' })
      dayMap[key] = { day: lbl, tickets: 0 }
    }

    const since = new Date()
    since.setDate(since.getDate() - 6)

    const { data: tickets } = await supabase
      .from('tickets')
      .select('created_at')
      .eq('user_id', userId!)
      .gte('created_at', since.toISOString())

    ;(tickets ?? []).forEach(t => {
      const key = t.created_at.slice(0, 10)
      if (dayMap[key]) dayMap[key].tickets++
    })

    setData(Object.values(dayMap))
  }

  const hasData = data.some(d => d.tickets > 0)

  if (!hasData) {
    return (
      <div className="h-[180px] flex items-center justify-center">
        <p className="text-sm text-gray-400">No ticket data for the last 7 days</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}
          cursor={{ fill: '#F3F4F6' }}
        />
        <Bar dataKey="tickets" fill="#2563EB" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  )
}