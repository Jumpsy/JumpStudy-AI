import { createClient } from '@/lib/supabase/server';
import { countWords, calculateTextCredits, FEATURE_COSTS } from './credits-system';

export interface CreditBalance {
  balance: number;
  canAfford: boolean;
}

/**
 * Check if user has enough credits
 */
export async function checkCredits(userId: string, creditsNeeded: number): Promise<CreditBalance> {
  const supabase = await createClient();

  const { data: user } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', userId)
    .single();

  const balance = user?.credits_balance || 0;
  const canAfford = balance >= creditsNeeded;

  return {
    balance,
    canAfford,
  };
}

/**
 * Deduct credits from user's balance
 */
export async function deductCredits(
  userId: string,
  credits: number,
  description: string,
  metadata?: Record<string, any>
): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const supabase = await createClient();

  try {
    // Get current balance
    const { data: user } = await supabase
      .from('users')
      .select('credits_balance, total_credits_used')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, newBalance: 0, error: 'User not found' };
    }

    const currentBalance = user.credits_balance || 0;

    if (currentBalance < credits) {
      return { success: false, newBalance: currentBalance, error: 'Insufficient credits' };
    }

    const newBalance = currentBalance - credits;
    const newTotalUsed = (user.total_credits_used || 0) + credits;

    // Update user's balance
    await supabase
      .from('users')
      .update({
        credits_balance: newBalance,
        total_credits_used: newTotalUsed,
      })
      .eq('id', userId);

    // Log transaction
    await supabase.from('credits_transactions').insert({
      user_id: userId,
      type: 'usage',
      amount: -credits,
      balance_after: newBalance,
      description,
      metadata,
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, newBalance: 0, error: 'Failed to deduct credits' };
  }
}

/**
 * Add credits to user's balance (purchase or bonus)
 */
export async function addCredits(
  userId: string,
  credits: number,
  type: 'purchase' | 'bonus',
  description: string,
  stripePaymentId?: string
): Promise<{ success: boolean; newBalance: number }> {
  const supabase = await createClient();

  try {
    // Get current balance
    const { data: user } = await supabase
      .from('users')
      .select('credits_balance, total_credits_purchased')
      .eq('id', userId)
      .single();

    if (!user) {
      return { success: false, newBalance: 0 };
    }

    const currentBalance = user.credits_balance || 0;
    const newBalance = currentBalance + credits;
    const newTotalPurchased = type === 'purchase'
      ? (user.total_credits_purchased || 0) + credits
      : user.total_credits_purchased;

    // Update user's balance
    await supabase
      .from('users')
      .update({
        credits_balance: newBalance,
        total_credits_purchased: newTotalPurchased,
      })
      .eq('id', userId);

    // Log transaction
    await supabase.from('credits_transactions').insert({
      user_id: userId,
      type,
      amount: credits,
      balance_after: newBalance,
      description,
      stripe_payment_id: stripePaymentId,
    });

    return { success: true, newBalance };
  } catch (error) {
    console.error('Error adding credits:', error);
    return { success: false, newBalance: 0 };
  }
}

/**
 * Calculate and deduct credits for a chat message
 */
export async function deductChatCredits(
  userId: string,
  userMessage: string,
  aiResponse: string
): Promise<{ success: boolean; creditsUsed: number; newBalance: number; error?: string }> {
  const inputWords = countWords(userMessage);
  const outputWords = countWords(aiResponse);
  const creditsUsed = calculateTextCredits(inputWords, outputWords);

  const result = await deductCredits(userId, creditsUsed, 'Chat message', {
    inputWords,
    outputWords,
    totalWords: inputWords + outputWords,
  });

  return {
    success: result.success,
    creditsUsed,
    newBalance: result.newBalance,
    error: result.error,
  };
}

/**
 * Deduct credits for image generation
 */
export async function deductImageCredits(userId: string, prompt: string): Promise<{
  success: boolean;
  creditsUsed: number;
  newBalance: number;
  error?: string;
}> {
  const creditsUsed = FEATURE_COSTS.IMAGE_GENERATION;

  const result = await deductCredits(userId, creditsUsed, 'Image generation', {
    prompt,
  });

  return {
    success: result.success,
    creditsUsed,
    newBalance: result.newBalance,
    error: result.error,
  };
}

/**
 * Deduct credits for quiz generation
 */
export async function deductQuizCredits(
  userId: string,
  topic: string,
  numberOfQuestions: number
): Promise<{
  success: boolean;
  creditsUsed: number;
  newBalance: number;
  error?: string;
}> {
  const creditsUsed = FEATURE_COSTS.QUIZ_GENERATION;

  const result = await deductCredits(userId, creditsUsed, 'Quiz generation', {
    topic,
    numberOfQuestions,
  });

  return {
    success: result.success,
    creditsUsed,
    newBalance: result.newBalance,
    error: result.error,
  };
}

/**
 * Deduct credits for note generation
 */
export async function deductNoteCredits(userId: string, topic: string): Promise<{
  success: boolean;
  creditsUsed: number;
  newBalance: number;
  error?: string;
}> {
  const creditsUsed = FEATURE_COSTS.NOTE_GENERATION;

  const result = await deductCredits(userId, creditsUsed, 'Note generation', {
    topic,
  });

  return {
    success: result.success,
    creditsUsed,
    newBalance: result.newBalance,
    error: result.error,
  };
}

/**
 * Deduct credits for slideshow generation
 */
export async function deductSlideshowCredits(
  userId: string,
  topic: string,
  numberOfSlides: number
): Promise<{
  success: boolean;
  creditsUsed: number;
  newBalance: number;
  error?: string;
}> {
  const creditsUsed = FEATURE_COSTS.SLIDESHOW_GENERATION;

  const result = await deductCredits(userId, creditsUsed, 'Slideshow generation', {
    topic,
    numberOfSlides,
  });

  return {
    success: result.success,
    creditsUsed,
    newBalance: result.newBalance,
    error: result.error,
  };
}

/**
 * Get user's recent credit transactions
 */
export async function getRecentTransactions(userId: string, limit: number = 20) {
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from('credits_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return transactions || [];
}
