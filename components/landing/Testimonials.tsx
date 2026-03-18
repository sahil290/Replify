const testimonials = [
  {
    stars:    5,
    text:     'Replify cut our average response time from 6 hours to under 5 minutes. Our CSAT scores have never been higher.',
    name:     'Sarah R.',
    role:     'Head of Support',
    initials: 'SR',
    color:    'bg-blue-100 text-blue-700',
  },
  {
    stars:    5,
    text:     'We were drowning in tickets. Replify identified that 60% were about the same 3 issues. We fixed them and volume dropped by half.',
    name:     'Marcus K.',
    role:     'VP Customer Success',
    initials: 'MK',
    color:    'bg-purple-100 text-purple-700',
  },
  {
    stars:    5,
    text:     "The AI-suggested replies are genuinely good — 80% of them we send without modification. It's like having a senior agent who never sleeps.",
    name:     'Jamie P.',
    role:     'Support Manager',
    initials: 'JP',
    color:    'bg-emerald-100 text-emerald-700',
  },
]

export default function Testimonials() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">What teams say</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">Support teams love it</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map(t => (
            <div key={t.name} className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}