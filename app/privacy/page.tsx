import LegalLayout from '@/components/landing/LegalLayout'

export const metadata = {
  title: 'Privacy Policy — Replify',
  description: 'How Replify collects, uses, and protects your personal data.',
}

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      subtitle="How we collect, use, and protect your personal information."
      lastUpdated="March 16, 2026"
      sections={[
        {
          title: 'Introduction',
          content: (
            <>
              <p>
                Replify ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered customer support platform at Replify.app ("Service").
              </p>
              <p>
                Please read this policy carefully. By using Replify, you agree to the practices described here. If you do not agree, please discontinue use of the Service.
              </p>
            </>
          ),
        },
        {
          title: 'Information We Collect',
          content: (
            <>
              <p><strong className="text-gray-800">Account information:</strong> When you sign up, we collect your name, email address, company name, and password (stored as a secure hash).</p>
              <p><strong className="text-gray-800">Support ticket data:</strong> Text content of support tickets you analyze through our platform, along with the AI-generated responses, categories, and urgency scores.</p>
              <p><strong className="text-gray-800">Usage data:</strong> Information about how you use the Service, including pages visited, features used, and actions taken within the platform.</p>
              <p><strong className="text-gray-800">Payment information:</strong> When you subscribe to a paid plan, payment is processed by Razorpay. We do not store your card details — we only store a reference to your payment and your subscription status.</p>
              <p><strong className="text-gray-800">Communications:</strong> If you contact us for support, we keep records of that correspondence.</p>
            </>
          ),
        },
        {
          title: 'How We Use Your Information',
          content: (
            <>
              <p>We use your information to:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Provide, operate, and maintain the Service</li>
                <li>Process support tickets through our AI engine to generate responses and insights</li>
                <li>Send transactional emails (account confirmation, password reset, urgent ticket alerts, weekly digests)</li>
                <li>Process payments and manage your subscription</li>
                <li>Improve the Service through aggregated, anonymized usage analytics</li>
                <li>Respond to your support requests and enquiries</li>
                <li>Comply with legal obligations</li>
              </ul>
              <p>We do <strong className="text-gray-800">not</strong> sell your personal data to third parties. We do not use your support ticket content to train AI models without explicit consent.</p>
            </>
          ),
        },
        {
          title: 'AI Processing and Data',
          content: (
            <>
              <p>
                Replify uses AI models to analyze support tickets. When you submit a ticket for analysis, the text is sent to our AI processing pipeline (powered by Groq's infrastructure or a local Ollama instance you configure).
              </p>
              <p>
                <strong className="text-gray-800">Groq:</strong> If using our cloud AI processing, ticket text is transmitted to Groq's API. Groq's data retention policies apply to data processed through their API. We recommend reviewing <a href="https://groq.com/privacy-policy/" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">Groq's Privacy Policy</a>.
              </p>
              <p>
                <strong className="text-gray-800">Local processing:</strong> If you configure a local Ollama instance, your ticket data never leaves your infrastructure.
              </p>
              <p>
                We store the results of AI analysis (category, urgency, confidence score, suggested reply) in our database linked to your account, but we do not use this data to train AI models without your explicit consent.
              </p>
            </>
          ),
        },
        {
          title: 'Data Storage and Security',
          content: (
            <>
              <p>
                Your data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure. All data is encrypted at rest and in transit using TLS 1.2+.
              </p>
              <p>
                We implement Row Level Security (RLS) so that each user can only access their own data. Team members can only access data belonging to their shared workspace.
              </p>
              <p>
                While we take security seriously and implement industry-standard protections, no method of transmission over the Internet is 100% secure. We cannot guarantee absolute security of your data.
              </p>
            </>
          ),
        },
        {
          title: 'Data Retention',
          content: (
            <>
              <p>We retain your data for as long as your account is active or as needed to provide the Service.</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li><strong className="text-gray-800">Account data:</strong> Retained until you delete your account</li>
                <li><strong className="text-gray-800">Ticket data:</strong> Retained for the duration of your subscription. You can export or delete your tickets at any time from Settings</li>
                <li><strong className="text-gray-800">Payment records:</strong> Retained for 7 years as required by financial regulations</li>
                <li><strong className="text-gray-800">After account deletion:</strong> We delete personal data within 30 days, except where retention is required by law</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Third-Party Services',
          content: (
            <>
              <p>We use the following third-party services to operate Replify:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li><strong className="text-gray-800">Supabase</strong> — Database and authentication</li>
                <li><strong className="text-gray-800">Groq</strong> — AI inference (when using cloud AI)</li>
                <li><strong className="text-gray-800">Razorpay</strong> — Payment processing</li>
                <li><strong className="text-gray-800">Resend</strong> — Transactional email delivery</li>
                <li><strong className="text-gray-800">Vercel</strong> — Application hosting</li>
              </ul>
              <p>Each of these services has their own privacy policy. We select partners who meet high data protection standards.</p>
            </>
          ),
        },
        {
          title: 'Your Rights',
          content: (
            <>
              <p>Depending on your location, you may have the following rights regarding your personal data:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li><strong className="text-gray-800">Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong className="text-gray-800">Correction:</strong> Request correction of inaccurate data</li>
                <li><strong className="text-gray-800">Deletion:</strong> Request deletion of your account and personal data</li>
                <li><strong className="text-gray-800">Export:</strong> Download your ticket data as CSV from Settings → Export</li>
                <li><strong className="text-gray-800">Opt-out:</strong> Unsubscribe from marketing emails at any time</li>
              </ul>
              <p>To exercise any of these rights, contact us at <a href="mailto:privacy@Replify.app" className="text-blue-600 hover:underline">privacy@Replify.app</a>.</p>
            </>
          ),
        },
        {
          title: 'Cookies',
          content: (
            <>
              <p>
                We use essential cookies for authentication (to keep you logged in) and session management. We do not use tracking cookies or third-party advertising cookies.
              </p>
              <p>
                For more details, see our <a href="/cookies" className="text-blue-600 hover:underline">Cookie Policy</a>.
              </p>
            </>
          ),
        },
        {
          title: 'Changes to This Policy',
          content: (
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by email and by posting a notice in the app. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.
            </p>
          ),
        },
        {
          title: 'Contact Us',
          content: (
            <p>
              For privacy-related questions or requests, contact us at{' '}
              <a href="mailto:privacy@Replify.app" className="text-blue-600 hover:underline">
                privacy@Replify.app
              </a>{' '}
              or through our <a href="/contact" className="text-blue-600 hover:underline">contact page</a>.
            </p>
          ),
        },
      ]}
    />
  )
}