import Link from 'next/link'
import { Layers } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 text-white font-semibold mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <Layers className="w-3.5 h-3.5 text-white" />
              </div>
              Replify
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered support ticket analysis and response generation for modern customer teams.
            </p>
          </div>

          {[
            { title: 'Product',  links: [
              { label: 'Features',     href: '/#features'    },
              { label: 'Pricing',      href: '/#pricing'     },
              { label: 'Integrations', href: '/integrations' },
              { label: 'Security',     href: '/security'     },
            ]},
            { title: 'Company',  links: [
              { label: 'About',   href: '/contact'  },
              { label: 'Blog',    href: '#'         },
              { label: 'Contact', href: '/contact'  },
            ]},
            { title: 'Legal', links: [
              { label: 'Privacy Policy', href: '/privacy'  },
              { label: 'Terms of Service', href: '/terms'  },
              { label: 'Cookie Policy',  href: '/cookies'  },
              { label: 'Security',       href: '/security' },
            ]},
          ].map(col => (
            <div key={col.title}>
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.label}>
                    <a href={l.href} className="text-sm hover:text-white transition-colors">{l.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
          <span>© 2025 Replify, Inc. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms"   className="hover:text-white transition-colors">Terms</a>
            <a href="/cookies" className="hover:text-white transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}