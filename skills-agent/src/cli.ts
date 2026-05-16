#!/usr/bin/env node

/**
 * Skills Agent CLI - For testing and development
 */

import dotenv from 'dotenv';
import { skillManager } from './skills/manager.js';
import { configManager } from './utils/config.js';
import { budgetTracker } from './budget/tracker.js';
import { logger } from './utils/logger.js';

dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    await configManager.load();
    await skillManager.loadAll();

    switch (command) {
      case 'list-skills':
        listSkills();
        break;

      case 'list-providers':
        listProviders();
        break;

      case 'budget':
        showBudget();
        break;

      case 'mcp':
        // Start MCP server
        const { SkillsMCPServer } = await import('./mcp/server.js');
        const server = new SkillsMCPServer();
        await server.start();
        break;

      default:
        showHelp();
    }
  } catch (error) {
    logger.error('Command failed:', error);
    process.exit(1);
  }
}

function listSkills() {
  const skills = skillManager.getAllSkills();
  console.log(`\n📚 Available Skills (${skills.length}):\n`);
  
  for (const skill of skills) {
    console.log(`  • ${skill.name}`);
    console.log(`    ${skill.description.substring(0, 80)}...`);
    console.log(`    Complexity: ${skill.metadata.complexity || 'medium'}`);
    console.log('');
  }
}

function listProviders() {
  const providers = configManager.getEnabledProviders();
  console.log(`\n🔌 Enabled Providers (${providers.length}):\n`);
  
  for (const provider of providers) {
    const cost = provider.cost_per_1k_input || 0;
    const costStr = cost === 0 ? 'FREE' : `$${cost.toFixed(4)}/1K`;
    console.log(`  • ${provider.name} (${provider.tier})`);
    console.log(`    Model: ${provider.model}`);
    console.log(`    Cost: ${costStr}`);
    console.log('');
  }
}

function showBudget() {
  const summary = budgetTracker.getSummary(7);
  console.log('\n💰 Budget Summary (Last 7 days):\n');
  console.log(`  Total Spent: $${summary.total.toFixed(4)}`);
  console.log(`  Total Tokens: ${summary.total_tokens.toLocaleString()}`);
  
  console.log('\n  By Provider:');
  for (const [provider, cost] of Object.entries(summary.by_provider)) {
    console.log(`    ${provider}: $${cost.toFixed(4)}`);
  }
  
  console.log('\n  By Skill:');
  for (const [skill, cost] of Object.entries(summary.by_skill)) {
    console.log(`    ${skill}: $${cost.toFixed(4)}`);
  }
  
  const todaySpent = budgetTracker.getTodaySpending();
  console.log(`\n  Today: $${todaySpent.toFixed(4)}`);
  console.log('');
}

function showHelp() {
  console.log(`
Skills Agent CLI

Usage:
  skills-agent <command>

Commands:
  mcp              Start MCP server (for OpenCode integration)
  list-skills      List all available skills
  list-providers   List enabled providers
  budget           Show budget and usage summary
  
Examples:
  skills-agent mcp
  skills-agent list-skills
  skills-agent budget
  `);
}

main();
