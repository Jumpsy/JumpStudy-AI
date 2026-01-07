export type PlanType = 'free' | 'pro' | 'premium';
export type UserRole = 'user' | 'all_access' | 'ceo';
export type AccountStatus = 'active' | 'flagged' | 'suspended';

// Pricing in USD (monthly)
export const PLAN_PRICES: Record<PlanType, number> = {
  free: 0,
  pro: 9.99,
  premium: 24.99,
};

// Annual pricing (with discount)
export const PLAN_PRICES_ANNUAL: Record<PlanType, number> = {
  free: 0,
  pro: 89, // $7.42/mo - Save $31/year (26% off)
  premium: 219, // $18.25/mo - Save $81/year (27% off)
};

// Daily word limits (converted from tokens: 1 token ≈ 0.75 words)
export const USAGE_LIMITS: Record<PlanType, number> = {
  free: 1500,       // ~1.5K words/day - just enough to try it
  pro: 75000,       // ~75K words/day - great for students
  premium: 500000,  // ~500K words/day - power users (essentially unlimited)
};

// Feature limits per plan
// COSTS: Undetectable AI = $30/mo for 20K words humanize (detection is unlimited), OpenAI = ~$0.50/1M tokens
// Pro at $9.99 should use max ~$3-4 in API costs to profit
// Premium at $24.99 should use max ~$10-12 in API costs
export const FEATURE_LIMITS: Record<PlanType, {
  quizzesPerDay: number;
  audioMinutesPerDay: number;  // Whisper = $0.006/min
  youtubeNotesPerDay: number;
  gamesPerDay: number;
  videoGenerationsPerDay: number;  // D-ID - expensive
  humanizeWordsPerDay: number;  // Undetectable = $0.0015/word (costs credits)
  detectWordsPerDay: number;    // Unlimited - no cost
  voiceMinutesPerDay: number;   // TTS = $0.015/1K chars
}> = {
  free: {
    quizzesPerDay: 2,
    audioMinutesPerDay: 0,        // Not available on free
    youtubeNotesPerDay: 2,
    gamesPerDay: 0,               // Not available on free
    videoGenerationsPerDay: 0,    // Not available on free
    humanizeWordsPerDay: 0,       // Not available on free
    detectWordsPerDay: 999999,    // Unlimited (no cost)
    voiceMinutesPerDay: 0,        // Not available on free
  },
  pro: {
    quizzesPerDay: 30,
    audioMinutesPerDay: 60,       // 1 hour/day
    youtubeNotesPerDay: 40,
    gamesPerDay: 15,
    videoGenerationsPerDay: 0,    // Not available on pro
    humanizeWordsPerDay: 5000,    // More generous humanization
    detectWordsPerDay: 999999,    // Unlimited (no cost)
    voiceMinutesPerDay: 60,       // 1 hour/day
  },
  premium: {
    quizzesPerDay: 100,
    audioMinutesPerDay: 180,      // 3 hours/day
    youtubeNotesPerDay: 200,
    gamesPerDay: 50,
    videoGenerationsPerDay: 15,   // More video generations
    humanizeWordsPerDay: 15000,   // Generous humanization
    detectWordsPerDay: 999999,    // Unlimited (no cost)
    voiceMinutesPerDay: 180,      // 3 hours/day
  },
};

// Plan features for display
export const PLAN_FEATURES: Record<PlanType, string[]> = {
  free: [
    '1,500 words/day',
    '2 quizzes/day',
    '2 YouTube summaries/day',
    'Unlimited AI detection',
    'Basic chat features',
    'Ads displayed',
  ],
  pro: [
    '75,000 words/day',
    '30 quizzes/day',
    '40 YouTube summaries/day',
    'Unlimited AI detection',
    '1 hour audio notes/day',
    '1 hour voice chat/day',
    '5,000 words humanize/day',
    '15 games/day',
    'Pay-as-you-go extra usage',
    'No ads',
    'Priority support',
  ],
  premium: [
    '500,000 words/day',
    '100 quizzes/day',
    '200 YouTube summaries/day',
    'Unlimited AI detection',
    '3 hours audio notes/day',
    '3 hours voice chat/day',
    '15,000 words humanize/day',
    '50 games/day',
    '15 AI videos/day',
    'Pay-as-you-go extra usage',
    'No ads',
    'Priority support',
  ],
};

export interface User {
  id: string;
  email: string;
  plan_type: PlanType;
  role: UserRole;
  account_status: AccountStatus;
  tokens_used_today: number;
  last_reset_date: string;
  created_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  subscription_status?: 'active' | 'canceled' | 'past_due' | 'trialing';
  abuse_flags?: number;
  last_abuse_check?: string;
  flagged_reason?: string;
}

// Abuse detection thresholds
export const ABUSE_THRESHOLDS = {
  requests_per_minute: 60,  // Max 60 requests per minute
  requests_per_hour: 500,   // Max 500 requests per hour
  tokens_per_hour: 100000,  // Max 100K tokens per hour
  humanize_words_per_hour: 10000, // Max 10K words humanized per hour
};

export interface UsageTracking {
  quizzes: number;
  audioMinutes: number;
  youtubeNotes: number;
  games: number;
  videoScripts: number;
  humanizeWords: number;
  detectWords: number;
  voiceMinutes: number;
  lastReset: string;
}

export interface HumanizeRequest {
  text: string;
}

export interface HumanizeResponse {
  humanizedText: string;
  tokensUsed: number;
  error?: string;
}

// Feature names for access control
export type FeatureName =
  | 'chat'           // Basic chat - all tiers
  | 'aiDetect'       // AI detection - all tiers (no cost)
  | 'quiz'           // Quizzes - all tiers
  | 'youtube'        // YouTube notes - all tiers
  | 'audioNotes'     // Audio recording/transcription - Pro+
  | 'voiceChat'      // Voice mode - Pro+
  | 'humanize'       // Text humanization - Pro+
  | 'gameBuilder'    // Game creation - Pro+
  | 'videoGenerate'; // AI video generation - Premium only

// Which features are available at each tier
// Ordered from cheapest to most expensive for us
export const FEATURE_ACCESS: Record<PlanType, FeatureName[]> = {
  free: [
    'chat',        // GPT-4o-mini: ~$0.50/1M tokens
    'aiDetect',    // Undetectable AI: FREE (unlimited)
    'quiz',        // GPT-4o-mini: minimal cost
    'youtube',     // GPT-4o-mini: minimal cost
  ],
  pro: [
    'chat',
    'aiDetect',
    'quiz',
    'youtube',
    'audioNotes',  // Whisper: $0.006/min
    'voiceChat',   // TTS: $0.015/1K chars
    'humanize',    // Undetectable AI: $0.0015/word
    'gameBuilder', // GPT-4o: ~$2.50/1M tokens
  ],
  premium: [
    'chat',
    'aiDetect',
    'quiz',
    'youtube',
    'audioNotes',
    'voiceChat',
    'humanize',
    'gameBuilder',
    'videoGenerate', // D-ID: ~$0.30/video
  ],
};

// Helper function to check if a user has access to a feature
export function hasFeatureAccess(planType: PlanType, feature: FeatureName, role: UserRole = 'user'): boolean {
  // CEO and All Access get everything
  if (role === 'ceo' || role === 'all_access') return true;

  return FEATURE_ACCESS[planType].includes(feature);
}

// Check if user has unlimited usage
export function hasUnlimitedUsage(role: UserRole): boolean {
  return role === 'ceo';
}

// Check if account is flagged
export function isAccountFlagged(status: AccountStatus): boolean {
  return status === 'flagged' || status === 'suspended';
}

// Get required plan for a feature
export function getRequiredPlan(feature: FeatureName): PlanType {
  if (FEATURE_ACCESS.free.includes(feature)) return 'free';
  if (FEATURE_ACCESS.pro.includes(feature)) return 'pro';
  return 'premium';
}

// Utility functions for usage tracking
// Conversion rate: 1 token ≈ 0.75 words (or 1 word ≈ 1.33 tokens)
export const tokensToWords = (tokens: number): number => {
  return Math.round(tokens * 0.75);
};

export const wordsToTokens = (words: number): number => {
  return Math.round(words * 1.33);
};

export const formatWordCount = (words: number): string => {
  if (words >= 1000000) {
    return `${(words / 1000000).toFixed(1)}M`;
  }
  if (words >= 1000) {
    return `${(words / 1000).toFixed(1)}K`;
  }
  return words.toString();
};

// Flashcard types
export interface FlashcardSet {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  subject?: string;
  is_public: boolean;
  card_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  set_id: string;
  term: string;
  definition: string;
  created_at: string;
}

export type StudyMode = 'flashcards' | 'learn' | 'test' | 'match';

// School Schedule types
export interface SchoolClass {
  id: string;
  className: string;      // e.g., "AP Biology"
  classCode?: string;     // e.g., "BIO301"
  teacher?: string;
  room: string;           // e.g., "Room 204"
  block: string;          // e.g., "Block A", "Period 1"
  startTime: string;      // HH:MM format
  endTime: string;        // HH:MM format
  daysOfWeek: number[];   // 0-6 (Sunday-Saturday)
  color?: string;         // Color for calendar display
}

export interface Assignment {
  id: string;
  classId: string;        // Reference to SchoolClass
  title: string;
  description?: string;
  dueDate: string;        // YYYY-MM-DD
  dueTime?: string;       // HH:MM
  type?: 'homework' | 'assignment' | 'project' | 'test' | 'quiz' | 'other';
  completed: boolean;
  createdAt: string;
}

export interface SchoolSchedule {
  id: string;
  userId: string;
  classes: SchoolClass[];
  assignments: Assignment[];
  createdAt: string;
  updatedAt: string;
  source?: 'manual' | 'upload' | 'link';  // How the schedule was added
  sourceUrl?: string;     // If from a link
}
