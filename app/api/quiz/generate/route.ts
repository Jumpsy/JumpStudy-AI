import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductQuizCredits } from '@/lib/credits';
import { FEATURE_COSTS } from '@/lib/credits-system';

export const runtime = 'edge';

const QuestionSchema = z.object({
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'fill-in-blank']),
  question: z.string(),
  options: z.array(z.string()).optional(), // For multiple choice
  correctAnswer: z.string(),
  explanation: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

const QuizSchema = z.object({
  title: z.string(),
  description: z.string(),
  subject: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  questions: z.array(QuestionSchema),
  estimatedTime: z.number(), // Minutes
});

export async function POST(req: Request) {
  try {
    const { topic, numberOfQuestions, difficulty, questionTypes, content } = await req.json();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check credits for quiz generation
    const creditsNeeded = FEATURE_COSTS.QUIZ_GENERATION;
    const creditCheck = await checkCredits(user.id, creditsNeeded);

    if (!creditCheck.canAfford) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for quiz generation',
          creditsNeeded,
          balance: creditCheck.balance,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt based on input type
    let prompt = '';

    if (content) {
      // Generate quiz from provided content (notes, textbook, etc.)
      prompt = `Create a ${numberOfQuestions}-question quiz based on the following content:

${content}

Requirements:
- Difficulty level: ${difficulty}
- Question types to include: ${questionTypes?.join(', ') || 'multiple-choice, true-false, short-answer'}
- Make questions test understanding, not just memorization
- Provide clear explanations for each answer
- Ensure questions cover different parts of the content`;
    } else {
      // Generate quiz from topic
      prompt = `Create a ${numberOfQuestions}-question quiz about: ${topic}

Requirements:
- Difficulty level: ${difficulty}
- Question types to include: ${questionTypes?.join(', ') || 'multiple-choice, true-false, short-answer'}
- Cover key concepts and important details
- Make it educational and comprehensive
- Provide clear explanations for each answer`;
    }

    // Generate quiz with GPT-4o
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: QuizSchema,
      prompt,
    });

    const quiz = result.object as z.infer<typeof QuizSchema>;

    // Deduct credits
    const deductResult = await deductQuizCredits(user.id, topic || 'content-based', numberOfQuestions);

    if (!deductResult.success) {
      return new Response(
        JSON.stringify({ error: deductResult.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Save quiz to database
    const { data: savedQuiz } = await supabase
      .from('quizzes')
      .insert({
        user_id: user.id,
        title: quiz.title,
        description: quiz.description,
        subject: quiz.subject,
        difficulty: quiz.difficulty,
        questions: quiz.questions,
        settings: {
          estimatedTime: quiz.estimatedTime,
          allowReview: true,
          shuffleQuestions: false,
        },
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        quiz: {
          ...quiz,
          id: savedQuiz?.id,
        },
        creditsUsed: deductResult.creditsUsed,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Quiz generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate quiz' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
