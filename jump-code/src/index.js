/**
 * Jump Code - Main Application
 * AI-Powered Terminal Coding Assistant by JumpStudy
 *
 * Designed to look and work EXACTLY like Claude Code
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { EventEmitter } from 'events';

import { FileSystem } from './core/filesystem.js';
import { AIEngine } from './core/ai-engine.js';
import { ProjectAnalyzer } from './core/project-analyzer.js';
import { CommandHandler } from './commands/handler.js';
import { TerminalUI } from './ui/terminal.js';
import { Config } from './utils/config.js';

export class JumpCode extends EventEmitter {
  constructor() {
    super();

    // Jump Code Identity - KNOWS it is Jump Code
    this.identity = {
      name: 'Jump Code',
      version: '1.0.0',
      creator: 'JumpStudy',
      description: 'AI-Powered Terminal Coding Assistant',
    };

    // Core components
    this.config = new Config();
    this.fs = new FileSystem();
    this.ui = new TerminalUI(this);
    this.ai = new AIEngine(this);
    this.analyzer = new ProjectAnalyzer(this);
    this.commands = new CommandHandler(this);

    // State
    this.conversationHistory = [];
    this.projectContext = null;
    this.currentDir = process.cwd();
    this.isRunning = false;

    // Bind methods
    this.handleInput = this.handleInput.bind(this);
    this.handleExit = this.handleExit.bind(this);
  }

  /**
   * Main entry point - starts Jump Code
   */
  async run() {
    this.isRunning = true;

    // Setup signal handlers
    process.on('SIGINT', this.handleExit);
    process.on('SIGTERM', this.handleExit);

    // Show Claude Code style welcome
    this.ui.showWelcome();

    // Initialize components
    await this.initialize();

    // Start the main loop
    await this.mainLoop();
  }

  /**
   * Show welcome (Claude Code style)
   */
  async showWelcome() {
    this.ui.showWelcome();
  }

  /**
   * Initialize all components
   */
  async initialize() {
    try {
      // Load configuration
      await this.config.load();

      // Analyze current project
      this.projectContext = await this.analyzer.analyze(this.currentDir);

      // Initialize AI engine
      await this.ai.initialize();

      // Show project info (Claude Code style)
      if (this.projectContext) {
        if (this.projectContext.type && this.projectContext.type !== 'unknown') {
          this.ui.status(`${this.projectContext.language || 'Project'} ${this.projectContext.framework ? `(${this.projectContext.framework})` : ''} detected`, 'info');
        }
        if (this.projectContext.hasGit) {
          this.ui.status('Git repository', 'info');
        }
      }

      console.log('');
    } catch (error) {
      this.ui.status(`Init warning: ${error.message}`, 'warning');
    }
  }

  /**
   * Main interaction loop
   */
  async mainLoop() {
    while (this.isRunning) {
      try {
        const input = await this.ui.prompt();

        if (!input || input.trim() === '') {
          continue;
        }

        await this.handleInput(input.trim());
      } catch (error) {
        if (error.message === 'USER_EXIT') {
          break;
        }
        this.ui.status(error.message, 'error');
      }
    }
  }

  /**
   * Handle user input
   */
  async handleInput(input) {
    // Check for commands (starting with /)
    if (input.startsWith('/')) {
      return await this.commands.execute(input);
    }

    // Regular chat/code request
    await this.processRequest(input);
  }

  /**
   * Process a natural language request
   */
  async processRequest(input) {
    // Show thinking indicator (Claude Code style)
    this.ui.startThinking();

    try {
      // Build context for the AI
      const context = await this.buildContext(input);

      // Get AI response
      const response = await this.ai.chat(input, context);

      this.ui.stopThinking();

      // Process and display the response
      await this.processResponse(response);

      // Save to history
      this.conversationHistory.push({
        role: 'user',
        content: input,
        timestamp: new Date(),
      });
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      });
    } catch (error) {
      this.ui.stopThinking();
      this.ui.status(`Error: ${error.message}`, 'error');
    }
  }

  /**
   * Build context for AI request
   */
  async buildContext(input) {
    const context = {
      identity: this.identity,
      projectContext: this.projectContext,
      currentDir: this.currentDir,
      conversationHistory: this.conversationHistory.slice(-10),
      timestamp: new Date().toISOString(),
    };

    // Check if input references files
    const fileReferences = this.extractFileReferences(input);
    if (fileReferences.length > 0) {
      context.referencedFiles = await Promise.all(
        fileReferences.map(async (file) => {
          try {
            const content = await this.fs.readFile(file);
            return { path: file, content };
          } catch {
            return { path: file, error: 'File not found' };
          }
        })
      );
    }

    return context;
  }

  /**
   * Extract file references from input
   */
  extractFileReferences(input) {
    const patterns = [
      /`([^`]+\.[a-z]+)`/gi,
      /(?:^|\s)(\S+\.[a-z]{1,4})(?:\s|$)/gi,
      /(?:file|read|edit|open)\s+([^\s]+)/gi,
    ];

    const files = new Set();
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(input)) !== null) {
        files.add(match[1]);
      }
    }

    return Array.from(files);
  }

  /**
   * Process AI response and execute any actions
   */
  async processResponse(response) {
    // Check for code blocks with actions
    const actions = this.parseActions(response);

    if (actions.length > 0) {
      // Show actions and ask for confirmation (Claude Code style)
      const confirm = await this.ui.showActions(actions);

      if (confirm) {
        for (const action of actions) {
          await this.executeAction(action);
        }
      }
    }

    // Display the response (Claude Code style)
    this.ui.displayResponse(response);
  }

  /**
   * Parse actions from AI response
   */
  parseActions(response) {
    const actions = [];

    // Parse file write actions
    const writePattern = /```(?:write|create)\s+(\S+)\n([\s\S]*?)```/g;
    let match;
    while ((match = writePattern.exec(response)) !== null) {
      actions.push({
        type: 'write',
        path: match[1],
        content: match[2],
        description: `Write file: ${match[1]}`,
      });
    }

    // Parse file edit actions
    const editPattern = /```edit\s+(\S+)\n([\s\S]*?)```/g;
    while ((match = editPattern.exec(response)) !== null) {
      actions.push({
        type: 'edit',
        path: match[1],
        content: match[2],
        description: `Edit file: ${match[1]}`,
      });
    }

    // Parse bash commands
    const bashPattern = /```(?:bash|shell|sh)\n([\s\S]*?)```/g;
    while ((match = bashPattern.exec(response)) !== null) {
      const commands = match[1].trim().split('\n').filter((c) => c.trim() && !c.startsWith('#'));
      for (const cmd of commands) {
        actions.push({
          type: 'bash',
          command: cmd,
          description: `Run: ${cmd}`,
        });
      }
    }

    // Parse action blocks for computer control
    const actionPattern = /```action\n([\s\S]*?)```/g;
    while ((match = actionPattern.exec(response)) !== null) {
      const actionLines = match[1].trim().split('\n');
      for (const line of actionLines) {
        actions.push({
          type: 'computer',
          action: line.trim(),
          description: `Computer: ${line.trim()}`,
        });
      }
    }

    return actions;
  }

  /**
   * Execute a parsed action
   */
  async executeAction(action) {
    // Show tool call (Claude Code style)
    this.ui.displayToolCall(action.type, action.description);

    try {
      switch (action.type) {
        case 'write':
          await this.fs.writeFile(action.path, action.content);
          this.ui.displayToolResult(true, `Created ${action.path}`);
          break;

        case 'edit':
          await this.fs.editFile(action.path, action.content);
          this.ui.displayToolResult(true, `Updated ${action.path}`);
          break;

        case 'bash':
          const result = await this.fs.runCommand(action.command);
          if (result.success) {
            this.ui.displayToolResult(true, `Completed`);
            if (result.stdout) {
              console.log(chalk.gray(result.stdout));
            }
          } else {
            this.ui.displayToolResult(false, result.stderr || 'Command failed');
          }
          break;

        case 'computer':
          const computerResult = await this.ai.executeAction(action.action);
          if (computerResult.success) {
            this.ui.displayToolResult(true, 'Action completed');
          } else {
            this.ui.displayToolResult(false, computerResult.error || 'Action failed');
          }
          break;

        default:
          this.ui.displayToolResult(false, `Unknown action: ${action.type}`);
      }
    } catch (error) {
      this.ui.displayToolResult(false, error.message);
    }
  }

  /**
   * Handle exit (Claude Code style)
   */
  handleExit() {
    console.log(chalk.gray('\n  Goodbye!\n'));
    this.isRunning = false;
    process.exit(0);
  }
}

export default JumpCode;
