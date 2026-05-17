/**
 * MCP Config Writer
 *
 * Safe modifier untuk `~/.config/opencode/opencode.json`.
 * Workflow: read → backup → merge → validate → write. Rollback on failure.
 *
 * NEVER call this without explicit user confirmation.
 */

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join, dirname } from 'path';
import { logger } from '../utils/logger.js';

const DEFAULT_CONFIG_PATH = join(homedir(), '.config', 'opencode', 'opencode.json');

export interface WriteResult {
  ok: boolean;
  path: string;
  backupPath?: string;
  added: string[];
  skipped: string[];
  error?: string;
}

export class McpConfigWriter {
  constructor(private configPath: string = DEFAULT_CONFIG_PATH) {}

  async readCurrent(): Promise<Record<string, any>> {
    try {
      const raw = await fs.readFile(this.configPath, 'utf-8');
      return JSON.parse(raw);
    } catch (err: any) {
      if (err.code === 'ENOENT') {
        return { $schema: 'https://opencode.ai/config.json' };
      }
      throw new Error(`Failed to read ${this.configPath}: ${err.message}`);
    }
  }

  async backup(): Promise<string | undefined> {
    try {
      await fs.access(this.configPath);
    } catch {
      return undefined; // nothing to backup
    }
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `${this.configPath}.backup-${ts}`;
    await fs.copyFile(this.configPath, backupPath);
    logger.info(`Backup created at ${backupPath}`);
    return backupPath;
  }

  /**
   * Merge new MCP entries into existing config.
   * Existing entries with the same key are SKIPPED (never overwritten).
   */
  async merge(newMcp: Record<string, unknown>): Promise<WriteResult> {
    const current = await this.readCurrent();
    const backupPath = await this.backup();

    const existing = (current.mcp ?? {}) as Record<string, unknown>;
    const added: string[] = [];
    const skipped: string[] = [];

    for (const [key, value] of Object.entries(newMcp)) {
      if (key in existing) {
        skipped.push(key);
      } else {
        existing[key] = value;
        added.push(key);
      }
    }

    const merged = { ...current, mcp: existing };

    try {
      this.validate(merged);
      await fs.mkdir(dirname(this.configPath), { recursive: true });
      await fs.writeFile(this.configPath, JSON.stringify(merged, null, 2), 'utf-8');
      return { ok: true, path: this.configPath, backupPath, added, skipped };
    } catch (err: any) {
      // Rollback
      if (backupPath) {
        await fs.copyFile(backupPath, this.configPath);
        logger.warn(`Rolled back to ${backupPath}`);
      }
      return {
        ok: false,
        path: this.configPath,
        backupPath,
        added: [],
        skipped,
        error: err.message,
      };
    }
  }

  private validate(config: Record<string, any>): void {
    if (typeof config !== 'object' || config === null) {
      throw new Error('Config must be an object');
    }
    if (config.mcp && typeof config.mcp !== 'object') {
      throw new Error('config.mcp must be an object');
    }
    // Re-serialize to ensure valid JSON
    JSON.parse(JSON.stringify(config));
  }
}

export const mcpConfigWriter = new McpConfigWriter();
