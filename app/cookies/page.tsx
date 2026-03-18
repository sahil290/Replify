import LegalLayout from '@/components/landing/LegalLayout'

export const metadata = {
  title: 'Cookie Policy — Replify',
  description: 'How Replify uses cookies.',
}

export default function CookiesPage() {
  return (
    <LegalLayout
      title="Cookie Policy"
      subtitle="A clear explanation of the cookies we use and why."
      lastUpdated="March 16, 2026"
      sections={[
        {
          title: 'What Are Cookies',
          content: (
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and keep you logged in between visits. Replify uses a minimal number of cookies — only those necessary to operate the Service.
            </p>
          ),
        },
        {
          title: 'Cookies We Use',
          content: (
            <>
              <p>We use only <strong className="text-gray-800">essential cookies</strong>. We do not use advertising, tracking, or analytics cookies.</p>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Cookie</th>
                      <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Purpose</th>
                      <th className="text-left p-3 font-semibold text-gray-700 border-b border-gray-200">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'sb-access-token',  purpose: 'Keeps you logged in (Supabase auth)',   duration: '1 hour'   },
                      { name: 'sb-refresh-token', purpose: 'Refreshes your session automatically',  duration: '7 days'   },
                      { name: 'sp_welcome_seen',  purpose: 'Remembers if you\'ve seen the onboarding welcome (localStorage)', duration: 'Persistent' },
                      { name: 'sp_onboarding_dismissed', purpose: 'Remembers if you dismissed the onboarding checklist (localStorage)', duration: 'Persistent' },
                    ].map(c => (
                      <tr key={c.name} className="border-b border-gray-100 last:border-0">
                        <td className="p-3 font-mono text-gray-700">{c.name}</td>
                        <td className="p-3 text-gray-600">{c.purpose}</td>
                        <td className="p-3 text-gray-500">{c.duration}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          title: 'What We Do NOT Use',
          content: (
            <>
              <p>Replify does <strong className="text-gray-800">not</strong> use:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Google Analytics or any third-party analytics trackers</li>
                <li>Facebook Pixel or social media tracking</li>
                <li>Advertising or retargeting cookies</li>
                <li>Cross-site tracking cookies</li>
                <li>Fingerprinting technologies</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Managing Cookies',
          content: (
            <>
              <p>
                You can control cookies through your browser settings. However, disabling essential cookies will prevent you from staying logged in to Replify.
              </p>
              <p>
                To clear cookies in common browsers:
              </p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li><strong className="text-gray-800">Chrome:</strong> Settings → Privacy and Security → Clear browsing data</li>
                <li><strong className="text-gray-800">Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong className="text-gray-800">Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong className="text-gray-800">Edge:</strong> Settings → Privacy, search, and services → Clear browsing data</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Contact',
          content: (
            <p>
              Questions about our use of cookies? Contact us at{' '}
              <a href="mailto:privacy@Replify.app" className="text-blue-600 hover:underline">
                privacy@Replify.app
              </a>.
            </p>
          ),
        },
      ]}
    />
  )
}