#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════

const SUPABASE_URL = 'https://sthumeeyjjmtpnkwpdpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aHVtZWV5amptdHBua3dwZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzE2ODAsImV4cCI6MjA4NTE0NzY4MH0.G36_hvGCcy7lanZUO66ZtKgRaDQrtHY6xJsCfzA1ujY';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.jump-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MEMORY_DIR = path.join(CONFIG_DIR, 'memory');
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');

// Colors
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
};

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

interface Config {
  anthropicApiKey?: string;
  userId?: string;
  email?: string;
  sessionToken?: string;
}

interface ProjectMemory {
  projectPath: string;
  summary: string;
  keyFiles: string[];
  recentChanges: string[];
  lastAccessed: number;
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string | Anthropic.ContentBlock[];
  timestamp: number;
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS DEFINITION
// ═══════════════════════════════════════════════════════════════════

const tools: Anthropic.Tool[] = [
  {
    name: 'bash',
    description: 'Execute a bash command in the terminal. Use for running scripts, git commands, npm/yarn, building projects, running tests, etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        command: {
          type: 'string',
          description: 'The bash command to execute',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 120000)',
        },
      },
      required: ['command'],
    },
  },
  {
    name: 'read_file',
    description: 'Read the contents of a file. Use this to examine code, configs, or any text file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file (absolute or relative to current directory)',
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (optional)',
        },
        limit: {
          type: 'number',
          description: 'Number of lines to read (optional)',
        },
      },
      required: ['path'],
    },
  },
  {
    name: 'write_file',
    description: 'Write content to a file. Creates the file if it doesn\'t exist, overwrites if it does.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['path', 'content'],
    },
  },
  {
    name: 'edit_file',
    description: 'Edit a file by replacing specific text. Use for precise code modifications.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Path to the file',
        },
        old_string: {
          type: 'string',
          description: 'The exact text to find and replace (must be unique in the file)',
        },
        new_string: {
          type: 'string',
          description: 'The replacement text',
        },
      },
      required: ['path', 'old_string', 'new_string'],
    },
  },
  {
    name: 'glob',
    description: 'Find files matching a glob pattern. Use to discover project structure.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "**/*.ts", "src/**/*.js")',
        },
        path: {
          type: 'string',
          description: 'Directory to search in (default: current directory)',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'grep',
    description: 'Search for text patterns in files. Use to find code, references, or specific content.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pattern: {
          type: 'string',
          description: 'Search pattern (regex supported)',
        },
        path: {
          type: 'string',
          description: 'File or directory to search in',
        },
        include: {
          type: 'string',
          description: 'File pattern to include (e.g., "*.ts")',
        },
      },
      required: ['pattern'],
    },
  },
  {
    name: 'list_dir',
    description: 'List contents of a directory with details.',
    input_schema: {
      type: 'object' as const,
      properties: {
        path: {
          type: 'string',
          description: 'Directory path (default: current directory)',
        },
      },
      required: [],
    },
  },
  {
    name: 'think',
    description: 'Use this tool to think through complex problems step by step before taking action.',
    input_schema: {
      type: 'object' as const,
      properties: {
        thought: {
          type: 'string',
          description: 'Your step-by-step reasoning about the problem',
        },
      },
      required: ['thought'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// JUMP CODE CLASS
// ═══════════════════════════════════════════════════════════════════

class JumpCode {
  private anthropic: Anthropic | null = null;
  private supabase: SupabaseClient;
  private config: Config = {};
  private cwd: string;
  private conversationHistory: Anthropic.MessageParam[] = [];
  private projectMemory: Map<string, ProjectMemory> = new Map();
  private rl: readline.Interface;
  private sessionId: string;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.cwd = process.cwd();
    this.sessionId = crypto.randomUUID();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // CONFIG & AUTH
  // ─────────────────────────────────────────────────────────────────

  private async ensureConfigDir(): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  }

  private async loadConfig(): Promise<void> {
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = JSON.parse(data);
    } catch {
      this.config = {};
    }
  }

  private async saveConfig(): Promise<void> {
    await this.ensureConfigDir();
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  private async loadMemory(): Promise<void> {
    try {
      const projectHash = this.hashPath(this.cwd);
      const memoryFile = path.join(MEMORY_DIR, `${projectHash}.json`);
      const data = await fs.readFile(memoryFile, 'utf-8');
      const memory = JSON.parse(data);
      this.projectMemory.set(this.cwd, memory);

      // Load conversation history
      const historyFile = path.join(MEMORY_DIR, `${projectHash}_history.json`);
      try {
        const historyData = await fs.readFile(historyFile, 'utf-8');
        this.conversationHistory = JSON.parse(historyData);
        this.print(`\n  ${c.dim}📚 Loaded ${this.conversationHistory.length / 2} previous messages from memory${c.reset}\n`);
      } catch {}
    } catch {}
  }

  private async saveMemory(): Promise<void> {
    const projectHash = this.hashPath(this.cwd);

    // Save project memory
    const memory = this.projectMemory.get(this.cwd);
    if (memory) {
      const memoryFile = path.join(MEMORY_DIR, `${projectHash}.json`);
      await fs.writeFile(memoryFile, JSON.stringify(memory, null, 2));
    }

    // Save conversation history (keep last 100 messages for context)
    const historyFile = path.join(MEMORY_DIR, `${projectHash}_history.json`);
    const recentHistory = this.conversationHistory.slice(-100);
    await fs.writeFile(historyFile, JSON.stringify(recentHistory, null, 2));
  }

  private hashPath(p: string): string {
    return crypto.createHash('md5').update(p).digest('hex').slice(0, 12);
  }

  private async authenticate(): Promise<boolean> {
    if (this.config.anthropicApiKey) {
      this.anthropic = new Anthropic({ apiKey: this.config.anthropicApiKey });
      return true;
    }

    // Check for session
    if (this.config.sessionToken) {
      const { data, error } = await this.supabase.auth.setSession({
        access_token: this.config.sessionToken,
        refresh_token: '',
      });

      if (!error && data.user) {
        // Get user's API key from their profile
        const { data: profile } = await this.supabase
          .from('users')
          .select('subscription_tier')
          .eq('id', data.user.id)
          .single();

        if (profile?.subscription_tier === 'code') {
          // User has Jump Code subscription - use server API
          return true;
        }
      }
    }

    return false;
  }

  private async login(): Promise<boolean> {
    console.log(`\n${c.cyan}${c.bold}  🔐 Jump Code Login${c.reset}\n`);

    const email = await this.question(`  ${c.dim}Email:${c.reset} `);
    const password = await this.questionHidden(`  ${c.dim}Password:${c.reset} `);

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.print(`\n  ${c.red}✗ Login failed: ${error.message}${c.reset}\n\n`);
      return false;
    }

    // Check subscription
    const { data: profile } = await this.supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', data.user.id)
      .single();

    if (profile?.subscription_tier !== 'code') {
      this.print(`\n  ${c.yellow}⚠ Jump Code requires a Jump Code subscription.${c.reset}`);
      this.print(`\n  ${c.dim}Upgrade at: https://jumpstudy.ai/pricing${c.reset}\n\n`);
      return false;
    }

    this.config.sessionToken = data.session.access_token;
    this.config.userId = data.user.id;
    this.config.email = data.user.email;
    await this.saveConfig();

    this.print(`\n  ${c.green}✓ Logged in as ${data.user.email}${c.reset}\n`);
    return true;
  }

  private async setupApiKey(): Promise<boolean> {
    console.log(`\n${c.cyan}${c.bold}  🔑 API Key Setup${c.reset}\n`);
    console.log(`  ${c.dim}You can use your own Anthropic API key for unlimited access.${c.reset}`);
    console.log(`  ${c.dim}Get one at: https://console.anthropic.com/${c.reset}\n`);

    const apiKey = await this.questionHidden(`  ${c.dim}Anthropic API Key:${c.reset} `);

    if (apiKey.startsWith('sk-ant-')) {
      this.config.anthropicApiKey = apiKey;
      await this.saveConfig();
      this.anthropic = new Anthropic({ apiKey });
      this.print(`\n  ${c.green}✓ API key saved successfully!${c.reset}\n`);
      return true;
    }

    this.print(`\n  ${c.red}✗ Invalid API key format${c.reset}\n`);
    return false;
  }

  // ─────────────────────────────────────────────────────────────────
  // TOOL EXECUTION
  // ─────────────────────────────────────────────────────────────────

  private async executeTool(name: string, input: Record<string, any>): Promise<string> {
    switch (name) {
      case 'bash':
        return this.executeBash(input.command, input.timeout);
      case 'read_file':
        return this.readFile(input.path, input.offset, input.limit);
      case 'write_file':
        return this.writeFile(input.path, input.content);
      case 'edit_file':
        return this.editFile(input.path, input.old_string, input.new_string);
      case 'glob':
        return this.glob(input.pattern, input.path);
      case 'grep':
        return this.grep(input.pattern, input.path, input.include);
      case 'list_dir':
        return this.listDir(input.path);
      case 'think':
        return JSON.stringify({ thought: 'Acknowledged', status: 'complete' });
      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

  private async executeBash(command: string, timeout = 120000): Promise<string> {
    this.print(`\n  ${c.yellow}⚡ ${command}${c.reset}\n`);

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        env: { ...process.env, FORCE_COLOR: '1' },
      });

      if (stdout) {
        const lines = stdout.split('\n');
        const preview = lines.slice(0, 30).join('\n');
        this.print(`${c.dim}${preview}${c.reset}`);
        if (lines.length > 30) {
          this.print(`\n${c.dim}  ... (${lines.length - 30} more lines)${c.reset}`);
        }
        this.print('\n');
      }

      return JSON.stringify({ stdout, stderr, exitCode: 0 });
    } catch (error: any) {
      const result = {
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        exitCode: error.code || 1,
      };

      if (result.stderr) {
        this.print(`  ${c.red}${result.stderr}${c.reset}\n`);
      }

      return JSON.stringify(result);
    }
  }

  private async readFile(filePath: string, offset?: number, limit?: number): Promise<string> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.cwd, filePath);
      this.print(`\n  ${c.blue}📖 Reading: ${filePath}${c.reset}\n`);

      let content = await fs.readFile(fullPath, 'utf-8');
      const lines = content.split('\n');

      if (offset !== undefined || limit !== undefined) {
        const start = offset || 0;
        const end = limit ? start + limit : lines.length;
        content = lines.slice(start, end).join('\n');
      }

      return JSON.stringify({ content, totalLines: lines.length });
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  }

  private async writeFile(filePath: string, content: string): Promise<string> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.cwd, filePath);
      this.print(`\n  ${c.green}✏️  Writing: ${filePath}${c.reset}\n`);

      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, content, 'utf-8');

      this.print(`  ${c.green}✓ File written successfully${c.reset}\n`);
      return JSON.stringify({ success: true, path: filePath });
    } catch (error: any) {
      this.print(`  ${c.red}✗ Failed: ${error.message}${c.reset}\n`);
      return JSON.stringify({ success: false, error: error.message });
    }
  }

  private async editFile(filePath: string, oldString: string, newString: string): Promise<string> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.cwd, filePath);
      this.print(`\n  ${c.magenta}✏️  Editing: ${filePath}${c.reset}\n`);

      let content = await fs.readFile(fullPath, 'utf-8');

      if (!content.includes(oldString)) {
        this.print(`  ${c.red}✗ Text not found in file${c.reset}\n`);
        return JSON.stringify({ success: false, error: 'Old string not found in file' });
      }

      const occurrences = content.split(oldString).length - 1;
      if (occurrences > 1) {
        this.print(`  ${c.yellow}⚠ Found ${occurrences} occurrences, replacing first one${c.reset}\n`);
      }

      content = content.replace(oldString, newString);
      await fs.writeFile(fullPath, content, 'utf-8');

      this.print(`  ${c.green}✓ Edit applied successfully${c.reset}\n`);
      return JSON.stringify({ success: true, occurrences });
    } catch (error: any) {
      this.print(`  ${c.red}✗ Failed: ${error.message}${c.reset}\n`);
      return JSON.stringify({ success: false, error: error.message });
    }
  }

  private async glob(pattern: string, basePath?: string): Promise<string> {
    try {
      const searchPath = basePath || this.cwd;
      this.print(`\n  ${c.blue}🔍 Searching: ${pattern}${c.reset}\n`);

      const { stdout } = await execAsync(
        `find ${searchPath} -type f -name "${pattern}" 2>/dev/null | head -100`,
        { cwd: this.cwd }
      );

      const files = stdout.trim().split('\n').filter(Boolean);
      this.print(`  ${c.dim}Found ${files.length} files${c.reset}\n`);

      return JSON.stringify({ files, count: files.length });
    } catch (error: any) {
      return JSON.stringify({ files: [], error: error.message });
    }
  }

  private async grep(pattern: string, searchPath?: string, include?: string): Promise<string> {
    try {
      const target = searchPath || this.cwd;
      const includeFlag = include ? `--include="${include}"` : '';
      this.print(`\n  ${c.blue}🔍 Searching for: "${pattern}"${c.reset}\n`);

      const { stdout } = await execAsync(
        `grep -rn ${includeFlag} "${pattern}" ${target} 2>/dev/null | head -50`,
        { cwd: this.cwd, maxBuffer: 5 * 1024 * 1024 }
      );

      const matches = stdout.trim().split('\n').filter(Boolean);
      this.print(`  ${c.dim}Found ${matches.length} matches${c.reset}\n`);

      return JSON.stringify({ matches, count: matches.length });
    } catch (error: any) {
      return JSON.stringify({ matches: [], count: 0 });
    }
  }

  private async listDir(dirPath?: string): Promise<string> {
    try {
      const target = dirPath || '.';
      const fullPath = path.isAbsolute(target) ? target : path.join(this.cwd, target);

      const { stdout } = await execAsync(`ls -la "${fullPath}"`, { cwd: this.cwd });
      return JSON.stringify({ listing: stdout });
    } catch (error: any) {
      return JSON.stringify({ error: error.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // CHAT
  // ─────────────────────────────────────────────────────────────────

  private async chat(userMessage: string): Promise<string> {
    if (!this.anthropic) {
      throw new Error('Not authenticated');
    }

    this.conversationHistory.push({ role: 'user', content: userMessage });

    const systemPrompt = `You are Jump Code, an elite AI coding assistant running in the user's terminal. You have FULL access to their system and can execute ANY command.

CORE IDENTITY:
- You are powered by Claude Opus - the most capable AI model
- You have persistent memory of this project across sessions
- You can read, write, edit ANY file and run ANY command
- You are here to BUILD, not just advise

CAPABILITIES:
- bash: Execute any shell command (git, npm, python, docker, etc.)
- read_file: Read any file with optional line ranges
- write_file: Create or overwrite files
- edit_file: Make precise edits by replacing specific text
- glob: Find files by pattern
- grep: Search file contents
- list_dir: List directory contents
- think: Reason through complex problems

PRINCIPLES:
1. ACTION OVER EXPLANATION - When asked to do something, DO IT immediately
2. READ BEFORE EDIT - Always read a file before modifying it
3. VERIFY YOUR WORK - Run tests/builds after changes
4. BE THOROUGH - Complete the entire task, not just part of it
5. CONTEXT AWARENESS - Remember what we've discussed and done

PROJECT CONTEXT:
- Working directory: ${this.cwd}
- Platform: ${process.platform}
- Shell: ${process.env.SHELL || 'bash'}

MEMORY:
You remember our entire conversation. Build on previous context.
If continuing work, pick up exactly where we left off.

RESPONSE STYLE:
- Be concise but complete
- Show your work (what commands you ran, what you found)
- If something fails, diagnose and fix it
- Ask clarifying questions only when truly necessary`;

    let response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 16384,
      system: systemPrompt,
      tools,
      messages: this.conversationHistory,
    });

    // Agentic loop - process tool calls
    while (response.stop_reason === 'tool_use') {
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          this.print(`\n${block.text}\n`);
        }

        if (block.type === 'tool_use') {
          const result = await this.executeTool(block.name, block.input as Record<string, any>);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      this.conversationHistory.push({ role: 'assistant', content: response.content });
      this.conversationHistory.push({ role: 'user', content: toolResults });

      response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 16384,
        system: systemPrompt,
        tools,
        messages: this.conversationHistory,
      });
    }

    // Extract final response
    const textBlocks = response.content.filter(
      (block): block is Anthropic.TextBlock => block.type === 'text'
    );

    const finalResponse = textBlocks.map(b => b.text).join('\n');
    this.conversationHistory.push({ role: 'assistant', content: response.content });

    // Save memory after each interaction
    await this.saveMemory();

    return finalResponse;
  }

  // ─────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────────

  private print(text: string): void {
    process.stdout.write(text);
  }

  private question(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  private questionHidden(prompt: string): Promise<string> {
    return new Promise((resolve) => {
      process.stdout.write(prompt);

      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;

      if (stdin.isTTY) {
        stdin.setRawMode(true);
      }

      let input = '';

      const onData = (char: Buffer) => {
        const c = char.toString();

        if (c === '\n' || c === '\r') {
          stdin.removeListener('data', onData);
          if (stdin.isTTY) {
            stdin.setRawMode(wasRaw || false);
          }
          process.stdout.write('\n');
          resolve(input);
        } else if (c === '\u0003') {
          process.exit();
        } else if (c === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += c;
        }
      };

      stdin.on('data', onData);
    });
  }

  private printHeader(): void {
    console.clear();
    console.log(`
${c.cyan}${c.bold}    ╭─────────────────────────────────────────────────────╮
    │                                                     │
    │         ⚡ JUMP CODE - AI Terminal Assistant        │
    │            Powered by Claude Opus                   │
    │                                                     │
    ╰─────────────────────────────────────────────────────╯${c.reset}

  ${c.dim}Directory: ${this.cwd}${c.reset}
  ${c.dim}Type your request. Commands: /help, /clear, /memory, /exit${c.reset}
`);
  }

  private printHelp(): void {
    console.log(`
${c.cyan}${c.bold}  Jump Code Commands${c.reset}

  ${c.yellow}/clear${c.reset}    - Clear conversation (keeps memory)
  ${c.yellow}/memory${c.reset}   - Show what I remember about this project
  ${c.yellow}/forget${c.reset}   - Clear all memory for this project
  ${c.yellow}/help${c.reset}     - Show this help
  ${c.yellow}/exit${c.reset}     - Exit Jump Code

${c.cyan}${c.bold}  Tips${c.reset}

  ${c.dim}• I can read, write, and edit any file
  • I can run any terminal command
  • I remember our conversation across sessions
  • Just tell me what you want to build!${c.reset}
`);
  }

  // ─────────────────────────────────────────────────────────────────
  // MAIN LOOP
  // ─────────────────────────────────────────────────────────────────

  async run(): Promise<void> {
    await this.ensureConfigDir();
    await this.loadConfig();
    await this.loadMemory();

    // Check authentication
    const isAuthed = await this.authenticate();

    if (!isAuthed) {
      console.log(`
${c.cyan}${c.bold}  ⚡ Welcome to Jump Code${c.reset}

  ${c.dim}Choose how to authenticate:${c.reset}

  ${c.yellow}1${c.reset}) Login with JumpStudy account (requires Jump Code subscription)
  ${c.yellow}2${c.reset}) Use your own Anthropic API key (unlimited)
`);

      const choice = await this.question(`  ${c.dim}Choice (1/2):${c.reset} `);

      let success = false;
      if (choice === '1') {
        success = await this.login();
      } else {
        success = await this.setupApiKey();
      }

      if (!success) {
        this.rl.close();
        process.exit(1);
      }
    }

    this.printHeader();

    // Main loop
    while (true) {
      const input = await this.question(`\n${c.cyan}❯${c.reset} `);
      const trimmed = input.trim();

      if (!trimmed) continue;

      // Commands
      if (trimmed === '/exit' || trimmed === 'exit' || trimmed === 'quit') {
        await this.saveMemory();
        this.print(`\n${c.cyan}  👋 See you next time!${c.reset}\n\n`);
        this.rl.close();
        process.exit(0);
      }

      if (trimmed === '/clear') {
        this.conversationHistory = [];
        this.printHeader();
        this.print(`${c.green}  ✓ Conversation cleared (memory preserved)${c.reset}\n`);
        continue;
      }

      if (trimmed === '/help') {
        this.printHelp();
        continue;
      }

      if (trimmed === '/memory') {
        const memory = this.projectMemory.get(this.cwd);
        if (memory) {
          console.log(`\n${c.cyan}  Project Memory:${c.reset}`);
          console.log(`  ${c.dim}Summary: ${memory.summary}${c.reset}`);
          console.log(`  ${c.dim}Key files: ${memory.keyFiles.join(', ')}${c.reset}`);
        } else {
          console.log(`\n${c.dim}  No memory stored for this project yet.${c.reset}`);
        }
        console.log(`  ${c.dim}Conversation: ${this.conversationHistory.length / 2} messages${c.reset}\n`);
        continue;
      }

      if (trimmed === '/forget') {
        this.conversationHistory = [];
        this.projectMemory.delete(this.cwd);
        const projectHash = this.hashPath(this.cwd);
        try {
          await fs.unlink(path.join(MEMORY_DIR, `${projectHash}.json`));
          await fs.unlink(path.join(MEMORY_DIR, `${projectHash}_history.json`));
        } catch {}
        this.print(`${c.green}  ✓ Memory cleared for this project${c.reset}\n`);
        continue;
      }

      // Process with Claude
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const spinnerInterval = setInterval(() => {
        process.stdout.write(`\r${c.cyan}${spinner[i]}${c.reset} Thinking...`);
        i = (i + 1) % spinner.length;
      }, 80);

      try {
        const response = await this.chat(trimmed);
        clearInterval(spinnerInterval);
        process.stdout.write('\r' + ' '.repeat(20) + '\r');

        if (response.trim()) {
          console.log(`\n${response}`);
        }
      } catch (error: any) {
        clearInterval(spinnerInterval);
        process.stdout.write('\r' + ' '.repeat(20) + '\r');
        console.log(`\n${c.red}  Error: ${error.message}${c.reset}`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
${c.cyan}${c.bold}Jump Code${c.reset} - AI Terminal Assistant powered by Claude Opus

${c.yellow}Usage:${c.reset}
  jump-code [options]
  jc [options]

${c.yellow}Options:${c.reset}
  -h, --help      Show this help
  -v, --version   Show version
  --reset         Reset all configuration

${c.yellow}Commands (inside Jump Code):${c.reset}
  /clear    Clear conversation
  /memory   Show project memory
  /forget   Clear project memory
  /help     Show help
  /exit     Exit

${c.yellow}Examples:${c.reset}
  jump-code                    Start interactive session
  jc                           Short alias
`);
  process.exit(0);
}

if (args.includes('--version') || args.includes('-v')) {
  console.log('jump-code v1.0.0');
  process.exit(0);
}

if (args.includes('--reset')) {
  fs.rm(CONFIG_DIR, { recursive: true, force: true })
    .then(() => console.log('Configuration reset.'))
    .catch(() => {});
  process.exit(0);
}

// Run
const jumpCode = new JumpCode();
jumpCode.run().catch(console.error);
