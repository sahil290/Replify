'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Layers, AlertCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', company: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: `${form.firstName} ${form.lastName}`.trim(),
          company: form.company,
        },
      },
    })
    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      // Fire welcome email (non-blocking)
      fetch('/api/email/send-welcome', { method: 'POST' }).catch(() => { })
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get('redirect') ?? '/dashboard'
      router.push(redirect)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-white px-4 py-16">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-lg p-10">
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            Replify
          </Link>
        </div>

        <h1 className="font-display text-2xl text-center text-gray-900 mb-1">Start your free trial</h1>
        <p className="text-sm text-center text-gray-400 mb-8">14 days free · No credit card required</p>

        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">First name</label>
              <input type="text" required value={form.firstName} onChange={update('firstName')} className="form-input" placeholder="Alex" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Last name</label>
              <input type="text" required value={form.lastName} onChange={update('lastName')} className="form-input" placeholder="Johnson" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Work email</label>
            <input type="email" required value={form.email} onChange={update('email')} className="form-input" placeholder="you@company.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required minLength={8} value={form.password} onChange={update('password')} className="form-input" placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company size</label>
            <select value={form.company} onChange={update('company')} className="form-input">
              <option value="">Select size…</option>
              {['1–10', '11–50', '51–200', '201–500', '500+'].map(s => (
                <option key={s} value={s}>{s} employees</option>
              ))}
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full justify-center !py-3 !mt-1">
            {loading ? <><div className="spinner !w-4 !h-4" /> Creating account…</> : 'Create account'}
          </button>

          <p className="text-xs text-center text-gray-400 !mt-2">
            By signing up you agree to our{' '}
            <a href="/terms" className="underline">Terms</a> and{' '}
            <a href="/privacy" className="underline">Privacy Policy</a>
          </p>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}