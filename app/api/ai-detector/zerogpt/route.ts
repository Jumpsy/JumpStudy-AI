/**
 * ZeroGPT API Integration
 * Official ZeroGPT API for AI detection
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 10) {
      return NextResponse.json(
        { error: 'Text must be at least 10 characters' },
        { status: 400 }
      );
    }

    // ZeroGPT API endpoint
    // Get your API key from https://zerogpt.com/api
    const ZEROGPT_API_KEY = process.env.ZEROGPT_API_KEY;

    if (!ZEROGPT_API_KEY) {
      // Fallback to local detection if no ZeroGPT key
      return NextResponse.json(
        {
          error: 'ZeroGPT API key not configured',
          ai_probability: 0,
          classification: 'Unavailable',
          confidence: 0
        },
        { status: 200 }
      );
    }

    const response = await fetch('https://api.zerogpt.com/api/detect/detectText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ApiKey': ZEROGPT_API_KEY
      },
      body: JSON.stringify({
        input_text: text
      })
    });

    if (!response.ok) {
      throw new Error('ZeroGPT API request failed');
    }

    const data = await response.json();

    // ZeroGPT response format:
    // {
    //   "data": {
    //     "isHuman": 0,  // 0 = AI, 1 = Human
    //     "fakePercentage": 85.5,  // AI probability
    //     "textWords": 150,
    //     ...
    //   }
    // }

    const aiProbability = (data.data?.fakePercentage || 0) / 100;
    const isAI = aiProbability > 0.5;

    return NextResponse.json({
      success: true,
      ai_probability: aiProbability,
      human_probability: 1 - aiProbability,
      classification: aiProbability >= 0.65 ? 'AI-Generated' :
                     aiProbability >= 0.35 ? 'Mixed Content' :
                     'Human-Written',
      confidence: Math.max(aiProbability, 1 - aiProbability),
      is_ai: isAI,
      raw_data: data.data
    });

  } catch (error) {
    console.error('ZeroGPT API error:', error);
    return NextResponse.json(
      {
        error: 'ZeroGPT detection failed',
        ai_probability: 0,
        classification: 'Error',
        confidence: 0
      },
      { status: 200 } // Return 200 so enhanced detector still shows
    );
  }
}
