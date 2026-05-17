#!/usr/bin/env node

/**
 * Skills Agent CLI - For testing and development
 */

import dotenv from 'dotenv';
import { skillManager } from './skills/manager.js';
import { configManager } from './utils/config.js';
import { logger } from './utils/logger.js';
import { getCacheStats, clearAllCaches } from './utils/cache.js';

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

      case 'cache:stats':
        showCacheStats();
        break;

      case 'cache:clear':
        clearCaches();
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

function showHelp() {
  console.log(`
Skills Agent CLI

Usage:
  skills-agent <command>

Commands:
  mcp              Start MCP server (for OpenCode integration)
  list-skills      List all available skills
  list-providers   List enabled providers
  cache:stats      Show cache performance statistics
  cache:clear      Clear all caches
  
Examples:
  skills-agent mcp
  skills-agent list-skills
  skills-agent list-providers
  skills-agent cache:stats
  skills-agent cache:clear
  `);
}

function showCacheStats() {
  const stats = getCacheStats();
  
  console.log('\n📊 Cache Performance Statistics\n');
  
  // Skills cache
  console.log('🔹 Skills Cache:');
  console.log(`   Size: ${stats.skill.size}`);
  console.log(`   Hits: ${stats.skill.hits}`);
  console.log(`   Misses: ${stats.skill.misses}`);
  console.log(`   Hit rate: ${(stats.skill.hitRate * 100).toFixed(2)}%`);
  console.log(`   Evictions: ${stats.skill.evictions}`);
  console.log('');
  
  // Framework cache
  console.log('🔹 Framework Cache:');
  console.log(`   Size: ${stats.framework.size}`);
  console.log(`   Hits: ${stats.framework.hits}`);
  console.log(`   Misses: ${stats.framework.misses}`);
  console.log(`   Hit rate: ${(stats.framework.hitRate * 100).toFixed(2)}%`);
  console.log(`   Evictions: ${stats.framework.evictions}`);
  console.log('');
  
  // Persona cache
  console.log('🔹 Persona Cache:');
  console.log(`   Size: ${stats.persona.size}`);
  console.log(`   Hits: ${stats.persona.hits}`);
  console.log(`   Misses: ${stats.persona.misses}`);
  console.log(`   Hit rate: ${(stats.persona.hitRate * 100).toFixed(2)}%`);
  console.log(`   Evictions: ${stats.persona.evictions}`);
  console.log('');
  
  // Overall stats
  const totalHits = stats.skill.hits + stats.framework.hits + stats.persona.hits;
  const totalMisses = stats.skill.misses + stats.framework.misses + stats.persona.misses;
  const overallHitRate = totalHits / (totalHits + totalMisses || 1);
  
  console.log('📈 Overall:');
  console.log(`   Total hits: ${totalHits}`);
  console.log(`   Total misses: ${totalMisses}`);
  console.log(`   Overall hit rate: ${(overallHitRate * 100).toFixed(2)}%`);
  console.log('');
}

function clearCaches() {
  console.log('\n🧹 Clearing all caches...\n');
  
  const statsBefore = getCacheStats();
  clearAllCaches();
  
  console.log('✅ Caches cleared:');
  console.log(`   Skills: ${statsBefore.skill.size} entries removed`);
  console.log(`   Framework: ${statsBefore.framework.size} entries removed`);
  console.log(`   Persona: ${statsBefore.persona.size} entries removed`);
  console.log('');
}

main();
