import { createClient } from '@/lib/supabase/server';

export interface AbuseDetectionResult {
  isAbusive: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  action: 'allow' | 'warn' | 'block' | 'ban';
  score: number; // 0-100, higher = more suspicious
}

/**
 * Comprehensive anti-abuse detection system
 * Analyzes user behavior patterns to detect potential abuse
 */
export async function detectAbuse(
  userId: string,
  action: 'message' | 'image' | 'refund' | 'signup' | 'quiz' | 'note' | 'slideshow'
): Promise<AbuseDetectionResult> {
  const supabase = await createClient();
  const reasons: string[] = [];
  let score = 0;

  try {
    // Get user account info
    const { data: user } = await supabase
      .from('users')
      .select('created_at, subscription_tier')
      .eq('id', userId)
      .single();

    if (!user) {
      return {
        isAbusive: true,
        riskLevel: 'critical',
        reasons: ['User not found'],
        action: 'block',
        score: 100,
      };
    }

    const accountAge = Math.floor(
      (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Check 1: Very new account activity
    if (accountAge < 1) {
      score += 20;
      reasons.push('Very new account (< 1 day old)');

      // Extra suspicious if free tier doing heavy activity
      if (user.subscription_tier === 'free') {
        score += 10;
        reasons.push('Free tier with immediate heavy usage');
      }
    }

    // Check 2: Refund request patterns
    if (action === 'refund') {
      const { data: refunds } = await supabase
        .from('refund_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (refunds && refunds.length > 0) {
        // Multiple refund requests
        if (refunds.length >= 3) {
          score += 50;
          reasons.push(`Multiple refund requests (${refunds.length} total)`);
        } else if (refunds.length === 2) {
          score += 30;
          reasons.push('Second refund request');
        }

        // Recent refund request
        const lastRefund = refunds[0];
        const daysSinceLastRefund = Math.floor(
          (Date.now() - new Date(lastRefund.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceLastRefund < 7) {
          score += 40;
          reasons.push(`Recent refund request (${daysSinceLastRefund} days ago)`);
        }

        // Pattern of approved refunds
        const approvedRefunds = refunds.filter((r) => r.status === 'approved').length;
        if (approvedRefunds >= 2) {
          score += 35;
          reasons.push(`Pattern of approved refunds (${approvedRefunds})`);
        }
      }
    }

    // Check 3: Unusual usage patterns
    const { data: usage } = await supabase
      .from('usage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(3);

    if (usage && usage.length > 0) {
      const currentUsage = usage[0];

      // Check for hitting limits repeatedly
      const limits = {
        free: 10,
        starter: 100,
        premium: 500,
        unlimited: Infinity,
      };

      const userLimit = limits[user.subscription_tier as keyof typeof limits];

      if (currentUsage.messages_used >= userLimit && userLimit !== Infinity) {
        score += 15;
        reasons.push('Consistently hitting usage limits');
      }

      // Sudden spike in usage
      if (usage.length >= 2) {
        const previousUsage = usage[1];
        const usageIncrease =
          ((currentUsage.messages_used - previousUsage.messages_used) /
            (previousUsage.messages_used || 1)) *
          100;

        if (usageIncrease > 500 && accountAge < 30) {
          score += 25;
          reasons.push(`Sudden usage spike (${usageIncrease.toFixed(0)}% increase)`);
        }
      }
    }

    // Check 4: Rate limiting - rapid successive requests
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

    if (action === 'message' || action === 'image') {
      const { data: recentMessages } = await supabase
        .from('messages')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', oneMinuteAgo);

      if (recentMessages && recentMessages.length > 20) {
        score += 30;
        reasons.push(`Excessive requests (${recentMessages.length} in last minute)`);
      }
    }

    // Check 5: Content generation abuse
    if (action === 'quiz' || action === 'note' || action === 'slideshow') {
      const { data: recentQuizzes } = await supabase
        .from(action === 'quiz' ? 'quizzes' : action === 'note' ? 'notes' : 'slideshows')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString()); // Last hour

      if (recentQuizzes && recentQuizzes.length > 10) {
        score += 25;
        reasons.push(`Excessive ${action} generation (${recentQuizzes.length} in last hour)`);
      }
    }

    // Check 6: Signup abuse patterns
    if (action === 'signup') {
      // Check for multiple accounts from same IP (would need IP tracking)
      // Check for disposable email patterns
      const { data: userEmail } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (userEmail?.email) {
        const disposableEmailDomains = [
          'tempmail',
          'throwaway',
          'guerrillamail',
          'mailinator',
          '10minutemail',
          'trashmail',
        ];

        const isDisposable = disposableEmailDomains.some((domain) =>
          userEmail.email.toLowerCase().includes(domain)
        );

        if (isDisposable) {
          score += 40;
          reasons.push('Disposable email address detected');
        }
      }
    }

    // Determine risk level and action based on score
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    let actionToTake: 'allow' | 'warn' | 'block' | 'ban';

    if (score >= 80) {
      riskLevel = 'critical';
      actionToTake = 'ban';
    } else if (score >= 60) {
      riskLevel = 'high';
      actionToTake = 'block';
    } else if (score >= 35) {
      riskLevel = 'medium';
      actionToTake = 'warn';
    } else {
      riskLevel = 'low';
      actionToTake = 'allow';
    }

    return {
      isAbusive: score >= 60,
      riskLevel,
      reasons,
      action: actionToTake,
      score,
    };
  } catch (error) {
    console.error('Anti-abuse detection error:', error);

    // On error, allow but with low confidence
    return {
      isAbusive: false,
      riskLevel: 'low',
      reasons: ['Detection system error'],
      action: 'allow',
      score: 0,
    };
  }
}

/**
 * Log suspicious activity for review
 */
export async function logSuspiciousActivity(
  userId: string,
  activity: string,
  details: Record<string, any>
) {
  const supabase = await createClient();

  try {
    await supabase.from('abuse_logs').insert({
      user_id: userId,
      activity,
      details,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log suspicious activity:', error);
  }
}

/**
 * Check if user is currently banned or blocked
 */
export async function isUserBanned(userId: string): Promise<boolean> {
  const supabase = await createClient();

  try {
    const { data: user } = await supabase
      .from('users')
      .select('is_banned, ban_reason, ban_expires_at')
      .eq('id', userId)
      .single();

    if (!user) return false;

    // Check if banned and if ban hasn't expired
    if (user.is_banned) {
      if (user.ban_expires_at) {
        const banExpires = new Date(user.ban_expires_at).getTime();
        if (Date.now() < banExpires) {
          return true; // Still banned
        } else {
          // Ban expired, unban user
          await supabase
            .from('users')
            .update({ is_banned: false, ban_expires_at: null })
            .eq('id', userId);
          return false;
        }
      }
      return true; // Permanent ban
    }

    return false;
  } catch (error) {
    console.error('Error checking ban status:', error);
    return false; // Default to not banned on error
  }
}

/**
 * Ban a user temporarily or permanently
 */
export async function banUser(
  userId: string,
  reason: string,
  durationDays?: number
): Promise<void> {
  const supabase = await createClient();

  const banExpiresAt = durationDays
    ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  await supabase
    .from('users')
    .update({
      is_banned: true,
      ban_reason: reason,
      ban_expires_at: banExpiresAt,
    })
    .eq('id', userId);
}
