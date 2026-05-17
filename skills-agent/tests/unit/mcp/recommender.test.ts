/**
 * Unit tests for McpRecommender
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { McpRecommender, RecommendationInput } from '../../../src/mcp/recommender.js';
import { ProjectType } from '../../../src/mcp/registry.js';

describe('McpRecommender', () => {
  let recommender: McpRecommender;

  beforeEach(() => {
    recommender = new McpRecommender();
  });

  describe('recommend', () => {
    it('should recommend servers for web project', () => {
      const input: RecommendationInput = {
        projectType: 'web',
        hasBrowser: true,
        hasDatabase: false,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(Array.isArray(recs)).toBe(true);
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend servers for api project', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThan(0);
      
      // API project should recommend database MCP
      const dbRec = recs.find(r => r.server.category === 'database');
      expect(dbRec).toBeDefined();
      expect(dbRec?.priority).toBe('required');
    });

    it('should recommend servers for fullstack project', () => {
      const input: RecommendationInput = {
        projectType: 'fullstack',
        hasBrowser: true,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThan(0);
      
      // Fullstack should have both browser and database recommendations
      const hasDatabase = recs.some(r => r.server.category === 'database');
      const hasBrowser = recs.some(r => r.server.category === 'browser');
      
      expect(hasDatabase).toBe(true);
      expect(hasBrowser).toBe(true);
    });

    it('should recommend servers for mobile project', () => {
      const input: RecommendationInput = {
        projectType: 'mobile',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend servers for cli project', () => {
      const input: RecommendationInput = {
        projectType: 'cli',
        hasDatabase: false,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should recommend servers for library project', () => {
      const input: RecommendationInput = {
        projectType: 'library',
        hasDatabase: false,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      expect(recs).toBeDefined();
      expect(recs.length).toBeGreaterThan(0);
    });

    it('should sort recommendations by priority (required > recommended > optional)', () => {
      const input: RecommendationInput = {
        projectType: 'fullstack',
        hasBrowser: true,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      // Check that required come before recommended, and recommended before optional
      let lastPriority = 0; // required = 0, recommended = 1, optional = 2
      const order = { required: 0, recommended: 1, optional: 2 };

      for (const rec of recs) {
        const currentPriority = order[rec.priority];
        expect(currentPriority).toBeGreaterThanOrEqual(lastPriority);
        lastPriority = currentPriority;
      }
    });

    it('should exclude browser MCP when hasBrowser is false', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasBrowser: false,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      const browserRec = recs.find(r => r.server.category === 'browser');
      expect(browserRec).toBeUndefined();
    });

    it('should exclude database MCP when hasDatabase is false', () => {
      const input: RecommendationInput = {
        projectType: 'web',
        hasDatabase: false,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      const dbRec = recs.find(r => r.server.category === 'database');
      expect(dbRec).toBeUndefined();
    });

    it('should mark database as required when hasDatabase is true', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      const dbRec = recs.find(r => r.server.category === 'database');
      expect(dbRec).toBeDefined();
      expect(dbRec?.priority).toBe('required');
      expect(dbRec?.reason).toContain('Database-First Protocol');
    });

    it('should mark VCS as optional when hasVcs is false', () => {
      const input: RecommendationInput = {
        projectType: 'web',
        hasVcs: false
      };

      const recs = recommender.recommend(input);

      const vcsRec = recs.find(r => r.server.category === 'vcs');
      if (vcsRec) {
        expect(vcsRec.priority).toBe('optional');
      }
    });

    it('should provide reason for each recommendation', () => {
      const input: RecommendationInput = {
        projectType: 'fullstack',
        hasBrowser: true,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);

      for (const rec of recs) {
        expect(rec.reason).toBeDefined();
        expect(typeof rec.reason).toBe('string');
        expect(rec.reason.length).toBeGreaterThan(0);
      }
    });
  });

  describe('buildConfigSnippet', () => {
    it('should build config snippet from recommendations', () => {
      const input: RecommendationInput = {
        projectType: 'fullstack',
        hasBrowser: true,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);

      expect(snippet).toBeDefined();
      expect(snippet.mcp).toBeDefined();
      expect(typeof snippet.mcp).toBe('object');
    });

    it('should enable required and recommended servers', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);
      const mcp = snippet.mcp as Record<string, any>;

      const dbRec = recs.find(r => r.server.category === 'database');
      if (dbRec) {
        const serverId = dbRec.server.id;
        expect(mcp[serverId]).toBeDefined();
        expect(mcp[serverId].enabled).toBe(true); // required
      }

      const vcsRec = recs.find(r => r.server.category === 'vcs');
      if (vcsRec) {
        const serverId = vcsRec.server.id;
        expect(mcp[serverId]).toBeDefined();
        expect(mcp[serverId].enabled).toBe(true); // recommended
      }
    });

    it('should disable optional servers', () => {
      const input: RecommendationInput = {
        projectType: 'web',
        hasDatabase: false,
        hasVcs: false
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);
      const mcp = snippet.mcp as Record<string, any>;

      const optionalRecs = recs.filter(r => r.priority === 'optional');
      for (const rec of optionalRecs) {
        const serverId = rec.server.id;
        if (mcp[serverId]) {
          expect(mcp[serverId].enabled).toBe(false);
        }
      }
    });

    it('should include command and args in snippet', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);
      const mcp = snippet.mcp as Record<string, any>;

      for (const rec of recs) {
        const serverId = rec.server.id;
        const config = mcp[serverId];
        
        expect(config).toBeDefined();
        expect(config.type).toBe('local');
        expect(config.command).toBeDefined();
        expect(Array.isArray(config.command)).toBe(true);
        expect(config.command[0]).toBe(rec.server.command);
        expect(config.timeout).toBe(30000);
      }
    });

    it('should include environment variables if present', () => {
      const input: RecommendationInput = {
        projectType: 'api',
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);
      const mcp = snippet.mcp as Record<string, any>;

      for (const rec of recs) {
        const serverId = rec.server.id;
        const config = mcp[serverId];
        
        if (rec.server.environment) {
          expect(config.environment).toEqual(rec.server.environment);
        }
      }
    });

    it('should generate valid JSON-serializable snippet', () => {
      const input: RecommendationInput = {
        projectType: 'fullstack',
        hasBrowser: true,
        hasDatabase: true,
        hasVcs: true
      };

      const recs = recommender.recommend(input);
      const snippet = recommender.buildConfigSnippet(recs);

      // Should be serializable to JSON
      expect(() => JSON.stringify(snippet)).not.toThrow();
      
      const json = JSON.stringify(snippet, null, 2);
      expect(json).toBeDefined();
      expect(json.length).toBeGreaterThan(0);
    });

    it('should handle empty recommendations', () => {
      const snippet = recommender.buildConfigSnippet([]);

      expect(snippet).toBeDefined();
      expect(snippet.mcp).toBeDefined();
      expect(Object.keys(snippet.mcp as object).length).toBe(0);
    });
  });
});
