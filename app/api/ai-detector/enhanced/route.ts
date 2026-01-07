/**
 * Enhanced AI Detector API Route
 * Uses the 10-layer detector that fixes the 22% AI bug
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

    // Call the enhanced detector API (deployed on Railway/Render)
    // Replace this URL with your deployed detector URL
    const DETECTOR_URL = process.env.ENHANCED_DETECTOR_URL || 'http://localhost:8000';

    const response = await fetch(`${DETECTOR_URL}/api/detect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        include_sentences: true
      })
    });

    if (!response.ok) {
      throw new Error('Enhanced detector API failed');
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Enhanced detector error:', error);
    return NextResponse.json(
      { error: 'Detection failed' },
      { status: 500 }
    );
  }
}
