import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { notFound } from 'next/navigation';
import QuizTaker from '@/components/quiz-taker';

export default async function QuizViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get the quiz
  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!quiz) {
    notFound();
  }

  // Get previous attempts
  const { data: previousAttempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('quiz_id', id)
    .eq('user_id', user.id)
    .eq('completed', true)
    .order('created_at', { ascending: false });

  // Get user credits
  const { data: userData } = await supabase
    .from('users')
    .select('credits_balance')
    .eq('id', user.id)
    .single();

  return (
    <QuizTaker
      quiz={quiz}
      userId={user.id}
      previousAttempts={previousAttempts || []}
      creditsBalance={userData?.credits_balance || 0}
    />
  );
}
