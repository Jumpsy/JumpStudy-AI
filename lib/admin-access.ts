/**
 * Admin Access System
 * Gives site owner unlimited free access to all features
 */

// Admin email(s) with unlimited access
const ADMIN_EMAILS = [
  // 'jacob.hurvitz@gmail.com', // DISABLED - Testing payments with basic plan
  'admin@jumpstudyai.com',
  // Add more admin emails here
  // Uncomment your email above to get unlimited access after testing
];

// Admin user IDs (if you know your Supabase user ID)
const ADMIN_USER_IDS: string[] = [
  // Add your Supabase user ID here when you sign up
  // Example: '123e4567-e89b-12d3-a456-426614174000'
];

/**
 * Check if user is admin (has unlimited access)
 */
export function isAdmin(userEmail?: string | null, userId?: string | null): boolean {
  if (!userEmail && !userId) return false;

  // Check by email
  if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
    return true;
  }

  // Check by user ID
  if (userId && ADMIN_USER_IDS.includes(userId)) {
    return true;
  }

  return false;
}

/**
 * Get unlimited credits for admin
 */
export function getAdminCredits(): number {
  return 999999; // Unlimited credits
}

/**
 * Check if user has access to feature
 * Admins always have access
 */
export function hasFeatureAccess(
  userEmail?: string | null,
  userId?: string | null,
  userCredits?: number
): boolean {
  // Admin has unlimited access
  if (isAdmin(userEmail, userId)) {
    return true;
  }

  // Regular users need credits
  return (userCredits ?? 0) > 0;
}

/**
 * Deduct credits (skip for admin)
 */
export function deductCredits(
  userEmail?: string | null,
  userId?: string | null,
  currentCredits?: number,
  amount: number = 1
): number {
  // Admin credits never decrease
  if (isAdmin(userEmail, userId)) {
    return getAdminCredits();
  }

  // Regular users lose credits
  return Math.max(0, (currentCredits ?? 0) - amount);
}

/**
 * Get user's display credits
 */
export function getDisplayCredits(
  userEmail?: string | null,
  userId?: string | null,
  actualCredits?: number
): number {
  if (isAdmin(userEmail, userId)) {
    return getAdminCredits();
  }

  return actualCredits ?? 0;
}

/**
 * Check if this is a premium feature
 */
export function isPremiumFeature(feature: string): boolean {
  const premiumFeatures = [
    'ai-chat',
    'quiz-creator',
    'notes-generator',
    'slideshow-creator',
    'image-generator',
    'ai-detector',
    'text-humanizer',
  ];

  return premiumFeatures.includes(feature);
}
