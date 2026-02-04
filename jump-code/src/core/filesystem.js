/**
 * Jump Code - File System Operations
 * Read, write, edit, search files and run commands
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { createPatch } from 'diff';

const execAsync = promisify(exec);

export class FileSystem {
  constructor() {
    this.cwd = process.cwd();
  }

  /**
   * Read a file's contents
   */
  async readFile(filePath) {
    const fullPath = this.resolvePath(filePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  }

  /**
   * Read a file with line numbers
   */
  async readFileWithLines(filePath, startLine = 1, endLine = null) {
    const content = await this.readFile(filePath);
    const lines = content.split('\n');

    const start = Math.max(0, startLine - 1);
    const end = endLine ? Math.min(lines.length, endLine) : lines.length;

    const selectedLines = lines.slice(start, end);

    return {
      content: selectedLines.join('\n'),
      startLine: start + 1,
      endLine: end,
      totalLines: lines.length,
    };
  }

  /**
   * Write content to a file (create or overwrite)
   */
  async writeFile(filePath, content) {
    const fullPath = this.resolvePath(filePath);

    // Ensure directory exists
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(fullPath, content, 'utf-8');
    return fullPath;
  }

  /**
   * Edit a file with changes
   */
  async editFile(filePath, newContent) {
    const fullPath = this.resolvePath(filePath);

    // Read existing content
    let existingContent = '';
    try {
      existingContent = await this.readFile(fullPath);
    } catch {
      // File doesn't exist, will create
    }

    // Write new content
    await this.writeFile(fullPath, newContent);

    // Return diff
    return createPatch(filePath, existingContent, newContent);
  }

  /**
   * Apply a patch/diff to a file
   */
  async applyEdit(filePath, oldText, newText) {
    const content = await this.readFile(filePath);

    if (!content.includes(oldText)) {
      throw new Error(`Could not find text to replace in ${filePath}`);
    }

    const updated = content.replace(oldText, newText);
    await this.writeFile(filePath, updated);

    return updated;
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath) {
    const fullPath = this.resolvePath(filePath);
    await fs.unlink(fullPath);
  }

  /**
   * Check if file exists
   */
  async exists(filePath) {
    try {
      const fullPath = this.resolvePath(filePath);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info/stats
   */
  async stat(filePath) {
    const fullPath = this.resolvePath(filePath);
    const stats = await fs.stat(fullPath);
    return {
      path: fullPath,
      size: stats.size,
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }

  /**
   * List directory contents
   */
  async listDir(dirPath = '.') {
    const fullPath = this.resolvePath(dirPath);
    const entries = await fs.readdir(fullPath, { withFileTypes: true });

    return entries.map((entry) => ({
      name: entry.name,
      type: entry.isDirectory() ? 'directory' : 'file',
      path: path.join(fullPath, entry.name),
    }));
  }

  /**
   * Search for files matching a pattern
   */
  async globFiles(pattern, options = {}) {
    const files = await glob(pattern, {
      cwd: options.cwd || this.cwd,
      ignore: options.ignore || ['**/node_modules/**', '**/.git/**'],
      nodir: true,
    });
    return files;
  }

  /**
   * Search for text in files
   */
  async searchInFiles(searchTerm, options = {}) {
    const pattern = options.pattern || '**/*';
    const files = await this.globFiles(pattern, options);

    const results = [];

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          if (line.includes(searchTerm)) {
            results.push({
              file,
              line: index + 1,
              content: line.trim(),
              match: searchTerm,
            });
          }
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Search with regex
   */
  async searchRegex(pattern, options = {}) {
    const filePattern = options.pattern || '**/*';
    const files = await this.globFiles(filePattern, options);
    const regex = new RegExp(pattern, options.flags || 'gi');

    const results = [];

    for (const file of files) {
      try {
        const content = await this.readFile(file);
        const lines = content.split('\n');

        lines.forEach((line, index) => {
          const matches = line.match(regex);
          if (matches) {
            results.push({
              file,
              line: index + 1,
              content: line.trim(),
              matches,
            });
          }
        });
      } catch {
        // Skip files that can't be read
      }
    }

    return results;
  }

  /**
   * Get directory tree structure
   */
  async getTree(dirPath = '.', depth = 3, currentDepth = 0) {
    if (currentDepth >= depth) return [];

    const fullPath = this.resolvePath(dirPath);
    const entries = await this.listDir(fullPath);

    const tree = [];

    for (const entry of entries) {
      // Skip common ignored directories
      if (['node_modules', '.git', '.next', 'dist', 'build', '__pycache__'].includes(entry.name)) {
        continue;
      }

      const item = {
        name: entry.name,
        type: entry.type,
        path: entry.path,
      };

      if (entry.type === 'directory') {
        item.children = await this.getTree(entry.path, depth, currentDepth + 1);
      }

      tree.push(item);
    }

    return tree;
  }

  /**
   * Run a shell command
   */
  async runCommand(command, options = {}) {
    const cwd = options.cwd || this.cwd;
    const timeout = options.timeout || 60000;

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      return {
        success: true,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        command,
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout?.trim() || '',
        stderr: error.stderr?.trim() || error.message,
        command,
        error: error.message,
      };
    }
  }

  /**
   * Run a command with streaming output
   */
  async runCommandStream(command, options = {}) {
    return new Promise((resolve, reject) => {
      const cwd = options.cwd || this.cwd;
      const [cmd, ...args] = command.split(' ');

      const child = spawn(cmd, args, {
        cwd,
        shell: true,
        stdio: ['inherit', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        stdout += text;
        if (options.onStdout) options.onStdout(text);
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        stderr += text;
        if (options.onStderr) options.onStderr(text);
      });

      child.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
          command,
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Create a directory
   */
  async mkdir(dirPath) {
    const fullPath = this.resolvePath(dirPath);
    await fs.mkdir(fullPath, { recursive: true });
    return fullPath;
  }

  /**
   * Copy a file
   */
  async copyFile(src, dest) {
    const srcPath = this.resolvePath(src);
    const destPath = this.resolvePath(dest);

    // Ensure dest directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    await fs.copyFile(srcPath, destPath);
    return destPath;
  }

  /**
   * Move/rename a file
   */
  async moveFile(src, dest) {
    const srcPath = this.resolvePath(src);
    const destPath = this.resolvePath(dest);

    // Ensure dest directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    await fs.rename(srcPath, destPath);
    return destPath;
  }

  /**
   * Resolve path relative to cwd
   */
  resolvePath(filePath) {
    if (path.isAbsolute(filePath)) {
      return filePath;
    }
    return path.resolve(this.cwd, filePath);
  }

  /**
   * Change working directory
   */
  chdir(newPath) {
    this.cwd = this.resolvePath(newPath);
    return this.cwd;
  }
}

export default FileSystem;
