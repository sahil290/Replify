'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Layers, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const token        = searchParams.get('token')

  const [status,  setStatus]  = useState<'checking' | 'loading' | 'success' | 'error' | 'login'>('checking')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link — no token found.')
      return
    }
    checkAuthThenAccept()
  }, [token])

  async function checkAuthThenAccept() {
    // Check if user is logged in first
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not logged in — show login/signup prompt
      setStatus('login')
      setMessage('Please sign in or create an account to accept this invite.')
      return
    }

    // Logged in — accept the invite
    setStatus('loading')
    await acceptInvite()
  }

  async function acceptInvite() {
    try {
      const res  = await fetch('/api/team/accept', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ token }),
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setMessage(data.error ?? 'Failed to accept invite')
        return
      }

      setStatus('success')
      setMessage('You have joined the workspace!')
      setTimeout(() => router.push('/dashboard'), 2000)
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-10 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            Replify
          </Link>
        </div>

        {(status === 'checking' || status === 'loading') && (
          <>
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">
              {status === 'checking' ? 'Checking your invite…' : 'Accepting your invite…'}
            </h1>
            <p className="text-sm text-gray-500">Just a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">You're in! 🎉</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <p className="text-xs text-gray-400">Redirecting to your dashboard…</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Invite error</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setStatus('loading'); acceptInvite() }}
                className="btn-primary w-full justify-center"
              >
                Try again
              </button>
              <Link href="/" className="btn-ghost w-full justify-center">Go home</Link>
            </div>
          </>
        )}

        {status === 'login' && (
          <>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Layers className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in to accept invite</h1>
            <p className="text-sm text-gray-500 mb-6">{message}</p>
            <div className="flex flex-col gap-3">
              <Link
                href={`/auth/login?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
                className="btn-primary w-full justify-center"
              >
                Sign in
              </Link>
              <Link
                href={`/auth/signup?redirect=${encodeURIComponent(`/invite/accept?token=${token}`)}`}
                className="btn-ghost w-full justify-center"
              >
                Create account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}