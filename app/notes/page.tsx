import NotesSystem from '@/components/notes-system';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function NotesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <NotesSystem userId={user.id} />;
}
