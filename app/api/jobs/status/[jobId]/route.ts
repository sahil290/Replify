import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getJobStatus } from '@/lib/queue'

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { jobId } = params
    if (!jobId || !/^[0-9a-f-]{36}$/i.test(jobId)) {
      return NextResponse.json({ error: 'Invalid jobId' }, { status: 400 })
    }

    const status = await getJobStatus(jobId)
    if (!status) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    return NextResponse.json(status)
  } catch (err: any) {
    // If Redis is not configured, return a graceful fallback
    if (err.message?.includes('UPSTASH_REDIS')) {
      return NextResponse.json({
        jobId:     params.jobId,
        status:    'unknown',
        error:     'Queue not configured — add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN to .env.local',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}