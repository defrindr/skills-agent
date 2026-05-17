/**
 * OpenCode configuration detector
 * Automatically detects and uses OpenCode's configured model and API keys
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { logger } from './logger.js';

interface OpenCodeConfig {
  model?: string;
  provider?: Record<string, any>;
}

interface DetectedModel {
  provider: string;
  model: string;
  apiKey?: string;
}

export class OpenCodeDetector {
  private opencodeConfigPath = path.join(homedir(), '.config', 'opencode', 'opencode.json');

  /**
   * Detect OpenCode's configured model and try to extract credentials
   */
  detectModel(): DetectedModel | null {
    try {
      if (!fs.existsSync(this.opencodeConfigPath)) {
        logger.debug('OpenCode config not found at ' + this.opencodeConfigPath);
        return null;
      }

      const content = fs.readFileSync(this.opencodeConfigPath, 'utf-8');
      const config: OpenCodeConfig = JSON.parse(content);

      if (!config.model) {
        logger.debug('No default model configured in OpenCode');
        return null;
      }

      // Parse model string: "provider/model" or "provider/model-variant"
      const [provider, ...modelParts] = config.model.split('/');
      const model = modelParts.join('/');

      logger.debug(`Detected OpenCode model: ${provider}/${model}`);

      return {
        provider,
        model,
        apiKey: this.extractApiKey(provider)
      };
    } catch (error) {
      logger.debug(`Failed to detect OpenCode model: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  /**
   * Extract API key from environment for detected provider
   */
  private extractApiKey(provider: string): string | undefined {
    const keyMap: Record<string, string> = {
      'anthropic': 'ANTHROPIC_API_KEY',
      'openai': 'OPENAI_API_KEY',
      'deepseek': 'DEEPSEEK_API_KEY',
      'groq': 'GROQ_API_KEY',
      'openrouter': 'OPENROUTER_API_KEY',
      'opencode': 'OPENCODE_API_KEY', // OpenCode Zen
    };

    const envVar = keyMap[provider];
    if (envVar && process.env[envVar]) {
      return process.env[envVar];
    }

    return undefined;
  }

  /**
   * Map OpenCode provider to skills-agent provider name
   */
  mapProviderName(opencodeProvider: string): string {
    const mapping: Record<string, string> = {
      'anthropic': 'claude-sonnet',
      'openai': 'gpt4-turbo',
      'deepseek': 'deepseek',
      'groq': 'groq-mixtral',
      'openrouter': 'bigpickel',
      'opencode': 'bigpickel', // OpenCode Zen uses OpenRouter
      'github-copilot': 'bigpickel', // GitHub Copilot also uses OpenRouter backend
    };

    return mapping[opencodeProvider] || opencodeProvider;
  }

  /**
   * Get fallback free tier provider when OpenCode model has no credentials
   */
  getFallbackFreeProvider(): string {
    // OpenCode Zen (bigpickel/OpenRouter) is free by default
    return 'bigpickel';
  }
}

export const opencodeDetector = new OpenCodeDetector();
