import EnhancedChatInterface from '@/components/enhanced-chat-interface';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user credits
  const { data: userData } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', user.id)
    .single();

  return (
    <EnhancedChatInterface
      userId={user.id}
      initialCredits={userData?.credits_balance || 0}
    />
  );
}
