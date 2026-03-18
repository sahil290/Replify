import 'server-only'

// ── Queue configuration ──────────────────────────────────────────
// Uses Upstash QStash for serverless-compatible background jobs.
// QStash sends HTTP requests to your API routes — no persistent
// worker process needed. Perfect for Vercel deployments.

export type JobType = 'analyze_ticket' | 'kb_generate' | 'auto_reply'

export interface JobPayload {
  type:      JobType
  userId:    string
  jobId:     string   // UUID for tracking
  data:      Record<string, unknown>
  retryCount?: number
}

export interface JobStatus {
  jobId:     string
  status:    'pending' | 'processing' | 'done' | 'failed'
  result?:   Record<string, unknown>
  error?:    string
  createdAt: string
  updatedAt: string
}

// ── Redis client for job status storage ─────────────────────────
function getRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    throw new Error('Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local')
  }

  return { url, token }
}

async function redisCommand(commands: unknown[]): Promise<unknown> {
  const { url, token } = getRedis()
  const res = await fetch(`${url}/pipeline`, {
    method:  'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type':  'application/json',
    },
    body: JSON.stringify(commands),
  })
  if (!res.ok) throw new Error(`Redis error: ${res.status} ${await res.text()}`)
  const data = await res.json()
  return data
}

async function redisGet(key: string): Promise<string | null> {
  const { url, token } = getRedis()
  const res = await fetch(`${url}/get/${encodeURIComponent(key)}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.result
}

async function redisSet(key: string, value: string, exSeconds?: number): Promise<void> {
  const { url, token } = getRedis()
  const endpoint = exSeconds
    ? `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}/ex/${exSeconds}`
    : `${url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`

  await fetch(endpoint, {
    method:  'GET',
    headers: { 'Authorization': `Bearer ${token}` },
  })
}

// ── Job status management ────────────────────────────────────────
const JOB_TTL = 60 * 60 * 24 // 24 hours

export async function setJobStatus(
  jobId:  string,
  status: JobStatus
): Promise<void> {
  await redisSet(`job:${jobId}`, JSON.stringify(status), JOB_TTL)
}

export async function getJobStatus(jobId: string): Promise<JobStatus | null> {
  const raw = await redisGet(`job:${jobId}`)
  if (!raw) return null
  try { return JSON.parse(raw) }
  catch { return null }
}

// ── QStash publisher ─────────────────────────────────────────────
async function publishToQStash(
  endpoint: string,
  payload:  JobPayload,
  options?: { delaySeconds?: number; retries?: number }
): Promise<string> {
  const token = process.env.QSTASH_TOKEN
  if (!token) throw new Error('Missing QSTASH_TOKEN in .env.local')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const url    = `${appUrl}${endpoint}`

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'Content-Type':  'application/json',
    'Upstash-Retries': String(options?.retries ?? 3),
  }

  if (options?.delaySeconds) {
    headers['Upstash-Delay'] = `${options.delaySeconds}s`
  }

  const qstashUrl = process.env.QSTASH_URL ?? 'https://qstash-us-east-1.upstash.io'
  const res = await fetch(`${qstashUrl}/v2/publish/${encodeURIComponent(url)}`, {
    method: 'POST',
    headers,
    body:   JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`QStash publish failed: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.messageId ?? payload.jobId
}

// ── Public API ───────────────────────────────────────────────────

export async function enqueueTicketAnalysis(
  userId:     string,
  ticketText: string,
  options?:   { platform?: string; externalId?: string }
): Promise<string> {
  const jobId = crypto.randomUUID()
  const now   = new Date().toISOString()

  // Set initial status in Redis
  await setJobStatus(jobId, {
    jobId,
    status:    'pending',
    createdAt: now,
    updatedAt: now,
  })

  // Publish to QStash → will POST to /api/jobs/analyze-ticket
  await publishToQStash('/api/jobs/analyze-ticket', {
    type:   'analyze_ticket',
    userId,
    jobId,
    data:   { ticketText, ...options },
  }, { retries: 3 })

  return jobId
}

export async function enqueueKBGeneration(
  userId:      string,
  query:       string,
  ticketCount: number,
  samples:     string[]
): Promise<string> {
  const jobId = crypto.randomUUID()
  const now   = new Date().toISOString()

  await setJobStatus(jobId, {
    jobId,
    status:    'pending',
    createdAt: now,
    updatedAt: now,
  })

  await publishToQStash('/api/jobs/kb-generate', {
    type:   'kb_generate',
    userId,
    jobId,
    data:   { query, ticketCount, samples },
  }, { retries: 2 })

  return jobId
}