#!/usr/bin/env node

/**
 * Jump Code - AI-Powered Terminal Coding Assistant
 * By JumpStudy
 *
 * A free, unlimited coding AI that runs in your terminal.
 * Similar to Claude Code but branded for JumpStudy users.
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: join(__dirname, '..', '.env') });
dotenv.config({ path: join(process.cwd(), '.env') });

// Import main application
import { JumpCode } from '../src/index.js';

// Run Jump Code
const app = new JumpCode();
app.run().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
