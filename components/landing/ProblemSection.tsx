const problems = [
  { icon: '🔁', title: 'Repetitive Tickets',       desc: 'The same password reset, billing, and onboarding questions flood in daily, consuming your team\'s most productive hours.' },
  { icon: '⏳', title: 'Slow Response Times',       desc: 'Customers wait hours or days for answers that could be delivered in seconds. Poor CSAT scores follow.' },
  { icon: '😤', title: 'Overwhelmed Teams',         desc: 'Support agents burn out under ticket backlogs, leading to high turnover, inconsistent answers, and escalating costs.' },
  { icon: '🔍', title: 'No Visibility into Patterns', desc: 'Without data, product and support teams can\'t identify what\'s causing the most friction for customers.' },
]

export default function ProblemSection() {
  return (
    <section id="features" className="bg-gray-50 py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">The Problem</p>
          <h2 className="font-display text-4xl text-gray-900 mb-4">
            Customer support teams waste hours<br className="hidden md:block" /> answering the same questions
          </h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            72% of all tickets are repetitive issues. Your team is smart — don't let them spend their days copy-pasting answers.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {problems.map(p => (
            <div
              key={p.title}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div className="text-2xl mb-4">{p.icon}</div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{p.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
