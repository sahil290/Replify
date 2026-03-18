'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Layers, Menu } from 'lucide-react'

interface NavbarProps {
  onMenuClick?: () => void
}

interface UserState {
  email?:     string
  full_name?: string
}

export default function Navbar({ onMenuClick }: NavbarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const isLanding = pathname === '/'
  const isApp     = !isLanding && !pathname.startsWith('/auth') && !pathname.startsWith('/invite')

  const [user,    setUser]    = useState<UserState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ? { email: user.email, full_name: user.user_metadata?.full_name } : null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user
        ? { email: session.user.email, full_name: session.user.user_metadata?.full_name }
        : null)
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const initials = user ? (user.full_name ?? user.email ?? 'U')[0].toUpperCase() : 'U'

  return (
    <nav className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 sm:h-16 gap-3">

        {/* Hamburger — mobile app pages only */}
        {isApp && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-500 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
          </div>
          <span className="hidden sm:block">Replify</span>
        </Link>

        {/* Landing nav links */}
        {isLanding && (
          <div className="hidden md:flex items-center gap-1 flex-1">
            {['Features', 'Pricing', 'How it works'].map(item => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {!loading && (
            user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                    {initials}
                  </div>
                  <span className="hidden md:block truncate max-w-32">{user.full_name ?? user.email}</span>
                </div>
                <button onClick={handleLogout} className="btn-ghost !py-1.5 !px-3 text-xs">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login"  className="btn-ghost  !py-1.5 !px-3 text-xs">Log in</Link>
                <Link href="/auth/signup" className="btn-primary !py-1.5 !px-3 text-xs">
                  <span className="hidden sm:block">Start free trial</span>
                  <span className="sm:hidden">Sign up</span>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  )
}