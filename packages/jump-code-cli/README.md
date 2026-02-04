# Jump Code CLI

> AI coding assistant for your terminal - Full Claude Code clone with unlimited usage

Jump Code is a powerful terminal-based AI assistant that gives you Claude AI with full computer control, file system access, web search, and self-modification capabilities.

## Installation

```bash
npm install -g jump-code-cli
```

## Usage

```bash
jump-code
# or
jc
```

On first run, you'll be prompted to login with your JumpStudy account.

## Features

### All Claude Code Tools
- **Bash** - Execute any shell command
- **Read/Write/Edit** - Full file system access
- **Glob/Grep** - Find files and search content
- **WebFetch/WebSearch** - Access the web
- **Task** - Spawn sub-agents for parallel work
- **NotebookEdit** - Edit Jupyter notebooks
- **TodoWrite** - Track your tasks

### Computer Control
Enable with `/computer` command:
- **Screenshot** - Capture your screen
- **MouseMove** - Move mouse cursor
- **MouseClick** - Click mouse buttons
- **Keyboard** - Type text or press keys

The AI pauses when you take control (move mouse/type).

### Self-Modification
With a master code, the AI can modify its own source:
- **SelfModify** - Edit own code
- **ReadSelf** - Read own source

### Automations
Create and run reusable automations:
- **CreateAutomation** - Save automation scripts
- **RunAutomation** - Execute saved automations

## Commands

| Command | Description |
|---------|-------------|
| `/model` | Switch model (opus/sonnet/haiku) |
| `/computer` | Toggle computer control |
| `/todos` | View current todos |
| `/automations` | View saved automations |
| `/mastercode` | Set master code for self-modification |
| `/clear` | Clear conversation |
| `/forget` | Wipe all memory |
| `/logout` | Logout |
| `/exit` | Exit |

## Security

- Permission prompts for dangerous operations
- Master code required for self-modification
- Token rotation for privacy
- Auto-approve safe tools (Read, Glob, Grep, WebFetch, WebSearch)

## Requirements

- Node.js >= 18.0.0
- JumpStudy account with Jump Code subscription

### For Computer Control (optional)
- **Linux**: `xdotool`, `imagemagick`
- **macOS**: `cliclick`

## Links

- Website: https://jumpstudy.ai
- Pricing: https://jumpstudy.ai/pricing

## License

MIT
