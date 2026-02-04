/**
 * Jump Code - Command Handler
 * Handles slash commands like /help, /read, /edit, etc.
 */

import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import figures from 'figures';

export class CommandHandler {
  constructor(app) {
    this.app = app;

    // Register commands
    this.commands = {
      help: this.cmdHelp.bind(this),
      read: this.cmdRead.bind(this),
      edit: this.cmdEdit.bind(this),
      write: this.cmdWrite.bind(this),
      search: this.cmdSearch.bind(this),
      tree: this.cmdTree.bind(this),
      run: this.cmdRun.bind(this),
      bash: this.cmdRun.bind(this),
      git: this.cmdGit.bind(this),
      screen: this.cmdScreen.bind(this),
      screenshot: this.cmdScreen.bind(this),
      click: this.cmdClick.bind(this),
      type: this.cmdType.bind(this),
      key: this.cmdKey.bind(this),
      move: this.cmdMove.bind(this),
      scroll: this.cmdScroll.bind(this),
      windows: this.cmdWindows.bind(this),
      clipboard: this.cmdClipboard.bind(this),
      clear: this.cmdClear.bind(this),
      config: this.cmdConfig.bind(this),
      model: this.cmdModel.bind(this),
      history: this.cmdHistory.bind(this),
      context: this.cmdContext.bind(this),
      exit: this.cmdExit.bind(this),
      quit: this.cmdExit.bind(this),
      about: this.cmdAbout.bind(this),
    };
  }

  /**
   * Execute a command
   */
  async execute(input) {
    const [command, ...args] = input.slice(1).split(/\s+/);
    const argStr = args.join(' ');

    if (!this.commands[command]) {
      console.log(chalk.red(`Unknown command: /${command}`));
      console.log(chalk.gray('Type /help for available commands'));
      return;
    }

    try {
      await this.commands[command](argStr, args);
    } catch (error) {
      console.error(chalk.red(`Command failed: ${error.message}`));
    }
  }

  // ==================== FILE COMMANDS ====================

  /**
   * /help - Show help menu
   */
  async cmdHelp() {
    this.app.ui.displayHelp();
  }

  /**
   * /read <file> - Read a file
   */
  async cmdRead(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /read <file>'));
      return;
    }

    const spinner = ora('Reading file...').start();

    try {
      const content = await this.app.fs.readFile(argStr);
      spinner.stop();
      this.app.ui.displayFile(argStr, content);
    } catch (error) {
      spinner.fail(chalk.red(`Could not read: ${argStr}`));
    }
  }

  /**
   * /edit <file> - Edit a file interactively
   */
  async cmdEdit(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /edit <file>'));
      return;
    }

    try {
      // Read current content
      let currentContent = '';
      try {
        currentContent = await this.app.fs.readFile(argStr);
        this.app.ui.displayFile(argStr, currentContent);
      } catch {
        console.log(chalk.yellow(`File ${argStr} does not exist. It will be created.`));
      }

      // Ask what to change
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'What would you like to do?',
          choices: [
            { name: 'Describe changes (AI will edit)', value: 'ai' },
            { name: 'Replace entire content', value: 'replace' },
            { name: 'Append content', value: 'append' },
            { name: 'Cancel', value: 'cancel' },
          ],
        },
      ]);

      if (action === 'cancel') return;

      if (action === 'ai') {
        const { description } = await inquirer.prompt([
          {
            type: 'input',
            name: 'description',
            message: 'Describe the changes:',
          },
        ]);

        // Use AI to make the edit
        console.log(chalk.cyan('\nAsking Jump Code to edit...'));
        await this.app.processRequest(`Edit the file ${argStr}: ${description}`);
      } else if (action === 'replace') {
        const { newContent } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'newContent',
            message: 'Enter new content:',
            default: currentContent,
          },
        ]);

        await this.app.fs.writeFile(argStr, newContent);
        console.log(chalk.green(`${figures.tick} File updated: ${argStr}`));
      } else if (action === 'append') {
        const { appendContent } = await inquirer.prompt([
          {
            type: 'editor',
            name: 'appendContent',
            message: 'Enter content to append:',
          },
        ]);

        await this.app.fs.writeFile(argStr, currentContent + '\n' + appendContent);
        console.log(chalk.green(`${figures.tick} Content appended to: ${argStr}`));
      }
    } catch (error) {
      console.error(chalk.red(`Edit failed: ${error.message}`));
    }
  }

  /**
   * /write <file> - Create/write a file
   */
  async cmdWrite(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /write <file>'));
      return;
    }

    const { content } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'content',
        message: 'Enter file content:',
      },
    ]);

    const spinner = ora('Writing file...').start();

    try {
      await this.app.fs.writeFile(argStr, content);
      spinner.succeed(chalk.green(`Created: ${argStr}`));
    } catch (error) {
      spinner.fail(chalk.red(`Could not write: ${argStr}`));
    }
  }

  /**
   * /search <term> - Search in files
   */
  async cmdSearch(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /search <term>'));
      return;
    }

    const spinner = ora('Searching...').start();

    try {
      const results = await this.app.fs.searchInFiles(argStr);
      spinner.stop();

      if (results.length === 0) {
        console.log(chalk.yellow(`No results found for: ${argStr}`));
        return;
      }

      console.log(chalk.cyan(`\nFound ${results.length} matches:\n`));

      for (const result of results.slice(0, 50)) {
        console.log(
          chalk.gray(`${result.file}:${result.line}`) +
          chalk.white(` ${result.content.substring(0, 100)}`)
        );
      }

      if (results.length > 50) {
        console.log(chalk.gray(`\n... and ${results.length - 50} more matches`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Search failed: ${error.message}`));
    }
  }

  /**
   * /tree - Show project structure
   */
  async cmdTree() {
    const spinner = ora('Building tree...').start();

    try {
      const tree = await this.app.fs.getTree('.', 3);
      spinner.stop();

      console.log(chalk.cyan.bold('\nProject Structure:\n'));
      this.app.ui.displayTree(tree);
      console.log('');
    } catch (error) {
      spinner.fail(chalk.red(`Tree failed: ${error.message}`));
    }
  }

  /**
   * /run <command> - Run a shell command
   */
  async cmdRun(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /run <command>'));
      return;
    }

    console.log(chalk.gray(`\n$ ${argStr}\n`));

    try {
      const result = await this.app.fs.runCommandStream(argStr, {
        onStdout: (data) => process.stdout.write(data),
        onStderr: (data) => process.stderr.write(chalk.yellow(data)),
      });

      if (!result.success) {
        console.log(chalk.red(`\nCommand exited with code ${result.exitCode}`));
      }
    } catch (error) {
      console.error(chalk.red(`Command failed: ${error.message}`));
    }

    console.log('');
  }

  /**
   * /git - Git helper
   */
  async cmdGit(argStr) {
    if (!argStr) {
      // Show git status
      await this.cmdRun('git status');
      return;
    }

    await this.cmdRun(`git ${argStr}`);
  }

  // ==================== COMPUTER CONTROL COMMANDS ====================

  /**
   * /screen - Take and analyze screenshot
   */
  async cmdScreen() {
    const spinner = ora('Capturing screen...').start();

    try {
      const screenshot = await this.app.ai.computerControl.screenshot();

      if (screenshot.success) {
        spinner.succeed(chalk.green('Screenshot captured'));
        console.log(chalk.gray(`Saved to: ${screenshot.filepath}`));

        // Ask AI to analyze
        const { analyze } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'analyze',
            message: 'Have Jump Code analyze the screenshot?',
            default: true,
          },
        ]);

        if (analyze) {
          await this.app.processRequest('Analyze this screenshot and describe what you see.');
        }
      } else {
        spinner.fail(chalk.red(`Screenshot failed: ${screenshot.error}`));
      }
    } catch (error) {
      spinner.fail(chalk.red(`Screenshot failed: ${error.message}`));
    }
  }

  /**
   * /click <x> <y> - Click at position
   */
  async cmdClick(argStr, args) {
    if (args.length < 2) {
      console.log(chalk.yellow('Usage: /click <x> <y>'));
      return;
    }

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    const result = await this.app.ai.computerControl.mouseClick({ x, y });

    if (result.success) {
      console.log(chalk.green(`${figures.tick} Clicked at (${x}, ${y})`));
    } else {
      console.log(chalk.red(`Click failed: ${result.error}`));
    }
  }

  /**
   * /type <text> - Type text
   */
  async cmdType(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /type <text>'));
      return;
    }

    const text = argStr.replace(/^["']|["']$/g, '');
    const result = await this.app.ai.computerControl.type(text);

    if (result.success) {
      console.log(chalk.green(`${figures.tick} Typed: ${text}`));
    } else {
      console.log(chalk.red(`Type failed: ${result.error}`));
    }
  }

  /**
   * /key <key> - Press a key
   */
  async cmdKey(argStr) {
    if (!argStr) {
      console.log(chalk.yellow('Usage: /key <key> (e.g., /key ctrl+c)'));
      return;
    }

    const parts = argStr.toLowerCase().split('+');
    let key, modifiers;

    if (parts.length > 1) {
      key = parts.pop();
      modifiers = parts;
    } else {
      key = parts[0];
      modifiers = [];
    }

    const result = await this.app.ai.computerControl.keyPress(key, modifiers);

    if (result.success) {
      console.log(chalk.green(`${figures.tick} Pressed: ${argStr}`));
    } else {
      console.log(chalk.red(`Key press failed: ${result.error}`));
    }
  }

  /**
   * /move <x> <y> - Move mouse
   */
  async cmdMove(argStr, args) {
    if (args.length < 2) {
      console.log(chalk.yellow('Usage: /move <x> <y>'));
      return;
    }

    const x = parseInt(args[0]);
    const y = parseInt(args[1]);

    const result = await this.app.ai.computerControl.mouseMove(x, y);

    if (result.success) {
      console.log(chalk.green(`${figures.tick} Mouse moved to (${x}, ${y})`));
    } else {
      console.log(chalk.red(`Move failed: ${result.error}`));
    }
  }

  /**
   * /scroll <amount> [direction] - Scroll
   */
  async cmdScroll(argStr, args) {
    const amount = parseInt(args[0]) || 3;
    const direction = args[1] || 'down';

    const result = await this.app.ai.computerControl.mouseScroll(amount, direction);

    if (result.success) {
      console.log(chalk.green(`${figures.tick} Scrolled ${direction} ${amount} times`));
    } else {
      console.log(chalk.red(`Scroll failed: ${result.error}`));
    }
  }

  /**
   * /windows - List open windows
   */
  async cmdWindows() {
    const result = await this.app.ai.computerControl.getWindows();

    if (result.success && result.windows) {
      console.log(chalk.cyan.bold('\nOpen Windows:\n'));
      result.windows.forEach((win, i) => {
        console.log(chalk.white(`  ${i + 1}. ${typeof win === 'string' ? win : win.name}`));
      });
      console.log('');
    } else {
      console.log(chalk.yellow('Could not list windows'));
    }
  }

  /**
   * /clipboard [get|set <text>] - Clipboard operations
   */
  async cmdClipboard(argStr, args) {
    if (!args[0] || args[0] === 'get') {
      const result = await this.app.ai.computerControl.getClipboard();
      if (result.success) {
        console.log(chalk.cyan('\nClipboard contents:\n'));
        console.log(result.content);
        console.log('');
      } else {
        console.log(chalk.red('Could not read clipboard'));
      }
    } else if (args[0] === 'set') {
      const text = args.slice(1).join(' ');
      const result = await this.app.ai.computerControl.setClipboard(text);
      if (result.success) {
        console.log(chalk.green(`${figures.tick} Clipboard set`));
      } else {
        console.log(chalk.red('Could not set clipboard'));
      }
    }
  }

  // ==================== UTILITY COMMANDS ====================

  /**
   * /clear - Clear terminal
   */
  async cmdClear() {
    console.clear();
    await this.app.showWelcome();
  }

  /**
   * /config - View/edit config
   */
  async cmdConfig() {
    const config = this.app.config.getAll();

    console.log(chalk.cyan.bold('\nJump Code Configuration:\n'));
    console.log(JSON.stringify(config, null, 2));
    console.log('');

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: [
          { name: 'Change model', value: 'model' },
          { name: 'Set API key', value: 'apikey' },
          { name: 'Toggle computer control', value: 'computer' },
          { name: 'Done', value: 'done' },
        ],
      },
    ]);

    if (action === 'model') {
      await this.cmdModel();
    } else if (action === 'apikey') {
      const { apiKey } = await inquirer.prompt([
        {
          type: 'password',
          name: 'apiKey',
          message: 'Enter OpenAI API key:',
        },
      ]);
      this.app.config.set('apiKey', apiKey);
      console.log(chalk.green(`${figures.tick} API key saved`));
    }
  }

  /**
   * /model - Change AI model
   */
  async cmdModel() {
    const { model } = await inquirer.prompt([
      {
        type: 'list',
        name: 'model',
        message: 'Select AI model:',
        choices: [
          { name: 'GPT-4o (Best quality)', value: 'gpt-4o' },
          { name: 'GPT-4o-mini (Faster, cheaper)', value: 'gpt-4o-mini' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-3.5 Turbo (Fastest)', value: 'gpt-3.5-turbo' },
          { name: 'Custom...', value: 'custom' },
        ],
      },
    ]);

    let selectedModel = model;

    if (model === 'custom') {
      const { customModel } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customModel',
          message: 'Enter model name:',
        },
      ]);
      selectedModel = customModel;
    }

    this.app.ai.model = selectedModel;
    this.app.config.set('model', selectedModel);
    console.log(chalk.green(`${figures.tick} Model set to: ${selectedModel}`));
  }

  /**
   * /history - Show conversation history
   */
  async cmdHistory() {
    const history = this.app.conversationHistory;

    if (history.length === 0) {
      console.log(chalk.yellow('No conversation history yet.'));
      return;
    }

    console.log(chalk.cyan.bold('\nConversation History:\n'));

    for (const msg of history.slice(-20)) {
      const role = msg.role === 'user' ? chalk.green('You') : chalk.cyan('Jump Code');
      const content = msg.content.substring(0, 100) + (msg.content.length > 100 ? '...' : '');
      console.log(`${role}: ${content}`);
    }

    console.log('');
  }

  /**
   * /context - Show project context
   */
  async cmdContext() {
    const context = this.app.projectContext;

    if (!context) {
      console.log(chalk.yellow('No project context available.'));
      return;
    }

    console.log(chalk.cyan.bold('\nProject Context:\n'));
    console.log(JSON.stringify(context, null, 2));
    console.log('');
  }

  /**
   * /about - About Jump Code
   */
  async cmdAbout() {
    const about = `
${chalk.cyan.bold('Jump Code')} v1.0.0

${chalk.white('AI-Powered Terminal Coding Assistant')}
${chalk.gray('Created by JumpStudy')}

Jump Code is a free, unlimited coding AI that runs
in your terminal. It can:

${chalk.green('•')} Read, write, and edit files
${chalk.green('•')} Generate and explain code
${chalk.green('•')} Run commands and scripts
${chalk.green('•')} See your screen and control your computer
${chalk.green('•')} Debug and fix issues

${chalk.gray('Free for all JumpStudy users!')}

${chalk.cyan('https://jumpstudy.co')}
`;

    this.app.ui.box(about, {
      borderColor: 'cyan',
      title: chalk.cyan(' About '),
    });
  }

  /**
   * /exit - Exit Jump Code
   */
  async cmdExit() {
    throw new Error('USER_EXIT');
  }
}

export default CommandHandler;
