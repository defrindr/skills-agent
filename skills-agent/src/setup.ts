#!/usr/bin/env node

/**
 * Interactive setup script for Skills Agent
 * One-command installation with prompts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as yaml from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface SetupConfig {
  deepseekApiKey?: string;
  groqApiKey?: string;
  claudeApiKey?: string;
  skillsDir?: string;
  dailyBudgetLimit?: number;
}

class InteractiveSetup {
  private rl: readline.Interface;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
  }

  async run(): Promise<void> {
    console.log('\n🚀 Skills Agent Setup\n');
    console.log('This will configure Skills Agent for use with OpenCode.\n');

    try {
      // Check if already configured
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      const configDir = path.join(homeDir, '.skills-agent');
      const configPath = path.join(configDir, 'config.yaml');

      if (fs.existsSync(configPath)) {
        const reconfigure = await this.confirm(
          'Skills Agent is already configured. Reconfigure?'
        );
        if (!reconfigure) {
          console.log('Setup cancelled.');
          this.rl.close();
          return;
        }
      }

      // Collect configuration
      const config = await this.collectConfig();

      // Create config directory
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }

      // Write config file
      await this.writeConfig(configPath, config);

      // Setup MCP config for OpenCode
      const setupMCP = await this.confirm(
        'Setup OpenCode MCP configuration automatically?'
      );

      if (setupMCP) {
        await this.setupOpenCodeMCP(config);
      }

      // Test connection
      const testConnection = await this.confirm('Test provider connections?');
      if (testConnection) {
        await this.testProviders(config);
      }

      console.log('\n✅ Setup complete!\n');
      console.log('Next steps:');
      console.log('  1. Restart OpenCode (if MCP was configured)');
      console.log('  2. Try: @copilot explore this codebase');
      console.log('  3. Try: @copilot init new nextjs project\n');
      console.log('For help: skills-agent --help\n');
    } catch (error: any) {
      console.error(`\n❌ Setup failed: ${error.message}\n`);
      process.exit(1);
    } finally {
      this.rl.close();
    }
  }

  private async collectConfig(): Promise<SetupConfig> {
    const config: SetupConfig = {};

    console.log('📝 API Keys Configuration\n');
    console.log('Get free API keys:');
    console.log('  - DeepSeek: https://platform.deepseek.com');
    console.log('  - Groq: https://console.groq.com');
    console.log('  - Claude (optional): https://console.anthropic.com\n');

    // DeepSeek (recommended)
    config.deepseekApiKey = await this.prompt(
      'DeepSeek API Key (recommended, free)',
      process.env.DEEPSEEK_API_KEY
    );

    // Groq (optional, free)
    config.groqApiKey = await this.prompt(
      'Groq API Key (optional, free)',
      process.env.GROQ_API_KEY
    );

    // Claude (optional, premium)
    config.claudeApiKey = await this.prompt(
      'Claude API Key (optional, premium)',
      process.env.ANTHROPIC_API_KEY
    );

    if (!config.deepseekApiKey && !config.groqApiKey && !config.claudeApiKey) {
      throw new Error('At least one API key is required');
    }

    console.log('\n⚙️  Configuration\n');

    // Skills directory
    const defaultSkillsDir = path.resolve(__dirname, '../../..');
    config.skillsDir = await this.prompt(
      'Skills directory path',
      defaultSkillsDir
    );

    // Budget limit
    const budgetStr = await this.prompt('Daily budget limit (USD)', '5.00');
    config.dailyBudgetLimit = parseFloat(budgetStr) || 5.0;

    return config;
  }

  private async writeConfig(configPath: string, config: SetupConfig): Promise<void> {
    const configContent = {
      providers: {
        default: config.deepseekApiKey ? 'deepseek' : 
                 config.groqApiKey ? 'groq-mixtral' : 
                 'claude-sonnet',
        
        deepseek: config.deepseekApiKey ? {
          enabled: true,
          api_key: config.deepseekApiKey,
          base_url: 'https://api.deepseek.com/v1',
          model: 'deepseek-chat',
        } : undefined,

        'groq-mixtral': config.groqApiKey ? {
          enabled: true,
          api_key: config.groqApiKey,
          base_url: 'https://api.groq.com/openai/v1',
          model: 'mixtral-8x7b-32768',
        } : undefined,

        'claude-sonnet': config.claudeApiKey ? {
          enabled: true,
          api_key: config.claudeApiKey,
          model: 'claude-sonnet-4-20250514',
        } : undefined,
      },

      budget: {
        enabled: true,
        daily_limit: config.dailyBudgetLimit,
        per_request_limit: 0.5,
        warning_threshold: 0.8,
      },

      skills: {
        dir: config.skillsDir,
      },
    };

    // Remove undefined providers
    Object.keys(configContent.providers).forEach(key => {
      if (configContent.providers[key as keyof typeof configContent.providers] === undefined) {
        delete configContent.providers[key as keyof typeof configContent.providers];
      }
    });

    const yamlContent = yaml.stringify(configContent);
    fs.writeFileSync(configPath, yamlContent, 'utf-8');

    console.log(`\n✅ Configuration written to: ${configPath}`);
  }

  private async setupOpenCodeMCP(config: SetupConfig): Promise<void> {
    const homeDir = process.env.HOME || process.env.USERPROFILE || '';
    const opencodeDir = path.join(homeDir, '.opencode');
    const mcpConfigPath = path.join(opencodeDir, 'mcp-config.json');

    // Create .opencode directory if not exists
    if (!fs.existsSync(opencodeDir)) {
      fs.mkdirSync(opencodeDir, { recursive: true });
    }

    // Build MCP config
    const skillsAgentPath = path.resolve(__dirname, '../index.js');
    
    const mcpConfig = {
      mcpServers: {
        'skills-agent': {
          command: 'node',
          args: [skillsAgentPath],
          env: {
            SKILLS_DIR: config.skillsDir || path.resolve(__dirname, '../../..'),
            ...(config.deepseekApiKey && { DEEPSEEK_API_KEY: config.deepseekApiKey }),
            ...(config.groqApiKey && { GROQ_API_KEY: config.groqApiKey }),
            ...(config.claudeApiKey && { ANTHROPIC_API_KEY: config.claudeApiKey }),
          },
        },
      },
    };

    // Merge with existing config if exists
    let existingConfig: any = {};
    if (fs.existsSync(mcpConfigPath)) {
      try {
        existingConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf-8'));
      } catch (error) {
        console.warn('⚠️  Could not parse existing MCP config, will overwrite');
      }
    }

    const mergedConfig = {
      ...existingConfig,
      mcpServers: {
        ...(existingConfig.mcpServers || {}),
        ...mcpConfig.mcpServers,
      },
    };

    fs.writeFileSync(mcpConfigPath, JSON.stringify(mergedConfig, null, 2), 'utf-8');

    console.log(`\n✅ OpenCode MCP config updated: ${mcpConfigPath}`);
    console.log('⚠️  Please restart OpenCode for changes to take effect');
  }

  private async testProviders(config: SetupConfig): Promise<void> {
    console.log('\n🧪 Testing provider connections...\n');

    const tests: Array<{ name: string; test: () => Promise<boolean> }> = [];

    if (config.deepseekApiKey) {
      tests.push({
        name: 'DeepSeek',
        test: async () => this.testOpenAIProvider(
          'https://api.deepseek.com/v1',
          config.deepseekApiKey!
        ),
      });
    }

    if (config.groqApiKey) {
      tests.push({
        name: 'Groq',
        test: async () => this.testOpenAIProvider(
          'https://api.groq.com/openai/v1',
          config.groqApiKey!
        ),
      });
    }

    if (config.claudeApiKey) {
      tests.push({
        name: 'Claude',
        test: async () => this.testAnthropicProvider(config.claudeApiKey!),
      });
    }

    for (const { name, test } of tests) {
      try {
        const success = await test();
        if (success) {
          console.log(`  ✅ ${name}: Connected`);
        } else {
          console.log(`  ❌ ${name}: Failed`);
        }
      } catch (error: any) {
        console.log(`  ❌ ${name}: ${error.message}`);
      }
    }
  }

  private async testOpenAIProvider(baseURL: string, apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseURL}/models`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private async testAnthropicProvider(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'test' }],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private prompt(question: string, defaultValue?: string): Promise<string> {
    return new Promise((resolve) => {
      const suffix = defaultValue ? ` [${defaultValue}]` : '';
      this.rl.question(`${question}${suffix}: `, (answer) => {
        resolve(answer.trim() || defaultValue || '');
      });
    });
  }

  private confirm(question: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.rl.question(`${question} [Y/n]: `, (answer) => {
        const normalized = answer.trim().toLowerCase();
        resolve(normalized === '' || normalized === 'y' || normalized === 'yes');
      });
    });
  }
}

// Run setup
const setup = new InteractiveSetup();
setup.run().catch((error) => {
  console.error('Setup failed:', error);
  process.exit(1);
});
