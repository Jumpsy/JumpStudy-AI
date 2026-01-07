import { createClient } from '@/lib/supabase/server';
import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { checkCredits, deductCredits } from '@/lib/credits';

export const runtime = 'edge';

const AI_TAB_GENERATION_COST = 15; // 15 credits for AI tab generation

export async function POST(req: Request) {
  try {
    const { prompt, instrument, tempo, timeSignature } = await req.json();

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

    // Check credits
    const creditCheck = await checkCredits(user.id, AI_TAB_GENERATION_COST);
    if (!creditCheck.canAfford) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          creditsNeeded: AI_TAB_GENERATION_COST,
          balance: creditCheck.balance,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Generate tab with AI
    const systemPrompt = `You are an expert music teacher and tablature writer. Generate accurate tablature for ${instrument}.

IMPORTANT RULES:
1. Use standard tablature notation
2. Include technique markings:
   - h = hammer-on (e.g., 5h7)
   - p = pull-off (e.g., 7p5)
   - b = bend with amount (e.g., 7b9 full, 7b8 1/2, 7b8.5 3/4, 7b7.5 1/4)
   - / = slide up
   - \\ = slide down
   - ~ = vibrato
   - PM = palm mute
   - x = muted note

3. For guitar/bass: Show all 6 or 4 strings (E A D G B e or E A D G)
4. For drums: Use standard drum notation (HH, SD, BD, etc.)
5. For piano: Show treble and bass clef
6. For violin: Include bowing marks (↓ ↑)

7. Make it ${tempo} BPM in ${timeSignature}

Format properly with bar lines (|) and section markers.`;

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt: `${systemPrompt}

User request: ${prompt}

Generate the tablature:`,
    });

    const tabNotation = result.text;

    // Deduct credits
    const deductResult = await deductCredits(
      user.id,
      AI_TAB_GENERATION_COST,
      'AI tab generation',
      {
        prompt,
        instrument,
        tempo,
        timeSignature,
      }
    );

    if (!deductResult.success) {
      return new Response(JSON.stringify({ error: deductResult.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(
      JSON.stringify({
        tab: tabNotation,
        creditsUsed: AI_TAB_GENERATION_COST,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('AI tab generation error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate tab' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
