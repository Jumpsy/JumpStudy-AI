import { createClient } from '@/lib/supabase/server';
import { SUBSCRIPTION_LIMITS } from '@/types/database';

export async function checkUsageLimit(
  userId: string,
  type: 'messages' | 'images'
): Promise<{ allowed: boolean; remaining: number }> {
  const supabase = await createClient();

  // Get user's subscription tier
  const { data: user } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (!user) {
    return { allowed: false, remaining: 0 };
  }

  const tier = user.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS;
  const limits = SUBSCRIPTION_LIMITS[tier];

  // Check if unlimited
  if (limits[type] === Infinity) {
    return { allowed: true, remaining: Infinity };
  }

  // Get current month's usage
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  const { data: usage } = await supabase
    .from('usage')
    .select('messages_used, images_used')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single();

  const used = usage ? usage[`${type}_used`] : 0;
  const remaining = limits[type] - used;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
  };
}

export async function incrementUsage(
  userId: string,
  type: 'messages' | 'images'
): Promise<void> {
  const supabase = await createClient();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Try to increment existing usage
  const { data: existing } = await supabase
    .from('usage')
    .select('id, messages_used, images_used')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .single();

  if (existing) {
    await supabase
      .from('usage')
      .update({
        [`${type}_used`]: existing[`${type}_used`] + 1,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('usage').insert({
      user_id: userId,
      month: currentMonth,
      messages_used: type === 'messages' ? 1 : 0,
      images_used: type === 'images' ? 1 : 0,
    });
  }
}
