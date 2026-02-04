/**
 * Jump Code - Computer Control
 * Full computer control: keyboard, mouse, and screen capture
 * Allows AI to see and interact with your computer
 */

import { exec, execSync } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

export class ComputerControl {
  constructor(app) {
    this.app = app;
    this.platform = process.platform;
    this.screenshotDir = path.join(os.tmpdir(), 'jump-code-screenshots');
    this.isEnabled = true;
  }

  /**
   * Initialize computer control
   */
  async initialize() {
    // Create screenshot directory
    await fs.mkdir(this.screenshotDir, { recursive: true });

    // Check available tools
    this.tools = await this.detectTools();

    return this.tools;
  }

  /**
   * Detect available control tools on the system
   */
  async detectTools() {
    const tools = {
      screenshot: null,
      mouse: null,
      keyboard: null,
      clipboard: null,
    };

    if (this.platform === 'linux') {
      // Check for screenshot tools
      if (await this.commandExists('gnome-screenshot')) {
        tools.screenshot = 'gnome-screenshot';
      } else if (await this.commandExists('scrot')) {
        tools.screenshot = 'scrot';
      } else if (await this.commandExists('import')) {
        tools.screenshot = 'imagemagick';
      }

      // Check for mouse/keyboard control
      if (await this.commandExists('xdotool')) {
        tools.mouse = 'xdotool';
        tools.keyboard = 'xdotool';
      } else if (await this.commandExists('xte')) {
        tools.mouse = 'xte';
        tools.keyboard = 'xte';
      }

      // Clipboard
      if (await this.commandExists('xclip')) {
        tools.clipboard = 'xclip';
      } else if (await this.commandExists('xsel')) {
        tools.clipboard = 'xsel';
      }
    } else if (this.platform === 'darwin') {
      // macOS
      tools.screenshot = 'screencapture';
      tools.mouse = 'cliclick';
      tools.keyboard = 'osascript';
      tools.clipboard = 'pbcopy';
    } else if (this.platform === 'win32') {
      // Windows
      tools.screenshot = 'powershell';
      tools.mouse = 'powershell';
      tools.keyboard = 'powershell';
      tools.clipboard = 'powershell';
    }

    return tools;
  }

  /**
   * Check if a command exists
   */
  async commandExists(cmd) {
    try {
      await execAsync(`which ${cmd}`);
      return true;
    } catch {
      return false;
    }
  }

  // ==================== SCREEN CAPTURE ====================

  /**
   * Take a screenshot of the entire screen
   */
  async screenshot(options = {}) {
    const filename = `screenshot_${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    try {
      if (this.platform === 'linux') {
        await this.screenshotLinux(filepath, options);
      } else if (this.platform === 'darwin') {
        await this.screenshotMac(filepath, options);
      } else if (this.platform === 'win32') {
        await this.screenshotWindows(filepath, options);
      }

      // Read the screenshot as base64
      const imageBuffer = await fs.readFile(filepath);
      const base64 = imageBuffer.toString('base64');

      return {
        success: true,
        filepath,
        base64,
        mimeType: 'image/png',
        width: options.width,
        height: options.height,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async screenshotLinux(filepath, options) {
    if (this.tools.screenshot === 'gnome-screenshot') {
      await execAsync(`gnome-screenshot -f "${filepath}"`);
    } else if (this.tools.screenshot === 'scrot') {
      await execAsync(`scrot "${filepath}"`);
    } else if (this.tools.screenshot === 'imagemagick') {
      await execAsync(`import -window root "${filepath}"`);
    } else {
      throw new Error('No screenshot tool available. Install scrot or gnome-screenshot.');
    }
  }

  async screenshotMac(filepath, options) {
    const args = options.region
      ? `-R${options.region.x},${options.region.y},${options.region.width},${options.region.height}`
      : '';
    await execAsync(`screencapture ${args} "${filepath}"`);
  }

  async screenshotWindows(filepath, options) {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Screen]::PrimaryScreen | ForEach-Object {
        $bitmap = New-Object System.Drawing.Bitmap($_.Bounds.Width, $_.Bounds.Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.CopyFromScreen($_.Bounds.Location, [System.Drawing.Point]::Empty, $_.Bounds.Size)
        $bitmap.Save("${filepath.replace(/\\/g, '\\\\')}")
      }
    `;
    await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
  }

  /**
   * Take a screenshot of a specific window
   */
  async screenshotWindow(windowName, options = {}) {
    const filename = `window_${Date.now()}.png`;
    const filepath = path.join(this.screenshotDir, filename);

    try {
      if (this.platform === 'linux') {
        // Find window ID
        const { stdout } = await execAsync(`xdotool search --name "${windowName}" | head -1`);
        const windowId = stdout.trim();

        if (this.tools.screenshot === 'scrot') {
          await execAsync(`scrot -u "${filepath}"`);
        } else {
          await execAsync(`import -window ${windowId} "${filepath}"`);
        }
      } else if (this.platform === 'darwin') {
        await execAsync(`screencapture -l $(osascript -e 'tell app "${windowName}" to id of window 1') "${filepath}"`);
      }

      const imageBuffer = await fs.readFile(filepath);
      return {
        success: true,
        filepath,
        base64: imageBuffer.toString('base64'),
        mimeType: 'image/png',
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get screen dimensions
   */
  async getScreenSize() {
    try {
      if (this.platform === 'linux') {
        const { stdout } = await execAsync("xdpyinfo | grep dimensions | awk '{print $2}'");
        const [width, height] = stdout.trim().split('x').map(Number);
        return { width, height };
      } else if (this.platform === 'darwin') {
        const { stdout } = await execAsync("system_profiler SPDisplaysDataType | grep Resolution | head -1");
        const match = stdout.match(/(\d+)\s*x\s*(\d+)/);
        if (match) {
          return { width: parseInt(match[1]), height: parseInt(match[2]) };
        }
      } else if (this.platform === 'win32') {
        const { stdout } = await execAsync('wmic path Win32_VideoController get CurrentHorizontalResolution,CurrentVerticalResolution');
        const lines = stdout.trim().split('\n');
        if (lines[1]) {
          const [width, height] = lines[1].trim().split(/\s+/).map(Number);
          return { width, height };
        }
      }
    } catch (error) {
      return { width: 1920, height: 1080 }; // Default fallback
    }
    return { width: 1920, height: 1080 };
  }

  // ==================== MOUSE CONTROL ====================

  /**
   * Move mouse to position
   */
  async mouseMove(x, y) {
    try {
      if (this.platform === 'linux') {
        if (this.tools.mouse === 'xdotool') {
          await execAsync(`xdotool mousemove ${x} ${y}`);
        } else if (this.tools.mouse === 'xte') {
          await execAsync(`xte 'mousemove ${x} ${y}'`);
        }
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick m:${x},${y}`);
      } else if (this.platform === 'win32') {
        const script = `
          Add-Type -AssemblyName System.Windows.Forms
          [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
        `;
        await execAsync(`powershell -Command "${script}"`);
      }
      return { success: true, x, y };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Click at current position or specified position
   */
  async mouseClick(options = {}) {
    const { x, y, button = 'left', clicks = 1 } = options;

    try {
      // Move to position if specified
      if (x !== undefined && y !== undefined) {
        await this.mouseMove(x, y);
      }

      if (this.platform === 'linux') {
        if (this.tools.mouse === 'xdotool') {
          const btnNum = button === 'left' ? 1 : button === 'right' ? 3 : 2;
          const clickCmd = clicks === 2 ? 'doubleclick' : 'click';
          if (x !== undefined && y !== undefined) {
            await execAsync(`xdotool mousemove ${x} ${y} ${clickCmd} ${btnNum}`);
          } else {
            await execAsync(`xdotool ${clickCmd} ${btnNum}`);
          }
        }
      } else if (this.platform === 'darwin') {
        const clickType = button === 'right' ? 'rc' : clicks === 2 ? 'dc' : 'c';
        if (x !== undefined && y !== undefined) {
          await execAsync(`cliclick ${clickType}:${x},${y}`);
        } else {
          await execAsync(`cliclick ${clickType}:.`);
        }
      } else if (this.platform === 'win32') {
        const script = `
          Add-Type -AssemblyName System.Windows.Forms
          ${x !== undefined ? `[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})` : ''}
          $signature = @"
          [DllImport("user32.dll", CharSet=CharSet.Auto, CallingConvention=CallingConvention.StdCall)]
          public static extern void mouse_event(long dwFlags, long dx, long dy, long cButtons, long dwExtraInfo);
          "@
          $SendMouseClick = Add-Type -memberDefinition $signature -name "Win32MouseEvent" -namespace Win32Functions -passThru
          $SendMouseClick::mouse_event(0x00000002, 0, 0, 0, 0)
          $SendMouseClick::mouse_event(0x00000004, 0, 0, 0, 0)
        `;
        await execAsync(`powershell -Command "${script.replace(/"/g, '\\"')}"`);
      }

      return { success: true, x, y, button, clicks };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Double click
   */
  async mouseDoubleClick(x, y) {
    return this.mouseClick({ x, y, clicks: 2 });
  }

  /**
   * Right click
   */
  async mouseRightClick(x, y) {
    return this.mouseClick({ x, y, button: 'right' });
  }

  /**
   * Drag from one position to another
   */
  async mouseDrag(fromX, fromY, toX, toY) {
    try {
      if (this.platform === 'linux' && this.tools.mouse === 'xdotool') {
        await execAsync(`xdotool mousemove ${fromX} ${fromY} mousedown 1 mousemove ${toX} ${toY} mouseup 1`);
      } else if (this.platform === 'darwin') {
        await execAsync(`cliclick dd:${fromX},${fromY} du:${toX},${toY}`);
      }
      return { success: true, from: { x: fromX, y: fromY }, to: { x: toX, y: toY } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Scroll mouse wheel
   */
  async mouseScroll(amount, direction = 'down') {
    try {
      if (this.platform === 'linux' && this.tools.mouse === 'xdotool') {
        const btn = direction === 'down' ? 5 : 4;
        for (let i = 0; i < Math.abs(amount); i++) {
          await execAsync(`xdotool click ${btn}`);
        }
      } else if (this.platform === 'darwin') {
        const dir = direction === 'down' ? '-' : '+';
        await execAsync(`cliclick "w:${dir}${amount}"`);
      }
      return { success: true, amount, direction };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get current mouse position
   */
  async getMousePosition() {
    try {
      if (this.platform === 'linux') {
        const { stdout } = await execAsync('xdotool getmouselocation');
        const match = stdout.match(/x:(\d+)\s+y:(\d+)/);
        if (match) {
          return { x: parseInt(match[1]), y: parseInt(match[2]) };
        }
      } else if (this.platform === 'darwin') {
        const { stdout } = await execAsync('cliclick p:.');
        const [x, y] = stdout.trim().split(',').map(Number);
        return { x, y };
      }
      return { x: 0, y: 0 };
    } catch (error) {
      return { x: 0, y: 0, error: error.message };
    }
  }

  // ==================== KEYBOARD CONTROL ====================

  /**
   * Type text
   */
  async type(text, options = {}) {
    const { delay = 12 } = options;

    try {
      if (this.platform === 'linux') {
        if (this.tools.keyboard === 'xdotool') {
          // Escape special characters
          const escaped = text.replace(/'/g, "'\\''");
          await execAsync(`xdotool type --delay ${delay} '${escaped}'`);
        }
      } else if (this.platform === 'darwin') {
        // Use AppleScript for typing
        const escaped = text.replace(/"/g, '\\"').replace(/'/g, "'\\''");
        await execAsync(`osascript -e 'tell application "System Events" to keystroke "${escaped}"'`);
      } else if (this.platform === 'win32') {
        const escaped = text.replace(/"/g, '`"');
        await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${escaped}')"`);
      }

      return { success: true, text };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Press a key or key combination
   */
  async keyPress(key, modifiers = []) {
    try {
      if (this.platform === 'linux' && this.tools.keyboard === 'xdotool') {
        const keyCombo = [...modifiers, key].join('+');
        await execAsync(`xdotool key ${keyCombo}`);
      } else if (this.platform === 'darwin') {
        let script = 'tell application "System Events" to ';
        if (modifiers.length > 0) {
          const modMap = {
            ctrl: 'control down',
            alt: 'option down',
            shift: 'shift down',
            cmd: 'command down',
            super: 'command down',
          };
          const mods = modifiers.map((m) => modMap[m.toLowerCase()] || m).join(', ');
          script += `key code ${this.getKeyCode(key)} using {${mods}}`;
        } else {
          script += `keystroke "${key}"`;
        }
        await execAsync(`osascript -e '${script}'`);
      } else if (this.platform === 'win32') {
        let keyStr = '';
        if (modifiers.includes('ctrl')) keyStr += '^';
        if (modifiers.includes('alt')) keyStr += '%';
        if (modifiers.includes('shift')) keyStr += '+';
        keyStr += `{${key.toUpperCase()}}`;
        await execAsync(`powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('${keyStr}')"`);
      }

      return { success: true, key, modifiers };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Press Enter key
   */
  async pressEnter() {
    return this.keyPress('Return');
  }

  /**
   * Press Tab key
   */
  async pressTab() {
    return this.keyPress('Tab');
  }

  /**
   * Press Escape key
   */
  async pressEscape() {
    return this.keyPress('Escape');
  }

  /**
   * Common shortcuts
   */
  async copy() {
    return this.keyPress('c', ['ctrl']);
  }

  async paste() {
    return this.keyPress('v', ['ctrl']);
  }

  async cut() {
    return this.keyPress('x', ['ctrl']);
  }

  async selectAll() {
    return this.keyPress('a', ['ctrl']);
  }

  async undo() {
    return this.keyPress('z', ['ctrl']);
  }

  async redo() {
    return this.keyPress('y', ['ctrl']);
  }

  async save() {
    return this.keyPress('s', ['ctrl']);
  }

  // ==================== CLIPBOARD ====================

  /**
   * Get clipboard contents
   */
  async getClipboard() {
    try {
      let content = '';

      if (this.platform === 'linux') {
        if (this.tools.clipboard === 'xclip') {
          const { stdout } = await execAsync('xclip -selection clipboard -o');
          content = stdout;
        } else if (this.tools.clipboard === 'xsel') {
          const { stdout } = await execAsync('xsel --clipboard --output');
          content = stdout;
        }
      } else if (this.platform === 'darwin') {
        const { stdout } = await execAsync('pbpaste');
        content = stdout;
      } else if (this.platform === 'win32') {
        const { stdout } = await execAsync('powershell -Command "Get-Clipboard"');
        content = stdout;
      }

      return { success: true, content };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Set clipboard contents
   */
  async setClipboard(text) {
    try {
      if (this.platform === 'linux') {
        if (this.tools.clipboard === 'xclip') {
          await execAsync(`echo -n "${text}" | xclip -selection clipboard`);
        } else if (this.tools.clipboard === 'xsel') {
          await execAsync(`echo -n "${text}" | xsel --clipboard --input`);
        }
      } else if (this.platform === 'darwin') {
        await execAsync(`echo -n "${text}" | pbcopy`);
      } else if (this.platform === 'win32') {
        await execAsync(`powershell -Command "Set-Clipboard -Value '${text}'"`);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // ==================== WINDOW MANAGEMENT ====================

  /**
   * Get list of open windows
   */
  async getWindows() {
    try {
      if (this.platform === 'linux') {
        const { stdout } = await execAsync('wmctrl -l');
        const windows = stdout
          .trim()
          .split('\n')
          .map((line) => {
            const parts = line.split(/\s+/);
            return {
              id: parts[0],
              desktop: parts[1],
              name: parts.slice(3).join(' '),
            };
          });
        return { success: true, windows };
      } else if (this.platform === 'darwin') {
        const script = `
          tell application "System Events"
            set windowList to {}
            repeat with proc in (every process whose background only is false)
              repeat with win in (every window of proc)
                set end of windowList to (name of proc) & ": " & (name of win)
              end repeat
            end repeat
            return windowList
          end tell
        `;
        const { stdout } = await execAsync(`osascript -e '${script}'`);
        return { success: true, windows: stdout.split(', ') };
      }
      return { success: true, windows: [] };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Focus a window by name
   */
  async focusWindow(name) {
    try {
      if (this.platform === 'linux') {
        await execAsync(`wmctrl -a "${name}"`);
      } else if (this.platform === 'darwin') {
        await execAsync(`osascript -e 'tell application "${name}" to activate'`);
      }
      return { success: true, window: name };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get active window info
   */
  async getActiveWindow() {
    try {
      if (this.platform === 'linux') {
        const { stdout } = await execAsync('xdotool getactivewindow getwindowname');
        return { success: true, name: stdout.trim() };
      } else if (this.platform === 'darwin') {
        const { stdout } = await execAsync(`osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`);
        return { success: true, name: stdout.trim() };
      }
      return { success: true, name: '' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get macOS key code (helper)
   */
  getKeyCode(key) {
    const keyCodes = {
      return: 36,
      enter: 36,
      tab: 48,
      space: 49,
      delete: 51,
      escape: 53,
      esc: 53,
      up: 126,
      down: 125,
      left: 123,
      right: 124,
    };
    return keyCodes[key.toLowerCase()] || 0;
  }
}

export default ComputerControl;
