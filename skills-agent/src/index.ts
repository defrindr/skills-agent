#!/usr/bin/env node

/**
 * Skills Agent - Main entry point (MCP mode)
 */

import dotenv from 'dotenv';
import { SkillsMCPServer } from './mcp/server.js';
import { logger } from './utils/logger.js';

// Load environment variables
dotenv.config();

async function main() {
  try {
    const server = new SkillsMCPServer();
    await server.start();
  } catch (error) {
    logger.error('Fatal error:', error);
    process.exit(1);
  }
}

main();
