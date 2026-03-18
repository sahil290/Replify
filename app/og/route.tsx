import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const title    = searchParams.get('title')    ?? 'AI-Powered Customer Support'
  const subtitle = searchParams.get('subtitle') ?? 'Reduce support tickets by 40% with AI'
  const page     = searchParams.get('page')     ?? ''

  return new ImageResponse(
    (
      <div
        style={{
          width:           '1200px',
          height:          '630px',
          display:         'flex',
          flexDirection:   'column',
          background:      'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 40%, #4C1D95 100%)',
          padding:         '60px',
          fontFamily:      'sans-serif',
          position:        'relative',
          overflow:        'hidden',
        }}
      >
        {/* Background pattern */}
        <div style={{
          position: 'absolute', top: '-100px', right: '-100px',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          display: 'flex',
        }} />
        <div style={{
          position: 'absolute', bottom: '-150px', left: '-80px',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
          display: 'flex',
        }} />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '48px' }}>
          <div style={{
            width: '48px', height: '48px',
            background: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <div style={{
              color: '#2563EB',
              fontSize: '20px',
              fontWeight: '900',
              letterSpacing: '-1px',
              display: 'flex',
            }}>SP</div>
          </div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: '700', display: 'flex' }}>
            Replify
          </div>
          {page && (
            <div style={{
              marginLeft: '16px',
              background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.9)',
              fontSize: '14px',
              fontWeight: '600',
              padding: '4px 14px',
              borderRadius: '100px',
              display: 'flex',
            }}>
              {page}
            </div>
          )}
        </div>

        {/* Main title */}
        <div style={{
          color: 'white',
          fontSize: title.length > 40 ? '48px' : '60px',
          fontWeight: '800',
          lineHeight: '1.1',
          marginBottom: '20px',
          maxWidth: '900px',
          display: 'flex',
          flexWrap: 'wrap',
        }}>
          {title}
        </div>

        {/* Subtitle */}
        <div style={{
          color: 'rgba(255,255,255,0.75)',
          fontSize: '24px',
          lineHeight: '1.5',
          maxWidth: '700px',
          display: 'flex',
        }}>
          {subtitle}
        </div>

        {/* Bottom stats row */}
        <div style={{
          display: 'flex',
          gap: '32px',
          marginTop: 'auto',
          paddingTop: '32px',
          borderTop: '1px solid rgba(255,255,255,0.15)',
        }}>
          {[
            { label: 'Tickets analyzed', value: '40% faster' },
            { label: 'Auto-reply rate',  value: '66%'        },
            { label: 'Avg response',     value: '< 2 min'    },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ color: 'white', fontSize: '22px', fontWeight: '700', display: 'flex' }}>
                {stat.value}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', display: 'flex' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    {
      width:  1200,
      height: 630,
    }
  )
}