#!/usr/bin/env node

import Anthropic from '@anthropic-ai/sdk';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════════

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.jump-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MEMORY_DIR = path.join(CONFIG_DIR, 'memory');

const MODELS = {
  opus: 'claude-opus-4-20250514',
  sonnet: 'claude-sonnet-4-20250514',
  haiku: 'claude-haiku-4-20250514',
} as const;

type ModelName = keyof typeof MODELS;

// Colors - no external deps
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
};

interface Config {
  apiKey?: string;
  model?: ModelName;
}

// ═══════════════════════════════════════════════════════════════════
// TOOLS - Same as Claude Code
// ═══════════════════════════════════════════════════════════════════

const tools: Anthropic.Tool[] = [
  {
    name: 'Bash',
    description: 'Execute a bash command. Use for git, npm, python, running scripts, etc.',
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
    description: 'Read file contents. Always read before editing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: 'Absolute or relative path' },
        offset: { type: 'number', description: 'Start line (optional)' },
        limit: { type: 'number', description: 'Number of lines (optional)' },
      },
      required: ['file_path'],
    },
  },
  {
    name: 'Write',
    description: 'Write content to a file. Creates directories if needed.',
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
    description: 'Edit file by replacing exact text. Must be unique in file.',
    input_schema: {
      type: 'object' as const,
      properties: {
        file_path: { type: 'string', description: 'Path to file' },
        old_string: { type: 'string', description: 'Exact text to replace' },
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
        pattern: { type: 'string', description: 'Glob pattern like **/*.ts' },
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
        include: { type: 'string', description: 'File filter like *.ts' },
      },
      required: ['pattern'],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════
// JUMP CODE
// ═══════════════════════════════════════════════════════════════════

class JumpCode {
  private anthropic!: Anthropic;
  private config: Config = { model: 'opus' };
  private cwd: string;
  private history: Anthropic.MessageParam[] = [];
  private rl!: readline.Interface;

  constructor() {
    this.cwd = process.cwd();
  }

  private async init(): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.mkdir(MEMORY_DIR, { recursive: true });

    // Load config
    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch {}

    // Load memory for this project
    await this.loadMemory();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  private async saveConfig(): Promise<void> {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  private hashPath(p: string): string {
    return crypto.createHash('md5').update(p).digest('hex').slice(0, 12);
  }

  private async loadMemory(): Promise<void> {
    try {
      const file = path.join(MEMORY_DIR, `${this.hashPath(this.cwd)}.json`);
      const data = await fs.readFile(file, 'utf-8');
      this.history = JSON.parse(data);
      if (this.history.length > 0) {
        this.print(`${c.dim}  ✓ Restored ${Math.floor(this.history.length / 2)} messages from memory${c.reset}\n`);
      }
    } catch {}
  }

  private async saveMemory(): Promise<void> {
    const file = path.join(MEMORY_DIR, `${this.hashPath(this.cwd)}.json`);
    // Keep last 200 messages
    await fs.writeFile(file, JSON.stringify(this.history.slice(-200), null, 2));
  }

  // ─────────────────────────────────────────────────────────────────
  // Tool execution
  // ─────────────────────────────────────────────────────────────────

  private async runTool(name: string, input: Record<string, any>): Promise<string> {
    switch (name) {
      case 'Bash': {
        this.print(`\n${c.yellow}  ⚡ ${input.command}${c.reset}\n`);
        try {
          const { stdout, stderr } = await execAsync(input.command, {
            cwd: this.cwd,
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024,
            env: { ...process.env, FORCE_COLOR: '1' },
          });
          if (stdout) {
            const lines = stdout.split('\n');
            this.print(`${c.dim}${lines.slice(0, 50).join('\n')}${c.reset}\n`);
            if (lines.length > 50) this.print(`${c.dim}  ... ${lines.length - 50} more lines${c.reset}\n`);
          }
          if (stderr) this.print(`${c.red}${stderr}${c.reset}\n`);
          return JSON.stringify({ stdout, stderr, exit_code: 0 });
        } catch (e: any) {
          if (e.stderr) this.print(`${c.red}${e.stderr}${c.reset}\n`);
          return JSON.stringify({ stdout: e.stdout || '', stderr: e.stderr || e.message, exit_code: e.code || 1 });
        }
      }

      case 'Read': {
        this.print(`${c.blue}  📖 ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          let content = await fs.readFile(p, 'utf-8');
          const lines = content.split('\n');
          if (input.offset || input.limit) {
            const start = input.offset || 0;
            const end = input.limit ? start + input.limit : lines.length;
            content = lines.slice(start, end).join('\n');
          }
          return JSON.stringify({ content, lines: lines.length });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Write': {
        this.print(`${c.green}  ✏️  ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          await fs.mkdir(path.dirname(p), { recursive: true });
          await fs.writeFile(p, input.content, 'utf-8');
          this.print(`${c.green}  ✓ Written${c.reset}\n`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          this.print(`${c.red}  ✗ ${e.message}${c.reset}\n`);
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Edit': {
        this.print(`${c.magenta}  ✏️  ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          let content = await fs.readFile(p, 'utf-8');
          if (!content.includes(input.old_string)) {
            this.print(`${c.red}  ✗ Text not found${c.reset}\n`);
            return JSON.stringify({ error: 'old_string not found in file' });
          }
          content = content.replace(input.old_string, input.new_string);
          await fs.writeFile(p, content, 'utf-8');
          this.print(`${c.green}  ✓ Edited${c.reset}\n`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          this.print(`${c.red}  ✗ ${e.message}${c.reset}\n`);
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Glob': {
        this.print(`${c.blue}  🔍 ${input.pattern}${c.reset}\n`);
        try {
          const dir = input.path || this.cwd;
          const { stdout } = await execAsync(`find "${dir}" -type f -name "${input.pattern}" 2>/dev/null | head -100`, { cwd: this.cwd });
          const files = stdout.trim().split('\n').filter(Boolean);
          this.print(`${c.dim}  Found ${files.length} files${c.reset}\n`);
          return JSON.stringify({ files });
        } catch {
          return JSON.stringify({ files: [] });
        }
      }

      case 'Grep': {
        this.print(`${c.blue}  🔍 "${input.pattern}"${c.reset}\n`);
        try {
          const dir = input.path || this.cwd;
          const inc = input.include ? `--include="${input.include}"` : '';
          const { stdout } = await execAsync(`grep -rn ${inc} "${input.pattern}" "${dir}" 2>/dev/null | head -100`, { cwd: this.cwd });
          const matches = stdout.trim().split('\n').filter(Boolean);
          this.print(`${c.dim}  Found ${matches.length} matches${c.reset}\n`);
          return JSON.stringify({ matches });
        } catch {
          return JSON.stringify({ matches: [] });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Chat
  // ─────────────────────────────────────────────────────────────────

  private async chat(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    const system = `You are Jump Code, an elite AI coding assistant in the terminal. You have FULL system access.

TOOLS: Bash, Read, Write, Edit, Glob, Grep

RULES:
1. DO things, don't just explain
2. Read files BEFORE editing
3. Verify changes work
4. Be concise

CONTEXT:
- Dir: ${this.cwd}
- Platform: ${process.platform}
- Model: ${this.config.model}`;

    const model = MODELS[this.config.model || 'opus'];

    let response = await this.anthropic.messages.create({
      model,
      max_tokens: 16384,
      system,
      tools,
      messages: this.history,
    });

    // Agentic loop
    while (response.stop_reason === 'tool_use') {
      const results: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text.trim()) {
          this.print(`\n${block.text}\n`);
        }
        if (block.type === 'tool_use') {
          const result = await this.runTool(block.name, block.input as Record<string, any>);
          results.push({ type: 'tool_result', tool_use_id: block.id, content: result });
        }
      }

      this.history.push({ role: 'assistant', content: response.content });
      this.history.push({ role: 'user', content: results });

      response = await this.anthropic.messages.create({
        model,
        max_tokens: 16384,
        system,
        tools,
        messages: this.history,
      });
    }

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map(b => b.text)
      .join('\n');

    this.history.push({ role: 'assistant', content: response.content });
    await this.saveMemory();

    return text;
  }

  // ─────────────────────────────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────────────────────────────

  private print(s: string): void {
    process.stdout.write(s);
  }

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => this.rl.question(prompt, resolve));
  }

  private async questionHidden(prompt: string): Promise<string> {
    return new Promise(resolve => {
      process.stdout.write(prompt);
      let input = '';
      const stdin = process.stdin;
      if (stdin.isTTY) stdin.setRawMode(true);

      const handler = (ch: Buffer) => {
        const c = ch.toString();
        if (c === '\n' || c === '\r') {
          stdin.removeListener('data', handler);
          if (stdin.isTTY) stdin.setRawMode(false);
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
      stdin.on('data', handler);
    });
  }

  private printHeader(): void {
    console.clear();
    console.log(`
${c.cyan}${c.bold}  ╭────────────────────────────────────────────────╮
  │                                                │
  │      ⚡ JUMP CODE - AI Terminal Assistant      │
  │                                                │
  ╰────────────────────────────────────────────────╯${c.reset}

  ${c.dim}Directory: ${this.cwd}${c.reset}
  ${c.dim}Model: ${c.cyan}${this.config.model}${c.reset} ${c.dim}| /model to switch | /help for commands${c.reset}
`);
  }

  // ─────────────────────────────────────────────────────────────────
  // Main
  // ─────────────────────────────────────────────────────────────────

  async run(): Promise<void> {
    await this.init();

    // Check API key
    if (!this.config.apiKey) {
      console.log(`
${c.cyan}${c.bold}  ⚡ Welcome to Jump Code${c.reset}

  ${c.dim}Enter your Anthropic API key to get started.${c.reset}
  ${c.dim}Get one at: https://console.anthropic.com/${c.reset}
`);
      const key = await this.questionHidden(`  ${c.dim}API Key:${c.reset} `);
      if (!key.startsWith('sk-ant-')) {
        console.log(`${c.red}  Invalid key format${c.reset}`);
        process.exit(1);
      }
      this.config.apiKey = key;
      await this.saveConfig();
      console.log(`${c.green}  ✓ Saved!${c.reset}\n`);
    }

    this.anthropic = new Anthropic({ apiKey: this.config.apiKey });
    this.printHeader();

    // Main loop
    while (true) {
      const input = (await this.question(`\n${c.cyan}❯${c.reset} `)).trim();
      if (!input) continue;

      // Commands
      if (input === '/exit' || input === 'exit' || input === 'quit') {
        await this.saveMemory();
        console.log(`\n${c.cyan}  👋 Later!${c.reset}\n`);
        process.exit(0);
      }

      if (input === '/clear') {
        this.history = [];
        this.printHeader();
        console.log(`${c.green}  ✓ Cleared${c.reset}`);
        continue;
      }

      if (input === '/forget') {
        this.history = [];
        try { await fs.unlink(path.join(MEMORY_DIR, `${this.hashPath(this.cwd)}.json`)); } catch {}
        console.log(`${c.green}  ✓ Memory wiped${c.reset}`);
        continue;
      }

      if (input === '/model') {
        console.log(`\n${c.cyan}  Select model:${c.reset}`);
        console.log(`  ${c.yellow}1${c.reset}) opus   ${c.dim}- Most capable${c.reset}`);
        console.log(`  ${c.yellow}2${c.reset}) sonnet ${c.dim}- Balanced${c.reset}`);
        console.log(`  ${c.yellow}3${c.reset}) haiku  ${c.dim}- Fastest${c.reset}`);
        const choice = await this.question(`\n  ${c.dim}Choice:${c.reset} `);
        const models: ModelName[] = ['opus', 'sonnet', 'haiku'];
        const idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < 3) {
          this.config.model = models[idx];
          await this.saveConfig();
          console.log(`${c.green}  ✓ Switched to ${this.config.model}${c.reset}`);
        }
        continue;
      }

      if (input === '/help') {
        console.log(`
${c.cyan}${c.bold}  Commands${c.reset}
  ${c.yellow}/model${c.reset}   Switch AI model (opus/sonnet/haiku)
  ${c.yellow}/clear${c.reset}   Clear conversation
  ${c.yellow}/forget${c.reset}  Wipe all memory
  ${c.yellow}/exit${c.reset}    Exit

${c.cyan}${c.bold}  Tips${c.reset}
  ${c.dim}• Full file system access
  • Run any command
  • Memory persists per project
  • Just say what you want!${c.reset}
`);
        continue;
      }

      // Chat
      const spinner = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
      let i = 0;
      const spin = setInterval(() => {
        process.stdout.write(`\r${c.cyan}${spinner[i]}${c.reset} Thinking...`);
        i = (i + 1) % spinner.length;
      }, 80);

      try {
        const response = await this.chat(input);
        clearInterval(spin);
        process.stdout.write('\r                    \r');
        if (response.trim()) console.log(`\n${response}`);
      } catch (e: any) {
        clearInterval(spin);
        process.stdout.write('\r                    \r');
        console.log(`${c.red}  Error: ${e.message}${c.reset}`);
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Entry
// ═══════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
${c.cyan}${c.bold}Jump Code${c.reset} - AI Terminal Assistant

${c.yellow}Usage:${c.reset}  jump-code | jc

${c.yellow}Commands:${c.reset}
  /model   Switch model (opus/sonnet/haiku)
  /clear   Clear conversation
  /forget  Wipe memory
  /exit    Exit

${c.yellow}Options:${c.reset}
  -h, --help     Help
  -v, --version  Version
  --reset        Reset config
`);
  process.exit(0);
}

if (args.includes('-v') || args.includes('--version')) {
  console.log('jump-code v1.0.0');
  process.exit(0);
}

if (args.includes('--reset')) {
  fs.rm(CONFIG_DIR, { recursive: true, force: true }).then(() => {
    console.log('Reset complete.');
  });
  process.exit(0);
}

new JumpCode().run().catch(console.error);
