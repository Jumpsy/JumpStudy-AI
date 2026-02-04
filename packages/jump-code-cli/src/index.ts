#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as readline from 'readline';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════════════
// JUMP CODE v2.0 - Full Claude Code Clone + Computer Control + Self-Modify
// ═══════════════════════════════════════════════════════════════════════════

const API_URL = process.env.JUMPCODE_API_URL || 'https://jumpstudy.ai/api/jump-code';
const SUPABASE_URL = 'https://sthumeeyjjmtpnkwpdpw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0aHVtZWV5amptdHBua3dwZHB3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1NzE2ODAsImV4cCI6MjA4NTE0NzY4MH0.G36_hvGCcy7lanZUO66ZtKgRaDQrtHY6xJsCfzA1ujY';

const CONFIG_DIR = path.join(process.env.HOME || process.env.USERPROFILE || '~', '.jump-code');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MEMORY_DIR = path.join(CONFIG_DIR, 'memory');
const AUTOMATIONS_DIR = path.join(CONFIG_DIR, 'automations');
const TODOS_FILE = path.join(CONFIG_DIR, 'todos.json');
const SELF_CODE_PATH = __filename.replace('/dist/', '/src/').replace('.js', '.ts');

type ModelName = 'opus' | 'sonnet' | 'haiku';

// ═══════════════════════════════════════════════════════════════════════════
// COLORS & FORMATTING
// ═══════════════════════════════════════════════════════════════════════════

const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
};

// Syntax highlighting for code blocks
function highlightCode(code: string, lang: string): string {
  const keywords: Record<string, string[]> = {
    js: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined'],
    ts: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'async', 'await', 'try', 'catch', 'throw', 'new', 'this', 'true', 'false', 'null', 'undefined', 'interface', 'type', 'enum', 'extends', 'implements'],
    py: ['def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'import', 'from', 'try', 'except', 'raise', 'with', 'as', 'True', 'False', 'None', 'and', 'or', 'not', 'in', 'is', 'lambda', 'async', 'await'],
    sh: ['if', 'then', 'else', 'fi', 'for', 'do', 'done', 'while', 'case', 'esac', 'function', 'return', 'export', 'local', 'echo', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'cat', 'grep', 'sed', 'awk'],
  };

  const langKeywords = keywords[lang] || keywords.js;
  let result = code;

  // Highlight strings
  result = result.replace(/(["'`])(?:(?!\1)[^\\]|\\.)*\1/g, `${c.green}$&${c.reset}`);

  // Highlight keywords
  for (const kw of langKeywords) {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), `${c.magenta}${kw}${c.reset}`);
  }

  // Highlight numbers
  result = result.replace(/\b(\d+\.?\d*)\b/g, `${c.yellow}$1${c.reset}`);

  // Highlight comments
  result = result.replace(/(\/\/.*$|#.*$)/gm, `${c.dim}$1${c.reset}`);

  return result;
}

// Format markdown for terminal
function formatMarkdown(text: string): string {
  let result = text;

  // Code blocks with syntax highlighting
  result = result.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
    const highlighted = highlightCode(code.trim(), lang || 'js');
    return `\n${c.dim}─────────────────────────────────────${c.reset}\n${highlighted}\n${c.dim}─────────────────────────────────────${c.reset}\n`;
  });

  // Inline code
  result = result.replace(/`([^`]+)`/g, `${c.cyan}$1${c.reset}`);

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, `${c.bold}$1${c.reset}`);

  // Headers
  result = result.replace(/^### (.+)$/gm, `\n${c.yellow}${c.bold}$1${c.reset}`);
  result = result.replace(/^## (.+)$/gm, `\n${c.cyan}${c.bold}$1${c.reset}`);
  result = result.replace(/^# (.+)$/gm, `\n${c.magenta}${c.bold}$1${c.reset}`);

  // Lists
  result = result.replace(/^- (.+)$/gm, `  ${c.dim}•${c.reset} $1`);
  result = result.replace(/^\d+\. (.+)$/gm, `  ${c.dim}→${c.reset} $1`);

  return result;
}

// ═══════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════

interface Config {
  model: ModelName;
  sessionToken?: string;
  refreshToken?: string;
  email?: string;
  tokenRotation: number;
  masterCodeHash?: string;
  computerControlEnabled: boolean;
  autoApproveTools: string[];
  theme: 'dark' | 'light';
}

interface Message {
  role: 'user' | 'assistant';
  content: string | any[];
}

interface Todo {
  id: string;
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: string;
}

interface Automation {
  id: string;
  name: string;
  description: string;
  trigger: string;
  actions: string[];
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// DANGEROUS OPERATIONS (require confirmation)
// ═══════════════════════════════════════════════════════════════════════════

const DANGEROUS_PATTERNS = [
  /rm\s+(-rf?|--recursive)\s+[\/~]/i,
  /rm\s+.*\*/,
  /mkfs/i,
  /dd\s+if=/i,
  />\s*\/dev\//,
  /chmod\s+777/,
  /curl.*\|\s*(ba)?sh/i,
  /wget.*\|\s*(ba)?sh/i,
  /eval\s*\(/,
  /sudo\s+rm/,
  /git\s+push.*--force/,
  /git\s+reset\s+--hard/,
  /DROP\s+TABLE/i,
  /DELETE\s+FROM.*WHERE\s+1/i,
  /format\s+[a-z]:/i,
];

function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(command));
}

// ═══════════════════════════════════════════════════════════════════════════
// JUMP CODE CLASS
// ═══════════════════════════════════════════════════════════════════════════

class JumpCode {
  private supabase;
  private config: Config = {
    model: 'opus',
    tokenRotation: 0,
    computerControlEnabled: false,
    autoApproveTools: ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch'],
    theme: 'dark',
  };
  private cwd: string;
  private history: Message[] = [];
  private todos: Todo[] = [];
  private rl!: readline.Interface;
  private requestCount = 0;
  private userTakeover = false;
  private lastUserInput = Date.now();

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.cwd = process.cwd();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────────────────

  private async init(): Promise<void> {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    await fs.mkdir(MEMORY_DIR, { recursive: true });
    await fs.mkdir(AUTOMATIONS_DIR, { recursive: true });

    try {
      const data = await fs.readFile(CONFIG_FILE, 'utf-8');
      this.config = { ...this.config, ...JSON.parse(data) };
    } catch {}

    try {
      const data = await fs.readFile(TODOS_FILE, 'utf-8');
      this.todos = JSON.parse(data);
    } catch {}

    await this.loadMemory();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Track user input for takeover detection
    process.stdin.on('data', () => {
      this.lastUserInput = Date.now();
    });
  }

  private async saveConfig(): Promise<void> {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2));
  }

  private async saveTodos(): Promise<void> {
    await fs.writeFile(TODOS_FILE, JSON.stringify(this.todos, null, 2));
  }

  private hashPath(p: string): string {
    return crypto.createHash('md5').update(p).digest('hex').slice(0, 12);
  }

  private hashCode(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
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

  // ─────────────────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────────────────────────────────

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

      this.print(`\n  ${c.green}✓ Account created! Check email to verify.${c.reset}\n`);
      return false;
    } catch (e: any) {
      this.print(`\n  ${c.red}✗ ${e.message}${c.reset}\n`);
      return false;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SELF-MODIFICATION
  // ─────────────────────────────────────────────────────────────────────────

  private async setupMasterCode(): Promise<void> {
    if (this.config.masterCodeHash) return;

    console.log(`\n${c.yellow}${c.bold}  🔑 Set Master Code${c.reset}`);
    console.log(`  ${c.dim}This code allows AI to modify itself${c.reset}\n`);

    const code = await this.questionHidden(`  ${c.dim}Master Code:${c.reset} `);
    const confirm = await this.questionHidden(`  ${c.dim}Confirm:${c.reset} `);

    if (code !== confirm) {
      this.print(`\n  ${c.red}✗ Codes don't match${c.reset}\n`);
      return;
    }

    this.config.masterCodeHash = this.hashCode(code);
    await this.saveConfig();
    this.print(`\n  ${c.green}✓ Master code set${c.reset}\n`);
  }

  private async verifySelfModifyCode(): Promise<boolean> {
    if (!this.config.masterCodeHash) {
      await this.setupMasterCode();
      if (!this.config.masterCodeHash) return false;
    }

    const code = await this.questionHidden(`\n  ${c.yellow}🔑 Enter master code to allow self-modification:${c.reset} `);
    return this.hashCode(code) === this.config.masterCodeHash;
  }

  private async selfModify(changes: string): Promise<string> {
    const verified = await this.verifySelfModifyCode();
    if (!verified) {
      return JSON.stringify({ error: 'Invalid master code. Self-modification denied.' });
    }

    try {
      // Read current source
      const currentSource = await fs.readFile(SELF_CODE_PATH, 'utf-8');

      // Backup
      const backupPath = `${SELF_CODE_PATH}.backup.${Date.now()}`;
      await fs.writeFile(backupPath, currentSource);

      // Apply changes
      await fs.writeFile(SELF_CODE_PATH, changes);

      this.print(`\n${c.green}  ✓ Self-modification applied${c.reset}`);
      this.print(`\n${c.dim}  Backup: ${backupPath}${c.reset}`);
      this.print(`\n${c.yellow}  Run 'npm run build' in jump-code-cli to apply changes${c.reset}\n`);

      return JSON.stringify({ success: true, backup: backupPath });
    } catch (e: any) {
      return JSON.stringify({ error: e.message });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API
  // ─────────────────────────────────────────────────────────────────────────

  private generateRequestId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private async callAPI(messages: Message[]): Promise<any> {
    this.requestCount++;

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
        'X-Client-Version': '2.0.0',
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
    const todoList = this.todos.length > 0
      ? `\n\nCURRENT TODOS:\n${this.todos.map(t => `- [${t.status}] ${t.content}`).join('\n')}`
      : '';

    return `You are Jump Code v2.0, an elite AI assistant with FULL computer control.

AVAILABLE TOOLS:
- Bash: Execute any shell command
- Read: Read file contents
- Write: Write/create files
- Edit: Edit files (find & replace)
- Glob: Find files by pattern
- Grep: Search file contents
- WebFetch: Fetch URL content
- WebSearch: Search the web
- Screenshot: Capture screen
- MouseMove: Move mouse to x,y
- MouseClick: Click mouse button
- Keyboard: Type text or press keys
- TodoWrite: Manage task list
- CreateAutomation: Create reusable automation
- RunAutomation: Run saved automation
- SelfModify: Modify own source code (requires master code)
- Task: Spawn sub-agent for parallel work

RULES:
1. EXECUTE tasks, don't just explain
2. Read files BEFORE editing
3. Use todos to track complex tasks
4. Ask permission for dangerous operations
5. If user takes control (moves mouse/types), PAUSE and wait
6. For self-modification, ALWAYS require master code verification

CONTEXT:
- Directory: ${this.cwd}
- Platform: ${process.platform}
- Model: ${this.config.model}
- Computer Control: ${this.config.computerControlEnabled ? 'ENABLED' : 'DISABLED'}
${todoList}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PERMISSION SYSTEM
  // ─────────────────────────────────────────────────────────────────────────

  private async requestPermission(tool: string, action: string): Promise<boolean> {
    if (this.config.autoApproveTools.includes(tool)) return true;

    this.print(`\n${c.yellow}${c.bold}  ⚠️  Permission Required${c.reset}\n`);
    this.print(`  ${c.dim}Tool:${c.reset} ${tool}\n`);
    this.print(`  ${c.dim}Action:${c.reset} ${action}\n`);

    const answer = await this.question(`\n  ${c.cyan}Allow? (y/n/always):${c.reset} `);

    if (answer.toLowerCase() === 'always') {
      this.config.autoApproveTools.push(tool);
      await this.saveConfig();
      return true;
    }

    return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes';
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TOOL EXECUTION
  // ─────────────────────────────────────────────────────────────────────────

  private async runTool(name: string, input: Record<string, any>): Promise<string> {
    // Check for user takeover (recent input within 500ms means user is active)
    if (Date.now() - this.lastUserInput < 500) {
      this.userTakeover = true;
      this.print(`\n${c.yellow}  ⏸️  Paused - you have control${c.reset}\n`);
      await this.question(`  ${c.dim}Press Enter when ready to continue...${c.reset}`);
      this.userTakeover = false;
    }

    switch (name) {
      // ═══════════════════════════════════════════════════════════════════
      // FILE OPERATIONS
      // ═══════════════════════════════════════════════════════════════════

      case 'Bash': {
        const cmd = input.command;

        // Check for dangerous commands
        if (isDangerous(cmd)) {
          const approved = await this.requestPermission('Bash', cmd);
          if (!approved) return JSON.stringify({ error: 'Permission denied' });
        }

        this.print(`\n${c.yellow}  ⚡ ${cmd}${c.reset}\n`);
        try {
          const { stdout, stderr } = await execAsync(cmd, {
            cwd: this.cwd,
            timeout: 300000,
            maxBuffer: 50 * 1024 * 1024,
          });
          if (stdout) {
            const lines = stdout.split('\n');
            const display = lines.slice(0, 50).join('\n');
            this.print(`${c.dim}${display}${c.reset}\n`);
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

          // Apply offset and limit
          if (input.offset || input.limit) {
            const lines = content.split('\n');
            const offset = input.offset || 0;
            const limit = input.limit || lines.length;
            content = lines.slice(offset, offset + limit).join('\n');
          }

          return JSON.stringify({ content, lines: content.split('\n').length });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Write': {
        const approved = await this.requestPermission('Write', input.file_path);
        if (!approved) return JSON.stringify({ error: 'Permission denied' });

        this.print(`${c.green}  ✏️  ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          await fs.mkdir(path.dirname(p), { recursive: true });
          await fs.writeFile(p, input.content, 'utf-8');
          this.print(`${c.green}  ✓ Written ${input.content.length} bytes${c.reset}\n`);
          return JSON.stringify({ success: true, bytes: input.content.length });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Edit': {
        const approved = await this.requestPermission('Edit', input.file_path);
        if (!approved) return JSON.stringify({ error: 'Permission denied' });

        this.print(`${c.magenta}  ✏️  ${input.file_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.file_path) ? input.file_path : path.join(this.cwd, input.file_path);
          let content = await fs.readFile(p, 'utf-8');

          if (!content.includes(input.old_string)) {
            return JSON.stringify({ error: 'Text not found in file' });
          }

          const replaceAll = input.replace_all || false;
          if (replaceAll) {
            content = content.split(input.old_string).join(input.new_string);
          } else {
            content = content.replace(input.old_string, input.new_string);
          }

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
          const searchPath = input.path || this.cwd;
          const { stdout } = await execAsync(
            `find "${searchPath}" -type f -name "${input.pattern}" 2>/dev/null | head -100`,
            { cwd: this.cwd }
          );
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
          const inc = input.include ? `--include="${input.include}"` : '';
          const searchPath = input.path || this.cwd;
          const { stdout } = await execAsync(
            `grep -rn ${inc} "${input.pattern}" "${searchPath}" 2>/dev/null | head -100`,
            { cwd: this.cwd }
          );
          const matches = stdout.trim().split('\n').filter(Boolean);
          this.print(`${c.dim}  Found ${matches.length} matches${c.reset}\n`);
          return JSON.stringify({ matches });
        } catch {
          return JSON.stringify({ matches: [] });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // WEB OPERATIONS
      // ═══════════════════════════════════════════════════════════════════

      case 'WebFetch': {
        this.print(`${c.blue}  🌐 ${input.url}${c.reset}\n`);
        try {
          const content = await this.fetchUrl(input.url);
          return JSON.stringify({ content: content.slice(0, 50000) });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'WebSearch': {
        this.print(`${c.blue}  🔎 "${input.query}"${c.reset}\n`);
        try {
          // Use DuckDuckGo HTML search (no API key needed)
          const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(input.query)}`;
          const html = await this.fetchUrl(url);

          // Extract results
          const results: string[] = [];
          const regex = /<a rel="nofollow" class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
          let match;
          while ((match = regex.exec(html)) !== null && results.length < 10) {
            results.push(`${match[2]}: ${match[1]}`);
          }

          this.print(`${c.dim}  Found ${results.length} results${c.reset}\n`);
          return JSON.stringify({ results });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // COMPUTER CONTROL
      // ═══════════════════════════════════════════════════════════════════

      case 'Screenshot': {
        if (!this.config.computerControlEnabled) {
          return JSON.stringify({ error: 'Computer control disabled. Use /computer to enable.' });
        }

        this.print(`${c.blue}  📸 Taking screenshot...${c.reset}\n`);
        try {
          const filename = input.filename || `/tmp/screenshot_${Date.now()}.png`;

          if (process.platform === 'linux') {
            await execAsync(`import -window root ${filename}`);
          } else if (process.platform === 'darwin') {
            await execAsync(`screencapture ${filename}`);
          } else {
            return JSON.stringify({ error: 'Unsupported platform' });
          }

          this.print(`${c.green}  ✓ Saved to ${filename}${c.reset}\n`);
          return JSON.stringify({ success: true, path: filename });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'MouseMove': {
        if (!this.config.computerControlEnabled) {
          return JSON.stringify({ error: 'Computer control disabled. Use /computer to enable.' });
        }

        const approved = await this.requestPermission('MouseMove', `Move to (${input.x}, ${input.y})`);
        if (!approved) return JSON.stringify({ error: 'Permission denied' });

        this.print(`${c.blue}  🖱️  Moving to (${input.x}, ${input.y})${c.reset}\n`);
        try {
          if (process.platform === 'linux') {
            await execAsync(`xdotool mousemove ${input.x} ${input.y}`);
          } else if (process.platform === 'darwin') {
            await execAsync(`cliclick m:${input.x},${input.y}`);
          }
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'MouseClick': {
        if (!this.config.computerControlEnabled) {
          return JSON.stringify({ error: 'Computer control disabled. Use /computer to enable.' });
        }

        const button = input.button || 'left';
        const approved = await this.requestPermission('MouseClick', `${button} click`);
        if (!approved) return JSON.stringify({ error: 'Permission denied' });

        this.print(`${c.blue}  🖱️  ${button} click${c.reset}\n`);
        try {
          if (process.platform === 'linux') {
            const btn = button === 'right' ? '3' : button === 'middle' ? '2' : '1';
            await execAsync(`xdotool click ${btn}`);
          } else if (process.platform === 'darwin') {
            const btn = button === 'right' ? 'rc' : 'c';
            await execAsync(`cliclick ${btn}:.`);
          }
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      case 'Keyboard': {
        if (!this.config.computerControlEnabled) {
          return JSON.stringify({ error: 'Computer control disabled. Use /computer to enable.' });
        }

        const approved = await this.requestPermission('Keyboard', input.text || input.keys);
        if (!approved) return JSON.stringify({ error: 'Permission denied' });

        try {
          if (input.text) {
            this.print(`${c.blue}  ⌨️  Typing "${input.text.slice(0, 30)}..."${c.reset}\n`);
            if (process.platform === 'linux') {
              await execAsync(`xdotool type "${input.text.replace(/"/g, '\\"')}"`);
            } else if (process.platform === 'darwin') {
              await execAsync(`cliclick t:"${input.text.replace(/"/g, '\\"')}"`);
            }
          } else if (input.keys) {
            this.print(`${c.blue}  ⌨️  Pressing ${input.keys}${c.reset}\n`);
            if (process.platform === 'linux') {
              await execAsync(`xdotool key ${input.keys}`);
            }
          }
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // TODO MANAGEMENT
      // ═══════════════════════════════════════════════════════════════════

      case 'TodoWrite': {
        this.todos = input.todos.map((t: any) => ({
          ...t,
          id: t.id || crypto.randomUUID(),
          createdAt: t.createdAt || new Date().toISOString(),
        }));
        await this.saveTodos();

        this.print(`\n${c.cyan}  📋 Todos Updated${c.reset}\n`);
        for (const todo of this.todos) {
          const icon = todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '→' : '○';
          const color = todo.status === 'completed' ? c.green : todo.status === 'in_progress' ? c.yellow : c.dim;
          this.print(`  ${color}${icon} ${todo.content}${c.reset}\n`);
        }

        return JSON.stringify({ success: true, count: this.todos.length });
      }

      // ═══════════════════════════════════════════════════════════════════
      // AUTOMATIONS
      // ═══════════════════════════════════════════════════════════════════

      case 'CreateAutomation': {
        const automation: Automation = {
          id: crypto.randomUUID(),
          name: input.name,
          description: input.description,
          trigger: input.trigger,
          actions: input.actions,
          createdAt: new Date().toISOString(),
        };

        const automationFile = path.join(AUTOMATIONS_DIR, `${automation.id}.json`);
        await fs.writeFile(automationFile, JSON.stringify(automation, null, 2));

        this.print(`${c.green}  ✓ Automation "${input.name}" created${c.reset}\n`);
        return JSON.stringify({ success: true, id: automation.id });
      }

      case 'RunAutomation': {
        try {
          const files = await fs.readdir(AUTOMATIONS_DIR);
          let automation: Automation | null = null;

          for (const file of files) {
            const data = await fs.readFile(path.join(AUTOMATIONS_DIR, file), 'utf-8');
            const auto = JSON.parse(data);
            if (auto.name === input.name || auto.id === input.name) {
              automation = auto;
              break;
            }
          }

          if (!automation) {
            return JSON.stringify({ error: `Automation "${input.name}" not found` });
          }

          this.print(`${c.cyan}  ▶️  Running "${automation.name}"${c.reset}\n`);

          // Execute each action
          const results: any[] = [];
          for (const action of automation.actions) {
            const { stdout, stderr } = await execAsync(action, { cwd: this.cwd });
            results.push({ action, stdout, stderr });
          }

          return JSON.stringify({ success: true, results });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // SELF-MODIFICATION
      // ═══════════════════════════════════════════════════════════════════

      case 'SelfModify': {
        this.print(`\n${c.yellow}${c.bold}  ⚠️  Self-Modification Requested${c.reset}\n`);
        return await this.selfModify(input.new_source);
      }

      case 'ReadSelf': {
        try {
          const source = await fs.readFile(SELF_CODE_PATH, 'utf-8');
          return JSON.stringify({ source, path: SELF_CODE_PATH });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // TASK (SUB-AGENTS)
      // ═══════════════════════════════════════════════════════════════════

      case 'Task': {
        this.print(`${c.cyan}  🤖 Spawning sub-agent: ${input.description}${c.reset}\n`);

        // Create a mini conversation for the sub-task
        const subMessages: Message[] = [
          { role: 'user', content: input.prompt }
        ];

        try {
          const response = await this.callAPI(subMessages);
          const result = response.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join('\n');

          return JSON.stringify({ result });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      // ═══════════════════════════════════════════════════════════════════
      // NOTEBOOK EDIT
      // ═══════════════════════════════════════════════════════════════════

      case 'NotebookEdit': {
        this.print(`${c.magenta}  📓 ${input.notebook_path}${c.reset}\n`);
        try {
          const p = path.isAbsolute(input.notebook_path) ? input.notebook_path : path.join(this.cwd, input.notebook_path);
          const content = await fs.readFile(p, 'utf-8');
          const notebook = JSON.parse(content);

          if (input.edit_mode === 'insert') {
            const newCell = {
              cell_type: input.cell_type || 'code',
              source: input.new_source.split('\n'),
              metadata: {},
              ...(input.cell_type === 'code' ? { outputs: [], execution_count: null } : {}),
            };

            if (input.cell_number !== undefined) {
              notebook.cells.splice(input.cell_number, 0, newCell);
            } else {
              notebook.cells.push(newCell);
            }
          } else if (input.edit_mode === 'delete') {
            notebook.cells.splice(input.cell_number, 1);
          } else {
            // Replace
            if (notebook.cells[input.cell_number]) {
              notebook.cells[input.cell_number].source = input.new_source.split('\n');
            }
          }

          await fs.writeFile(p, JSON.stringify(notebook, null, 2));
          this.print(`${c.green}  ✓ Notebook updated${c.reset}\n`);
          return JSON.stringify({ success: true });
        } catch (e: any) {
          return JSON.stringify({ error: e.message });
        }
      }

      default:
        return JSON.stringify({ error: `Unknown tool: ${name}` });
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // WEB FETCH HELPER
  // ─────────────────────────────────────────────────────────────────────────

  private fetchUrl(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;

      const req = protocol.get(url, {
        headers: { 'User-Agent': 'JumpCode/2.0' },
        timeout: 30000,
      }, (res) => {
        // Follow redirects
        if (res.statusCode === 301 || res.statusCode === 302) {
          if (res.headers.location) {
            this.fetchUrl(res.headers.location).then(resolve).catch(reject);
            return;
          }
        }

        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(data));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // CHAT LOOP
  // ─────────────────────────────────────────────────────────────────────────

  private async chat(message: string): Promise<string> {
    this.history.push({ role: 'user', content: message });

    let response = await this.callAPI(this.history);

    // Agentic loop - process tool calls
    while (response.stop_reason === 'tool_use') {
      const toolResults: any[] = [];

      for (const block of response.content) {
        if (block.type === 'text' && block.text?.trim()) {
          this.print(`\n${formatMarkdown(block.text)}\n`);
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

    return formatMarkdown(text);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UI HELPERS
  // ─────────────────────────────────────────────────────────────────────────

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
${c.cyan}${c.bold}  ╭─────────────────────────────────────────────────────────╮
  │                                                         │
  │   ⚡ JUMP CODE v2.0 - Ultimate AI Terminal Assistant    │
  │                                                         │
  ╰─────────────────────────────────────────────────────────╯${c.reset}

  ${c.dim}Directory:${c.reset} ${this.cwd}
  ${c.dim}Model:${c.reset} ${c.cyan}${this.config.model}${c.reset} ${c.dim}|${c.reset} ${c.dim}User:${c.reset} ${this.config.email || 'Unknown'}
  ${c.dim}Computer Control:${c.reset} ${this.config.computerControlEnabled ? `${c.green}ENABLED${c.reset}` : `${c.red}DISABLED${c.reset}`}

  ${c.dim}Commands: /model /computer /todos /automations /clear /forget /help /exit${c.reset}
`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN
  // ─────────────────────────────────────────────────────────────────────────

  async run(): Promise<void> {
    await this.init();

    const isAuthed = await this.checkAuth();

    if (!isAuthed) {
      console.log(`
${c.cyan}${c.bold}  ⚡ Welcome to Jump Code v2.0${c.reset}

  ${c.dim}Unlimited Claude AI + Full Computer Control${c.reset}

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

    // Setup master code if not set
    if (!this.config.masterCodeHash) {
      const setup = await this.question(`\n  ${c.yellow}Set up master code for self-modification? (y/n):${c.reset} `);
      if (setup.toLowerCase() === 'y') {
        await this.setupMasterCode();
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

      if (input === '/computer') {
        this.config.computerControlEnabled = !this.config.computerControlEnabled;
        await this.saveConfig();
        const status = this.config.computerControlEnabled ? `${c.green}ENABLED${c.reset}` : `${c.red}DISABLED${c.reset}`;
        console.log(`\n  Computer Control: ${status}`);
        if (this.config.computerControlEnabled) {
          console.log(`\n  ${c.dim}Required tools:${c.reset}`);
          console.log(`  ${c.dim}- Linux: xdotool, import (imagemagick)${c.reset}`);
          console.log(`  ${c.dim}- macOS: cliclick, screencapture${c.reset}`);
        }
        continue;
      }

      if (input === '/todos') {
        console.log(`\n${c.cyan}${c.bold}  📋 Current Todos${c.reset}\n`);
        if (this.todos.length === 0) {
          console.log(`  ${c.dim}No todos${c.reset}`);
        } else {
          for (const todo of this.todos) {
            const icon = todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '→' : '○';
            const color = todo.status === 'completed' ? c.green : todo.status === 'in_progress' ? c.yellow : c.dim;
            console.log(`  ${color}${icon} ${todo.content}${c.reset}`);
          }
        }
        continue;
      }

      if (input === '/automations') {
        console.log(`\n${c.cyan}${c.bold}  🤖 Saved Automations${c.reset}\n`);
        try {
          const files = await fs.readdir(AUTOMATIONS_DIR);
          if (files.length === 0) {
            console.log(`  ${c.dim}No automations${c.reset}`);
          } else {
            for (const file of files) {
              const data = await fs.readFile(path.join(AUTOMATIONS_DIR, file), 'utf-8');
              const auto = JSON.parse(data);
              console.log(`  ${c.yellow}${auto.name}${c.reset} - ${auto.description}`);
            }
          }
        } catch {
          console.log(`  ${c.dim}No automations${c.reset}`);
        }
        continue;
      }

      if (input === '/mastercode') {
        await this.setupMasterCode();
        continue;
      }

      if (input === '/help') {
        console.log(`
${c.cyan}${c.bold}  Commands${c.reset}
  ${c.yellow}/model${c.reset}       Switch model (opus/sonnet/haiku)
  ${c.yellow}/computer${c.reset}    Toggle computer control (mouse/keyboard/screen)
  ${c.yellow}/todos${c.reset}       View current todos
  ${c.yellow}/automations${c.reset} View saved automations
  ${c.yellow}/mastercode${c.reset}  Set/change master code for self-modification
  ${c.yellow}/clear${c.reset}       Clear conversation
  ${c.yellow}/forget${c.reset}      Wipe all memory
  ${c.yellow}/logout${c.reset}      Logout
  ${c.yellow}/exit${c.reset}        Exit

${c.cyan}${c.bold}  Features${c.reset}
  ${c.dim}•${c.reset} Full file system access (read, write, edit, search)
  ${c.dim}•${c.reset} Web search and fetch
  ${c.dim}•${c.reset} Computer control (mouse, keyboard, screenshots)
  ${c.dim}•${c.reset} Todo tracking
  ${c.dim}•${c.reset} Automation creation and execution
  ${c.dim}•${c.reset} Self-modification (with master code)
  ${c.dim}•${c.reset} Jupyter notebook editing
  ${c.dim}•${c.reset} Git integration (via bash)

${c.cyan}${c.bold}  Self-Modification${c.reset}
  ${c.dim}Ask the AI to modify itself and provide the master code when prompted.
  Example: "Add a new tool that can send emails"${c.reset}
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

// ═══════════════════════════════════════════════════════════════════════════
// ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);

if (args.includes('-h') || args.includes('--help')) {
  console.log(`
${c.cyan}${c.bold}Jump Code v2.0${c.reset} - Ultimate AI Terminal Assistant

${c.yellow}Usage:${c.reset}  jump-code | jc

${c.yellow}Features:${c.reset}
  • Full Claude AI (opus/sonnet/haiku)
  • File operations (read, write, edit, search)
  • Web search and fetch
  • Computer control (mouse, keyboard, screen)
  • Todo tracking
  • Automation creation
  • Self-modification capability
  • Jupyter notebook editing

${c.yellow}Commands:${c.reset}
  /model       Switch model
  /computer    Toggle computer control
  /todos       View todos
  /automations View saved automations
  /mastercode  Set master code
  /clear       Clear conversation
  /forget      Wipe memory
  /logout      Logout
  /exit        Exit

${c.yellow}Options:${c.reset}
  -h, --help     Help
  -v, --version  Version
  --reset        Reset all data
`);
  process.exit(0);
}

if (args.includes('-v') || args.includes('--version')) {
  console.log('jump-code v2.0.0');
  process.exit(0);
}

if (args.includes('--reset')) {
  fs.rm(CONFIG_DIR, { recursive: true, force: true }).then(() => {
    console.log('Reset complete.');
  });
  process.exit(0);
}

new JumpCode().run().catch(console.error);
