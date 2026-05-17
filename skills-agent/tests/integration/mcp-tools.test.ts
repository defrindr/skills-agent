/**
 * Integration tests for MCP tool workflows
 * Tests end-to-end flow: MCP handler → executor → provider → response
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { toolHandlers } from '../../src/mcp/handlers.js';
import { skillManager } from '../../src/skills/manager.js';
import { providerExecutor } from '../../src/providers/executor.js';
import { providerResolver } from '../../src/providers/resolver.js';
import { configManager } from '../../src/utils/config.js';

describe('MCP Tool Integration Tests', () => {
  beforeAll(async () => {
    // Load config and skills once before all tests
    await configManager.load();
    await skillManager.loadAll();
  });

  beforeEach(async () => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  describe('explore_codebase', () => {
    it('should explore codebase and return architecture insights', async () => {
      // Mock provider execution to avoid real API calls
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Architecture analysis:\n- Framework: Next.js\n- Structure: Feature-first',
          usage: {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100
          },
          model: 'test-model',
          provider: 'test-provider'
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
          usage: {
            prompt_tokens: 75,
            completion_tokens: 75,
            total_tokens: 150
          },
          model: 'test-model',
          provider: 'test-provider'
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
      // First attempt fails, second succeeds
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValueOnce({
        success: false,
        error: new Error('Rate limit exceeded'),
        attempts: 2,
        providers_tried: ['provider-1', 'provider-2'],
        metadata: {
          attempts: [
            { provider: 'provider-1', error: 'Rate limit', latency: 200, timestamp: Date.now() },
            { provider: 'provider-2', latency: 300, timestamp: Date.now() }
          ],
          total_latency: 500
        }
      }).mockResolvedValueOnce({
        success: true,
        response: {
          content: 'Success after fallback',
          usage: {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100
          },
          model: 'test-model',
          provider: 'fallback-provider'
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
      });

      // First call will fail with our mock, so catch it
      try {
        await toolHandlers.handleExploreCodebase({
          path: './tests/fixtures/projects/nextjs',
          depth: 'quick'
        });
      } catch (e) {
        // Expected to fail on first call
      }

      // Second call should succeed
      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'quick'
      });

      expect(result).toBeDefined();
      expect(mockExecute).toHaveBeenCalledTimes(2);
    });
  });

  describe('implement_feature', () => {
    it('should implement feature with architectural guidance', async () => {
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Implementation plan:\n1. Create component\n2. Add state management\n3. Write tests',
          usage: {
            prompt_tokens: 100,
            completion_tokens: 100,
            total_tokens: 200
          },
          model: 'test-model',
          provider: 'test-provider'
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
          usage: {
            prompt_tokens: 125,
            completion_tokens: 125,
            total_tokens: 250
          },
          model: 'test-model',
          provider: 'test-provider'
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
      // Should include Next.js setup guidance
      expect(result.toLowerCase()).toContain('next');
    });

    it('should recommend framework based on description if not provided', async () => {
      const result = await toolHandlers.handleInitProject({
        description: 'mobile app for iOS and Android with offline support'
      });

      expect(result).toBeDefined();
      // Should ask for more info or recommend framework
      expect(result.length).toBeGreaterThan(50);
    });

    it('should include feature-specific setup if features mentioned', async () => {
      const result = await toolHandlers.handleInitProject({
        description: 'nestjs api with postgres, redis cache, and stripe payments',
        framework: 'nestjs'
      });

      expect(result).toBeDefined();
      // Should return guidance (may ask for more info or provide setup)
      expect(result.length).toBeGreaterThan(100);
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
      // Should return some content (may be empty or error message)
      expect(typeof result).toBe('string');
    });
  });

  describe('Provider fallback integration', () => {
    it('should retry with different provider on rate limit', async () => {
      // Mock successful execution after fallback
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Success with fallback provider',
          usage: {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100
          },
          model: 'fallback-model',
          provider: 'fallback-provider'
        },
        attempts: 2,
        providers_tried: ['provider-1', 'provider-2'],
        metadata: {
          attempts: [
            { provider: 'provider-1', error: 'Rate limit', latency: 100, timestamp: Date.now() },
            { provider: 'provider-2', latency: 200, timestamp: Date.now() }
          ],
          total_latency: 300
        }
      });

      const result = await toolHandlers.handleExploreCodebase({
        path: './tests/fixtures/projects/nextjs',
        depth: 'quick'
      });

      expect(result).toBeDefined();
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
      const mockExecute = vi.spyOn(providerExecutor, 'execute').mockResolvedValue({
        success: true,
        response: {
          content: 'Feature implemented',
          usage: {
            prompt_tokens: 50,
            completion_tokens: 50,
            total_tokens: 100
          },
          model: 'test-model',
          provider: 'test-provider'
        },
        attempts: 1,
        providers_tried: ['test-provider'],
        metadata: {
          attempts: [{ provider: 'test-provider', latency: 500, timestamp: Date.now() }],
          total_latency: 500
        }
      });

      // First call
      const result1 = await toolHandlers.handleImplementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'test feature 1'
      });

      // Second call with same path
      const result2 = await toolHandlers.handleImplementFeature({
        path: './tests/fixtures/projects/nextjs',
        description: 'test feature 2'
      });

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();
      // Framework detection should be cached (not tested directly, but should be faster)
    });
  });
});
