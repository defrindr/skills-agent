/**
 * Provider resolver - resolves which provider to use for a task
 */

import { Provider, ProviderTier } from '../types/provider.js';
import { Skill } from '../types/skill.js';
import { Config } from '../types/config.js';
import { configManager } from '../utils/config.js';
import { opencodeDetector } from '../utils/opencode-detector.js';
import { logger } from '../utils/logger.js';

export class ProviderResolver {
  private config: Config | null = null;

  private ensureConfig(): Config {
    if (!this.config) {
      this.config = configManager.getConfig();
    }
    return this.config;
  }

  resolve(skill: Skill, overrideProvider?: string): Provider {
    const config = this.ensureConfig();
    logger.debug(`Resolving provider for skill: ${skill.name}`);
    logger.debug(`Skill metadata providers: ${skill.metadata.providers?.map(p => p.name).join(', ') || 'none'}`);
    logger.debug(`Config enabled providers: ${Object.entries(config.providers).filter(([_, p]) => p.enabled).map(([name]) => name).join(', ')}`);
    
    // Priority 0: OpenCode's auto-detected model (if available and not explicitly overridden)
    if (!overrideProvider) {
      const detected = opencodeDetector.detectModel();
      if (detected) {
        const mappedProvider = opencodeDetector.mapProviderName(detected.provider);
        const provider = config.providers[mappedProvider];
        if (provider && provider.api_key) {
          logger.debug(`Using OpenCode auto-detected provider: ${detected.provider}/${detected.model} → ${mappedProvider}`);
          return { ...provider, name: mappedProvider };
        }
      }
    }
    
    // Priority 1: Explicit override
    if (overrideProvider) {
      const provider = config.providers[overrideProvider];
      if (provider && provider.enabled) {
        logger.debug(`Using override provider: ${overrideProvider}`);
        return { ...provider, name: overrideProvider };
      }
      logger.warn(`Override provider ${overrideProvider} not available, falling back`);
    }

    // Priority 2: Skill-specific override from config
    const skillOverride = config.skill_overrides?.[skill.name];
    if (skillOverride?.force_provider) {
      const provider = config.providers[skillOverride.force_provider];
      if (provider && provider.enabled) {
        logger.debug(`Using skill override provider: ${skillOverride.force_provider}`);
        return { ...provider, name: skillOverride.force_provider };
      }
    }

    // Priority 3: Skill's preferred providers (from SKILL.md)
    if (skill.metadata.providers && skill.metadata.providers.length > 0) {
      for (const pref of skill.metadata.providers) {
        const provider = config.providers[pref.name];
        if (provider && provider.enabled) {
          logger.debug(`Using skill preferred provider: ${pref.name}`);
          return { ...provider, name: pref.name };
        }
      }
    }

    // Priority 4: Skill override preferred tier
    if (skillOverride?.prefer_tier) {
      const provider = this.getProviderByTier(skillOverride.prefer_tier);
      if (provider) {
        logger.debug(`Using tier ${skillOverride.prefer_tier} provider: ${provider.name}`);
        return provider;
      }
    }

    // Priority 5: Global default tier
    const defaultProvider = this.getProviderByTier(config.global.default_tier);
    if (defaultProvider) {
      logger.debug(`Using default tier provider: ${defaultProvider.name}`);
      return defaultProvider;
    }

    // Fallback: First enabled provider
    const fallbackEntry = Object.entries(config.providers).find(([_, p]) => p.enabled);
    if (fallbackEntry) {
      const [name, provider] = fallbackEntry;
      const providerWithName = { ...provider, name };
      logger.warn(`Using fallback provider: ${providerWithName.name}`);
      return providerWithName;
    }

    throw new Error('No enabled providers available');
  }

  private getProviderByTier(tier: ProviderTier): Provider | null {
    const config = this.ensureConfig();
    const providers = Object.entries(config.providers)
      .filter(([_, p]) => p.enabled && p.tier === tier)
      .map(([name, p]) => ({ ...p, name }));

    if (providers.length === 0) {
      return null;
    }

    // If prefer_speed is enabled, sort by model speed (heuristic)
    if (config.global.prefer_speed) {
      // Groq models are typically fastest
      const groqProvider = providers.find(p => p.name.includes('groq'));
      if (groqProvider) return groqProvider;
    }

    // For free tier, prefer bigpickel (OpenCode Zen) as it's always available
    if (tier === 'free') {
      const bigPickelProvider = providers.find(p => p.name === 'bigpickel');
      if (bigPickelProvider) return bigPickelProvider;
    }

    // Return first available
    return providers[0];
  }

  getNextProvider(currentProvider: Provider): Provider | null {
    const config = this.ensureConfig();
    const allProviders = Object.entries(config.providers)
      .filter(([name, p]) => p.enabled && name !== currentProvider.name)
      .map(([name, p]) => ({ ...p, name }));

    // Try same tier first
    const sameTier = allProviders.find(p => p.tier === currentProvider.tier);
    if (sameTier) return sameTier;

    // Then try any available
    return allProviders[0] || null;
  }
}

export const providerResolver = new ProviderResolver();
