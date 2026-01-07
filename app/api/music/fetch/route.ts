import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductCredits } from '@/lib/credits';

export const runtime = 'edge';

const MUSIC_TAB_COST = 20; // 20 credits to fetch and display tabs

export async function POST(req: Request) {
  try {
    const { url, instrument } = await req.json();

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
    const creditCheck = await checkCredits(user.id, MUSIC_TAB_COST);
    if (!creditCheck.canAfford) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits',
          creditsNeeded: MUSIC_TAB_COST,
          balance: creditCheck.balance,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch tab data (simplified - in production would use proper APIs or scraping)
    // This is a placeholder for the actual implementation
    const tabData = {
      song: 'Sample Song',
      artist: 'Sample Artist',
      instrument: instrument,
      tuning: 'Standard (E A D G B E)',
      difficulty: 'Intermediate',
      tempo: 120,
      timeSignature: '4/4',
      capo: 0,
      sections: [
        {
          name: 'Intro',
          bars: [
            {
              notes: [
                { string: 1, fret: 0, duration: '4n', time: 0 },
                { string: 2, fret: 1, duration: '4n', time: 0.5 },
                { string: 3, fret: 0, duration: '4n', time: 1 },
                { string: 2, fret: 1, duration: '4n', time: 1.5 },
              ],
            },
          ],
        },
        {
          name: 'Verse',
          bars: [
            {
              notes: [
                { string: 4, fret: 2, duration: '4n', time: 0 },
                { string: 3, fret: 2, duration: '4n', time: 0.5 },
                { string: 2, fret: 0, duration: '4n', time: 1 },
                { string: 1, fret: 0, duration: '4n', time: 1.5 },
              ],
            },
          ],
        },
      ],
      tabNotation: `
e|---0---1---0---1---|
B|---1---0---1---0---|
G|---0---0---0---0---|
D|---2---2---2---2---|
A|---2---3---2---3---|
E|---0---0---0---0---|
      `.trim(),
    };

    // Deduct credits
    const deductResult = await deductCredits(
      user.id,
      MUSIC_TAB_COST,
      `Music tab: ${tabData.song} by ${tabData.artist}`,
      {
        instrument,
        url,
      }
    );

    if (!deductResult.success) {
      return new Response(JSON.stringify({ error: deductResult.error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Save to user's tab library
    await supabase.from('music_tabs').insert({
      user_id: user.id,
      song: tabData.song,
      artist: tabData.artist,
      instrument: tabData.instrument,
      tab_data: tabData,
      source_url: url,
    });

    return new Response(
      JSON.stringify({
        tab: tabData,
        creditsUsed: MUSIC_TAB_COST,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Music fetch error:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch tab' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
