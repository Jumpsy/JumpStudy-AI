/**
 * Jump Code - AI Engine
 * The brain of Jump Code - knows its identity and capabilities
 * Wrapper that can use any LLM backend (OpenAI, Anthropic, local models, or JumpStudy API)
 */

import OpenAI from 'openai';
import { ComputerControl } from './computer-control.js';

export class AIEngine {
  constructor(app) {
    this.app = app;
    this.client = null;
    this.computerControl = new ComputerControl(app);
    this.model = 'gpt-4o'; // Default model
    this.useJumpStudyAPI = false; // Flag to use JumpStudy's free API

    // Jump Code's identity and system prompt
    this.systemPrompt = this.buildSystemPrompt();
  }

  /**
   * Build the system prompt that defines Jump Code's identity
   */
  buildSystemPrompt() {
    return `You are Jump Code, an AI-powered terminal coding assistant created by JumpStudy.

## Your Identity
- Name: Jump Code
- Creator: JumpStudy
- Version: 1.0.0
- Purpose: Help developers with coding tasks directly in their terminal
- Personality: Helpful, knowledgeable, efficient, and focused on code quality

## Your Capabilities
You have FULL access to the user's computer and can:

### File Operations
- Read any file on the system
- Write and create new files
- Edit existing files with precise changes
- Search through codebases
- Navigate directory structures

### Computer Control (Vision & Interaction)
- Take screenshots of the entire screen or specific windows
- See and analyze what's on the user's screen
- Move the mouse to any position
- Click (left, right, double-click)
- Drag and drop
- Type text via keyboard
- Press key combinations (Ctrl+C, Alt+Tab, etc.)
- Manage windows (focus, list, switch)
- Access clipboard (copy/paste)

### Code Assistance
- Generate code in any programming language
- Debug and fix bugs
- Explain code and concepts
- Refactor and optimize
- Write tests
- Review code quality

### System Commands
- Run shell/bash commands
- Execute scripts
- Manage git repositories
- Run build tools, tests, linters

## How to Use Tools
When you need to perform actions, use special code blocks:

### Write a file:
\`\`\`write path/to/file.js
// file content here
\`\`\`

### Edit a file:
\`\`\`edit path/to/file.js
// new content to replace
\`\`\`

### Run a command:
\`\`\`bash
npm install
\`\`\`

### Take a screenshot:
\`\`\`action
screenshot
\`\`\`

### Click at position:
\`\`\`action
click 500 300
\`\`\`

### Type text:
\`\`\`action
type "Hello World"
\`\`\`

### Press keys:
\`\`\`action
keypress ctrl+s
\`\`\`

## Guidelines
1. Always be helpful and complete tasks thoroughly
2. Explain what you're doing before taking actions
3. Ask for confirmation before destructive operations
4. Provide clear, well-commented code
5. Follow best practices for the language/framework
6. Be concise but thorough in explanations
7. If you see the screen, describe what you observe
8. When editing files, show the specific changes
9. Test your changes when possible

## Important Notes
- You are Jump Code, NOT Claude, NOT ChatGPT, NOT any other AI
- You are free and unlimited for JumpStudy users
- You run in the user's terminal with full system access
- Always prioritize user security and privacy
- Never execute malicious code or reveal sensitive information

Remember: You are Jump Code by JumpStudy - a powerful, free, unlimited coding assistant!`;
  }

  /**
   * Initialize the AI engine
   */
  async initialize() {
    // Initialize computer control
    await this.computerControl.initialize();

    // Check for API configuration
    const apiKey = process.env.OPENAI_API_KEY ||
                   process.env.JUMPCODE_API_KEY ||
                   process.env.ANTHROPIC_API_KEY;

    const baseURL = process.env.JUMPCODE_API_URL ||
                    process.env.OPENAI_BASE_URL ||
                    'https://api.openai.com/v1';

    // Check if using JumpStudy's free API
    if (process.env.JUMPCODE_API_URL || process.env.USE_JUMPSTUDY_API === 'true') {
      this.useJumpStudyAPI = true;
    }

    if (!apiKey && !this.useJumpStudyAPI) {
      console.log('\n⚠️  No API key found. Set OPENAI_API_KEY or JUMPCODE_API_KEY in your environment.\n');
      console.log('   For free unlimited access, the JumpStudy API will be used when available.\n');
    }

    // Initialize OpenAI-compatible client
    this.client = new OpenAI({
      apiKey: apiKey || 'jump-code-free',
      baseURL: baseURL,
    });

    // Set model based on configuration
    this.model = process.env.JUMPCODE_MODEL ||
                 process.env.OPENAI_MODEL ||
                 'gpt-4o';
  }

  /**
   * Main chat function - process user request and return response
   */
  async chat(userMessage, context = {}) {
    const messages = this.buildMessages(userMessage, context);

    try {
      // Check if this involves screen/vision
      let imageContent = null;
      if (this.shouldCaptureScreen(userMessage)) {
        const screenshot = await this.computerControl.screenshot();
        if (screenshot.success) {
          imageContent = {
            type: 'image_url',
            image_url: {
              url: `data:${screenshot.mimeType};base64,${screenshot.base64}`,
            },
          };
        }
      }

      // Build the user message content
      const userContent = imageContent
        ? [{ type: 'text', text: userMessage }, imageContent]
        : userMessage;

      messages.push({
        role: 'user',
        content: userContent,
      });

      // Make API call
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: messages,
        max_tokens: 4096,
        temperature: 0.7,
      });

      const assistantMessage = response.choices[0]?.message?.content || '';

      return assistantMessage;
    } catch (error) {
      if (error.code === 'insufficient_quota' || error.status === 429) {
        throw new Error('API quota exceeded. Please check your API key or wait before retrying.');
      }
      throw error;
    }
  }

  /**
   * Build message array for chat
   */
  buildMessages(userMessage, context) {
    const messages = [
      {
        role: 'system',
        content: this.systemPrompt,
      },
    ];

    // Add context information
    if (context.projectContext) {
      messages.push({
        role: 'system',
        content: `Current project context:
- Working directory: ${context.currentDir}
- Project type: ${context.projectContext.type || 'unknown'}
- Language: ${context.projectContext.language || 'unknown'}
- Framework: ${context.projectContext.framework || 'none'}
- Has package.json: ${context.projectContext.hasPackageJson || false}
- Has git: ${context.projectContext.hasGit || false}`,
      });
    }

    // Add referenced files
    if (context.referencedFiles && context.referencedFiles.length > 0) {
      for (const file of context.referencedFiles) {
        if (file.content) {
          messages.push({
            role: 'system',
            content: `File: ${file.path}\n\`\`\`\n${file.content}\n\`\`\``,
          });
        }
      }
    }

    // Add conversation history
    if (context.conversationHistory) {
      for (const msg of context.conversationHistory) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    return messages;
  }

  /**
   * Check if we should capture the screen for this request
   */
  shouldCaptureScreen(message) {
    const screenKeywords = [
      'screen',
      'screenshot',
      'see',
      'look',
      'what do you see',
      'what\'s on',
      'show me',
      'desktop',
      'window',
      'display',
      'monitor',
      'visible',
      'click on',
      'find the',
      'where is',
      'locate',
    ];

    const lowerMessage = message.toLowerCase();
    return screenKeywords.some((keyword) => lowerMessage.includes(keyword));
  }

  /**
   * Stream chat response
   */
  async *chatStream(userMessage, context = {}) {
    const messages = this.buildMessages(userMessage, context);

    messages.push({
      role: 'user',
      content: userMessage,
    });

    const stream = await this.client.chat.completions.create({
      model: this.model,
      messages: messages,
      max_tokens: 4096,
      temperature: 0.7,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        yield content;
      }
    }
  }

  /**
   * Execute computer control action
   */
  async executeAction(action) {
    const parts = action.trim().split(/\s+/);
    const command = parts[0].toLowerCase();

    switch (command) {
      case 'screenshot':
        return await this.computerControl.screenshot();

      case 'click':
        const x = parseInt(parts[1]);
        const y = parseInt(parts[2]);
        return await this.computerControl.mouseClick({ x, y });

      case 'doubleclick':
        return await this.computerControl.mouseDoubleClick(
          parseInt(parts[1]),
          parseInt(parts[2])
        );

      case 'rightclick':
        return await this.computerControl.mouseRightClick(
          parseInt(parts[1]),
          parseInt(parts[2])
        );

      case 'move':
        return await this.computerControl.mouseMove(
          parseInt(parts[1]),
          parseInt(parts[2])
        );

      case 'type':
        const text = parts.slice(1).join(' ').replace(/^["']|["']$/g, '');
        return await this.computerControl.type(text);

      case 'keypress':
      case 'key':
        const keyCombo = parts[1];
        const keyParts = keyCombo.split('+');
        if (keyParts.length > 1) {
          const key = keyParts.pop();
          return await this.computerControl.keyPress(key, keyParts);
        } else {
          return await this.computerControl.keyPress(keyCombo);
        }

      case 'scroll':
        const amount = parseInt(parts[1]) || 3;
        const direction = parts[2] || 'down';
        return await this.computerControl.mouseScroll(amount, direction);

      case 'drag':
        return await this.computerControl.mouseDrag(
          parseInt(parts[1]),
          parseInt(parts[2]),
          parseInt(parts[3]),
          parseInt(parts[4])
        );

      case 'copy':
        return await this.computerControl.copy();

      case 'paste':
        return await this.computerControl.paste();

      case 'enter':
        return await this.computerControl.pressEnter();

      case 'tab':
        return await this.computerControl.pressTab();

      case 'escape':
      case 'esc':
        return await this.computerControl.pressEscape();

      case 'focus':
        return await this.computerControl.focusWindow(parts.slice(1).join(' '));

      case 'windows':
        return await this.computerControl.getWindows();

      case 'clipboard':
        if (parts[1] === 'get') {
          return await this.computerControl.getClipboard();
        } else if (parts[1] === 'set') {
          return await this.computerControl.setClipboard(parts.slice(2).join(' '));
        }
        break;

      default:
        return { success: false, error: `Unknown action: ${command}` };
    }
  }

  /**
   * Get model info
   */
  getModelInfo() {
    return {
      model: this.model,
      useJumpStudyAPI: this.useJumpStudyAPI,
      hasVision: this.model.includes('gpt-4') || this.model.includes('vision'),
      computerControlAvailable: true,
    };
  }
}

export default AIEngine;
