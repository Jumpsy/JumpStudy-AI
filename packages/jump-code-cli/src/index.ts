#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════════════
// CONFIG - Connects to YOUR wrapper API
// ═══════════════════════════════════════════════════════════════════

const API_URL = process.env.JUMPCODE_API_URL || 'https://jumpstudy.ai/api/jump-code';
const SUPABASE_URL = 'https://sthumeeyjjmtpnkwpdpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aHVtZWV5amptdHBua3dwZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzE2ODAsImV4cCI6MjA4NTE0NzY4MH0.G36_hvGCcy7lanZUO66ZtKgRaDQrtHY6xJsCfzA1ujY';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.jump-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MEMORY_DIR = path.join(CONFIG_DIR, 'memory');
const SESSION_FILE = path.join(CONFIG_DIR, 'session.json');

type ModelName = 'opus' | 'sonnet' | 'haiku';

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
};

interface Config {
  model: ModelName;
  sessionToken?: string;
  refreshToken?: string;
  email?: string;
  tokenRotation: number;
}

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
}

// ═══════════════════════════════════════════════════════════════════
// JUMP CODE CLI - Wrapper Edition
// ═══════════════════════════════════════════════════════════════════

class JumpCode {
  private supabase;
  private config: Config = { model: 'opus', tokenRotation: 0 };
  private cwd: string;
  private history: Message[] = [];
  private rl!: readline.Interface;
  private requestCount = 0;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.cwd = process.cwd();
  }

  private async init(): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.mkdir(MEMORY_DIR, { recursive: true });

    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch {}

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
        this.print(`${c.dim}  ✓ Restored ${Math.floor(this.history.length / 2)} messages${c.reset}\n`);
      }
    } catch {}
  }

  private async saveMemory(): Promise<void> {
    const file = path.join(MEMORY_DIR, `${this.hashPath(this.cwd)}.json`);
    await fs.writeFile(file, JSON.stringify(this.history.slice(-200), null, 2));
  }

  // ─────────────────────────────────────────────────────────────────
  // Auth - JumpStudy Account
  // ─────────────────────────────────────────────────────────────────

  private async refreshSession(): Promise<boolean> {
    if (!this.config.refreshToken) return false;

    try {
      const { data, error } = await this.supabase.auth.refreshSession({
        refresh_token: this.config.refreshToken,
      });

      if (error || !data.session) return false;

      this.config.sessionToken = data.session.access_token;
      this.config.refreshToken = data.session.refresh_token;
      this.config.tokenRotation++;
      await this.saveConfig();
      return true;
    } catch {
      return false;
    }
  }

  private async checkAuth(): Promise<boolean> {
    if (!this.config.sessionToken) return false;

    // Rotate token every 10 requests for stealth
    if (this.requestCount > 0 && this.requestCount % 10 === 0) {
      await this.refreshSession();
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser(this.config.sessionToken);
      return !!user;
    } catch {
      return await this.refreshSession();
    }
  }

  private async login(): Promise<boolean> {
    console.log(`\n${c.cyan}${c.bold}  🔐 Jump Code Login${c.reset}\n`);
    console.log(`  ${c.dim}Login with your JumpStudy account${c.reset}\n`);

    const email = await this.question(`  ${c.dim}Email:${c.reset} `);
    const password = await this.questionHidden(`  ${c.dim}Password:${c.reset} `);

    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        this.print(`\n  ${c.red}✗ ${error.message}${c.reset}\n`);
        return false;
      }

      this.config.sessionToken = data.session.access_token;
      this.config.refreshToken = data.session.refresh_token;
      this.config.email = data.user.email;
      await this.saveConfig();

      this.print(`\n  ${c.green}✓ Logged in as ${data.user.email}${c.reset}\n`);
      return true;
    } catch (e: any) {
      this.print(`\n  ${c.red}✗ ${e.message}${c.reset}\n`);
      return false;
    }
  }

  private async signup(): Promise<boolean> {
    console.log(`\n${c.cyan}${c.bold}  📝 Create Account${c.reset}\n`);

    const email = await this.question(`  ${c.dim}Email:${c.reset} `);
    const password = await this.questionHidden(`  ${c.dim}Password:${c.reset} `);

    try {
      const { data, error } = await this.supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (error) {
        this.print(`\n  ${c.red}✗ ${error.message}${c.reset}\n`);
        return false;
      }

      this.print(`\n  ${c.green}✓ Account created! Check your email to verify.${c.reset}\n`);
      return false; // Need to verify email first
    } catch (e: any) {
      this.print(`\n  ${c.red}✗ ${e.message}${c.reset}\n`);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // API Call - Through YOUR Wrapper
  // ─────────────────────────────────────────────────────────────────

  private generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async callAPI(messages: Message[]): Promise<any> {
    this.requestCount++;

    // Rotate session token periodically
    if (this.requestCount % 10 === 0) {
      await this.refreshSession();
    }

    const requestId = this.generateRequestId();
    const timestamp = Date.now();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.sessionToken}`,
        'X-Request-ID': requestId,
        'X-Timestamp': timestamp.toString(),
        'X-Client-Version': '1.0.0',
        'User-Agent': `JumpCode/${this.config.tokenRotation}`,
      },
      body: JSON.stringify({
        messages,
        model: this.config.model,
        system: this.buildSystemPrompt(),
        _rid: requestId,
        _ts: timestamp,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private buildSystemPrompt(): string {
    return `You are Jump Code, an elite AI coding assistant running in the user's terminal. You have FULL system access through tools.

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
  }

  // ─────────────────────────────────────────────────────────────────
  // Tool Execution - Local
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
          const content = await fs.readFile(p, 'utf-8');
          return JSON.stringify({ content, lines: content.split('\n').length });
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
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Edit': {
        this.print(`${c.magenta}  ✏️  ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          let content = await fs.readFile(p, 'utf-8');
          if (!content.includes(input.old_string)) {
            return JSON.stringify({ error: 'Text not found' });
          }
          content = content.replace(input.old_string, input.new_string);
          await fs.writeFile(p, content, 'utf-8');
          this.print(`${c.green}  ✓ Edited${c.reset}\n`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Glob': {
        this.print(`${c.blue}  🔍 ${input.pattern}${c.reset}\n`);
        try {
          const { stdout } = await execAsync(`find "${input.path || this.cwd}" -type f -name "${input.pattern}" 2>/dev/null | head -100`, { cwd: this.cwd });
          return JSON.stringify({ files: stdout.trim().split('\n').filter(Boolean) });
        } catch {
          return JSON.stringify({ files: [] });
        }
      }

      case 'Grep': {
        this.print(`${c.blue}  🔍 "${input.pattern}"${c.reset}\n`);
        try {
          const inc = input.include ? `--include="${input.include}"` : '';
          const { stdout } = await execAsync(`grep -rn ${inc} "${input.pattern}" "${input.path || this.cwd}" 2>/dev/null | head -100`, { cwd: this.cwd });
          return JSON.stringify({ matches: stdout.trim().split('\n').filter(Boolean) });
        } catch {
          return JSON.stringify({ matches: [] });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Chat Loop
  // ─────────────────────────────────────────────────────────────────

  private async chat(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    let response = await this.callAPI(this.history);

    // Agentic loop - process tool calls
    while (response.stop_reason === 'tool_use') {
      const toolResults: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text?.trim()) {
          this.print(`\n${block.text}\n`);
        }
        if (block.type === 'tool_use') {
          const result = await this.runTool(block.name, block.input);
          toolResults.push({
            type: 'tool_result',
            tool_use_id: block.id,
            content: result,
          });
        }
      }

      this.history.push({ role: 'assistant', content: response.content });
      this.history.push({ role: 'user', content: toolResults });

      response = await this.callAPI(this.history);
    }

    const text = response.content
      .filter((b: any) => b.type === 'text')
      .map((b: any) => b.text)
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

  private questionHidden(prompt: string): Promise<string> {
    return new Promise(resolve => {
      process.stdout.write(prompt);
      let input = '';
      const stdin = process.stdin;
      if (stdin.isTTY) stdin.setRawMode(true);

      const handler = (ch: Buffer) => {
        const char = ch.toString();
        if (char === '\n' || char === '\r') {
          stdin.removeListener('data', handler);
          if (stdin.isTTY) stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(input);
        } else if (char === '\u0003') {
          process.exit();
        } else if (char === '\u007f') {
          input = input.slice(0, -1);
        } else {
          input += char;
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
  ${c.dim}Model: ${c.cyan}${this.config.model}${c.reset} ${c.dim}| Logged in as ${this.config.email || 'Unknown'}${c.reset}
  ${c.dim}Commands: /model, /clear, /forget, /logout, /help, /exit${c.reset}
`);
  }

  // ─────────────────────────────────────────────────────────────────
  // Main
  // ─────────────────────────────────────────────────────────────────

  async run(): Promise<void> {
    await this.init();

    // Check auth
    const isAuthed = await this.checkAuth();

    if (!isAuthed) {
      console.log(`
${c.cyan}${c.bold}  ⚡ Welcome to Jump Code${c.reset}

  ${c.dim}Unlimited Claude AI in your terminal.${c.reset}

  ${c.yellow}1${c.reset}) Login
  ${c.yellow}2${c.reset}) Create Account
`);
      const choice = await this.question(`  ${c.dim}Choice:${c.reset} `);

      let success = false;
      if (choice === '1') {
        success = await this.login();
      } else if (choice === '2') {
        await this.signup();
        success = await this.login();
      }

      if (!success) {
        this.rl.close();
        process.exit(1);
      }
    }

    this.printHeader();

    // Main loop
    while (true) {
      const input = (await this.question(`\n${c.cyan}❯${c.reset} `)).trim();
      if (!input) continue;

      // Commands
      if (input === '/exit' || input === 'exit') {
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

      if (input === '/logout') {
        this.config.sessionToken = undefined;
        this.config.refreshToken = undefined;
        this.config.email = undefined;
        await this.saveConfig();
        console.log(`${c.green}  ✓ Logged out${c.reset}`);
        this.rl.close();
        process.exit(0);
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
  ${c.yellow}/model${c.reset}   Switch model (opus/sonnet/haiku)
  ${c.yellow}/clear${c.reset}   Clear conversation
  ${c.yellow}/forget${c.reset}  Wipe all memory
  ${c.yellow}/logout${c.reset}  Logout
  ${c.yellow}/exit${c.reset}    Exit
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

        // Try to refresh token on auth errors
        if (e.message.includes('401') || e.message.includes('Unauthorized')) {
          const refreshed = await this.refreshSession();
          if (!refreshed) {
            console.log(`${c.yellow}  Session expired. Please login again.${c.reset}`);
            this.config.sessionToken = undefined;
            await this.saveConfig();
          }
        }
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
  /logout  Logout
  /exit    Exit

${c.yellow}Options:${c.reset}
  -h, --help     Help
  -v, --version  Version
  --reset        Reset all data
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
