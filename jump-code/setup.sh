#!/bin/bash

# Jump Code Setup Script
# Installs Jump Code globally on your system

set -e

echo ""
echo "╦╦ ╦╔╦╗╔═╗  ╔═╗╔═╗╔╦╗╔═╗"
echo "║║ ║║║║╠═╝  ║  ║ ║ ║║║╣ "
echo "╚╝╚═╝╩ ╩╩    ╚═╝╚═╝═╩╝╚═╝"
echo ""
echo "AI-Powered Terminal Coding Assistant"
echo "by JumpStudy • Free & Unlimited"
echo ""

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    echo "   Please upgrade Node.js."
    exit 1
fi

echo "✓ Node.js $(node -v) detected"

# Navigate to jump-code directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Link globally
echo ""
echo "Linking Jump Code globally..."
npm link

# Check for Linux computer control tools
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo ""
    echo "Checking computer control tools..."

    MISSING_TOOLS=""

    if ! command -v xdotool &> /dev/null; then
        MISSING_TOOLS="$MISSING_TOOLS xdotool"
    fi

    if ! command -v scrot &> /dev/null && ! command -v gnome-screenshot &> /dev/null; then
        MISSING_TOOLS="$MISSING_TOOLS scrot"
    fi

    if ! command -v xclip &> /dev/null; then
        MISSING_TOOLS="$MISSING_TOOLS xclip"
    fi

    if [ -n "$MISSING_TOOLS" ]; then
        echo ""
        echo "For full computer control features, install:"
        echo "  sudo apt install$MISSING_TOOLS"
        echo ""
        echo "Or on Fedora:"
        echo "  sudo dnf install$MISSING_TOOLS"
    else
        echo "✓ All computer control tools installed"
    fi
fi

# Create config directory
mkdir -p ~/.jump-code

# Check for API key
echo ""
if [ -z "$OPENAI_API_KEY" ] && [ -z "$JUMPCODE_API_KEY" ]; then
    echo "ℹ️  No API key found in environment."
    echo ""
    echo "   Jump Code can use JumpStudy's free API (when available)"
    echo "   or you can set your own OpenAI API key:"
    echo ""
    echo "   export OPENAI_API_KEY=your-key-here"
    echo ""
    echo "   Add this to your ~/.bashrc or ~/.zshrc for persistence."
else
    echo "✓ API key found"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "✅ Jump Code installed successfully!"
echo ""
echo "Run it with:"
echo ""
echo "  jump-code"
echo ""
echo "Or use the short alias:"
echo ""
echo "  jc"
echo ""
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Quick commands:"
echo "  /help     - Show all commands"
echo "  /read     - Read a file"
echo "  /edit     - Edit a file"
echo "  /screen   - Take a screenshot"
echo "  /click    - Click at position"
echo "  /type     - Type text"
echo ""
echo "Or just talk naturally:"
echo "  \"Fix the bug in auth.js\""
echo "  \"Create a React component for user profiles\""
echo "  \"Take a screenshot and tell me what you see\""
echo ""
