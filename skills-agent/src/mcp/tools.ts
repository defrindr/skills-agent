/**
 * MCP Tool definitions for Skills Agent
 */

export const SKILL_TOOLS = [
  {
    name: 'explore_codebase',
    description: 'Map dan analyze codebase untuk pertama kali atau setelah perubahan besar. Automatically detects framework dan loads relevant skills.',
    inputSchema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Path to codebase to explore'
        },
        depth: {
          type: 'string',
          enum: ['quick', 'normal', 'deep'],
          default: 'normal',
          description: 'Thoroughness level: quick (basic structure), normal (detailed analysis), deep (comprehensive)'
        },
        provider: {
          type: 'string',
          description: 'Override default provider (optional, e.g., claude-sonnet, deepseek)'
        }
      },
      required: ['path']
    }
  },

  {
    name: 'implement_feature',
    description: 'Implement new feature dengan architectural thinking, best practices, dan framework-specific patterns. Automatically loads framework skills.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Detailed feature description and requirements'
        },
        path: {
          type: 'string',
          description: 'Working directory path'
        },
        framework: {
          type: 'string',
          description: 'Framework hint (auto-detected if not provided)'
        },
        provider: {
          type: 'string',
          description: 'Override default provider (optional)'
        }
      },
      required: ['description', 'path']
    }
  },

  {
    name: 'load_skill_context',
    description: 'Load specific skill contexts to inject into current conversation. Useful untuk manual skill loading.',
    inputSchema: {
      type: 'object',
      properties: {
        skills: {
          type: 'array',
          items: { type: 'string' },
          description: 'Skill names to load (e.g., ["codebase-explorer", "token-efficient-coding"])'
        },
        framework: {
          type: 'string',
          description: 'Auto-load framework-specific skill (e.g., "nextjs", "nestjs")'
        }
      }
    }
  },

  {
    name: 'init_project',
    description: 'Initialize new project with guidance from framework-specific skills. Provides commands and structure recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        framework: {
          type: 'string',
          description: 'Framework to initialize (e.g., "nextjs", "nestjs", "react", "expressjs")'
        },
        name: {
          type: 'string',
          description: 'Project name'
        },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional features (e.g., ["auth", "database", "docker"])'
        },
        provider: {
          type: 'string',
          description: 'Override default provider (optional)'
        }
      },
      required: ['framework', 'name']
    }
  }
];
