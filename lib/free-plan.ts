/**
 * Free/Basic Plan System
 * Gives new users a FREE basic plan to start with
 */

export const FREE_PLAN = {
  name: 'Free',
  credits: 100, // Start with 100 free credits
  features: [
    '100 free credits to start',
    'AI Chat access',
    'Quiz Creator',
    'Notes Generator',
    'AI Detector',
    'Can purchase more credits',
  ],
};

/**
 * Get initial credits for new users
 */
export function getNewUserCredits(): number {
  return FREE_PLAN.credits;
}

/**
 * Check if user should get free starter credits
 */
export function shouldGetFreeCredits(userCreatedAt: Date): boolean {
  // Give free credits to new signups
  const now = new Date();
  const hoursSinceSignup = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60);

  // If account is less than 1 hour old, they're a new user
  return hoursSinceSignup < 1;
}

/**
 * Welcome message for new users
 */
export function getWelcomeMessage(): string {
  return `Welcome to JumpStudyAI! You've received ${FREE_PLAN.credits} free credits to get started. Enjoy exploring all our features!`;
}
