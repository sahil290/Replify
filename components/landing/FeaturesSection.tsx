import { ScanSearch, BarChart3, MessageSquare, BookOpen } from 'lucide-react'

const features = [
  {
    icon: ScanSearch,
    title: 'AI Ticket Analyzer',
    desc: 'Instantly categorize every incoming ticket by type, urgency, and complexity. Route the right tickets to the right agents automatically.',
  },
  {
    icon: BarChart3,
    title: 'Recurring Issue Detection',
    desc: 'Automatically surface the most common support problems so your product team knows exactly what to fix next.',
  },
  {
    icon: MessageSquare,
    title: 'AI Suggested Replies',
    desc: 'Generate accurate, on-brand support responses in seconds. Agents review and send — or let AI handle it fully with auto-send.',
  },
  {
    icon: BookOpen,
    title: 'Knowledge Base Suggestions',
    desc: 'Identify gaps in your help articles from repeated questions. Replify tells you exactly which docs to write.',
  },
]

export default function FeaturesSection() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-3">Features</p>
          <h2 className="font-display text-4xl text-gray-900 mb-4">Everything you need to automate support</h2>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">
            Replify's AI engine handles the heavy lifting so your team can focus on the complex, high-value conversations.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group bg-white border border-gray-200 rounded-xl p-8 relative overflow-hidden hover:-translate-y-1 hover:shadow-md transition-all duration-200"
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 text-base mb-2">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}