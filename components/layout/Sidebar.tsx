'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, ScanSearch, BarChart3, BookMarked,
  Settings, Layers, Plug, Clock, Users, X,
  BookOpen, AlertTriangle, Target, Zap, TrendingUp,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard',      href: '/dashboard',       icon: LayoutDashboard, plan: 'starter' },
  { label: 'Analyze Ticket', href: '/analyze-ticket',  icon: ScanSearch,      plan: 'starter' },
  { label: 'Ticket History', href: '/tickets',         icon: Clock,           plan: 'starter' },
  { label: 'Insights',       href: '/insights',        icon: BarChart3,       plan: 'pro'     },
  { label: 'ROI Dashboard',  href: '/roi',             icon: TrendingUp,      plan: 'starter' },
  { label: 'Saved Replies',  href: '/saved-replies',   icon: BookMarked,      plan: 'starter' },
  { label: 'Knowledge Base', href: '/knowledge-base',  icon: BookOpen,        plan: 'pro'     },
  { label: 'Frustration',    href: '/frustration',     icon: AlertTriangle,   plan: 'pro'     },
  { label: 'AI Performance', href: '/performance',     icon: Target,          plan: 'pro'     },
  { label: 'AI Usage',       href: '/usage',           icon: Zap,             plan: 'starter' },
  { label: 'Integrations',   href: '/integrations',    icon: Plug,            plan: 'pro'     },
  { label: 'Team',           href: '/team',            icon: Users,           plan: 'pro'     },
]

const bottomItems = [
  { label: 'Settings', href: '/settings', icon: Settings, plan: 'starter' },
]

interface SidebarProps {
  onClose?:  () => void
  userPlan?: string
}

export default function Sidebar({ onClose, userPlan = 'starter' }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 lg:w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col py-5 px-3 min-h-screen">
      <div className="flex items-center justify-between px-2 mb-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900" onClick={onClose}>
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 text-white" />
          </div>
          SupportPilot
        </Link>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Main</p>

      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ label, href, icon: Icon, plan }) => {
          const active  = pathname === href
          const locked  = plan === 'pro' && userPlan === 'starter'
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn('sidebar-item group relative', active && 'active')}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
              )}
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span className={cn('flex-1', active ? 'text-blue-700 font-semibold' : '')}>{label}</span>
              {locked && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">PRO</span>
              )}
              {!locked && active && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </Link>
          )
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-3 mb-2">Account</p>
        {bottomItems.map(({ label, href, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href} onClick={onClose} className={cn('sidebar-item group relative', active && 'active')}>
              {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />}
              <Icon className={cn('w-4 h-4 shrink-0 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
              )} />
              <span className={cn(active ? 'text-blue-700 font-semibold' : '')}>{label}</span>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}