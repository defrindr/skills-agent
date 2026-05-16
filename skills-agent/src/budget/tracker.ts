/**
 * Budget tracker - track usage and enforce limits
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { UsageRecord } from '../types/config.js';
import { LLMResponse } from '../types/provider.js';
import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';

const DEFAULT_DB_PATH = path.join(homedir(), '.skills-agent', 'usage.db');

export class BudgetTracker {
  private dbPath: string;
  private records: UsageRecord[] = [];

  constructor(dbPath?: string) {
    this.dbPath = dbPath || process.env.BUDGET_DB_PATH || DEFAULT_DB_PATH;
    this.loadRecords();
  }

  private loadRecords(): void {
    try {
      if (fs.existsSync(this.dbPath)) {
        const content = fs.readFileSync(this.dbPath, 'utf-8');
        this.records = JSON.parse(content);
      }
    } catch (error) {
      logger.warn('Could not load usage records, starting fresh');
      this.records = [];
    }
  }

  private saveRecords(): void {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.records, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Failed to save usage records:', error);
    }
  }

  async track(skill: string, response: LLMResponse): Promise<void> {
    const config = configManager.getConfig();
    if (!config.budget?.track_usage) {
      return;
    }

    const record: UsageRecord = {
      timestamp: Date.now(),
      provider: response.provider,
      model: response.model,
      skill,
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens,
      cost: response.cost || 0,
    };

    this.records.push(record);
    this.saveRecords();

    logger.debug(`Tracked usage: ${skill} - $${record.cost.toFixed(4)}`);
  }

  async checkBudget(): Promise<{ ok: boolean; message?: string }> {
    const config = configManager.getConfig();
    if (!config.budget?.daily_limit) {
      return { ok: true };
    }

    const todaySpent = this.getTodaySpending();
    const limit = config.budget.daily_limit;
    const warn = config.budget.warn_threshold || limit * 0.8;

    if (todaySpent >= limit) {
      return {
        ok: false,
        message: `Daily budget limit reached: $${todaySpent.toFixed(2)}/$${limit.toFixed(2)}`
      };
    }

    if (todaySpent >= warn) {
      logger.warn(`Approaching daily budget limit: $${todaySpent.toFixed(2)}/$${limit.toFixed(2)}`);
    }

    return { ok: true };
  }

  getTodaySpending(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = today.getTime();

    return this.records
      .filter(r => r.timestamp >= todayTimestamp)
      .reduce((sum, r) => sum + r.cost, 0);
  }

  getSpendingByProvider(days: number = 7): Record<string, number> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRecords = this.records.filter(r => r.timestamp >= cutoff);

    const spending: Record<string, number> = {};
    for (const record of recentRecords) {
      spending[record.provider] = (spending[record.provider] || 0) + record.cost;
    }

    return spending;
  }

  getSpendingBySkill(days: number = 7): Record<string, number> {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRecords = this.records.filter(r => r.timestamp >= cutoff);

    const spending: Record<string, number> = {};
    for (const record of recentRecords) {
      spending[record.skill] = (spending[record.skill] || 0) + record.cost;
    }

    return spending;
  }

  getSummary(days: number = 7): {
    total: number;
    by_provider: Record<string, number>;
    by_skill: Record<string, number>;
    total_tokens: number;
  } {
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    const recentRecords = this.records.filter(r => r.timestamp >= cutoff);

    return {
      total: recentRecords.reduce((sum, r) => sum + r.cost, 0),
      by_provider: this.getSpendingByProvider(days),
      by_skill: this.getSpendingBySkill(days),
      total_tokens: recentRecords.reduce((sum, r) => sum + r.total_tokens, 0),
    };
  }
}

export const budgetTracker = new BudgetTracker();
