import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { checkCredits, deductSlideshowCredits } from '@/lib/credits';
import { FEATURE_COSTS } from '@/lib/credits-system';

export const runtime = 'edge';

const SlideSchema = z.object({
  title: z.string(),
  content: z.array(z.string()),
  imageQuery: z.string(), // Search query for finding relevant image
  notes: z.string().optional(),
});

const SlideshowSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  slides: z.array(SlideSchema),
  suggestedTheme: z.enum(['professional', 'creative', 'minimal', 'educational', 'dark', 'colorful']),
});

export async function POST(req: Request) {
  try {
    const { topic, numberOfSlides, audience } = await req.json();

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

    // Check credits for slideshow generation
    const creditsNeeded = FEATURE_COSTS.SLIDESHOW_GENERATION;
    const creditCheck = await checkCredits(user.id, creditsNeeded);

    if (!creditCheck.canAfford) {
      return new Response(
        JSON.stringify({
          error: 'Insufficient credits for slideshow generation',
          creditsNeeded,
          balance: creditCheck.balance,
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate slideshow content with GPT-4o
    const result = await generateObject({
      model: openai('gpt-4o'),
      schema: SlideshowSchema,
      prompt: `Create a ${numberOfSlides}-slide presentation about: ${topic}

Target audience: ${audience || 'general audience'}

Requirements:
- Make it engaging and informative
- Each slide should have a clear title
- Provide 2-4 bullet points per slide
- For each slide, provide a search query to find a relevant, professional image
- Suggest an appropriate theme based on the topic
- Include speaker notes if helpful

Make the presentation flow logically and be well-structured.`,
    });

    const slideshow = result.object as z.infer<typeof SlideshowSchema>;

    // Fetch images for each slide from Unsplash
    const slidesWithImages = await Promise.all(
      slideshow.slides.map(async (slide) => {
        try {
          // Try Unsplash first (high quality, no watermarks)
          const unsplashResponse = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
              slide.imageQuery
            )}&per_page=5&orientation=landscape`,
            {
              headers: {
                Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
              },
            }
          );

          const unsplashData = await unsplashResponse.json();

          if (unsplashData.results && unsplashData.results.length > 0) {
            // Get top 5 images for user to choose from
            const images = unsplashData.results.slice(0, 5).map((img: any) => ({
              url: img.urls.regular,
              thumb: img.urls.thumb,
              alt: img.alt_description || slide.imageQuery,
              credit: {
                photographer: img.user.name,
                photographerUrl: img.user.links.html,
              },
            }));

            return {
              ...slide,
              images, // Multiple options
              selectedImage: images[0], // Default to first
            };
          }
        } catch (error) {
          console.error('Error fetching images:', error);
        }

        // Fallback: return slide without images
        return {
          ...slide,
          images: [],
          selectedImage: null,
        };
      })
    );

    // Deduct credits
    const deductResult = await deductSlideshowCredits(user.id, topic, numberOfSlides);

    if (!deductResult.success) {
      return new Response(
        JSON.stringify({ error: deductResult.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Save slideshow to database
    const { data: savedSlideshow } = await supabase
      .from('slideshows')
      .insert({
        user_id: user.id,
        title: slideshow.title,
        content: {
          ...slideshow,
          slides: slidesWithImages,
        },
      })
      .select()
      .single();

    return new Response(
      JSON.stringify({
        slideshow: {
          ...slideshow,
          slides: slidesWithImages,
          id: savedSlideshow?.id,
        },
        creditsUsed: deductResult.creditsUsed,
        newBalance: deductResult.newBalance,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Slideshow generation error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate slideshow' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
