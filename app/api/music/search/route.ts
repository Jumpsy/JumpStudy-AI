import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { song, artist, instrument } = await req.json();

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

    // Search for tabs using Ultimate Guitar API (using web scraping as backup)
    const searchQuery = `${song} ${artist} ${instrument} tab`;

    // Search multiple sources
    const sources = [
      {
        name: 'Ultimate Guitar',
        url: `https://www.ultimate-guitar.com/search.php?search_type=title&value=${encodeURIComponent(searchQuery)}`,
      },
      {
        name: 'Songsterr',
        url: `https://www.songsterr.com/a/wa/search?q=${encodeURIComponent(`${song} ${artist}`)}`,
      },
      {
        name: 'Tab4u',
        url: `https://www.tab4u.com/tabs/search?q=${encodeURIComponent(searchQuery)}`,
      },
    ];

    // For now, return structured search results
    // In production, you would scrape or use official APIs
    return new Response(
      JSON.stringify({
        query: searchQuery,
        sources: sources,
        message: 'Search completed. Click on a source to view tabs.',
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Music search error:', error);
    return new Response(JSON.stringify({ error: 'Failed to search for tabs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
