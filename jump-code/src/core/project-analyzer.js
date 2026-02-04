/**
 * Jump Code - Project Analyzer
 * Analyzes the current project to provide context to AI
 */

import fs from 'fs/promises';
import path from 'path';

export class ProjectAnalyzer {
  constructor(app) {
    this.app = app;
  }

  /**
   * Analyze the project directory
   */
  async analyze(projectPath) {
    const context = {
      path: projectPath,
      type: 'unknown',
      language: null,
      framework: null,
      hasGit: false,
      hasPackageJson: false,
      hasPyproject: false,
      hasCargoToml: false,
      hasGoMod: false,
      hasMakefile: false,
      hasDockerfile: false,
      dependencies: [],
      devDependencies: [],
      scripts: {},
      mainFiles: [],
      configFiles: [],
      testFramework: null,
      linter: null,
    };

    try {
      // Check for various project files
      const files = await fs.readdir(projectPath);

      // Git
      if (files.includes('.git')) {
        context.hasGit = true;
      }

      // Node.js / JavaScript / TypeScript
      if (files.includes('package.json')) {
        context.hasPackageJson = true;
        const packageJson = await this.readJson(path.join(projectPath, 'package.json'));
        if (packageJson) {
          context.name = packageJson.name;
          context.dependencies = Object.keys(packageJson.dependencies || {});
          context.devDependencies = Object.keys(packageJson.devDependencies || {});
          context.scripts = packageJson.scripts || {};

          // Detect framework
          if (context.dependencies.includes('next') || context.devDependencies.includes('next')) {
            context.framework = 'Next.js';
            context.type = 'web';
          } else if (context.dependencies.includes('react') || context.devDependencies.includes('react')) {
            context.framework = 'React';
            context.type = 'web';
          } else if (context.dependencies.includes('vue')) {
            context.framework = 'Vue.js';
            context.type = 'web';
          } else if (context.dependencies.includes('express')) {
            context.framework = 'Express.js';
            context.type = 'backend';
          } else if (context.dependencies.includes('fastify')) {
            context.framework = 'Fastify';
            context.type = 'backend';
          } else if (context.dependencies.includes('electron')) {
            context.framework = 'Electron';
            context.type = 'desktop';
          }

          // Detect language
          if (context.devDependencies.includes('typescript') || files.includes('tsconfig.json')) {
            context.language = 'TypeScript';
          } else {
            context.language = 'JavaScript';
          }

          // Detect test framework
          if (context.devDependencies.includes('jest')) {
            context.testFramework = 'Jest';
          } else if (context.devDependencies.includes('mocha')) {
            context.testFramework = 'Mocha';
          } else if (context.devDependencies.includes('vitest')) {
            context.testFramework = 'Vitest';
          } else if (context.devDependencies.includes('@playwright/test')) {
            context.testFramework = 'Playwright';
          }

          // Detect linter
          if (context.devDependencies.includes('eslint') || files.includes('.eslintrc.json')) {
            context.linter = 'ESLint';
          }
        }
      }

      // Python
      if (files.includes('pyproject.toml')) {
        context.hasPyproject = true;
        context.language = 'Python';
        context.type = 'python';

        const pyproject = await fs.readFile(path.join(projectPath, 'pyproject.toml'), 'utf-8');
        if (pyproject.includes('django')) {
          context.framework = 'Django';
          context.type = 'web';
        } else if (pyproject.includes('fastapi')) {
          context.framework = 'FastAPI';
          context.type = 'backend';
        } else if (pyproject.includes('flask')) {
          context.framework = 'Flask';
          context.type = 'web';
        }
      } else if (files.includes('requirements.txt') || files.includes('setup.py')) {
        context.language = 'Python';
        context.type = 'python';
      }

      // Rust
      if (files.includes('Cargo.toml')) {
        context.hasCargoToml = true;
        context.language = 'Rust';
        context.type = 'rust';
      }

      // Go
      if (files.includes('go.mod')) {
        context.hasGoMod = true;
        context.language = 'Go';
        context.type = 'go';
      }

      // Build files
      if (files.includes('Makefile')) {
        context.hasMakefile = true;
      }

      // Docker
      if (files.includes('Dockerfile') || files.includes('docker-compose.yml')) {
        context.hasDockerfile = true;
      }

      // Find main/entry files
      const mainCandidates = [
        'index.js',
        'index.ts',
        'main.js',
        'main.ts',
        'app.js',
        'app.ts',
        'server.js',
        'server.ts',
        'main.py',
        'app.py',
        'main.go',
        'main.rs',
        'lib.rs',
      ];

      for (const candidate of mainCandidates) {
        if (files.includes(candidate)) {
          context.mainFiles.push(candidate);
        }
      }

      // Common directories check
      for (const dir of ['src', 'lib', 'app', 'pages', 'components', 'api']) {
        try {
          await fs.access(path.join(projectPath, dir));
          context.configFiles.push(dir + '/');
        } catch {
          // Directory doesn't exist
        }
      }

      // Config files
      const configPatterns = [
        'tsconfig.json',
        '.eslintrc.json',
        '.eslintrc.js',
        '.prettierrc',
        'jest.config.js',
        'vitest.config.ts',
        'webpack.config.js',
        'vite.config.ts',
        'next.config.js',
        'next.config.mjs',
        'tailwind.config.js',
        'tailwind.config.ts',
      ];

      for (const config of configPatterns) {
        if (files.includes(config)) {
          context.configFiles.push(config);
        }
      }

      // Determine project type if still unknown
      if (context.type === 'unknown') {
        if (context.language) {
          context.type = context.language.toLowerCase();
        }
      }

    } catch (error) {
      // Could not analyze project
      context.error = error.message;
    }

    return context;
  }

  /**
   * Helper to read JSON files
   */
  async readJson(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  /**
   * Get a summary of the project for AI context
   */
  getSummary(context) {
    const parts = [];

    if (context.name) {
      parts.push(`Project: ${context.name}`);
    }

    if (context.language) {
      parts.push(`Language: ${context.language}`);
    }

    if (context.framework) {
      parts.push(`Framework: ${context.framework}`);
    }

    if (context.testFramework) {
      parts.push(`Tests: ${context.testFramework}`);
    }

    if (context.mainFiles.length > 0) {
      parts.push(`Entry: ${context.mainFiles.join(', ')}`);
    }

    if (context.hasGit) {
      parts.push('Git: Yes');
    }

    return parts.join(' | ');
  }

  /**
   * Get relevant files for a specific task
   */
  async getRelevantFiles(context, task) {
    const files = [];
    const taskLower = task.toLowerCase();

    // API-related tasks
    if (taskLower.includes('api') || taskLower.includes('route') || taskLower.includes('endpoint')) {
      files.push(...await this.app.fs.globFiles('**/api/**/*.{js,ts,py}'));
      files.push(...await this.app.fs.globFiles('**/routes/**/*.{js,ts,py}'));
    }

    // Component tasks
    if (taskLower.includes('component') || taskLower.includes('ui')) {
      files.push(...await this.app.fs.globFiles('**/components/**/*.{js,ts,tsx,jsx,vue}'));
    }

    // Test tasks
    if (taskLower.includes('test')) {
      files.push(...await this.app.fs.globFiles('**/*.{test,spec}.{js,ts,tsx,jsx,py}'));
      files.push(...await this.app.fs.globFiles('**/tests/**/*.{js,ts,py}'));
    }

    // Config tasks
    if (taskLower.includes('config') || taskLower.includes('setup')) {
      files.push(...context.configFiles);
    }

    return [...new Set(files)].slice(0, 20); // Limit to 20 files
  }
}

export default ProjectAnalyzer;
