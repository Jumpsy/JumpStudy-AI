import QuizCreator from '@/components/quiz-creator';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function QuizPage() {
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

  const tier = userData?.subscription_tier || 'free';

  return <QuizCreator userId={user.id} subscriptionTier={tier} />;
}
