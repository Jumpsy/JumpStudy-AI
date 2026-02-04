import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Initialize Anthropic client
const getAnthropic = () => {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
};

// Sandboxed directory for user code execution
const SANDBOX_BASE = '/tmp/jumpcode-sandbox';

// Allowed commands whitelist (for safety)
const ALLOWED_COMMANDS = [
  'ls', 'cat', 'head', 'tail', 'grep', 'find', 'wc',
  'node', 'npm', 'npx', 'python', 'python3', 'pip',
  'git', 'echo', 'pwd', 'mkdir', 'touch', 'cp', 'mv',
  'tsc', 'tsx', 'bun', 'deno',
];

// Check if command is allowed
function isCommandAllowed(command: string): boolean {
  const baseCommand = command.trim().split(/\s+/)[0];
  return ALLOWED_COMMANDS.some(allowed =>
    baseCommand === allowed || baseCommand.endsWith(`/${allowed}`)
  );
}

// Execute command in sandbox
async function executeCommand(
  command: string,
  workingDir: string
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    // Ensure sandbox directory exists
    await fs.mkdir(workingDir, { recursive: true });

    const { stdout, stderr } = await execAsync(command, {
      cwd: workingDir,
      timeout: 30000, // 30 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
      env: {
        ...process.env,
        HOME: workingDir,
        PATH: process.env.PATH,
      },
    });

    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1,
    };
  }
}

// Write file to sandbox
async function writeFile(
  filePath: string,
  content: string,
  workingDir: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const fullPath = path.join(workingDir, filePath);
    const dir = path.dirname(fullPath);

    // Security check - ensure path is within sandbox
    if (!fullPath.startsWith(workingDir)) {
      return { success: false, error: 'Path traversal not allowed' };
    }

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Read file from sandbox
async function readFile(
  filePath: string,
  workingDir: string
): Promise<{ content?: string; error?: string }> {
  try {
    const fullPath = path.join(workingDir, filePath);

    // Security check
    if (!fullPath.startsWith(workingDir)) {
      return { error: 'Path traversal not allowed' };
    }

    const content = await fs.readFile(fullPath, 'utf-8');
    return { content };
  } catch (error: any) {
    return { error: error.message };
  }
}

// Tool definitions for Claude
const tools: Anthropic.Tool[] = [
  {
    name: 'execute_command',
    description: 'Execute a terminal command in the user\'s sandbox environment. Use this to run code, install packages, or perform file operations.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'The command to execute (e.g., "npm install express", "python script.py", "node index.js")',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file in the user\'s sandbox. Use this to create or modify code files.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the sandbox (e.g., "src/index.js", "main.py")',
        },
        content: {
          type: 'string',
          description: 'The content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file in the user\'s sandbox.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The file path relative to the sandbox',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'list_files',
    description: 'List files and directories in the user\'s sandbox.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'The directory path relative to the sandbox (default: ".")',
        },
      },
      required: [],
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user has Jump Code subscription
    const { data: userData } = await supabase
      .from('users')
      .select('subscription_tier, credits_balance')
      .eq('id', user.id)
      .single();

    if (!userData || (userData.subscription_tier !== 'code' && userData.subscription_tier !== 'unlimited')) {
      return NextResponse.json({
        error: 'Jump Code requires a Jump Code subscription',
        upgrade_required: true
      }, { status: 403 });
    }

    const { message, conversationHistory = [] } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const anthropic = getAnthropic();

    // Create user-specific sandbox directory
    const userSandbox = path.join(SANDBOX_BASE, user.id);
    await fs.mkdir(userSandbox, { recursive: true });

    // Build messages array
    const messages: Anthropic.MessageParam[] = [
      ...conversationHistory,
      { role: 'user', content: message },
    ];

    // System prompt for Jump Code
    const systemPrompt = `You are Jump Code, an AI coding assistant powered by Claude Opus. You help users write, debug, and run code directly in their terminal environment.

You have access to a sandboxed terminal environment where you can:
- Write and edit code files
- Execute terminal commands (Node.js, Python, npm, git, etc.)
- Read file contents
- List directory contents

IMPORTANT GUIDELINES:
1. When the user asks you to write code, use the write_file tool to create the file
2. When asked to run code, use execute_command to run it
3. Always explain what you're doing before and after each action
4. If a command fails, analyze the error and suggest fixes
5. For multi-step tasks, execute them one at a time and verify each step
6. Be proactive - if you write a file, offer to run it
7. Keep responses concise but informative

The user's sandbox is a clean environment. You may need to initialize projects (npm init, etc.) if needed.

Current working directory: ${userSandbox}`;

    // Initial API call
    let response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      tools,
      messages,
    });

    const assistantMessages: any[] = [];
    const toolResults: any[] = [];

    // Process tool calls in a loop
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
      );

      // Add assistant's response to messages
      assistantMessages.push(...response.content);

      const toolResultsForMessage: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let result: string;
        const input = toolUse.input as Record<string, any>;

        switch (toolUse.name) {
          case 'execute_command': {
            const command = input.command as string;

            // Security check
            if (!isCommandAllowed(command)) {
              result = JSON.stringify({
                error: `Command not allowed: ${command.split(/\s+/)[0]}`,
                allowed_commands: ALLOWED_COMMANDS,
              });
            } else {
              const { stdout, stderr, exitCode } = await executeCommand(command, userSandbox);
              result = JSON.stringify({ stdout, stderr, exitCode });
              toolResults.push({
                tool: 'execute_command',
                command,
                stdout,
                stderr,
                exitCode,
              });
            }
            break;
          }

          case 'write_file': {
            const { success, error } = await writeFile(
              input.path as string,
              input.content as string,
              userSandbox
            );
            result = JSON.stringify({ success, error, path: input.path });
            toolResults.push({
              tool: 'write_file',
              path: input.path,
              success,
              error,
            });
            break;
          }

          case 'read_file': {
            const { content, error } = await readFile(input.path as string, userSandbox);
            result = JSON.stringify({ content, error });
            toolResults.push({
              tool: 'read_file',
              path: input.path,
              content: content?.substring(0, 500),
              error,
            });
            break;
          }

          case 'list_files': {
            const listPath = input.path || '.';
            const { stdout, stderr, exitCode } = await executeCommand(
              `ls -la ${listPath}`,
              userSandbox
            );
            result = JSON.stringify({ files: stdout, error: stderr, exitCode });
            toolResults.push({
              tool: 'list_files',
              path: listPath,
              files: stdout,
            });
            break;
          }

          default:
            result = JSON.stringify({ error: `Unknown tool: ${toolUse.name}` });
        }

        toolResultsForMessage.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result,
        });
      }

      // Continue conversation with tool results
      messages.push({ role: 'assistant', content: response.content });
      messages.push({ role: 'user', content: toolResultsForMessage });

      // Get next response
      response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });
    }

    // Extract final text response
    const textContent = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    // Deduct credits (Jump Code uses more credits)
    const creditsUsed = 50; // Base credits per interaction
    await supabase
      .from('users')
      .update({
        credits_balance: Math.max(0, (userData.credits_balance || 0) - creditsUsed)
      })
      .eq('id', user.id);

    return NextResponse.json({
      response: textContent?.text || 'No response generated',
      toolResults,
      creditsUsed,
      conversationHistory: messages,
    });

  } catch (error: any) {
    console.error('Jump Code error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
