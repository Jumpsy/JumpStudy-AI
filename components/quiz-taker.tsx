'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Brain,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  TrendingUp,
  RotateCcw,
  ArrowLeft,
  Trophy,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Question {
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-in-blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  settings: {
    estimatedTime: number;
    allowReview: boolean;
    shuffleQuestions: boolean;
  };
}

interface PreviousAttempt {
  id: string;
  score: number;
  total_questions: number;
  time_taken: number;
  created_at: string;
}

interface QuizTakerProps {
  quiz: Quiz;
  userId: string;
  previousAttempts: PreviousAttempt[];
  creditsBalance: number;
}

export default function QuizTaker({
  quiz,
  userId,
  previousAttempts,
  creditsBalance,
}: QuizTakerProps) {
  const [step, setStep] = useState<'overview' | 'taking' | 'results'>('overview');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const supabase = createClient();

  // Timer
  useEffect(() => {
    if (step === 'taking' && startTime) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [step, startTime]);

  function startQuiz() {
    setStep('taking');
    setStartTime(Date.now());
    setAnswers({});
    setCurrentQuestionIndex(0);
    setElapsedTime(0);
  }

  function handleAnswer(answer: string) {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  }

  function calculateScore() {
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index]?.trim().toLowerCase();
      const correctAnswer = question.correctAnswer.trim().toLowerCase();

      if (question.type === 'short-answer' || question.type === 'fill-in-blank') {
        if (userAnswer === correctAnswer || userAnswer?.includes(correctAnswer)) {
          correct++;
        }
      } else {
        if (userAnswer === correctAnswer) {
          correct++;
        }
      }
    });

    return {
      score: correct,
      total: quiz.questions.length,
      percentage: Math.round((correct / quiz.questions.length) * 100),
    };
  }

  async function submitQuiz() {
    const { score, total, percentage } = calculateScore();

    // Save attempt to database
    await supabase.from('quiz_attempts').insert({
      user_id: userId,
      quiz_id: quiz.id,
      answers: answers,
      score: score,
      total_questions: total,
      time_taken: elapsedTime,
      completed: true,
    });

    setStep('results');
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  // Overview Step
  if (step === 'overview') {
    const bestAttempt = previousAttempts[0];
    const averageScore = previousAttempts.length
      ? Math.round(
          previousAttempts.reduce((sum, a) => sum + (a.score / a.total_questions) * 100, 0) /
            previousAttempts.length
        )
      : null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
        <div className="max-w-5xl mx-auto px-6 py-12">
          {/* Back Button */}
          <Link
            href="/quizzes"
            className="inline-flex items-center gap-2 text-purple-700 hover:text-purple-900 mb-8 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Quizzes
          </Link>

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 px-8 py-10 text-white">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <Brain className="w-10 h-10" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span
                      className={`text-xs px-4 py-1.5 rounded-full font-semibold capitalize ${
                        quiz.difficulty === 'easy'
                          ? 'bg-green-500/30 text-green-100'
                          : quiz.difficulty === 'medium'
                          ? 'bg-yellow-500/30 text-yellow-100'
                          : 'bg-red-500/30 text-red-100'
                      }`}
                    >
                      {quiz.difficulty}
                    </span>
                    <span className="text-xs px-4 py-1.5 rounded-full font-semibold bg-white/20 backdrop-blur-sm">
                      {quiz.subject}
                    </span>
                  </div>
                  <h1 className="text-4xl font-bold mb-3">{quiz.title}</h1>
                  <p className="text-white/90 text-lg">{quiz.description}</p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-6 px-8 py-8 bg-gray-50 border-b border-gray-200">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Brain className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{quiz.questions.length}</div>
                <div className="text-sm text-gray-600">Questions</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {quiz.settings.estimatedTime}
                </div>
                <div className="text-sm text-gray-600">Minutes</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <RotateCcw className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">{previousAttempts.length}</div>
                <div className="text-sm text-gray-600">Attempts</div>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900">
                  {averageScore !== null ? `${averageScore}%` : '-'}
                </div>
                <div className="text-sm text-gray-600">Avg Score</div>
              </div>
            </div>

            {/* Previous Attempts */}
            {previousAttempts.length > 0 && (
              <div className="px-8 py-8 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  Previous Attempts
                </h3>
                <div className="space-y-3">
                  {previousAttempts.slice(0, 5).map((attempt, index) => {
                    const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                    return (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg ${
                              percentage >= 80
                                ? 'bg-green-100 text-green-700'
                                : percentage >= 60
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {percentage}%
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">
                              {attempt.score} / {attempt.total_questions} correct
                            </div>
                            <div className="text-sm text-gray-600">
                              {new Date(attempt.created_at).toLocaleDateString()} •{' '}
                              {formatTime(attempt.time_taken)}
                            </div>
                          </div>
                        </div>
                        {index === 0 && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">
                            Best
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Start Button */}
            <div className="px-8 py-8">
              <button
                onClick={startQuiz}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6 rounded-xl font-bold text-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                {previousAttempts.length > 0 ? 'Retake Quiz' : 'Start Quiz'}
              </button>
              <p className="text-center text-sm text-gray-500 mt-4">
                {previousAttempts.length > 0
                  ? 'Challenge yourself and beat your best score!'
                  : 'Take your time and read each question carefully'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Taking Quiz Step
  if (step === 'taking') {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span className="text-lg font-mono font-bold">{formatTime(elapsedTime)}</span>
              </div>
              <div className="text-sm text-gray-600">
                {Object.keys(answers).length} / {quiz.questions.length} answered
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Progress */}
          <div className="mb-8">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">{currentQuestionIndex + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      currentQuestion.difficulty === 'easy'
                        ? 'bg-green-100 text-green-700'
                        : currentQuestion.difficulty === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold capitalize">
                    {currentQuestion.type.replace('-', ' ')}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{currentQuestion.question}</h3>
              </div>
            </div>

            {/* Answer Options */}
            <div className="space-y-3">
              {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
                <>
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all font-medium ${
                        answers[currentQuestionIndex] === option
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-bold text-purple-600">
                        {String.fromCharCode(65 + idx)}.
                      </span>{' '}
                      {option}
                    </button>
                  ))}
                </>
              )}

              {currentQuestion.type === 'true-false' && (
                <>
                  {['True', 'False'].map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(option)}
                      className={`w-full text-left p-5 rounded-xl border-2 transition-all font-medium ${
                        answers[currentQuestionIndex] === option
                          ? 'border-purple-600 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </>
              )}

              {(currentQuestion.type === 'short-answer' ||
                currentQuestion.type === 'fill-in-blank') && (
                <input
                  type="text"
                  value={answers[currentQuestionIndex] || ''}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-600 focus:outline-none text-lg"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={isFirstQuestion}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700 transition-all font-semibold"
              >
                Next
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-bold"
              >
                Submit Quiz
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Results Step
  if (step === 'results') {
    const { score, total, percentage } = calculateScore();

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-8">
        <div className="max-w-5xl mx-auto">
          {/* Score Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 text-center">
            <div
              className={`w-40 h-40 mx-auto mb-6 rounded-full flex items-center justify-center text-5xl font-bold border-8 ${
                percentage >= 80
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : percentage >= 60
                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                  : 'bg-red-50 text-red-600 border-red-200'
              }`}
            >
              {percentage}%
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-3">
              {percentage >= 80
                ? 'Excellent! 🎉'
                : percentage >= 60
                ? 'Good Job! 👍'
                : 'Keep Practicing! 💪'}
            </h2>
            <p className="text-2xl text-gray-600 mb-4">
              You scored {score} out of {total}
            </p>
            <p className="text-gray-500 mb-8">
              Time taken: {formatTime(elapsedTime)}
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/quizzes"
                className="px-8 py-4 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 inline mr-2" />
                Back to Quizzes
              </Link>
              <button
                onClick={() => {
                  setStep('overview');
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all"
              >
                <RotateCcw className="w-5 h-5 inline mr-2" />
                Try Again
              </button>
            </div>
          </div>

          {/* Review Answers */}
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Review Your Answers</h3>
            {quiz.questions.map((question, index) => {
              const userAnswer = answers[index]?.trim().toLowerCase();
              const correctAnswer = question.correctAnswer.trim().toLowerCase();
              const isCorrect =
                question.type === 'short-answer' || question.type === 'fill-in-blank'
                  ? userAnswer === correctAnswer || userAnswer?.includes(correctAnswer)
                  : userAnswer === correctAnswer;

              return (
                <div key={index} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="w-7 h-7 text-green-600" />
                      ) : (
                        <XCircle className="w-7 h-7 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-semibold text-gray-900 mb-3">
                        {question.question}
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-600">
                            Your answer:{' '}
                          </span>
                          <span
                            className={`font-medium ${
                              isCorrect ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {answers[index] || '(Not answered)'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-sm font-semibold text-gray-600">
                              Correct answer:{' '}
                            </span>
                            <span className="text-green-600 font-medium">
                              {question.correctAnswer}
                            </span>
                          </div>
                        )}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-3">
                          <span className="text-sm font-semibold text-blue-900">
                            Explanation:{' '}
                          </span>
                          <span className="text-sm text-blue-700">{question.explanation}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
