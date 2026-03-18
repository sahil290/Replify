import 'server-only'

export async function getUserPlan(supabase: any, userId: string): Promise<{
  plan:       string
  trialOver:  boolean
  planActive: boolean
  isActive:   boolean
}> {
  const { data } = await supabase
    .from('users')
    .select('plan, plan_expires_at, created_at')
    .eq('id', userId)
    .single()

  const plan       = data?.plan ?? 'starter'
  const createdAt  = new Date(data?.created_at ?? new Date())
  const trialEnd   = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000)
  const now        = new Date()
  const trialOver  = now > trialEnd
  const planActive = data?.plan_expires_at
    ? now <= new Date(data.plan_expires_at)
    : false

  // Account is active if on paid plan OR trial still running
  const isActive = planActive || !trialOver || plan !== 'starter'

  return { plan, trialOver, planActive, isActive }
}