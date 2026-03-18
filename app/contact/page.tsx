'use client'

import { useState } from 'react'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/landing/Footer'
import { Mail, MessageSquare, Clock, Check, RefreshCw } from 'lucide-react'

const TOPICS = [
  'General enquiry',
  'Billing & payments',
  'Technical support',
  'Feature request',
  'Partnership',
  'Privacy / data request',
  'Security vulnerability',
  'Other',
]

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', topic: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  function update(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('sending')
    // In production: send to your support email or a form service like Formspree
    await new Promise(r => setTimeout(r, 1200)) // simulate
    setStatus('sent')
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Get in touch</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            Have a question, issue, or feedback? We'd love to hear from you. We typically respond within a few hours.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-5">
            {[
              {
                icon: Mail,
                title: 'Email us',
                desc: 'For general enquiries and support',
                value: 'support@Replify.app',
                href: 'mailto:support@Replify.app',
              },
              {
                icon: MessageSquare,
                title: 'Billing',
                desc: 'Payment and subscription questions',
                value: 'billing@Replify.app',
                href: 'mailto:billing@Replify.app',
              },
              {
                icon: Clock,
                title: 'Response time',
                desc: 'We aim to respond to all enquiries',
                value: 'Within 24 hours',
                href: null,
              },
            ].map(item => (
              <div key={item.title} className="card p-5">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 mb-1">{item.desc}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm text-blue-600 hover:underline font-medium">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-700 font-medium">{item.value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2 card p-8">
            {status === 'sent' ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-emerald-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Message sent!</h3>
                <p className="text-sm text-gray-500">
                  Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within 24 hours.
                </p>
                <button
                  onClick={() => { setStatus('idle'); setForm({ name: '', email: '', topic: '', message: '' }) }}
                  className="btn-ghost mt-6 !text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Alex Johnson"
                      value={form.name}
                      onChange={update('name')}
                      className="form-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@company.com"
                      value={form.email}
                      onChange={update('email')}
                      className="form-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Topic</label>
                  <select required value={form.topic} onChange={update('topic')} className="form-input">
                    <option value="">Select a topic…</option>
                    {TOPICS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Tell us how we can help…"
                    value={form.message}
                    onChange={update('message')}
                    className="form-input resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn-primary w-full justify-center"
                >
                  {status === 'sending'
                    ? <><RefreshCw className="w-4 h-4 animate-spin" /> Sending…</>
                    : 'Send message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}