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
