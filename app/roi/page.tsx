import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import ROIDashboard from '@/components/roi/ROIDashboard'

export const metadata = { title: 'ROI Dashboard — Replify' }

export default async function ROIPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">ROI Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Track the real business value Replify generates for your team.
        </p>
      </div>
      <ROIDashboard />
    </AppShell>
  )
}