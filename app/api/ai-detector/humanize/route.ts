/**
 * Text Humanizer API Route
 * Converts AI-generated text to sound more human
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || text.length < 20) {
      return NextResponse.json(
        { error: 'Text must be at least 20 characters' },
        { status: 400 }
      );
    }

    // Call the enhanced detector API's humanizer endpoint
    const DETECTOR_URL = process.env.ENHANCED_DETECTOR_URL || 'http://localhost:8000';

    const response = await fetch(`${DETECTOR_URL}/api/humanize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error('Humanizer API failed');
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Humanizer error:', error);
    return NextResponse.json(
      { error: 'Humanization failed' },
      { status: 500 }
    );
  }
}
