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
      persona: {
        type: 'string',
        enum: ['senior-engineer', 'red-team', 'minimalist'],
        default: 'senior-engineer',
        description: 'Persona lens: senior-engineer (default, professional), red-team (security focus), minimalist (code-first)'
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
      persona: {
        type: 'string',
        enum: ['senior-engineer', 'red-team', 'minimalist'],
        default: 'senior-engineer',
        description: 'Persona lens: senior-engineer (default, professional), red-team (security focus), minimalist (code-first)'
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
        },
        persona: {
          type: 'string',
          enum: ['senior-engineer', 'red-team', 'minimalist'],
          default: 'senior-engineer',
          description: 'Persona lens: senior-engineer (default, professional), red-team (security focus), minimalist (code-first)'
        }
      }
    }
  },

  {
    name: 'init_project',
    description: 'Initialize new project with tailored guidance. If requirements unclear, agent will ask questions first to understand scale, features, team size, and timeline before recommending setup.',
    inputSchema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Project description with as much detail as possible: type (web/mobile/api), scale (mvp/startup/enterprise), features needed (auth, db, payments, etc), team size, timeline. Example: "nextjs saas app with clerk auth and postgres, solo dev, startup scale"'
        },
        framework: {
          type: 'string',
          description: 'Preferred framework (optional - agent can recommend based on requirements)'
        },
        name: {
          type: 'string',
          description: 'Project name (optional - can be provided later)'
        },
        persona: {
          type: 'string',
          enum: ['senior-engineer', 'red-team', 'minimalist'],
          default: 'senior-engineer',
          description: 'Persona lens: senior-engineer (default, professional), red-team (security focus), minimalist (code-first)'
        },
      provider: {
        type: 'string',
        description: 'Override default provider (optional)'
      }
      },
      required: ['description']
    }
  }
];
