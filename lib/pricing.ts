// Pricing plans - 20% cheaper than ChatGPT
// ChatGPT Plus: $20/month -> We charge $16/month
// ChatGPT Team: $25/month -> We charge $20/month
// ChatGPT Enterprise: Custom -> We offer Pro at $32/month

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out JumpStudy AI',
    price: 0,
    priceId: null,
    features: [
      'Unlimited AI Chat',
      'Unlimited AI Humanizer',
      'Unlimited AI Detector',
      'Basic Image Generation (10/day)',
      'Basic Video Generation (5/day)',
      'Voice Conversation Mode',
      'Community Support',
    ],
    limits: {
      imagesPerDay: 10,
      videosPerDay: 5,
      priority: false,
    },
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    description: 'For power users who need more',
    price: 16, // 20% cheaper than ChatGPT Plus ($20)
    priceId: process.env.STRIPE_PLUS_PRICE_ID,
    popular: true,
    features: [
      'Everything in Free',
      'Unlimited Image Generation',
      'Unlimited Video Generation',
      'Priority Response Speed',
      'Advanced AI Models',
      'No Daily Limits',
      'Email Support',
    ],
    limits: {
      imagesPerDay: -1, // unlimited
      videosPerDay: -1,
      priority: true,
    },
  },
  team: {
    id: 'team',
    name: 'Team',
    description: 'For teams and small businesses',
    price: 20, // 20% cheaper than ChatGPT Team ($25)
    priceId: process.env.STRIPE_TEAM_PRICE_ID,
    features: [
      'Everything in Plus',
      'Up to 10 team members',
      'Shared workspace',
      'Admin dashboard',
      'Usage analytics',
      'Priority support',
      'API access',
    ],
    limits: {
      imagesPerDay: -1,
      videosPerDay: -1,
      priority: true,
      teamMembers: 10,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For professionals and enterprises',
    price: 32, // Premium tier
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Team',
      'Unlimited team members',
      'Custom AI model training',
      'White-label options',
      'Dedicated support',
      'SLA guarantee',
      'Custom integrations',
      'Advanced analytics',
    ],
    limits: {
      imagesPerDay: -1,
      videosPerDay: -1,
      priority: true,
      teamMembers: -1,
    },
  },
}

export type PlanId = keyof typeof PRICING_PLANS
export type Plan = typeof PRICING_PLANS[PlanId]

export function getPlan(planId: string): Plan {
  return PRICING_PLANS[planId as PlanId] || PRICING_PLANS.free
}

export function canUseFeature(
  userPlan: string,
  feature: 'images' | 'videos' | 'priority',
  currentUsage: number = 0
): boolean {
  const plan = getPlan(userPlan)

  switch (feature) {
    case 'images':
      return plan.limits.imagesPerDay === -1 || currentUsage < plan.limits.imagesPerDay
    case 'videos':
      return plan.limits.videosPerDay === -1 || currentUsage < plan.limits.videosPerDay
    case 'priority':
      return plan.limits.priority
    default:
      return true
  }
}
