/**
 * MCP Server Registry
 *
 * Catalog of recommended MCP servers untuk berbagai project type.
 * Dipakai oleh recommender untuk generate suggestion + config-writer untuk
 * inject ke ~/.config/opencode/opencode.json.
 */

export interface McpServerSpec {
  id: string;
  displayName: string;
  description: string;
  category: 'browser' | 'database' | 'devtools' | 'vcs' | 'general';
  /** Command to launch the MCP server (stdio transport) */
  command: string;
  args?: string[];
  /** Environment variables required (user must provide) */
  environment?: Record<string, string>;
  /** Project types yang relevan */
  appliesTo: ProjectType[];
  /** Default enable when recommended */
  defaultEnabled: boolean;
  /** Link untuk docs */
  homepage?: string;
}

export type ProjectType = 'web' | 'api' | 'fullstack' | 'mobile' | 'cli' | 'library';

export const MCP_REGISTRY: Record<string, McpServerSpec> = {
  'playwright-mcp': {
    id: 'playwright-mcp',
    displayName: 'Playwright MCP',
    description: 'Browser automation untuk E2E testing dan UI verification',
    category: 'browser',
    command: 'npx',
    args: ['-y', '@playwright/mcp@latest'],
    appliesTo: ['web', 'fullstack'],
    defaultEnabled: true,
    homepage: 'https://github.com/microsoft/playwright-mcp',
  },

  'chrome-devtools-mcp': {
    id: 'chrome-devtools-mcp',
    displayName: 'Chrome DevTools MCP',
    description: 'Inspect runtime browser state (DOM, network, console)',
    category: 'browser',
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest'],
    appliesTo: ['web', 'fullstack'],
    defaultEnabled: false,
    homepage: 'https://github.com/ChromeDevTools/chrome-devtools-mcp',
  },

  'dbhub': {
    id: 'dbhub',
    displayName: 'DBHub MCP',
    description: 'Read-only database introspection (Postgres/MySQL/SQLite)',
    category: 'database',
    command: 'npx',
    args: ['-y', '@bytebase/dbhub'],
    environment: {
      DBHUB_DSN: 'postgres://user:pass@localhost:5432/dbname',
    },
    appliesTo: ['api', 'fullstack'],
    defaultEnabled: true,
    homepage: 'https://github.com/bytebase/dbhub',
  },

  'mcp-toolbox': {
    id: 'mcp-toolbox',
    displayName: 'MCP Toolbox for Databases',
    description: 'Google MCP Toolbox — production-grade database tooling',
    category: 'database',
    command: 'npx',
    args: ['-y', '@googleapis/mcp-toolbox'],
    appliesTo: ['api', 'fullstack'],
    defaultEnabled: false,
    homepage: 'https://github.com/googleapis/mcp-toolbox',
  },

  'github-mcp': {
    id: 'github-mcp',
    displayName: 'GitHub MCP',
    description: 'GitHub repo, issue, PR, workflow management',
    category: 'vcs',
    command: 'npx',
    args: ['-y', '@modelcontextprotocol/server-github'],
    environment: {
      GITHUB_PERSONAL_ACCESS_TOKEN: 'ghp_xxx',
    },
    appliesTo: ['web', 'api', 'fullstack', 'mobile', 'cli', 'library'],
    defaultEnabled: true,
    homepage: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
  },
};

export function getMcpById(id: string): McpServerSpec | undefined {
  return MCP_REGISTRY[id];
}

export function getMcpsByProjectType(type: ProjectType): McpServerSpec[] {
  return Object.values(MCP_REGISTRY).filter(s => s.appliesTo.includes(type));
}

export function listAllMcps(): McpServerSpec[] {
  return Object.values(MCP_REGISTRY);
}
