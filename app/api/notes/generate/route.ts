import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductNoteCredits } from '@/lib/credits';
import { FEATURE_COSTS } from '@/lib/credits-system';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid topic' }), {
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

    // Check credits for note generation
    const creditsNeeded = FEATURE_COSTS.NOTE_GENERATION;
    const creditCheck = await checkCredits(user.id, creditsNeeded);

    if (!creditCheck.canAfford) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for note generation',
          creditsNeeded,
          balance: creditCheck.balance,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate comprehensive notes with GPT-4o
    const result = await generateText({
      model: openai('gpt-4o'),
      prompt: `Create comprehensive, well-organized study notes about: ${topic}

Requirements:
- Be thorough and educational
- Organize with clear sections and headings
- Include key concepts, definitions, and important details
- Add examples where helpful
- Make it easy to study from
- Use clear, student-friendly language
- Format with proper line breaks and structure

Create notes that would help a student learn and understand this topic completely.`,
    });

    const noteContent = result.text;

    // Deduct credits
    const deductResult = await deductNoteCredits(user.id, topic);

    if (!deductResult.success) {
      return new Response(
        JSON.stringify({ error: deductResult.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Save note to database
    const { data: note } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: `${topic} - Study Notes`,
        content: noteContent,
        subject: topic,
        tags: [topic.toLowerCase()],
        ai_generated: true,
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        note,
        creditsUsed: deductResult.creditsUsed,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Note generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate note' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
