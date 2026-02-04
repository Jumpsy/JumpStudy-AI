/**
 * Jump Code - Terminal UI
 * Designed to look EXACTLY like Claude Code in terminal
 */

import chalk from 'chalk';
import readline from 'readline';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import boxen from 'boxen';
import figures from 'figures';
import ora from 'ora';

// Configure marked for terminal - matching Claude Code's style
marked.setOptions({
  renderer: new TerminalRenderer({
    code: chalk.cyan,
    codespan: chalk.cyan.bold,
    strong: chalk.bold,
    em: chalk.italic,
    heading: chalk.bold.white,
    listitem: chalk.white,
    paragraph: chalk.white,
    link: chalk.cyan.underline,
  }),
});

export class TerminalUI {
  constructor(app) {
    this.app = app;
    this.rl = null;
    this.terminalWidth = process.stdout.columns || 80;
    this.spinner = null;

    // Update width on resize
    process.stdout.on('resize', () => {
      this.terminalWidth = process.stdout.columns || 80;
    });
  }

  /**
   * Show the Claude Code style welcome screen
   */
  showWelcome() {
    console.clear();

    // Claude Code style header
    console.log('');
    console.log(chalk.cyan.bold('╭─────────────────────────────────────────────────────────────╮'));
    console.log(chalk.cyan.bold('│') + chalk.white.bold('                        Jump Code                            ') + chalk.cyan.bold('│'));
    console.log(chalk.cyan.bold('│') + chalk.gray('            AI-Powered Terminal Coding Assistant             ') + chalk.cyan.bold('│'));
    console.log(chalk.cyan.bold('╰─────────────────────────────────────────────────────────────╯'));
    console.log('');

    // Tips section like Claude Code
    console.log(chalk.gray('  Tips:'));
    console.log(chalk.gray('  • Ask me to read, write, or edit files'));
    console.log(chalk.gray('  • I can run commands and see your screen'));
    console.log(chalk.gray('  • Type ') + chalk.cyan('/help') + chalk.gray(' for all commands'));
    console.log(chalk.gray('  • Press ') + chalk.cyan('Ctrl+C') + chalk.gray(' to exit'));
    console.log('');

    // Working directory
    const cwd = process.cwd();
    const shortCwd = cwd.length > 50 ? '...' + cwd.slice(-47) : cwd;
    console.log(chalk.gray('  cwd: ') + chalk.white(shortCwd));
    console.log('');
  }

  /**
   * Claude Code style prompt
   */
  async prompt() {
    return new Promise((resolve, reject) => {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: true,
      });

      // Claude Code style prompt with > symbol
      const promptStr = chalk.cyan.bold('> ');

      this.rl.question(promptStr, (answer) => {
        this.rl.close();

        if (answer.toLowerCase() === 'exit' || answer.toLowerCase() === '/exit') {
          reject(new Error('USER_EXIT'));
        } else {
          resolve(answer);
        }
      });

      // Handle Ctrl+C
      this.rl.on('SIGINT', () => {
        this.rl.close();
        reject(new Error('USER_EXIT'));
      });
    });
  }

  /**
   * Show thinking indicator (like Claude Code)
   */
  startThinking() {
    this.spinner = ora({
      text: chalk.gray('Thinking...'),
      spinner: {
        interval: 80,
        frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
      },
      color: 'cyan',
    }).start();
  }

  /**
   * Stop thinking indicator
   */
  stopThinking() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Display AI response in Claude Code style
   */
  displayResponse(response) {
    this.stopThinking();
    console.log('');

    // Process the response - handle code blocks specially
    const formatted = this.formatMarkdown(response);
    console.log(formatted);

    console.log('');
  }

  /**
   * Format markdown like Claude Code does
   */
  formatMarkdown(text) {
    // Handle code blocks with Claude Code styling
    let processed = text;

    // Style code blocks
    processed = processed.replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      (match, lang, code) => {
        const language = lang || '';
        const trimmedCode = code.trim();
        const lines = trimmedCode.split('\n');

        // Claude Code style code block
        let result = '\n';
        result += chalk.gray('  ┌─') + (language ? chalk.gray(` ${language} `) : '') + chalk.gray('─'.repeat(Math.max(0, 50 - (language?.length || 0)))) + '\n';

        for (const line of lines) {
          result += chalk.gray('  │ ') + chalk.cyan(line) + '\n';
        }

        result += chalk.gray('  └' + '─'.repeat(52)) + '\n';
        return result;
      }
    );

    // Style inline code
    processed = processed.replace(/`([^`]+)`/g, (match, code) => {
      return chalk.cyan.bold(code);
    });

    // Style headers
    processed = processed.replace(/^### (.+)$/gm, (match, text) => {
      return '\n' + chalk.white.bold(text);
    });
    processed = processed.replace(/^## (.+)$/gm, (match, text) => {
      return '\n' + chalk.white.bold(text);
    });
    processed = processed.replace(/^# (.+)$/gm, (match, text) => {
      return '\n' + chalk.white.bold.underline(text);
    });

    // Style bold
    processed = processed.replace(/\*\*([^*]+)\*\*/g, (match, text) => {
      return chalk.bold(text);
    });

    // Style italic
    processed = processed.replace(/\*([^*]+)\*/g, (match, text) => {
      return chalk.italic(text);
    });

    // Style bullet points
    processed = processed.replace(/^- (.+)$/gm, (match, text) => {
      return chalk.gray('  •') + ' ' + text;
    });

    // Style numbered lists
    processed = processed.replace(/^(\d+)\. (.+)$/gm, (match, num, text) => {
      return chalk.gray(`  ${num}.`) + ' ' + text;
    });

    return processed;
  }

  /**
   * Display a tool call (like Claude Code shows tool usage)
   */
  displayToolCall(toolName, description) {
    console.log('');
    console.log(chalk.gray('  ⚡ ') + chalk.cyan(toolName) + chalk.gray(` - ${description}`));
  }

  /**
   * Display tool result (like Claude Code)
   */
  displayToolResult(success, message) {
    if (success) {
      console.log(chalk.gray('  ') + chalk.green('✓') + chalk.gray(` ${message}`));
    } else {
      console.log(chalk.gray('  ') + chalk.red('✗') + chalk.gray(` ${message}`));
    }
  }

  /**
   * Display a file (Claude Code style)
   */
  displayFile(path, content, startLine = 1) {
    console.log('');
    console.log(chalk.gray('  ┌─ ') + chalk.cyan(path));

    const lines = content.split('\n');
    const lineNumWidth = String(startLine + lines.length).length;

    for (let i = 0; i < lines.length; i++) {
      const lineNum = String(startLine + i).padStart(lineNumWidth, ' ');
      console.log(chalk.gray(`  │${lineNum}│ `) + lines[i]);
    }

    console.log(chalk.gray('  └' + '─'.repeat(52)));
    console.log('');
  }

  /**
   * Display diff (Claude Code style)
   */
  displayDiff(oldContent, newContent, path) {
    console.log('');
    console.log(chalk.gray('  ┌─ ') + chalk.yellow('Changes to ') + chalk.cyan(path));

    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');

    const maxLines = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLines; i++) {
      const oldLine = oldLines[i];
      const newLine = newLines[i];

      if (oldLine === undefined) {
        console.log(chalk.gray('  │') + chalk.green('+ ') + chalk.green(newLine));
      } else if (newLine === undefined) {
        console.log(chalk.gray('  │') + chalk.red('- ') + chalk.red(oldLine));
      } else if (oldLine !== newLine) {
        console.log(chalk.gray('  │') + chalk.red('- ') + chalk.red(oldLine));
        console.log(chalk.gray('  │') + chalk.green('+ ') + chalk.green(newLine));
      }
    }

    console.log(chalk.gray('  └' + '─'.repeat(52)));
    console.log('');
  }

  /**
   * Display tree structure (Claude Code style)
   */
  displayTree(items, indent = 0) {
    const prefix = '  ' + '  '.repeat(indent);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const isLast = i === items.length - 1;
      const connector = isLast ? '└── ' : '├── ';

      if (item.type === 'directory') {
        console.log(chalk.gray(prefix + connector) + chalk.cyan.bold(item.name + '/'));
        if (item.children) {
          this.displayTree(item.children, indent + 1);
        }
      } else {
        console.log(chalk.gray(prefix + connector) + chalk.white(item.name));
      }
    }
  }

  /**
   * Show action confirmation (Claude Code style)
   */
  async showActions(actions) {
    console.log('');
    console.log(chalk.yellow.bold('  Jump Code wants to:'));

    for (const action of actions) {
      console.log(chalk.gray('  • ') + action.description);
    }

    console.log('');

    return new Promise((resolve) => {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      this.rl.question(chalk.yellow('  Allow? ') + chalk.gray('[y/n] '), (answer) => {
        this.rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Display help menu (Claude Code style)
   */
  displayHelp() {
    console.log('');
    console.log(chalk.cyan.bold('  Jump Code Commands'));
    console.log(chalk.gray('  ' + '─'.repeat(50)));
    console.log('');

    const commands = [
      ['/help', 'Show this help menu'],
      ['/read <file>', 'Read a file'],
      ['/edit <file>', 'Edit a file'],
      ['/write <file>', 'Write/create a file'],
      ['/search <term>', 'Search for text in files'],
      ['/tree', 'Show project structure'],
      ['/run <cmd>', 'Run a shell command'],
      ['/git [args]', 'Git operations'],
      ['/screen', 'Capture and analyze screen'],
      ['/click <x> <y>', 'Click at position'],
      ['/type <text>', 'Type text via keyboard'],
      ['/key <combo>', 'Press key combination'],
      ['/clear', 'Clear the terminal'],
      ['/config', 'View/edit configuration'],
      ['/model', 'Change AI model'],
      ['/exit', 'Exit Jump Code'],
    ];

    for (const [cmd, desc] of commands) {
      console.log(chalk.cyan(`  ${cmd.padEnd(18)}`) + chalk.gray(desc));
    }

    console.log('');
    console.log(chalk.gray('  Or just type naturally:'));
    console.log(chalk.white('  "Fix the bug in auth.js"'));
    console.log(chalk.white('  "Create a React component for users"'));
    console.log(chalk.white('  "Take a screenshot and tell me what you see"'));
    console.log('');
  }

  /**
   * Status message (Claude Code style)
   */
  status(message, type = 'info') {
    const icons = {
      info: chalk.cyan('ℹ'),
      success: chalk.green('✓'),
      warning: chalk.yellow('⚠'),
      error: chalk.red('✗'),
    };

    console.log(`  ${icons[type]} ${message}`);
  }

  /**
   * Prompt for confirmation
   */
  async confirm(message) {
    return new Promise((resolve) => {
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      this.rl.question(chalk.yellow(`  ${message} `) + chalk.gray('[y/n] '), (answer) => {
        this.rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  /**
   * Clear terminal
   */
  clear() {
    console.clear();
  }

  /**
   * Box display for special content
   */
  box(content, options = {}) {
    const box = boxen(content, {
      padding: options.padding || 1,
      margin: options.margin || 0,
      borderStyle: 'round',
      borderColor: options.borderColor || 'cyan',
      title: options.title,
      titleAlignment: 'center',
    });

    console.log(box);
  }
}

export default TerminalUI;
