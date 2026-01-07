'use client';

import { useState } from 'react';
import {
  Brain,
  Wand2,
  Play,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  BookOpen,
  Clock,
  Target,
} from 'lucide-react';

interface Question {
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'fill-in-blank';
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface Quiz {
  id?: string;
  title: string;
  description: string;
  subject: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: Question[];
  estimatedTime: number;
}

interface QuizCreatorProps {
  userId: string;
  subscriptionTier: string;
}

export default function QuizCreator({ userId, subscriptionTier }: QuizCreatorProps) {
  const [step, setStep] = useState<'input' | 'generating' | 'taking' | 'results'>('input');
  const [inputType, setInputType] = useState<'topic' | 'content'>('topic');
  const [topic, setTopic] = useState('');
  const [content, setContent] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  async function generateQuiz() {
    setIsGenerating(true);
    setStep('generating');

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: inputType === 'topic' ? topic : undefined,
          content: inputType === 'content' ? content : undefined,
          numberOfQuestions,
          difficulty,
          questionTypes: ['multiple-choice', 'true-false', 'short-answer'],
        }),
      });

      const data = await response.json();

      if (data.quiz) {
        setQuiz(data.quiz);
        setStep('taking');
      } else {
        alert(data.error || 'Failed to generate quiz');
        setStep('input');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz');
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  }

  function handleAnswer(answer: string) {
    setAnswers({ ...answers, [currentQuestionIndex]: answer });
  }

  function calculateScore() {
    if (!quiz) return { score: 0, total: 0, percentage: 0 };

    let correct = 0;
    quiz.questions.forEach((question, index) => {
      const userAnswer = answers[index]?.trim().toLowerCase();
      const correctAnswer = question.correctAnswer.trim().toLowerCase();

      if (question.type === 'short-answer' || question.type === 'fill-in-blank') {
        // Fuzzy matching for short answers
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

  function submitQuiz() {
    setStep('results');
    setShowResults(true);
  }

  // Input Step
  if (step === 'input') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-12">
          <div className="text-center mb-12">
            <Brain className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Quiz Generator</h1>
            <p className="text-gray-600">Create custom quizzes instantly with AI</p>
          </div>

          <div className="space-y-6">
            {/* Input Type Toggle */}
            <div className="flex gap-4 bg-gray-100 p-2 rounded-xl">
              <button
                onClick={() => setInputType('topic')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  inputType === 'topic'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                From Topic
              </button>
              <button
                onClick={() => setInputType('content')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  inputType === 'content'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                From Content
              </button>
            </div>

            {inputType === 'topic' ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  What topic should the quiz cover?
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., World War II, Cell Biology, Algebra"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none text-lg"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Paste your notes or content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your study materials, notes, or textbook content here..."
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none resize-none h-40"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Number of questions
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="5"
                  max="30"
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-blue-600 w-12 text-center">
                  {numberOfQuestions}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Difficulty level
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`py-3 rounded-lg font-semibold capitalize transition-all ${
                      difficulty === level
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateQuiz}
              disabled={inputType === 'topic' ? !topic.trim() : !content.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
            >
              <Wand2 className="w-5 h-5" />
              Generate Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Generating Step
  if (step === 'generating') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-8">
            <div className="absolute inset-0 border-8 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-8 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Creating Your Quiz</h2>
          <p className="text-gray-600">Generating questions with AI...</p>
        </div>
      </div>
    );
  }

  // Taking Quiz Step
  if (step === 'taking' && quiz) {
    const currentQuestion = quiz.questions[currentQuestionIndex];
    const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
    const isFirstQuestion = currentQuestionIndex === 0;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{quiz.title}</h2>
              <p className="text-sm text-gray-600">{quiz.description}</p>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm">{quiz.estimatedTime} min</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Target className="w-4 h-4" />
                <span className="text-sm capitalize">{quiz.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span className="text-sm text-gray-600">
                {Object.keys(answers).length} answered
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">{currentQuestionIndex + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
                <h3 className="text-2xl font-bold text-gray-900">
                  {currentQuestion.question}
                </h3>
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
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[currentQuestionIndex] === option
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <span className="font-semibold">{String.fromCharCode(65 + idx)}.</span>{' '}
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
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        answers[currentQuestionIndex] === option
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:outline-none text-lg"
                />
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={isFirstQuestion}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {!isLastQuestion ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={submitQuiz}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition-colors font-semibold"
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
  if (step === 'results' && quiz) {
    const { score, total, percentage } = calculateScore();

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Score Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-12 mb-8 text-center">
            <div
              className={`w-32 h-32 mx-auto mb-6 rounded-full flex items-center justify-center text-4xl font-bold ${
                percentage >= 80
                  ? 'bg-green-100 text-green-600'
                  : percentage >= 60
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {percentage}%
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-xl text-gray-600 mb-6">
              You scored {score} out of {total}
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => {
                  setStep('input');
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                  setQuiz(null);
                }}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                New Quiz
              </button>
              <button
                onClick={() => {
                  setStep('taking');
                  setAnswers({});
                  setCurrentQuestionIndex(0);
                }}
                className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
              >
                Retry Quiz
              </button>
            </div>
          </div>

          {/* Review Answers */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Review Your Answers</h3>
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-green-100' : 'bg-red-100'
                      }`}
                    >
                      {isCorrect ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {question.question}
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-600">
                            Your answer:{' '}
                          </span>
                          <span className={isCorrect ? 'text-green-600' : 'text-red-600'}>
                            {answers[index] || '(Not answered)'}
                          </span>
                        </div>
                        {!isCorrect && (
                          <div>
                            <span className="text-sm font-semibold text-gray-600">
                              Correct answer:{' '}
                            </span>
                            <span className="text-green-600">{question.correctAnswer}</span>
                          </div>
                        )}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
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
