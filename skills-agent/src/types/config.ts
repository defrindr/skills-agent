/**
 * Configuration type definitions
 */

import { Provider, ProviderTier } from './provider.js';

export interface Config {
  providers: {
    [key: string]: Provider;
  };
  global: GlobalConfig;
  skill_overrides?: SkillOverrides;
  budget?: BudgetConfig;
}

export interface GlobalConfig {
  default_tier: ProviderTier;
  auto_fallback: boolean;
  max_cost_per_task?: number;
  prefer_speed?: boolean;
}

export interface SkillOverrides {
  [skillName: string]: {
    force_provider?: string;
    prefer_tier?: ProviderTier;
    providers?: string[];
  };
}

export interface BudgetConfig {
  daily_limit?: number;
  warn_threshold?: number;
  track_usage: boolean;
}

export interface UsageRecord {
  timestamp: number;
  provider: string;
  model: string;
  skill: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
}
