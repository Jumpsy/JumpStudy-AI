import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductImageCredits } from '@/lib/credits';
import { FEATURE_COSTS } from '@/lib/credits-system';
import OpenAI from 'openai';

export const runtime = 'edge';

const getOpenAI = () => {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });
};

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

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

    // Check credits for image generation
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

    // Anti-abuse: Check for inappropriate content keywords
    const blockedKeywords = [
      'nude', 'naked', 'nsfw', 'porn', 'sex', 'violence', 'gore', 'blood',
      'weapon', 'gun', 'bomb', 'terrorist', 'hate', 'racist', 'offensive'
    ];

    const lowerPrompt = prompt.toLowerCase();
    const hasBlockedContent = blockedKeywords.some(keyword =>
      lowerPrompt.includes(keyword)
    );

    if (hasBlockedContent) {
      return new Response(
        JSON.stringify({
          error: 'Inappropriate content detected. Please modify your prompt.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate image with DALL-E 3
    const openai = getOpenAI();
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: prompt,
      n: 1,
      size: '1024x1024',
      quality: 'standard', // Use 'hd' for premium tiers if needed
    });

    const imageUrl = response.data?.[0]?.url;

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate image' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Deduct credits
    const deductResult = await deductImageCredits(user.id, prompt);

    if (!deductResult.success) {
      return new Response(
        JSON.stringify({ error: deductResult.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Save to conversation or image history if needed
    // This can be expanded to save to a dedicated images table

    return new Response(
      JSON.stringify({
        imageUrl,
        prompt,
        creditsUsed: deductResult.creditsUsed,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Image generation error:', error);

    // Handle OpenAI-specific errors
    if (error?.error?.message) {
      return new Response(
        JSON.stringify({ error: error.error.message }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Failed to generate image' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
