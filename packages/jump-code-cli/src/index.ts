#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import * as https from 'https';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);

// ═══════════════════════════════════════════════════════════════════════════
// JUMP CODE - Free Claude Code Clone (Powered by JumpStudy)
// ═══════════════════════════════════════════════════════════════════════════

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.jump-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MEMORY_DIR = path.join(CONFIG_DIR, 'memory');

// JumpStudy wrapper API - free for everyone
const API_HOST = 'jumpstudy.ai';
const API_PATH = '/api/jump-code';

type ModelName = 'opus' | 'sonnet' | 'haiku';

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
};

interface Config {
  model: ModelName;
}

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
}

class JumpCode {
  private config: Config = { model: 'sonnet' };
  private cwd: string;
  private history: Message[] = [];
  private rl!: readline.Interface;

  constructor() {
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
    } catch {}
  }

  private async saveMemory(): Promise<void> {
    const file = path.join(MEMORY_DIR, `${this.hashPath(this.cwd)}.json`);
    await fs.writeFile(file, JSON.stringify(this.history.slice(-100), null, 2));
  }

  private async callAPI(messages: Message[]): Promise<any> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: this.config.model,
        system: `You are Jump Code, an AI coding assistant. You have access to tools to help with coding tasks.

Working directory: ${this.cwd}
Platform: ${process.platform}

Rules:
- Execute tasks, don't just explain
- Read files before editing
- Be concise`,
        messages,
      });

      const req = https.request({
        hostname: API_HOST,
        port: 443,
        path: API_PATH,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.error) {
              reject(new Error(json.error));
            } else {
              resolve(json);
            }
          } catch (e) {
            reject(new Error('Failed to parse response'));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private async runTool(name: string, input: Record<string, any>): Promise<string> {
    switch (name) {
      case 'Bash': {
        console.log(`${c.dim}$ ${input.command}${c.reset}`);
        try {
          const { stdout, stderr } = await execAsync(input.command, {
            cwd: this.cwd,
            timeout: 120000,
            maxBuffer: 10 * 1024 * 1024,
          });
          const output = (stdout + stderr).trim();
          if (output) {
            const lines = output.split('\n').slice(0, 30);
            console.log(`${c.dim}${lines.join('\n')}${c.reset}`);
            if (output.split('\n').length > 30) {
              console.log(`${c.dim}... (truncated)${c.reset}`);
            }
          }
          return JSON.stringify({ stdout, stderr, code: 0 });
        } catch (e: any) {
          console.log(`${c.red}${e.message}${c.reset}`);
          return JSON.stringify({ error: e.message, code: e.code || 1 });
        }
      }

      case 'Read': {
        console.log(`${c.dim}Reading ${input.file_path}${c.reset}`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          const content = await fs.readFile(p, 'utf-8');
          return JSON.stringify({ content });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Write': {
        console.log(`${c.dim}Writing ${input.file_path}${c.reset}`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          await fs.mkdir(path.dirname(p), { recursive: true });
          await fs.writeFile(p, input.content);
          console.log(`${c.green}✓ Written${c.reset}`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Edit': {
        console.log(`${c.dim}Editing ${input.file_path}${c.reset}`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          let content = await fs.readFile(p, 'utf-8');
          if (!content.includes(input.old_string)) {
            return JSON.stringify({ error: 'Text not found' });
          }
          content = content.replace(input.old_string, input.new_string);
          await fs.writeFile(p, content);
          console.log(`${c.green}✓ Edited${c.reset}`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Glob': {
        try {
          const searchPath = input.path || this.cwd;
          const { stdout } = await execAsync(
            `find "${searchPath}" -type f -name "${input.pattern}" 2>/dev/null | head -50`,
            { cwd: this.cwd }
          );
          return JSON.stringify({ files: stdout.trim().split('\n').filter(Boolean) });
        } catch {
          return JSON.stringify({ files: [] });
        }
      }

      case 'Grep': {
        try {
          const searchPath = input.path || this.cwd;
          const { stdout } = await execAsync(
            `grep -rn "${input.pattern}" "${searchPath}" 2>/dev/null | head -50`,
            { cwd: this.cwd }
          );
          return JSON.stringify({ matches: stdout.trim().split('\n').filter(Boolean) });
        } catch {
          return JSON.stringify({ matches: [] });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

  private async chat(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    let response = await this.callAPI(this.history);

    // Agentic loop
    while (response.stop_reason === 'tool_use') {
      const toolResults: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text) {
          console.log(`\n${block.text}`);
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

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => this.rl.question(prompt, resolve));
  }

  private printHeader(): void {
    const dir = this.cwd.replace(process.env.HOME || '', '~');
    console.log(`\n${c.cyan}${c.bold}  Jump Code${c.reset} ${c.dim}v2.2.0${c.reset}`);
    console.log(`${c.dim}  Free & unlimited - powered by JumpStudy${c.reset}\n`);
    console.log(`${c.dim}${dir}${c.reset}`);
    console.log(`${c.dim}Model: ${this.config.model} | /help for commands${c.reset}\n`);
  }

  async run(): Promise<void> {
    await this.init();
    this.printHeader();

    // Main loop
    while (true) {
      const input = (await this.question(`${c.bold}>${c.reset} `)).trim();
      if (!input) continue;

      if (input === '/exit' || input === 'exit' || input === '/quit') {
        await this.saveMemory();
        process.exit(0);
      }

      if (input === '/clear') {
        this.history = [];
        console.clear();
        this.printHeader();
        continue;
      }

      if (input === '/model') {
        console.log(`\n  1) opus   - Claude Opus 4.5 (Most capable)`);
        console.log(`  2) sonnet - Claude Sonnet 4 (Balanced)`);
        console.log(`  3) haiku  - Claude Haiku 4 (Fastest)\n`);
        const choice = await this.question(`  Choice: `);
        const models: ModelName[] = ['opus', 'sonnet', 'haiku'];
        const idx = parseInt(choice) - 1;
        if (idx >= 0 && idx < 3) {
          this.config.model = models[idx];
          await this.saveConfig();
          console.log(`\n  ${c.green}Switched to ${this.config.model}${c.reset}\n`);
        }
        continue;
      }

      if (input === '/help') {
        console.log(`
  ${c.bold}Commands${c.reset}
  /model  - Change model (opus/sonnet/haiku)
  /clear  - Clear conversation
  /exit   - Exit

  ${c.bold}About${c.reset}
  Jump Code is a free Claude Code alternative.
  Powered by JumpStudy - https://jumpstudy.ai
`);
        continue;
      }

      try {
        const response = await this.chat(input);
        if (response) console.log(`\n${response}\n`);
      } catch (e: any) {
        console.log(`\n${c.red}Error: ${e.message}${c.reset}\n`);
      }
    }
  }
}

// Entry
const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
${c.bold}Jump Code${c.reset} - Free AI coding assistant

Usage: jump-code [options]

Options:
  -h, --help     Show help
  -v, --version  Show version
  --reset        Reset configuration

Commands (in chat):
  /model  - Change model (opus/sonnet/haiku)
  /clear  - Clear conversation
  /exit   - Exit

Free & unlimited - powered by JumpStudy
https://jumpstudy.ai
`);
  process.exit(0);
}

if (args.includes('-v') || args.includes('--version')) {
  console.log('jump-code 2.2.0');
  process.exit(0);
}

if (args.includes('--reset')) {
  fs.rm(CONFIG_DIR, { recursive: true, force: true }).then(() => {
    console.log('Reset complete.');
    process.exit(0);
  });
} else {
  new JumpCode().run().catch(console.error);
}
