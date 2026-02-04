import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// Initialize Anthropic with YOUR API key (server-side only)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

// Supabase admin client for auth verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const MODELS: Record<string, string> = {
  opus: 'claude-opus-4-20250514',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-20250514',
};

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check subscription (Jump Code tier required)
    const { data: profile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    // Allow 'code' tier or any paid tier for now
    const allowedTiers = ['code', 'pro', 'team', 'student', 'unlimited'];
    if (!profile || !allowedTiers.includes(profile.subscription_tier)) {
      return NextResponse.json({
        error: 'Jump Code subscription required',
        upgrade_url: 'https://jumpstudy.ai/pricing'
      }, { status: 403 });
    }

    // Parse request
    const { messages, model = 'opus', system } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const modelId = MODELS[model] || MODELS.opus;

    // Tools definition (same as Claude Code)
    const tools: Anthropic.Tool[] = [
      {
        name: 'Bash',
        description: 'Execute a bash command.',
        input_schema: {
          type: 'object' as const,
          properties: {
            command: { type: 'string', description: 'The command to execute' },
          },
          required: ['command'],
        },
      },
      {
        name: 'Read',
        description: 'Read file contents.',
        input_schema: {
          type: 'object' as const,
          properties: {
            file_path: { type: 'string', description: 'Path to file' },
            offset: { type: 'number', description: 'Start line' },
            limit: { type: 'number', description: 'Number of lines' },
          },
          required: ['file_path'],
        },
      },
      {
        name: 'Write',
        description: 'Write content to a file.',
        input_schema: {
          type: 'object' as const,
          properties: {
            file_path: { type: 'string', description: 'Path to file' },
            content: { type: 'string', description: 'Content to write' },
          },
          required: ['file_path', 'content'],
        },
      },
      {
        name: 'Edit',
        description: 'Edit file by replacing text.',
        input_schema: {
          type: 'object' as const,
          properties: {
            file_path: { type: 'string', description: 'Path to file' },
            old_string: { type: 'string', description: 'Text to replace' },
            new_string: { type: 'string', description: 'Replacement text' },
          },
          required: ['file_path', 'old_string', 'new_string'],
        },
      },
      {
        name: 'Glob',
        description: 'Find files by pattern.',
        input_schema: {
          type: 'object' as const,
          properties: {
            pattern: { type: 'string', description: 'Glob pattern' },
            path: { type: 'string', description: 'Search directory' },
          },
          required: ['pattern'],
        },
      },
      {
        name: 'Grep',
        description: 'Search file contents.',
        input_schema: {
          type: 'object' as const,
          properties: {
            pattern: { type: 'string', description: 'Search pattern' },
            path: { type: 'string', description: 'File or directory' },
            include: { type: 'string', description: 'File filter' },
          },
          required: ['pattern'],
        },
      },
    ];

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 16384,
      system: system || 'You are Jump Code, an AI coding assistant.',
      tools,
      messages,
    });

    // Return response (no logging, no tracking)
    return NextResponse.json({
      content: response.content,
      stop_reason: response.stop_reason,
      model: response.model,
      usage: response.usage,
    });

  } catch (error: any) {
    console.error('Jump Code API error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
