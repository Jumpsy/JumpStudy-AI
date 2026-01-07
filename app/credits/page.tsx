import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import CreditsPurchase from '@/components/credits-purchase';
import { getRecentTransactions } from '@/lib/credits';

export default async function CreditsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's credit balance
  const { data: userData } = await supabase
    .from('users')
    .select('credits_balance, total_credits_purchased, total_credits_used')
    .eq('id', user.id)
    .single();

  const transactions = await getRecentTransactions(user.id, 50);

  return (
    <CreditsPurchase
      userId={user.id}
      currentBalance={userData?.credits_balance || 0}
      totalPurchased={userData?.total_credits_purchased || 0}
      totalUsed={userData?.total_credits_used || 0}
      transactions={transactions}
    />
  );
}
