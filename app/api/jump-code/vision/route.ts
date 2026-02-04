/**
 * Jump Code Vision API Endpoint
 * Handles screenshot analysis and visual understanding
 * FREE and UNLIMITED for Jump Code CLI users
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, prompt = 'Describe what you see in this screenshot.', model = 'gpt-4o' } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Determine if image is base64 or URL
    const imageUrl = image.startsWith('http')
      ? image
      : `data:image/png;base64,${image}`;

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are Jump Code, analyzing a screenshot from the user's computer.
Describe what you see clearly and identify:
- UI elements (buttons, text fields, menus)
- Application windows and their contents
- Any errors or issues visible
- Clickable elements with their approximate positions
- Text content that might be relevant

Be specific about locations to help with computer control (e.g., "the Submit button is in the lower right corner").`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
    });

    return NextResponse.json({
      analysis: response.choices[0]?.message?.content,
      usage: response.usage,
    });
  } catch (error: unknown) {
    console.error('Vision API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to analyze image', details: errorMessage },
      { status: 500 }
    );
  }
}
