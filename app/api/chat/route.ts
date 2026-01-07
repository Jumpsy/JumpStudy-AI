import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { selectOptimalModel } from '@/lib/model-router';
import { z } from 'zod';
import { checkCredits, deductChatCredits } from '@/lib/credits';
import { estimateMessageCost } from '@/lib/credits-system';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages, conversationId, generateImage, imagePrompt } = await req.json();

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle image generation request
    if (generateImage && imagePrompt) {
      const { deductImageCredits } = await import('@/lib/credits');
      const FEATURE_COSTS = (await import('@/lib/credits-system')).FEATURE_COSTS;

      const creditsNeeded = FEATURE_COSTS.IMAGE_GENERATION;
      const creditCheck = await checkCredits(user.id, creditsNeeded);

      if (!creditCheck.canAfford) {
        return new Response(
          JSON.stringify({
            error: 'Insufficient credits for image generation',
            creditsNeeded,
            balance: creditCheck.balance,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Generate image with DALL-E 3
      const imageResponse = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: imagePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      const imageData = await imageResponse.json();

      if (imageData.data && imageData.data[0]) {
        // Deduct credits
        const { deductImageCredits } = await import('@/lib/credits');
        const deductResult = await deductImageCredits(user.id, imagePrompt);

        if (!deductResult.success) {
          return new Response(JSON.stringify({ error: deductResult.error }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Save to conversation if conversationId provided
        if (conversationId) {
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: `Generated image: ${imagePrompt}`,
            image_url: imageData.data[0].url,
          });
        }

        return new Response(
          JSON.stringify({
            imageUrl: imageData.data[0].url,
            creditsUsed: deductResult.creditsUsed,
            newBalance: deductResult.newBalance,
          }),
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(JSON.stringify({ error: 'Image generation failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get user's credit balance and account info for customer service context
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, created_at, stripe_subscription_id, credits_balance')
      .eq('id', user.id)
      .single();

    const creditsBalance = userData?.credits_balance || 0;

    // Estimate credits needed for this message (conservative estimate)
    const userMessage = messages[messages.length - 1].content;
    const estimate = estimateMessageCost(userMessage);

    if (creditsBalance < estimate.estimatedCredits) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          creditsNeeded: estimate.estimatedCredits,
          balance: creditsBalance,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Smart model routing - use cheap model when possible (94% cost savings!)
    const optimalModel = selectOptimalModel(userMessage, messages);

    // Get user's memory
    const { data: memories } = await supabase
      .from('user_memory')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    const memoryContext = memories && memories.length > 0
      ? `\n\nUser's Memory (Things to remember about this user):\n${memories.map((m) => `- ${m.content}`).join('\n')}`
      : '';

    // Customer service system message with memory
    const systemMessage = {
      role: 'system' as const,
      content: `You are JumpStudy AI, an advanced AI tutor and study assistant. You help students with:
- Homework and assignments
- Concept explanations
- Study strategies
- Quiz and test preparation
- Note-taking and organization
- Time management

You have TUTOR MODE which provides step-by-step explanations when requested.

MEMORY SYSTEM:
- When the user asks you to remember something, use the save_memory tool
- After saving, respond with "✓ Updated memory" followed by acknowledging what you saved
- Check existing memories before saving to avoid duplicates
- Use memories to personalize your responses

Current User Info:
- Credits Balance: ${creditsBalance.toFixed(1)} credits
- Account created: ${userData?.created_at ? new Date(userData.created_at).toLocaleDateString() : 'Unknown'}
${memoryContext}

Credits System:
- 1 credit = 100 words of AI usage
- Images cost 150 credits
- Quizzes cost 30 credits
- Notes cost 25 credits
- Slideshows cost 50 credits

Available Tools:
- check_account_status: View detailed account and credit information
- process_refund: Process a refund request (analyzes and can approve/partial/reject)
- suggest_credits: Suggest appropriate credit package to purchase
- save_memory: Save important information about the user for future conversations
- enable_tutor_mode: Switch to step-by-step tutoring mode for detailed explanations
- generate_quiz: Create a quiz on any topic (30 credits)
- search_music_tabs: Search for real music tabs from Ultimate Guitar, Songsterr, etc.
- create_custom_tab: Generate custom tablature with AI (15 credits)
- open_tuner: Direct user to the instrument tuner tool

When users ask about quizzes, music, tabs, or tuning, use these tools to help them directly from chat!

Be helpful, friendly, encouraging, and professional. Use memories to provide personalized assistance.`,
    };

    // Stream chat response with customer service tools
    const result = streamText({
      model: openai(optimalModel),
      messages: [systemMessage, ...messages],
      tools: {
        check_account_status: {
          description: 'Check the user\'s account status, credits balance, and transaction history',
          parameters: z.object({}),
          execute: async () => {
            const { data: userInfo } = await supabase
              .from('users')
              .select('credits_balance, total_credits_purchased, total_credits_used')
              .eq('id', user.id)
              .single();

            const { getRecentTransactions } = await import('@/lib/credits');
            const transactions = await getRecentTransactions(user.id, 10);

            return {
              credits: {
                balance: userInfo?.credits_balance || 0,
                totalPurchased: userInfo?.total_credits_purchased || 0,
                totalUsed: userInfo?.total_credits_used || 0,
              },
              recentTransactions: transactions,
              accountAge: userData?.created_at
                ? Math.floor(
                    (Date.now() - new Date(userData.created_at).getTime()) /
                      (1000 * 60 * 60 * 24)
                  )
                : 0,
            };
          },
        },
        process_refund: {
          description: 'Process a refund request from the user. Use when user asks for refund.',
          parameters: z.object({
            reason: z.string().describe('The reason for the refund request'),
          }),
          execute: async ({ reason }) => {
            if (!userData?.stripe_subscription_id) {
              return {
                success: false,
                message: 'No active subscription found. Only active subscribers can request refunds.',
              };
            }

            try {
              const refundResponse = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/refunds/request`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    reason,
                    subscriptionId: userData.stripe_subscription_id,
                  }),
                }
              );

              const refundData = await refundResponse.json();

              if (refundData.success) {
                return {
                  success: true,
                  decision: refundData.decision,
                  refundAmount: refundData.refundAmount,
                  percentage: refundData.percentage,
                  message: refundData.message,
                };
              }

              return {
                success: false,
                message: refundData.error || 'Failed to process refund',
              };
            } catch (error) {
              return {
                success: false,
                message: 'Unable to process refund request. Please contact support.',
              };
            }
          },
        },
        suggest_credits: {
          description: 'Suggest appropriate credit package to purchase based on user needs',
          parameters: z.object({
            needs: z.string().describe('What the user needs (e.g., more chat, images, quizzes)'),
          }),
          execute: async ({ needs }) => {
            const CREDIT_PRICING = (await import('@/lib/credits-system')).CREDIT_PRICING;

            const currentBalance = creditsBalance;
            let suggestion = '';

            if (currentBalance < 100) {
              suggestion = 'Starter package (1,000 credits for $2.99) - Great for trying out features';
            } else if (currentBalance < 500) {
              suggestion = 'Popular package (5,000 credits for $12.99) - Best value with 13% savings!';
            } else {
              suggestion = 'Pro package (20,000 credits for $44.99) - Save 25% for heavy usage';
            }

            return {
              currentBalance,
              packages: CREDIT_PRICING.PACKAGES,
              suggestion,
              purchaseUrl: '/credits',
            };
          },
        },
        save_memory: {
          description: 'Save important information about the user to remember for future conversations. Use when user asks you to remember something.',
          parameters: z.object({
            content: z.string().describe('The information to remember (e.g., "User is studying for AP Biology exam next week")'),
          }),
          execute: async ({ content }) => {
            // Check if similar memory already exists
            const { data: existingMemories } = await supabase
              .from('user_memory')
              .select('content')
              .eq('user_id', user.id)
              .ilike('content', `%${content.substring(0, 20)}%`);

            if (existingMemories && existingMemories.length > 0) {
              return {
                success: false,
                message: 'Similar memory already exists',
              };
            }

            // Save new memory
            const { error } = await supabase.from('user_memory').insert({
              user_id: user.id,
              content: content,
            });

            if (error) {
              return {
                success: false,
                message: 'Failed to save memory',
              };
            }

            return {
              success: true,
              message: 'Memory saved successfully',
              content: content,
            };
          },
        },
        enable_tutor_mode: {
          description: 'Enable tutor mode for step-by-step teaching and detailed explanations',
          parameters: z.object({
            topic: z.string().describe('The topic to teach (e.g., "quadratic equations")'),
          }),
          execute: async ({ topic }) => {
            return {
              mode: 'tutor',
              topic: topic,
              instructions: `Tutor Mode Activated for: ${topic}

I'll now teach you step-by-step:
1. Start with fundamentals
2. Build up complexity gradually
3. Use examples and analogies
4. Check understanding at each step
5. Provide practice problems

Let's begin!`,
            };
          },
        },
        generate_quiz: {
          description: 'Generate a quiz on any topic. Use when user asks to create a quiz.',
          parameters: z.object({
            topic: z.string().describe('The topic for the quiz'),
            numberOfQuestions: z.number().describe('Number of questions (5-30)'),
            difficulty: z.enum(['easy', 'medium', 'hard']).describe('Difficulty level'),
          }),
          execute: async ({ topic, numberOfQuestions, difficulty }) => {
            const { deductQuizCredits } = await import('@/lib/credits');
            const FEATURE_COSTS = (await import('@/lib/credits-system')).FEATURE_COSTS;

            const creditsNeeded = FEATURE_COSTS.QUIZ_GENERATION;
            const creditCheck = await checkCredits(user.id, creditsNeeded);

            if (!creditCheck.canAfford) {
              return {
                success: false,
                error: 'Insufficient credits',
                creditsNeeded,
                balance: creditCheck.balance,
              };
            }

            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/quiz/generate`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    topic,
                    numberOfQuestions,
                    difficulty,
                    questionTypes: ['multiple-choice', 'true-false', 'short-answer'],
                  }),
                }
              );

              const data = await response.json();

              if (data.quiz) {
                return {
                  success: true,
                  quiz: data.quiz,
                  quizUrl: `/quizzes/${data.quiz.id}`,
                  message: `Quiz created successfully! You can access it at /quizzes/${data.quiz.id}`,
                };
              }

              return { success: false, error: 'Failed to generate quiz' };
            } catch (error) {
              return { success: false, error: 'Failed to generate quiz' };
            }
          },
        },
        search_music_tabs: {
          description: 'Search for music tabs/tablature for any song and instrument',
          parameters: z.object({
            song: z.string().describe('Song name'),
            artist: z.string().optional().describe('Artist name (optional)'),
            instrument: z
              .enum(['guitar', 'bass', 'drums', 'piano', 'ukulele', 'violin'])
              .describe('Instrument'),
          }),
          execute: async ({ song, artist, instrument }) => {
            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/music/search`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    song,
                    artist: artist || '',
                    instrument,
                  }),
                }
              );

              const data = await response.json();

              return {
                success: true,
                sources: data.sources,
                message: `Found tabs from ${data.sources?.length || 0} sources. Visit /music to view and play them with our interactive tab player and metronome!`,
                musicPageUrl: '/music',
              };
            } catch (error) {
              return { success: false, error: 'Failed to search for tabs' };
            }
          },
        },
        create_custom_tab: {
          description: 'Create custom music tablature with AI assistance',
          parameters: z.object({
            prompt: z.string().describe('What to create (e.g., "Simple C major chord progression")'),
            instrument: z
              .enum(['guitar', 'bass', 'drums', 'piano', 'ukulele', 'violin'])
              .describe('Instrument'),
          }),
          execute: async ({ prompt, instrument }) => {
            const AI_TAB_COST = 15;
            const creditCheck = await checkCredits(user.id, AI_TAB_COST);

            if (!creditCheck.canAfford) {
              return {
                success: false,
                error: 'Insufficient credits',
                creditsNeeded: AI_TAB_COST,
                balance: creditCheck.balance,
              };
            }

            try {
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/music/generate-tab`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    prompt,
                    instrument,
                    tempo: 120,
                    timeSignature: '4/4',
                  }),
                }
              );

              const data = await response.json();

              if (data.tab) {
                return {
                  success: true,
                  tab: data.tab,
                  message: `Custom tab created! Here's your ${instrument} tablature:\n\n${data.tab}\n\nVisit /music to save and play it with the interactive player!`,
                };
              }

              return { success: false, error: 'Failed to generate tab' };
            } catch (error) {
              return { success: false, error: 'Failed to generate tab' };
            }
          },
        },
        open_tuner: {
          description: 'Open the instrument tuner tool for tuning guitar, bass, ukulele, or violin',
          parameters: z.object({
            instrument: z
              .enum(['guitar', 'bass', 'ukulele', 'violin'])
              .optional()
              .describe('Instrument to tune (optional)'),
          }),
          execute: async ({ instrument }) => {
            return {
              success: true,
              message: `Opening the instrument tuner! Visit /tuner to tune your ${instrument || 'instrument'}.

The tuner features:
- Real-time pitch detection
- Visual tuning indicator
- Reference note playback
- Support for multiple tunings
- Chromatic tuner for any note

It uses your microphone to detect the pitch and shows you if you're in tune!`,
              tunerUrl: '/tuner',
            };
          },
        },
      },
      async onFinish({ text }) {
        // Deduct actual credits based on word count
        const deductResult = await deductChatCredits(user.id, userMessage, text);

        if (!deductResult.success) {
          console.error('Failed to deduct credits:', deductResult.error);
        }

        // Save conversation if conversationId provided
        if (conversationId) {
          // Save user message
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'user',
            content: messages[messages.length - 1].content,
          });

          // Save assistant response with credits info
          await supabase.from('messages').insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: text,
          });

          // Update conversation timestamp
          await supabase
            .from('conversations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', conversationId);
        }
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
