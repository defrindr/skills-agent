/**
 * OpenCode Setup Helper
 * Guides OpenCode on how to configure credentials for skills-agent
 */

import { logger } from './logger.js';

interface CredentialMapping {
  provider: string;
  envVar: string;
  description: string;
  sources: string[];
}

const CREDENTIAL_MAPPINGS: CredentialMapping[] = [
  {
    provider: 'anthropic',
    envVar: 'ANTHROPIC_API_KEY',
    description: 'Anthropic Claude API key',
    sources: ['~/.anthropic/api_key', 'ANTHROPIC_API_KEY env var']
  },
  {
    provider: 'openai',
    envVar: 'OPENAI_API_KEY',
    description: 'OpenAI API key',
    sources: ['~/.openai/api_key', 'OPENAI_API_KEY env var']
  },
  {
    provider: 'groq',
    envVar: 'GROQ_API_KEY',
    description: 'Groq API key',
    sources: ['~/.groq/api_key', 'GROQ_API_KEY env var']
  },
  {
    provider: 'openrouter',
    envVar: 'OPENROUTER_API_KEY',
    description: 'OpenRouter API key (for bigpickel)',
    sources: ['~/.openrouter/api_key', 'OPENROUTER_API_KEY env var']
  },
  {
    provider: 'deepseek',
    envVar: 'DEEPSEEK_API_KEY',
    description: 'Deepseek API key',
    sources: ['~/.deepseek/api_key', 'DEEPSEEK_API_KEY env var']
  },
];

export function getSetupInstructions(detectedModel?: string): string {
  const instructions = [
    '',
    '═════════════════════════════════════════════════════════════',
    'Skills Agent - OpenCode Integration Setup',
    '═════════════════════════════════════════════════════════════',
    '',
    'To use skills-agent with OpenCode, add API credentials to your OpenCode config:',
    '',
    '  ~/.config/opencode/opencode.json',
    '',
    'In the "mcp.skills-agent.environment" section, add one or more of:',
    '',
  ];

  for (const mapping of CREDENTIAL_MAPPINGS) {
    instructions.push(`  "${mapping.envVar}": "your-api-key-here"  # ${mapping.description}`);
  }

  instructions.push(
    '',
    'OR set environment variables before running OpenCode:',
    '',
  );

  for (const mapping of CREDENTIAL_MAPPINGS) {
    instructions.push(`  export ${mapping.envVar}="your-api-key-here"`);
  }

  instructions.push(
    '',
    'Then run:',
    '  opencode run "explore codebase"',
    '',
    '═════════════════════════════════════════════════════════════',
    ''
  );

  return instructions.join('\n');
}

export function logSetupInstructions(detectedModel?: string): void {
  const instructions = getSetupInstructions(detectedModel);
  logger.info(instructions);
}
