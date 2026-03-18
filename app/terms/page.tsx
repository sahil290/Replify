import LegalLayout from '@/components/landing/LegalLayout'

export const metadata = {
  title: 'Terms of Service — Replify',
  description: 'Terms and conditions for using Replify.',
}

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      subtitle="Please read these terms carefully before using Replify."
      lastUpdated="March 16, 2026"
      sections={[
        {
          title: 'Acceptance of Terms',
          content: (
            <p>
              By accessing or using Replify ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you may not use the Service. These Terms apply to all users, including visitors, registered users, and paying customers.
            </p>
          ),
        },
        {
          title: 'Description of Service',
          content: (
            <>
              <p>
                Replify is an AI-powered customer support platform that helps companies analyze incoming support tickets, generate suggested replies, and detect recurring issues. The Service is provided on a subscription basis with a 7-day free trial.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice.
              </p>
            </>
          ),
        },
        {
          title: 'Account Registration',
          content: (
            <>
              <p>To use Replify, you must create an account. You agree to:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Provide accurate, current, and complete registration information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access to your account</li>
              </ul>
              <p>
                You must be at least 18 years old to create an account. By registering, you confirm that you meet this requirement.
              </p>
            </>
          ),
        },
        {
          title: 'Subscription and Payment',
          content: (
            <>
              <p><strong className="text-gray-800">Free trial:</strong> New accounts receive a 7-day free trial on the Starter plan. No credit card is required for the trial.</p>
              <p><strong className="text-gray-800">Paid plans:</strong> After the trial ends, continued use requires a paid subscription. Plans are billed monthly.</p>
              <p><strong className="text-gray-800">Pricing:</strong></p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Starter — ₹4,099/month or $49/month — 100 tickets/month</li>
                <li>Pro — ₹12,499/month or $149/month — 1,000 tickets/month</li>
                <li>Business — ₹33,299/month or $399/month — Unlimited tickets</li>
              </ul>
              <p><strong className="text-gray-800">Cancellation:</strong> You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial months, except where required by law.</p>
              <p><strong className="text-gray-800">Money-back guarantee:</strong> We offer a 14-day money-back guarantee on paid plans. Contact us within 14 days of your first payment for a full refund.</p>
            </>
          ),
        },
        {
          title: 'Acceptable Use',
          content: (
            <>
              <p>You agree not to use Replify to:</p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>Violate any applicable laws or regulations</li>
                <li>Process data you do not have the right to process</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Transmit malware, viruses, or any malicious code</li>
                <li>Harass, abuse, or harm any person</li>
                <li>Circumvent ticket limits or other usage restrictions</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Use the Service for any illegal or fraudulent purpose</li>
              </ul>
              <p>
                Violation of these terms may result in immediate termination of your account without refund.
              </p>
            </>
          ),
        },
        {
          title: 'Your Data and Content',
          content: (
            <>
              <p>
                You retain ownership of all data and content you submit to Replify, including support ticket text and customer information.
              </p>
              <p>
                By using the Service, you grant us a limited, non-exclusive license to process your data solely for the purpose of providing the Service to you. We do not claim ownership of your data and do not use it to train AI models without your explicit consent.
              </p>
              <p>
                You are responsible for ensuring you have the right to submit any data you upload, including customer support data containing personal information of third parties. You must have appropriate consent or legitimate basis for processing such data under applicable privacy laws (including GDPR, CCPA, and India's DPDP Act).
              </p>
            </>
          ),
        },
        {
          title: 'AI-Generated Content',
          content: (
            <>
              <p>
                Replify uses AI to generate suggested replies and analyses. You acknowledge that:
              </p>
              <ul className="list-disc ml-5 space-y-1.5">
                <li>AI-generated content may contain errors or inaccuracies</li>
                <li>You are responsible for reviewing AI suggestions before sending them to customers</li>
                <li>We make no guarantees about the accuracy, completeness, or appropriateness of AI-generated content</li>
                <li>The auto-reply feature, when enabled, sends responses without human review — you accept full responsibility for enabling this feature</li>
              </ul>
            </>
          ),
        },
        {
          title: 'Intellectual Property',
          content: (
            <>
              <p>
                The Replify platform, including its design, code, features, and branding, is owned by Replify and protected by copyright and other intellectual property laws.
              </p>
              <p>
                You may not copy, modify, distribute, sell, or lease any part of the Service, nor reverse-engineer or attempt to extract source code, without our written permission.
              </p>
            </>
          ),
        },
        {
          title: 'Disclaimers and Limitation of Liability',
          content: (
            <>
              <p>
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
              </p>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, Replify SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF THE SERVICE.
              </p>
              <p>
                OUR TOTAL LIABILITY TO YOU FOR ANY CLAIMS ARISING FROM THESE TERMS OR YOUR USE OF THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU PAID TO US IN THE 12 MONTHS PRECEDING THE CLAIM.
              </p>
            </>
          ),
        },
        {
          title: 'Termination',
          content: (
            <>
              <p>
                Either party may terminate this agreement at any time. We may suspend or terminate your account immediately if you violate these Terms, engage in fraudulent activity, or fail to pay fees when due.
              </p>
              <p>
                Upon termination, your right to use the Service ceases immediately. You may export your data before termination. We will delete your data within 30 days of account closure, except where retention is required by law.
              </p>
            </>
          ),
        },
        {
          title: 'Governing Law',
          content: (
            <p>
              These Terms are governed by the laws of India. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts in India. If you are using the Service from outside India, you consent to the transfer and processing of your data in India.
            </p>
          ),
        },
        {
          title: 'Changes to Terms',
          content: (
            <p>
              We may revise these Terms from time to time. We will notify you of material changes by email and by posting a notice in the app at least 14 days before the changes take effect. Your continued use of the Service after the effective date constitutes acceptance of the revised Terms.
            </p>
          ),
        },
        {
          title: 'Contact',
          content: (
            <p>
              For questions about these Terms, contact us at{' '}
              <a href="mailto:legal@Replify.app" className="text-blue-600 hover:underline">
                legal@Replify.app
              </a>.
            </p>
          ),
        },
      ]}
    />
  )
}