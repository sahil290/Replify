import Link from 'next/link'
import { Zap } from 'lucide-react'

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white pt-16 pb-12 px-4 sm:pt-24 sm:pb-20 sm:px-6">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 flex justify-center">
        <div className="w-[700px] h-[700px] rounded-full bg-blue-100/60 blur-3xl -translate-y-1/2" />
      </div>

      <div className="relative max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-1.5 text-sm font-medium text-blue-700 mb-8 shadow-sm">
          <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse-dot" />
          AI-Powered Support Automation
        </div>

        <h1 className="font-display text-3xl sm:text-5xl md:text-6xl text-gray-900 leading-tight mb-5">
          Reduce Support Tickets{' '}
          <em className="text-blue-600 not-italic">by 40%</em> with AI
        </h1>

        <p className="text-xl text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
          Replify analyzes incoming support tickets and automatically
          generates accurate, empathetic responses — saving your team hours every day.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link href="/auth/signup" className="btn-primary !py-3 !px-8 !text-base">
            <Zap className="w-4 h-4" />
            Start Free Trial
          </Link>
          <Link href="/dashboard" className="btn-ghost !py-3 !px-8 !text-base">
            View Demo →
          </Link>
        </div>

        {/* Hero mockup */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden max-w-3xl mx-auto text-left">
          {/* Window chrome */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-gray-400">Replify Dashboard</span>
          </div>

          {/* Metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 sm:divide-x divide-gray-100">
            {[
              { label: 'Tickets Analyzed', value: '1,284', change: '↑ 12% this week', color: 'text-emerald-600' },
              { label: 'Auto-Responded',   value: '847',   change: '66% auto-rate',   color: 'text-emerald-600' },
              { label: 'Avg Response',     value: '1.2m',  change: '↓ 94% faster',    color: 'text-emerald-600' },
            ].map(m => (
              <div key={m.label} className="p-5">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{m.label}</p>
                <p className="text-2xl font-bold text-gray-900">{m.value}</p>
                <p className={`text-xs font-medium mt-0.5 ${m.color}`}>{m.change}</p>
              </div>
            ))}
          </div>

          {/* Ticket examples */}
          <div className="p-4 grid grid-cols-2 gap-3 border-t border-gray-100">
            {[
              { id: '#TK-4821', title: 'Login issue',   badge: 'Urgent', badgeCls: 'bg-red-100 text-red-800',    text: '"Can\'t log in after reset. Have a deadline today…"', conf: '94%' },
              { id: '#TK-4819', title: 'Billing query', badge: 'Medium', badgeCls: 'bg-amber-100 text-amber-800', text: '"Charged twice this month, need a refund…"',           conf: '89%' },
            ].map(t => (
              <div key={t.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-semibold text-gray-700">{t.id} — {t.title}</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t.badgeCls}`}>{t.badge}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{t.text}</p>
                <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                  AI reply generated · {t.conf} confidence
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}