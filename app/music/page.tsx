import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MusicTabsInterface from '@/components/music-tabs-interface';

export default async function MusicPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's saved tabs
  const { data: savedTabs } = await supabase
    .from('music_tabs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get user credits
  const { data: userData } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', user.id)
    .single();

  return (
    <MusicTabsInterface
      userId={user.id}
      savedTabs={savedTabs || []}
      creditsBalance={userData?.credits_balance || 0}
    />
  );
}
