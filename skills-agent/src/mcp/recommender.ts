/**
 * MCP Recommender
 *
 * Decision logic untuk memilih MCP server yang cocok dengan project type.
 * Mengikuti matrix di skill `agent-planner` dan `project-planner` persona.
 */

import { MCP_REGISTRY, McpServerSpec, ProjectType, getMcpsByProjectType } from './registry.js';

export interface RecommendationInput {
  projectType: ProjectType;
  framework?: string;
  hasDatabase?: boolean;
  hasBrowser?: boolean;
  hasVcs?: boolean;
}

export interface Recommendation {
  server: McpServerSpec;
  reason: string;
  priority: 'required' | 'recommended' | 'optional';
}

export class McpRecommender {
  recommend(input: RecommendationInput): Recommendation[] {
    const candidates = getMcpsByProjectType(input.projectType);
    const recs: Recommendation[] = [];

    for (const server of candidates) {
      const rec = this.scoreServer(server, input);
      if (rec) recs.push(rec);
    }

    // Sort: required > recommended > optional
    const order = { required: 0, recommended: 1, optional: 2 };
    return recs.sort((a, b) => order[a.priority] - order[b.priority]);
  }

  private scoreServer(server: McpServerSpec, input: RecommendationInput): Recommendation | null {
    switch (server.category) {
      case 'browser':
        if (!input.hasBrowser && input.projectType !== 'web' && input.projectType !== 'fullstack') {
          return null;
        }
        return {
          server,
          reason: server.id === 'playwright-mcp'
            ? 'E2E testing dan UI verification untuk web/fullstack project'
            : 'Inspect runtime browser state saat debugging',
          priority: server.defaultEnabled ? 'recommended' : 'optional',
        };

      case 'database':
        if (input.hasDatabase === false) return null;
        return {
          server,
          reason: 'Database introspection — wajib untuk Database-First Protocol',
          priority: input.hasDatabase ? 'required' : 'recommended',
        };

      case 'vcs':
        return {
          server,
          reason: 'GitHub integration untuk PR, issue, dan workflow',
          priority: input.hasVcs === false ? 'optional' : 'recommended',
        };

      default:
        return {
          server,
          reason: server.description,
          priority: 'optional',
        };
    }
  }

  /** Generate snippet untuk preview ke user sebelum write */
  buildConfigSnippet(recs: Recommendation[]): Record<string, unknown> {
    const mcp: Record<string, unknown> = {};
    for (const rec of recs) {
      const { server } = rec;
      mcp[server.id] = {
        type: 'local',
        command: [server.command, ...(server.args ?? [])],
        enabled: rec.priority !== 'optional',
        ...(server.environment ? { environment: server.environment } : {}),
        timeout: 30000,
      };
    }
    return { mcp };
  }
}

export const mcpRecommender = new McpRecommender();
