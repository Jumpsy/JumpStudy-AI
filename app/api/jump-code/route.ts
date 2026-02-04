import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Initialize Anthropic with YOUR API key (server-side only)
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const MODELS: Record<string, string> = {
  opus: 'claude-opus-4-20250514',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-20250514',
};

// ═══════════════════════════════════════════════════════════════════════════
// JUMP CODE API - FREE & UNLIMITED FOR EVERYONE
// No login, no auth, no tracking, no limits
// ═══════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Parse request - no auth required
    const { messages, model = 'sonnet', system } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages required' }, { status: 400 });
    }

    const modelId = MODELS[model] || MODELS.sonnet;

    // Tools definition - full Claude Code capabilities
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
            replace_all: { type: 'boolean', description: 'Replace all occurrences' },
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
      {
        name: 'WebFetch',
        description: 'Fetch content from a URL.',
        input_schema: {
          type: 'object' as const,
          properties: {
            url: { type: 'string', description: 'URL to fetch' },
          },
          required: ['url'],
        },
      },
      {
        name: 'WebSearch',
        description: 'Search the web.',
        input_schema: {
          type: 'object' as const,
          properties: {
            query: { type: 'string', description: 'Search query' },
          },
          required: ['query'],
        },
      },
      {
        name: 'Screenshot',
        description: 'Take a screenshot.',
        input_schema: {
          type: 'object' as const,
          properties: {
            filename: { type: 'string', description: 'Output filename' },
          },
          required: [],
        },
      },
      {
        name: 'MouseMove',
        description: 'Move mouse cursor.',
        input_schema: {
          type: 'object' as const,
          properties: {
            x: { type: 'number', description: 'X coordinate' },
            y: { type: 'number', description: 'Y coordinate' },
          },
          required: ['x', 'y'],
        },
      },
      {
        name: 'MouseClick',
        description: 'Click mouse button.',
        input_schema: {
          type: 'object' as const,
          properties: {
            button: { type: 'string', description: 'Button: left, right, middle' },
          },
          required: [],
        },
      },
      {
        name: 'Keyboard',
        description: 'Type text or press keys.',
        input_schema: {
          type: 'object' as const,
          properties: {
            text: { type: 'string', description: 'Text to type' },
            keys: { type: 'string', description: 'Keys to press' },
          },
          required: [],
        },
      },
      {
        name: 'TodoWrite',
        description: 'Update todo list.',
        input_schema: {
          type: 'object' as const,
          properties: {
            todos: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  content: { type: 'string' },
                  status: { type: 'string' },
                },
              },
            },
          },
          required: ['todos'],
        },
      },
      {
        name: 'CreateAutomation',
        description: 'Create a reusable automation.',
        input_schema: {
          type: 'object' as const,
          properties: {
            name: { type: 'string', description: 'Automation name' },
            description: { type: 'string', description: 'Description' },
            trigger: { type: 'string', description: 'Trigger condition' },
            actions: { type: 'array', items: { type: 'string' }, description: 'Commands to run' },
          },
          required: ['name', 'description', 'actions'],
        },
      },
      {
        name: 'RunAutomation',
        description: 'Run a saved automation.',
        input_schema: {
          type: 'object' as const,
          properties: {
            name: { type: 'string', description: 'Automation name or ID' },
          },
          required: ['name'],
        },
      },
      {
        name: 'SelfModify',
        description: 'Modify own source code (requires master code).',
        input_schema: {
          type: 'object' as const,
          properties: {
            new_source: { type: 'string', description: 'New source code' },
          },
          required: ['new_source'],
        },
      },
      {
        name: 'ReadSelf',
        description: 'Read own source code.',
        input_schema: {
          type: 'object' as const,
          properties: {},
          required: [],
        },
      },
      {
        name: 'Task',
        description: 'Spawn a sub-agent for parallel work.',
        input_schema: {
          type: 'object' as const,
          properties: {
            description: { type: 'string', description: 'Task description' },
            prompt: { type: 'string', description: 'Task prompt' },
          },
          required: ['description', 'prompt'],
        },
      },
      {
        name: 'NotebookEdit',
        description: 'Edit a Jupyter notebook.',
        input_schema: {
          type: 'object' as const,
          properties: {
            notebook_path: { type: 'string', description: 'Path to notebook' },
            cell_number: { type: 'number', description: 'Cell index' },
            new_source: { type: 'string', description: 'New cell source' },
            edit_mode: { type: 'string', description: 'replace, insert, or delete' },
            cell_type: { type: 'string', description: 'code or markdown' },
          },
          required: ['notebook_path', 'new_source'],
        },
      },
    ];

    // Call Anthropic API
    const response = await anthropic.messages.create({
      model: modelId,
      max_tokens: 16384,
      system: system || 'You are Jump Code, an AI coding assistant with full computer control.',
      tools,
      messages,
    });

    // Return response - no logging, no tracking
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
