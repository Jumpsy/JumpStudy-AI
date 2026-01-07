import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { checkUsageLimit, incrementUsage } from '@/lib/usage';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid content' }), {
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

    // Check message limits
    const messageLimit = await checkUsageLimit(user.id, 'messages');
    if (!messageLimit.allowed) {
      return new Response(
        JSON.stringify({
          error: 'Message limit reached',
          remaining: messageLimit.remaining,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Enhance notes with GPT-4o-mini (cheaper since it's enhancement)
    const result = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: `Enhance and improve these study notes. Make them:
- Better organized with clear sections
- More comprehensive with additional relevant details
- Easier to understand and study from
- Well-formatted with proper structure
- Include key points and important concepts highlighted

Original notes:
${content}

Return the enhanced version, maintaining the same general topic but improving quality, organization, and completeness.`,
    });

    const enhanced = result.text;

    // Increment usage
    await incrementUsage(user.id, 'messages');

    return new Response(
      JSON.stringify({ enhanced }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Note enhancement error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to enhance note' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
