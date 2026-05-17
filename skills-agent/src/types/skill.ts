/**
 * Type definitions for Skills Agent
 */

export interface Skill {
  name: string;
  description: string;
  content: string;
  metadata: SkillMetadata;
  filePath?: string; // Path to SKILL.md file for cache invalidation
}

export interface SkillMetadata {
  default_provider?: string;
  complexity?: 'simple' | 'medium' | 'complex';
  token_estimate?: string;
  providers?: ProviderPreference[];
  fallback?: boolean;
  max_retries?: number;
  triggers?: string[];
  [key: string]: any;
}

export interface ProviderPreference {
  name: string;
  tier: 'free' | 'mid' | 'premium';
  reason?: string;
}

export interface Framework {
  name: string;
  type: 'frontend' | 'backend' | 'mobile' | 'fullstack';
  skills: string[];
}
