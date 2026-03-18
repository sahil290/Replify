'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import TrialBanner from '@/components/ui/TrialBanner'

interface AppShellProps {
  children: React.ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [trialInfo,   setTrialInfo]   = useState<{ signupDate: string; plan: string } | null>(null)
  const [userPlan,    setUserPlan]    = useState('starter')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setTrialInfo({ signupDate: user.created_at, plan: user.user_metadata?.plan ?? 'starter' })
        // Fetch actual plan from users table
        supabase.from('users').select('plan').eq('id', user.id).single()
          .then(({ data }) => { if (data?.plan) setUserPlan(data.plan) })
      }
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />

      {trialInfo && (
        <TrialBanner signupDate={trialInfo.signupDate} plan={trialInfo.plan} />
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:block">
          <Sidebar userPlan={userPlan} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/40 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-0 bottom-0 z-50 lg:hidden">
              <Sidebar onClose={() => setSidebarOpen(false)} userPlan={userPlan} />
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}