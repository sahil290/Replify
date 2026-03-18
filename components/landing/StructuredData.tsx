const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://Replify.app'

export default function StructuredData() {
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      // SoftwareApplication schema
      {
        '@type':            'SoftwareApplication',
        '@id':              `${APP_URL}/#app`,
        name:               'Replify',
        url:                APP_URL,
        description:        'AI-powered customer support platform that analyzes tickets, generates replies, and detects recurring issues.',
        applicationCategory: 'BusinessApplication',
        operatingSystem:    'Web',
        offers: {
          '@type':    'AggregateOffer',
          lowPrice:   '49',
          highPrice:  '399',
          priceCurrency: 'USD',
          offerCount: '3',
        },
        aggregateRating: {
          '@type':       'AggregateRating',
          ratingValue:   '4.9',
          reviewCount:   '127',
          bestRating:    '5',
          worstRating:   '1',
        },
      },
      // Organization schema
      {
        '@type': 'Organization',
        '@id':   `${APP_URL}/#org`,
        name:    'Replify',
        url:     APP_URL,
        logo: {
          '@type': 'ImageObject',
          url:     `${APP_URL}/favicon.svg`,
        },
        contactPoint: {
          '@type':           'ContactPoint',
          email:             'support@replify.app',
          contactType:       'customer support',
          availableLanguage: 'English',
        },
        sameAs: [],
      },
      // WebSite schema (enables Google sitelinks search)
      {
        '@type':  'WebSite',
        '@id':    `${APP_URL}/#website`,
        url:      APP_URL,
        name:     'Replify',
        publisher: { '@id': `${APP_URL}/#org` },
        potentialAction: {
          '@type':       'SearchAction',
          target:        `${APP_URL}/tickets?search={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      // FAQPage schema
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name:    'What is Replify?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:    'Replify is an AI-powered customer support platform that analyzes incoming support tickets, generates suggested replies, and detects recurring issues — reducing support workload by up to 40%.',
            },
          },
          {
            '@type': 'Question',
            name:    'How does Replify work?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:    'Replify connects to your support platform (Zendesk, Intercom, Freshdesk) via webhook. When a ticket arrives, AI analyzes the message, categorizes it, scores its urgency, and generates a suggested reply in under 2 seconds.',
            },
          },
          {
            '@type': 'Question',
            name:    'Is there a free trial?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:    'Yes. Replify offers a 7-day free trial on the Starter plan with no credit card required.',
            },
          },
          {
            '@type': 'Question',
            name:    'Which support platforms does Replify integrate with?',
            acceptedAnswer: {
              '@type': 'Answer',
              text:    'Replify integrates with Zendesk, Intercom, Freshdesk, Help Scout, and any platform that supports webhooks.',
            },
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}