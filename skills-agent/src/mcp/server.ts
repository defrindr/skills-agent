/**
 * MCP Server for Skills Agent
 * Exposes skills as tools for OpenCode/Copilot integration
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { SKILL_TOOLS } from './tools.js';
import { toolHandlers } from './handlers.js';
import { skillManager } from '../skills/manager.js';
import { personaManager } from '../skills/persona-manager.js';
import { configManager } from '../utils/config.js';
import { logger } from '../utils/logger.js';

export class SkillsMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'skills-agent',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: SKILL_TOOLS,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        logger.info(`Tool called: ${name}`);

        let result: string;

        switch (name) {
          case 'explore_codebase':
            result = await toolHandlers.handleExploreCodebase(args);
            break;

          case 'implement_feature':
            result = await toolHandlers.handleImplementFeature(args);
            break;

          case 'load_skill_context':
            result = await toolHandlers.handleLoadSkillContext(args);
            break;

          case 'init_project':
            result = await toolHandlers.handleInitProject(args);
            break;

          default:
            throw new Error(`Unknown tool: ${name}`);
        }

        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      } catch (error: any) {
        logger.error(`Tool ${name} failed:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async start(): Promise<void> {
    logger.info('Starting Skills Agent MCP Server...');

    try {
      // Load configuration
      await configManager.load();
      logger.info('Configuration loaded');

      // Load skills
      await skillManager.loadAll();
      logger.info(`Loaded ${skillManager.getAllSkills().length} skills`);

      // Load personas
      await personaManager.loadAll();
      logger.info(`Loaded ${personaManager.getAllPersonas().length} personas`);

      // Start server with stdio transport
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      logger.info('Skills Agent MCP Server started successfully');
      logger.info('Waiting for requests via stdio...');
    } catch (error) {
      logger.error('Failed to start server:', error);
      throw error;
    }
  }
}
