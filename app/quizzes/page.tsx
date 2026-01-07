import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Brain, Plus, Clock, Target, Calendar, TrendingUp } from 'lucide-react';

export default async function QuizzesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get all user's quizzes
  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  // Get quiz attempts for stats
  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id)
    .eq('completed', true);

  // Calculate stats
  const totalQuizzes = quizzes?.length || 0;
  const totalAttempts = attempts?.length || 0;
  const averageScore = attempts?.length
    ? Math.round(
        attempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) /
          attempts.length
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Your Quizzes</h1>
                <p className="text-gray-600">Study smarter with AI-generated quizzes</p>
              </div>
            </div>
            <Link
              href="/quiz"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create New Quiz
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-semibold text-blue-900">Total Quizzes</span>
              </div>
              <div className="text-4xl font-bold text-blue-700">{totalQuizzes}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-sm font-semibold text-purple-900">Attempts</span>
              </div>
              <div className="text-4xl font-bold text-purple-700">{totalAttempts}</div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-sm font-semibold text-green-900">Avg Score</span>
              </div>
              <div className="text-4xl font-bold text-green-700">{averageScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quizzes Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {!quizzes || quizzes.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Quizzes Yet</h2>
            <p className="text-gray-600 mb-8">
              Create your first AI-generated quiz to start studying
            </p>
            <Link
              href="/quiz"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg text-lg"
            >
              <Plus className="w-6 h-6" />
              Create Your First Quiz
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const quizAttempts = attempts?.filter((a) => a.quiz_id === quiz.id) || [];
              const bestScore = quizAttempts.length
                ? Math.max(...quizAttempts.map((a) => (a.score / a.total_questions) * 100))
                : null;
              const attemptCount = quizAttempts.length;

              return (
                <Link
                  key={quiz.id}
                  href={`/quizzes/${quiz.id}`}
                  className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all border-2 border-gray-100 hover:border-purple-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          quiz.difficulty === 'easy'
                            ? 'bg-green-100'
                            : quiz.difficulty === 'medium'
                            ? 'bg-yellow-100'
                            : 'bg-red-100'
                        }`}
                      >
                        <Brain
                          className={`w-6 h-6 ${
                            quiz.difficulty === 'easy'
                              ? 'text-green-600'
                              : quiz.difficulty === 'medium'
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        />
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`text-xs px-3 py-1 rounded-full font-semibold capitalize ${
                            quiz.difficulty === 'easy'
                              ? 'bg-green-100 text-green-700'
                              : quiz.difficulty === 'medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {quiz.difficulty}
                        </span>
                        {bestScore !== null && (
                          <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-700">
                            Best: {Math.round(bestScore)}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {quiz.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {quiz.description}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        <span>{quiz.questions?.length || 0} questions</span>
                      </div>
                      {quiz.settings?.estimatedTime && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{quiz.settings.estimatedTime} min</span>
                        </div>
                      )}
                    </div>

                    {attemptCount > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {attemptCount} {attemptCount === 1 ? 'attempt' : 'attempts'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 px-6 py-3 border-t border-purple-100">
                    <span className="text-sm font-semibold text-purple-700 group-hover:text-purple-900 transition-colors">
                      {attemptCount > 0 ? 'Practice Again →' : 'Start Quiz →'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
