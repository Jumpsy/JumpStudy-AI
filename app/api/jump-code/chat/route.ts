/**
 * Jump Code API Endpoint
 * Provides FREE and UNLIMITED AI access for Jump Code CLI users
 *
 * This endpoint handles requests from the Jump Code terminal app
 * and routes them to OpenAI, subsidized by JumpStudy.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Jump Code system prompt
const JUMP_CODE_SYSTEM_PROMPT = `You are Jump Code, an AI-powered terminal coding assistant created by JumpStudy.

## Your Identity
- Name: Jump Code
- Creator: JumpStudy
- Purpose: Help developers with coding tasks directly in their terminal
- Personality: Helpful, knowledgeable, efficient, and focused on code quality

## Your Capabilities
You can help with:
- Reading, writing, and editing files
- Generating code in any language
- Debugging and fixing bugs
- Explaining code and concepts
- Running commands and scripts
- Analyzing screenshots (with vision)
- Controlling the user's computer (mouse, keyboard)

## Response Format
When you need to perform actions, use these special code blocks:

### Write a file:
\`\`\`write path/to/file.js
// file content here
\`\`\`

### Edit a file:
\`\`\`edit path/to/file.js
// new content
\`\`\`

### Run a command:
\`\`\`bash
npm install package-name
\`\`\`

### Computer actions:
\`\`\`action
click 500 300
type "Hello"
keypress ctrl+s
\`\`\`

## Guidelines
1. Be helpful and complete tasks thoroughly
2. Explain what you're doing
3. Provide clean, well-commented code
4. Follow best practices

Remember: You are Jump Code by JumpStudy - free and unlimited for all users!`;

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json();
    const { messages, model = 'gpt-4o', max_tokens = 4096, temperature = 0.7, stream = false } = body;

    // Validate request
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Check client identification
    const clientId = request.headers.get('X-Client-ID');
    const clientVersion = request.headers.get('X-Client-Version');

    // Prepend Jump Code system prompt if not already present
    const hasSystemPrompt = messages.some(
      (m: { role: string }) => m.role === 'system'
    );

    const finalMessages = hasSystemPrompt
      ? messages
      : [{ role: 'system', content: JUMP_CODE_SYSTEM_PROMPT }, ...messages];

    // Handle streaming response
    if (stream) {
      const response = await openai.chat.completions.create({
        model,
        messages: finalMessages,
        max_tokens,
        temperature,
        stream: true,
      });

      // Create streaming response
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
                );
              }
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
      });

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const completion = await openai.chat.completions.create({
      model,
      messages: finalMessages,
      max_tokens,
      temperature,
    });

    return NextResponse.json(completion);
  } catch (error: unknown) {
    console.error('Jump Code API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isRateLimit = errorMessage.includes('rate limit');
    const isQuota = errorMessage.includes('quota');

    return NextResponse.json(
      {
        error: isRateLimit
          ? 'Rate limit reached. Please wait a moment and try again.'
          : isQuota
            ? 'API quota exceeded. Please try again later.'
            : 'An error occurred processing your request.',
        details: errorMessage,
      },
      { status: isRateLimit || isQuota ? 429 : 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Jump Code API',
    version: '1.0.0',
    provider: 'JumpStudy',
    features: ['chat', 'vision', 'code-generation', 'streaming'],
  });
}
