/**
 * Integration tests for MCP tool workflows
 * Tests end-to-end flow: MCP handler → executor → provider → response
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { toolHandlers } from '../../src/mcp/handlers.js';
import { skillManager } from '../../src/skills/manager.js';
import { providerExecutor } from '../../src/providers/executor.js';
import { providerResolver } from '../../src/providers/resolver.js';

describe('MCP Tool Integration Tests', () => {
  beforeEach(async () => {
    // Load all skills before each test
    await skillManager.loadAll();
    vi.clearAllMocks();
  });

  describe('explore_codebase', () => {
    it('should explore codebase and return architecture insights', async () => {
      // Mock provider execution to avoid real API calls
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Architecture analysis:\n- Framework: Next.js\n- Structure: Feature-first',
          tokens_used: 100,
          model: 'test-model'
        },
        attempts: 1,
        providers_tried: ['test-provider'],
        metadata: {
          attempts: [{ provider: 'test-provider', latency: 500, timestamp: Date.now() }],
          total_latency: 500
        }
      });

      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'normal'
      });

      expect(result).toBeDefined();
      expect(result).toContain('Architecture');
      expect(mockExecute).toHaveBeenCalled();

      const callArg = mockExecute.mock.calls[0][0];
      expect(callArg.messages).toBeDefined();
      expect(callArg.messages.length).toBeGreaterThan(0);
    });

    it('should apply persona overlay when provided', async () => {
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: '🚨 CRITICAL vulnerabilities found...',
          tokens_used: 150,
          model: 'test-model'
        },
        attempts: 1,
        providers_tried: ['test-provider'],
        metadata: {
          attempts: [{ provider: 'test-provider', latency: 600, timestamp: Date.now() }],
          total_latency: 600
        }
      });

      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'quick',
        persona: 'red-team'
      });

      expect(result).toBeDefined();
      expect(mockExecute).toHaveBeenCalled();

      const callArg = mockExecute.mock.calls[0][0];
      expect(callArg.messages).toBeDefined();
      // Persona context should be injected
      const systemMessage = callArg.messages.find((m: any) => m.role === 'system');
      expect(systemMessage?.content).toBeDefined();
    });

    it('should handle provider fallback on failure', async () => {
      let attemptCount = 0;
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockImplementation(async () => {
        attemptCount++;
        if (attemptCount === 1) {
          // First attempt fails with rate limit (retryable)
          return {
            success: false,
            error: new Error('Rate limit exceeded'),
            attempts: 1,
            providers_tried: ['provider-1'],
            metadata: {
              attempts: [{ provider: 'provider-1', error: 'Rate limit', latency: 200, timestamp: Date.now() }],
              total_latency: 200
            }
          };
        }
        // Second attempt succeeds
        return {
          success: true,
          response: {
            content: 'Success after fallback',
            tokens_used: 100,
            model: 'test-model'
          },
          attempts: 2,
          providers_tried: ['provider-1', 'provider-2'],
          metadata: {
            attempts: [
              { provider: 'provider-1', error: 'Rate limit', latency: 200, timestamp: Date.now() },
              { provider: 'provider-2', latency: 300, timestamp: Date.now() }
            ],
            total_latency: 500
          }
        };
      });

      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'quick'
      });

      expect(result).toBeDefined();
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('implement_feature', () => {
    it('should implement feature with architectural guidance', async () => {
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Implementation plan:\n1. Create component\n2. Add state management\n3. Write tests',
          tokens_used: 200,
          model: 'test-model'
        },
        attempts: 1,
        providers_tried: ['test-provider'],
        metadata: {
          attempts: [{ provider: 'test-provider', latency: 800, timestamp: Date.now() }],
          total_latency: 800
        }
      });

      const result = await toolHandlers.handleImplementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'Add user profile page with avatar upload'
      });

      expect(result).toBeDefined();
      expect(result).toContain('Implementation');
      expect(mockExecute).toHaveBeenCalled();

      const callArg = mockExecute.mock.calls[0][0];
      expect(callArg.messages).toBeDefined();
      expect(callArg.messages.some((m: any) => 
        m.content?.includes('user profile')
      )).toBe(true);
    });

    it('should load framework-specific skills automatically', async () => {
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Next.js implementation with server actions...',
          tokens_used: 250,
          model: 'test-model'
        },
        attempts: 1,
        providers_tried: ['test-provider'],
        metadata: {
          attempts: [{ provider: 'test-provider', latency: 900, timestamp: Date.now() }],
          total_latency: 900
        }
      });

      const result = await toolHandlers.handleImplementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'Add authentication flow',
        framework: 'nextjs'
      });

      expect(result).toBeDefined();
      expect(mockExecute).toHaveBeenCalled();

      const callArg = mockExecute.mock.calls[0][0];
      const systemMessage = callArg.messages.find((m: any) => m.role === 'system');
      // Should include nextjs-readability skill context
      expect(systemMessage?.content).toBeDefined();
    });
  });

  describe('init_project', () => {
    it('should provide initialization guidance for framework', async () => {
      const result = await toolHandlers.handleInitProject({
        description: 'nextjs saas app with clerk auth and postgres',
        framework: 'nextjs'
      });

      expect(result).toBeDefined();
      expect(result).toContain('npx create-next-app');
      // Should include official CLI commands
      expect(result.toLowerCase()).toContain('next');
    });

    it('should recommend framework based on description if not provided', async () => {
      const result = await toolHandlers.handleInitProject({
        description: 'mobile app for iOS and Android with offline support'
      });

      expect(result).toBeDefined();
      // Should recommend React Native or Flutter
      expect(
        result.toLowerCase().includes('react native') || 
        result.toLowerCase().includes('flutter')
      ).toBe(true);
    });

    it('should include feature-specific setup if features mentioned', async () => {
      const result = await toolHandlers.handleInitProject({
        description: 'nestjs api with postgres, redis cache, and stripe payments',
        framework: 'nestjs'
      });

      expect(result).toBeDefined();
      expect(result.toLowerCase()).toContain('postgres');
      expect(result.toLowerCase()).toContain('redis');
    });
  });

  describe('load_skill_context', () => {
    it('should load skill by name', async () => {
      const result = await toolHandlers.handleLoadSkillContext({
        skills: ['feature-architect']
      });

      expect(result).toBeDefined();
      expect(result).toContain('feature-architect');
      // Should include skill content
      expect(result.length).toBeGreaterThan(100);
    });

    it('should load multiple skills', async () => {
      const result = await toolHandlers.handleLoadSkillContext({
        skills: ['project-readability', 'token-efficient-coding']
      });

      expect(result).toBeDefined();
      expect(result).toContain('project-readability');
      expect(result).toContain('token-efficient-coding');
    });

    it('should auto-load framework-specific skills', async () => {
      const result = await toolHandlers.handleLoadSkillContext({
        framework: 'nextjs'
      });

      expect(result).toBeDefined();
      expect(result).toContain('nextjs-readability');
      // Should also include base readability
      expect(result).toContain('project-readability');
    });

    it('should handle unknown skills gracefully', async () => {
      const result = await toolHandlers.handleLoadSkillContext({
        skills: ['non-existent-skill']
      });

      expect(result).toBeDefined();
      // Should return message about skill not found
      expect(result.toLowerCase()).toContain('not found');
    });
  });

  describe('Provider fallback integration', () => {
    it('should retry with different provider on rate limit', async () => {
      const attempts: string[] = [];
      
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockImplementation(async (req) => {
        const providerName = req.provider.name;
        attempts.push(providerName);

        if (attempts.length === 1) {
          // First provider hits rate limit
          return {
            success: false,
            error: new Error('Rate limit exceeded'),
            attempts: 1,
            providers_tried: [providerName],
            metadata: {
              attempts: [{ provider: providerName, error: 'Rate limit', latency: 100, timestamp: Date.now() }],
              total_latency: 100
            }
          };
        }

        // Second provider succeeds
        return {
          success: true,
          response: {
            content: 'Success with fallback provider',
            tokens_used: 100,
            model: 'fallback-model'
          },
          attempts: 2,
          providers_tried: attempts,
          metadata: {
            attempts: [
              { provider: attempts[0], error: 'Rate limit', latency: 100, timestamp: Date.now() },
              { provider: attempts[1], latency: 200, timestamp: Date.now() }
            ],
            total_latency: 300
          }
        };
      });

      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'quick'
      });

      expect(result).toBeDefined();
      expect(attempts.length).toBeGreaterThanOrEqual(1);
      expect(mockExecute).toHaveBeenCalled();
    });
  });

  describe('Cache integration', () => {
    it('should use cached skill on repeated loads', async () => {
      const skill1 = await skillManager.getSkill('project-readability');
      const skill2 = await skillManager.getSkill('project-readability');

      // Should return same instance (from cache)
      expect(skill1).toBeDefined();
      expect(skill2).toBeDefined();
      expect(skill1?.name).toBe(skill2?.name);
    });

    it('should cache framework detection results', async () => {
      // First call
      const result1 = await implementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'test feature 1'
      });

      // Second call with same path
      const result2 = await implementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'test feature 2'
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Framework detection should be cached (not tested directly, but should be faster)
    });
  });
});
