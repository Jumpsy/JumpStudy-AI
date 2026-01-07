import ImageGenerator from '@/components/image-generator';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { checkUsageLimit } from '@/lib/usage';
import { SUBSCRIPTION_LIMITS } from '@/types/database';

export default async function ImageGeneratorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's subscription tier
  const { data: userData } = await supabase
    .from('users')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  const tier = (userData?.subscription_tier || 'free') as keyof typeof SUBSCRIPTION_LIMITS;
  const limits = SUBSCRIPTION_LIMITS[tier];

  // Check current usage
  const imageLimit = await checkUsageLimit(user.id, 'images');

  return (
    <ImageGenerator
      userId={user.id}
      subscriptionTier={tier}
      imagesRemaining={imageLimit.remaining}
      totalImages={limits.images}
    />
  );
}
