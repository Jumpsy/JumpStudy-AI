// JumpStudy AI Pricing Plans
// 20% cheaper than ChatGPT with annual savings

export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Basic',
    description: 'Perfect for trying out JumpStudy AI',
    price: 0,
    priceId: null,
    annualPrice: 0,
    annualPriceId: null,
    features: [
      'Unlimited AI Chat',
      'AI Detector (5 checks/day)',
      'AI Humanizer (3 uses/day, 500 words)',
      'Study flashcards (3 sets)',
      'Basic image generation (5/day)',
      'Community support',
    ],
    limits: {
      imagesPerDay: 5,
      videosPerDay: 2,
      humanizerPerDay: 3,
      humanizerMaxWords: 500,
      detectorPerDay: 5,
      studySets: 3,
      priority: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For power users who need more',
    price: 15.99, // 20% cheaper than ChatGPT Plus ($20)
    priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    annualPrice: 127.99, // $10.67/month - save 33%
    annualPriceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    popular: true,
    features: [
      'Everything in Basic',
      'Unlimited AI Humanizer',
      'Unlimited AI Detector',
      'Unlimited study sets & flashcards',
      'Notebook document analysis',
      'Cloud Writer with scheduling',
      'Priority response speed',
      'Image generation (100/day)',
      'Video generation (20/day)',
      'Email support',
    ],
    limits: {
      imagesPerDay: 100,
      videosPerDay: 20,
      humanizerPerDay: -1, // unlimited
      humanizerMaxWords: -1,
      detectorPerDay: -1,
      studySets: -1,
      priority: true,
    },
  },
  student: {
    id: 'student',
    name: 'Student',
    description: 'Discounted for students with .edu email',
    price: 9.99, // Student discount
    priceId: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID,
    annualPrice: 79.99, // $6.67/month
    annualPriceId: process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID,
    requiresEdu: true,
    features: [
      'All Pro features',
      'Unlimited AI Humanizer',
      'Unlimited AI Detector',
      'Unlimited study sets & flashcards',
      'Notebook document analysis',
      'Cloud Writer with scheduling',
      'Priority response speed',
      'Image generation (100/day)',
      'Video generation (20/day)',
      'Student-only price',
    ],
    limits: {
      imagesPerDay: 100,
      videosPerDay: 20,
      humanizerPerDay: -1,
      humanizerMaxWords: -1,
      detectorPerDay: -1,
      studySets: -1,
      priority: true,
    },
  },
  team: {
    id: 'team',
    name: 'Classroom',
    description: 'For teachers and study groups (5+ users)',
    price: 12.99, // per user
    priceId: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
    annualPrice: 99.99, // per user/year
    annualPriceId: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
    perUser: true,
    minUsers: 5,
    features: [
      'All Pro features',
      'Admin dashboard',
      'Usage analytics',
      'Shared study sets',
      'Class management',
      'Priority support',
      'API access',
      'Bulk user management',
    ],
    limits: {
      imagesPerDay: -1,
      videosPerDay: -1,
      humanizerPerDay: -1,
      humanizerMaxWords: -1,
      detectorPerDay: -1,
      studySets: -1,
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
  feature: 'images' | 'videos' | 'humanizer' | 'detector' | 'studySets' | 'priority',
  currentUsage: number = 0
): boolean {
  const plan = getPlan(userPlan)

  switch (feature) {
    case 'images':
      return plan.limits.imagesPerDay === -1 || currentUsage < plan.limits.imagesPerDay
    case 'videos':
      return plan.limits.videosPerDay === -1 || currentUsage < plan.limits.videosPerDay
    case 'humanizer':
      return plan.limits.humanizerPerDay === -1 || currentUsage < plan.limits.humanizerPerDay
    case 'detector':
      return plan.limits.detectorPerDay === -1 || currentUsage < plan.limits.detectorPerDay
    case 'studySets':
      return plan.limits.studySets === -1 || currentUsage < plan.limits.studySets
    case 'priority':
      return plan.limits.priority
    default:
      return true
  }
}

export function getAnnualSavings(planId: string): { monthly: number; annual: number; savings: number; percentOff: number } {
  const plan = getPlan(planId)
  if (plan.price === 0) return { monthly: 0, annual: 0, savings: 0, percentOff: 0 }

  const monthlyTotal = plan.price * 12
  const annualTotal = plan.annualPrice || monthlyTotal
  const savings = monthlyTotal - annualTotal
  const percentOff = Math.round((savings / monthlyTotal) * 100)

  return { monthly: monthlyTotal, annual: annualTotal, savings, percentOff }
}
