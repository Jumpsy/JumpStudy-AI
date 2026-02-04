/**
 * Plan Tiers Configuration
 * Defines all subscription plans and their features
 *
 * Stripe Products & Prices (CAD):
 * - JumpStudy Student: $9.99/month, $79.99/year (40% off Pro)
 * - JumpStudy Pro: $15.99/month, $127.99/year
 * - JumpStudy Team: $13.99/month, $99.99/year (per user)
 * - Jump Code: $24.99/month, $199.99/year (Claude Opus AI)
 */

export type PlanTier = 'free' | 'student' | 'pro' | 'team' | 'code';

export interface StripePriceConfig {
  monthly: {
    priceId: string;
    productId: string;
    amount: number;
  };
  yearly: {
    priceId: string;
    productId: string;
    amount: number;
  };
}

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number;
  yearlyPrice?: number;
  period: string;
  monthlyCredits: number;
  features: string[];
  limitations?: string[];
  popular?: boolean;
  stripe?: StripePriceConfig;
  description?: string;
}

/**
 * Stripe Product and Price IDs
 * All prices in CAD
 */
export const STRIPE_CONFIG = {
  // JumpStudy Student - 40% off Pro features
  student: {
    monthly: {
      priceId: 'price_1SxBIn',
      productId: 'prod_Tv1LmI',
      amount: 9.99,
    },
    yearly: {
      priceId: 'price_1SxBRx',
      productId: 'prod_Tv1UIU',
      amount: 79.99,
    },
  },
  // JumpStudy Pro - Power users, unlimited
  pro: {
    monthly: {
      priceId: 'price_1SxBIh',
      productId: 'prod_Tv1KCZ',
      amount: 15.99,
    },
    yearly: {
      priceId: 'price_1SxBQr',
      productId: 'prod_Tv1TtS',
      amount: 127.99,
    },
  },
  // JumpStudy Team - For teams and study groups (per user)
  team: {
    monthly: {
      priceId: 'price_1SxBOr',
      productId: 'prod_Tv1QvA',
      amount: 13.99,
    },
    yearly: {
      priceId: 'price_1SxBSl',
      productId: 'prod_Tv1VO4',
      amount: 99.99,
    },
  },
  // Jump Code - Claude Opus AI for development
  code: {
    monthly: {
      priceId: 'price_1SxBPl',
      productId: 'prod_Tv1S8S',
      amount: 24.99,
    },
    yearly: {
      priceId: 'price_1SxBRr',
      productId: 'prod_Tv1UM',
      amount: 199.99,
    },
  },
} as const;

export const PLAN_TIERS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    monthlyCredits: 100,
    description: 'Get started with basic AI study tools',
    features: [
      '100 credits per month',
      'AI Chat (GPT-4o-mini)',
      'Basic quiz generation',
      'AI Detector access',
      'Notes generator',
    ],
    limitations: [
      'Limited to 100 credits/month',
      'No image generation',
      'Basic features only',
    ],
  },

  student: {
    id: 'student',
    name: 'JumpStudy Student',
    price: 9.99,
    yearlyPrice: 79.99,
    period: 'month',
    monthlyCredits: 3000,
    popular: true,
    description: 'All Pro features at 40% off for students',
    stripe: STRIPE_CONFIG.student,
    features: [
      '3,000 credits per month',
      'Full GPT-4o access',
      '25 AI images per month',
      'All quiz features',
      'Advanced notes & slideshows',
      'Student discount (40% off)',
      'Priority support',
    ],
  },

  pro: {
    id: 'pro',
    name: 'JumpStudy Pro',
    price: 15.99,
    yearlyPrice: 127.99,
    period: 'month',
    monthlyCredits: 10000,
    description: 'For power users. Unlimited AI features',
    stripe: STRIPE_CONFIG.pro,
    features: [
      '10,000 credits per month',
      'Full GPT-4o access',
      '100 AI images per month',
      'Unlimited file uploads',
      'All advanced features',
      'Priority support',
      'Early feature access',
    ],
  },

  team: {
    id: 'team',
    name: 'JumpStudy Team',
    price: 13.99,
    yearlyPrice: 99.99,
    period: 'month',
    monthlyCredits: 5000,
    description: 'For teams and study groups',
    stripe: STRIPE_CONFIG.team,
    features: [
      '5,000 credits per user/month',
      'Team collaboration features',
      'Shared study resources',
      'Group quiz sessions',
      'Team analytics dashboard',
      'Admin controls',
      'Priority team support',
    ],
  },

  code: {
    id: 'code',
    name: 'Jump Code',
    price: 24.99,
    yearlyPrice: 199.99,
    period: 'month',
    monthlyCredits: 20000,
    description: 'Claude Opus AI for development',
    stripe: STRIPE_CONFIG.code,
    features: [
      '20,000 credits per month',
      'Claude Opus AI access',
      'Advanced code generation',
      'Code review & debugging',
      'Full documentation access',
      'API access included',
      'Priority developer support',
    ],
  },
};

/**
 * Get plan configuration by tier
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return PLAN_TIERS[tier];
}

/**
 * Get monthly credits for a plan tier
 */
export function getMonthlyCredits(tier: PlanTier): number {
  return PLAN_TIERS[tier].monthlyCredits;
}

/**
 * Check if plan has feature access
 */
export function planHasFeature(tier: PlanTier, feature: string): boolean {
  const plan = PLAN_TIERS[tier];
  return plan.features.some(f => f.toLowerCase().includes(feature.toLowerCase()));
}

/**
 * Get display name for plan tier
 */
export function getPlanDisplayName(tier: PlanTier): string {
  return PLAN_TIERS[tier].name;
}

/**
 * Get credits limit for free plan (to prevent abuse)
 */
export function getFreeCreditsLimit(): number {
  return PLAN_TIERS.free.monthlyCredits;
}

/**
 * Check if user is on free plan
 */
export function isFreePlan(tier: string | null | undefined): boolean {
  return !tier || tier === 'free';
}

/**
 * Get plan tier from Supabase (handles null/undefined)
 */
export function normalizePlanTier(dbPlan: string | null | undefined): PlanTier {
  if (!dbPlan) return 'free';

  const normalized = dbPlan.toLowerCase().trim();

  // New plan tiers
  if (normalized === 'student') return 'student';
  if (normalized === 'pro') return 'pro';
  if (normalized === 'team') return 'team';
  if (normalized === 'code') return 'code';

  // Legacy plan tier mapping (for backwards compatibility)
  if (normalized === 'starter') return 'student';
  if (normalized === 'premium') return 'pro';
  if (normalized === 'unlimited') return 'code';

  return 'free';
}

/**
 * Get Stripe price ID for a plan and billing period
 */
export function getStripePriceId(tier: PlanTier, yearly: boolean = false): string | null {
  const plan = PLAN_TIERS[tier];
  if (!plan.stripe) return null;
  return yearly ? plan.stripe.yearly.priceId : plan.stripe.monthly.priceId;
}

/**
 * Get Stripe product ID for a plan and billing period
 */
export function getStripeProductId(tier: PlanTier, yearly: boolean = false): string | null {
  const plan = PLAN_TIERS[tier];
  if (!plan.stripe) return null;
  return yearly ? plan.stripe.yearly.productId : plan.stripe.monthly.productId;
}

/**
 * Get plan tier from Stripe price ID
 */
export function getPlanTierFromPriceId(priceId: string): PlanTier | null {
  for (const [tier, config] of Object.entries(STRIPE_CONFIG)) {
    if (config.monthly.priceId === priceId || config.yearly.priceId === priceId) {
      return tier as PlanTier;
    }
  }
  return null;
}

/**
 * Check if a price ID is for yearly billing
 */
export function isYearlyPriceId(priceId: string): boolean {
  for (const config of Object.values(STRIPE_CONFIG)) {
    if (config.yearly.priceId === priceId) {
      return true;
    }
  }
  return false;
}

/**
 * Get all available paid plans (for pricing page)
 */
export function getPaidPlans(): PlanConfig[] {
  return Object.values(PLAN_TIERS).filter(plan => plan.id !== 'free');
}

/**
 * Calculate yearly savings for a plan
 */
export function getYearlySavings(tier: PlanTier): { amount: number; percentage: number } | null {
  const plan = PLAN_TIERS[tier];
  if (!plan.yearlyPrice) return null;

  const monthlyTotal = plan.price * 12;
  const yearlyTotal = plan.yearlyPrice;
  const savings = monthlyTotal - yearlyTotal;
  const percentage = Math.round((savings / monthlyTotal) * 100);

  return { amount: savings, percentage };
}
