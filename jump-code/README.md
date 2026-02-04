# Jump Code

AI-Powered Terminal Coding Assistant by JumpStudy

```
╦╦ ╦╔╦╗╔═╗  ╔═╗╔═╗╔╦╗╔═╗
║║ ║║║║╠═╝  ║  ║ ║ ║║║╣
╚╝╚═╝╩ ╩╩    ╚═╝╚═╝═╩╝╚═╝
```

**Free & Unlimited** for all JumpStudy users!

## Features

- **File Operations**: Read, write, edit, and search files
- **Code Generation**: Generate code in any language
- **Code Explanation**: Understand any codebase
- **Debugging**: Fix bugs and errors
- **Computer Control**: Mouse, keyboard, screen capture
- **Vision**: See and analyze your screen
- **Git Integration**: Full git workflow support
- **Project Awareness**: Understands your project context

## Installation

```bash
# Clone and setup
cd jump-code
./setup.sh

# Or manually
npm install
npm link
```

## Usage

```bash
# Start Jump Code
jump-code

# Or use the short alias
jc
```

## Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help menu |
| `/read <file>` | Read a file |
| `/edit <file>` | Edit a file |
| `/write <file>` | Create/write a file |
| `/search <term>` | Search in files |
| `/tree` | Show project structure |
| `/run <cmd>` | Run shell command |
| `/git` | Git operations |
| `/screen` | Take screenshot |
| `/click <x> <y>` | Click at position |
| `/type <text>` | Type text |
| `/key <combo>` | Press keys (e.g., ctrl+s) |
| `/clear` | Clear terminal |
| `/config` | View/edit settings |
| `/exit` | Exit Jump Code |

## Natural Language

Just type naturally:

```
"Fix the bug in auth.js"
"Create a new React component for user profiles"
"Explain how the API routes work"
"Run the tests and fix any failures"
"Take a screenshot and tell me what you see"
"Click on the submit button"
```

## Computer Control

Jump Code can see and control your computer:

```
/screen           # Take a screenshot
/click 500 300    # Click at coordinates
/type "Hello"     # Type text
/key ctrl+s       # Press key combination
/scroll 5 down    # Scroll
/windows          # List open windows
```

## Configuration

Settings are stored in `~/.jump-code/config.json`

```bash
/config           # View and edit settings
/model            # Change AI model
```

## API Configuration

Jump Code uses JumpStudy's free API by default. You can also use your own:

```bash
# Use your own OpenAI API key
export OPENAI_API_KEY=sk-your-key-here

# Or use a custom endpoint
export JUMPCODE_API_URL=https://your-api.com/v1
```

## Requirements

- Node.js 18+
- For computer control on Linux: `xdotool`, `scrot`, `xclip`

```bash
# Install Linux dependencies
sudo apt install xdotool scrot xclip
```

## License

MIT - Free for all JumpStudy users!

---

Made with ❤️ by [JumpStudy](https://jumpstudy.co)
