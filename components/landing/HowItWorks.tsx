const steps = [
  { num: 1, title: 'Connect your platform',         desc: 'Integrate with Zendesk, Intercom, Freshdesk, or paste tickets directly into Replify in seconds.' },
  { num: 2, title: 'AI analyzes every ticket',      desc: 'Our Llama3-powered engine reads, categorizes, and scores every ticket by urgency, category, and sentiment.' },
  { num: 3, title: 'Get responses & insights',      desc: 'Receive suggested replies instantly, detect recurring patterns, and see which issues need attention most.' },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 px-6 bg-gradient-to-b from-white via-blue-50/40 to-white">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">How It Works</p>
          <h2 className="font-display text-4xl text-gray-900">Up and running in minutes</h2>
        </div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {/* Connector line */}
          <div className="hidden md:block absolute top-7 left-[calc(16.6%+28px)] right-[calc(16.6%+28px)] h-px bg-gradient-to-r from-blue-300 to-purple-300" />

          {steps.map(s => (
            <div key={s.num} className="relative text-center">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-5 ring-4 ring-blue-100 shadow-md">
                {s.num}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}