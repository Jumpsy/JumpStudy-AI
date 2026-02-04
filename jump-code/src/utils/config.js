/**
 * Jump Code - Configuration Manager
 * Manages settings and API keys
 */

import fs from 'fs/promises';
import path from 'path';
import os from 'os';

export class Config {
  constructor() {
    this.configDir = path.join(os.homedir(), '.jump-code');
    this.configFile = path.join(this.configDir, 'config.json');
    this.config = {};

    // Default configuration
    this.defaults = {
      model: 'gpt-4o',
      theme: 'default',
      computerControlEnabled: true,
      confirmActions: true,
      maxHistoryLength: 100,
      autoSaveHistory: true,
      streamResponses: true,
      showTokenUsage: false,
    };
  }

  /**
   * Load configuration from file
   */
  async load() {
    try {
      // Ensure config directory exists
      await fs.mkdir(this.configDir, { recursive: true });

      // Try to read existing config
      try {
        const content = await fs.readFile(this.configFile, 'utf-8');
        this.config = { ...this.defaults, ...JSON.parse(content) };
      } catch {
        // No config file, use defaults
        this.config = { ...this.defaults };
        await this.save();
      }
    } catch (error) {
      this.config = { ...this.defaults };
    }

    return this.config;
  }

  /**
   * Save configuration to file
   */
  async save() {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      await fs.writeFile(
        this.configFile,
        JSON.stringify(this.config, null, 2),
        'utf-8'
      );
    } catch (error) {
      console.error('Could not save config:', error.message);
    }
  }

  /**
   * Get a config value
   */
  get(key) {
    return this.config[key] ?? this.defaults[key];
  }

  /**
   * Set a config value
   */
  set(key, value) {
    this.config[key] = value;
    this.save().catch(() => {}); // Save in background
    return this;
  }

  /**
   * Get all config values
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Reset to defaults
   */
  reset() {
    this.config = { ...this.defaults };
    return this.save();
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature) {
    return this.get(feature) === true;
  }
}

export default Config;
