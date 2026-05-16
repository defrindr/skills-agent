/**
 * Configuration management utilities
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import YAML from 'yaml';
import { Config } from '../types/config.js';

const DEFAULT_CONFIG_PATH = path.join(homedir(), '.skills-agent', 'config.yaml');

export class ConfigManager {
  private config: Config | null = null;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || process.env.SKILLS_AGENT_CONFIG || DEFAULT_CONFIG_PATH;
  }

  async load(): Promise<Config> {
    if (this.config) {
      return this.config;
    }

    // Try to load user config
    if (fs.existsSync(this.configPath)) {
      const content = fs.readFileSync(this.configPath, 'utf-8');
      this.config = YAML.parse(content);
    } else {
      // Load default config from package directory (relative to dist/)
      // When dist/index.js runs, __dirname is dist/, so ../config is the config folder
      const packageRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
      const defaultConfigPath = path.join(packageRoot, 'config', 'default-config.yaml');
      
      if (fs.existsSync(defaultConfigPath)) {
        const content = fs.readFileSync(defaultConfigPath, 'utf-8');
        this.config = YAML.parse(content);
      } else {
        throw new Error(`No configuration file found at ${this.configPath} or ${defaultConfigPath}`);
      }
    }

    // Inject API keys from environment variables
    this.injectEnvVars();

    return this.config!;
  }

  private injectEnvVars(): void {
    if (!this.config) return;

    const envKeyMap: Record<string, string> = {
      'deepseek': 'DEEPSEEK_API_KEY',
      'groq-mixtral': 'GROQ_API_KEY',
      'groq-llama3': 'GROQ_API_KEY',
      'bigpickel': 'OPENROUTER_API_KEY',
      'claude-sonnet': 'ANTHROPIC_API_KEY',
      'gpt4-turbo': 'OPENAI_API_KEY',
    };

    for (const [providerName, envVar] of Object.entries(envKeyMap)) {
      if (this.config.providers[providerName] && process.env[envVar]) {
        this.config.providers[providerName].api_key = process.env[envVar];
      }
    }
  }

  getConfig(): Config {
    if (!this.config) {
      throw new Error('Config not loaded. Call load() first.');
    }
    return this.config;
  }

  getProvider(name: string) {
    const config = this.getConfig();
    return config.providers[name];
  }

  getEnabledProviders() {
    const config = this.getConfig();
    return Object.entries(config.providers)
      .filter(([_, provider]) => provider.enabled)
      .map(([providerName, provider]) => {
        return {
          ...provider,
          name: providerName
        };
      });
  }

  getProvidersByTier(tier: string) {
    return this.getEnabledProviders().filter(p => p.tier === tier);
  }

  async save(config?: Config): Promise<void> {
    const configToSave = config || this.config;
    if (!configToSave) {
      throw new Error('No config to save');
    }

    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const content = YAML.stringify(configToSave);
    fs.writeFileSync(this.configPath, content, 'utf-8');
  }
}

export const configManager = new ConfigManager();
