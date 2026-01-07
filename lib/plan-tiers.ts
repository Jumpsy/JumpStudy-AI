/**
 * Plan Tiers Configuration
 * Defines all subscription plans and their features
 */

export type PlanTier = 'free' | 'starter' | 'premium' | 'unlimited';

export interface PlanConfig {
  id: PlanTier;
  name: string;
  price: number;
  period: string;
  monthlyCredits: number;
  features: string[];
  limitations?: string[];
  popular?: boolean;
}

export const PLAN_TIERS: Record<PlanTier, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    monthlyCredits: 100, // 100 credits per month
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

  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9.99,
    period: 'month',
    monthlyCredits: 1000, // 1000 credits per month
    features: [
      '1,000 credits per month',
      'Full GPT-4o access',
      '10 AI images per month',
      'All quiz features',
      'Advanced notes',
      'Slideshow creator',
      'Priority support',
    ],
  },

  premium: {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    period: 'month',
    monthlyCredits: 5000, // 5000 credits per month
    popular: true,
    features: [
      '5,000 credits per month',
      'Full GPT-4o access',
      '50 AI images per month',
      'Unlimited file uploads',
      'Advanced AI features',
      'Priority support',
      'Custom branding',
    ],
  },

  unlimited: {
    id: 'unlimited',
    name: 'Unlimited',
    price: 39.99,
    period: 'month',
    monthlyCredits: 999999, // Effectively unlimited
    features: [
      'Unlimited credits',
      'Full GPT-4o access',
      '200 AI images per month',
      'All features unlocked',
      'API access',
      'Priority support',
      'Early feature access',
      'Custom integrations',
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

  if (normalized === 'starter') return 'starter';
  if (normalized === 'premium') return 'premium';
  if (normalized === 'unlimited') return 'unlimited';

  return 'free';
}
