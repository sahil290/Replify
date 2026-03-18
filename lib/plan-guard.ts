import 'server-only'

export type PlanId = 'starter' | 'pro' | 'business'

// Feature access matrix
export const PLAN_FEATURES = {
  // ticket limits handled separately via getTicketLimit()
  insights:       { starter: false, pro: true,  business: true  },
  export_csv:     { starter: false, pro: true,  business: true  },
  saved_replies:  { starter: true,  pro: true,  business: true  },
  integrations:   { starter: false, pro: true,  business: true  },
  auto_reply:     { starter: false, pro: true,  business: true  },
  team_members:   { starter: false, pro: true,  business: true  },
  webhooks:       { starter: false, pro: true,  business: true  },
} as const

export type Feature = keyof typeof PLAN_FEATURES

export function canAccess(plan: string, feature: Feature): boolean {
  const p = (plan ?? 'starter') as PlanId
  return PLAN_FEATURES[feature][p] ?? false
}

export function planGateResponse(feature: Feature, plan: string) {
  if (!canAccess(plan, feature)) {
    const upgradeTo = feature === 'insights' || feature === 'export_csv'
      || feature === 'integrations' || feature === 'auto_reply'
      || feature === 'team_members' || feature === 'webhooks'
      ? 'Pro' : 'Pro'
    return {
      error:   `This feature requires the ${upgradeTo} plan or higher.`,
      code:    'PLAN_UPGRADE_REQUIRED',
      feature,
      current_plan: plan,
    }
  }
  return null
}