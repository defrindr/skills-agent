/**
 * Unit tests for MCP Tool Handlers
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ToolHandlers } from '../../../src/mcp/handlers.js';
import { skillManager } from '../../../src/skills/manager.js';
import { contextBuilder } from '../../../src/skills/context-builder.js';
import { providerResolver } from '../../../src/providers/resolver.js';
import { providerExecutor } from '../../../src/providers/executor.js';
import { detectFramework } from '../../../src/utils/framework-detector.js';

// Mock dependencies
vi.mock('../../../src/skills/manager.js');
vi.mock('../../../src/skills/context-builder.js');
vi.mock('../../../src/providers/resolver.js');
vi.mock('../../../src/providers/executor.js');
vi.mock('../../../src/utils/framework-detector.js');

describe('ToolHandlers', () => {
  let handlers: ToolHandlers;

  const mockSkill = {
    name: 'test-skill',
    description: 'Test skill',
    content: 'Test content',
    metadata: {},
    filePath: '/path/to/skill.md'
  };

  const mockProvider = {
    name: 'test-provider',
    enabled: true,
    tier: 'free',
    endpoint: 'https://api.test.com',
    model: 'test-model',
    max_tokens: 4096,
    temperature: 0.7
  };

  const mockExecutionResult = {
    success: true,
    response: {
      content: 'Mock response content',
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300
      },
      model: 'test-model',
      provider: 'test-provider'
    },
    metadata: {
      attempts: [],
      total_latency: 1000,
      fatal: false
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    handlers = new ToolHandlers();

    // Setup default mocks
    (skillManager.getSkill as any).mockReturnValue(mockSkill);
    (contextBuilder.build as any).mockResolvedValue('Mock context content');
    (providerResolver.resolve as any).mockReturnValue(mockProvider);
    (providerExecutor.execute as any).mockResolvedValue(mockExecutionResult);
    (detectFramework as any).mockResolvedValue(null);
  });

  describe('handleExploreCodebase', () => {
    it('should explore codebase successfully', async () => {
      const args = {
        path: '/test/path',
        depth: 'normal',
        persona: 'senior-engineer'
      };

      const result = await handlers.handleExploreCodebase(args);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(skillManager.getSkill).toHaveBeenCalledWith('codebase-explorer');
      expect(detectFramework).toHaveBeenCalledWith('/test/path');
      expect(contextBuilder.build).toHaveBeenCalled();
      expect(providerResolver.resolve).toHaveBeenCalled();
      expect(providerExecutor.execute).toHaveBeenCalled();
    });

    it('should handle quick depth exploration', async () => {
      const args = {
        path: '/test/path',
        depth: 'quick',
        persona: 'senior-engineer'
      };

      await handlers.handleExploreCodebase(args);

      expect(providerExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 4000
        })
      );
    });

    it('should handle deep depth exploration', async () => {
      const args = {
        path: '/test/path',
        depth: 'deep',
        persona: 'senior-engineer'
      };

      await handlers.handleExploreCodebase(args);

      expect(providerExecutor.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          max_tokens: 16000
        })
      );
    });

    it('should include framework info when detected', async () => {
      (detectFramework as any).mockResolvedValue({
        name: 'nextjs',
        type: 'fullstack',
        skills: ['nextjs-readability']
      });

      const args = {
        path: '/test/path',
        depth: 'normal',
        persona: 'senior-engineer'
      };

      await handlers.handleExploreCodebase(args);

      expect(detectFramework).toHaveBeenCalledWith('/test/path');
      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['nextjs-readability'])
        })
      );
    });

    it('should throw error if skill not found', async () => {
      (skillManager.getSkill as any).mockReturnValue(null);

      const args = {
        path: '/test/path',
        depth: 'normal',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleExploreCodebase(args)).rejects.toThrow(
        'codebase-explorer skill not found'
      );
    });

    it('should throw error if execution fails', async () => {
      (providerExecutor.execute as any).mockResolvedValue({
        success: false,
        error: { message: 'Execution failed' }
      });

      const args = {
        path: '/test/path',
        depth: 'normal',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleExploreCodebase(args)).rejects.toThrow(
        'Exploration failed: Execution failed'
      );
    });

    it('should use override provider if provided', async () => {
      const args = {
        path: '/test/path',
        depth: 'normal',
        persona: 'senior-engineer',
        provider: 'custom-provider'
      };

      await handlers.handleExploreCodebase(args);

      expect(providerResolver.resolve).toHaveBeenCalledWith(
        mockSkill,
        'custom-provider'
      );
    });
  });

  describe('handleImplementFeature', () => {
    it('should implement feature successfully', async () => {
      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        persona: 'senior-engineer'
      };

      const result = await handlers.handleImplementFeature(args);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(skillManager.getSkill).toHaveBeenCalledWith('feature-architect');
      expect(detectFramework).toHaveBeenCalledWith('/test/path');
      expect(contextBuilder.build).toHaveBeenCalled();
      expect(providerResolver.resolve).toHaveBeenCalled();
      expect(providerExecutor.execute).toHaveBeenCalled();
    });

    it('should use framework hint if provided', async () => {
      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        framework: 'nextjs',
        persona: 'senior-engineer'
      };

      await handlers.handleImplementFeature(args);

      // Should not call detectFramework when hint provided
      expect(detectFramework).not.toHaveBeenCalled();
    });

    it('should detect framework when no hint provided', async () => {
      (detectFramework as any).mockResolvedValue({
        name: 'expressjs',
        type: 'backend',
        skills: ['expressjs-readability']
      });

      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        persona: 'backend-architect'
      };

      await handlers.handleImplementFeature(args);

      expect(detectFramework).toHaveBeenCalledWith('/test/path');
      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['expressjs-readability'])
        })
      );
    });

    it('should throw error if skill not found', async () => {
      (skillManager.getSkill as any).mockReturnValue(null);

      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleImplementFeature(args)).rejects.toThrow(
        'feature-architect skill not found'
      );
    });

    it('should throw error if execution fails', async () => {
      (providerExecutor.execute as any).mockResolvedValue({
        success: false,
        error: { message: 'Feature implementation failed' }
      });

      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleImplementFeature(args)).rejects.toThrow(
        'Feature implementation failed'
      );
    });

    it('should include token-efficient-coding skill', async () => {
      const args = {
        description: 'Add user authentication',
        path: '/test/path',
        persona: 'senior-engineer'
      };

      await handlers.handleImplementFeature(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['token-efficient-coding'])
        })
      );
    });
  });

  describe('handleLoadSkillContext', () => {
    it('should load skill context successfully', async () => {
      const args = {
        skills: ['project-readability', 'token-efficient-coding'],
        persona: 'senior-engineer'
      };

      const result = await handlers.handleLoadSkillContext(args);

      expect(result).toBeDefined();
      expect(result).toContain('Loaded Skills Context');
      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: ['project-readability', 'token-efficient-coding'],
          persona: 'senior-engineer',
          compressionLevel: 'full'
        })
      );
    });

    it('should load framework skills when framework provided', async () => {
      const args = {
        framework: 'nextjs',
        persona: 'senior-engineer'
      };

      await handlers.handleLoadSkillContext(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['nextjs-readability'])
        })
      );
    });

    it('should combine explicit skills and framework skills', async () => {
      const args = {
        skills: ['project-readability'],
        framework: 'expressjs',
        persona: 'backend-architect'
      };

      await handlers.handleLoadSkillContext(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['project-readability', 'expressjs-readability'])
        })
      );
    });

    it('should use default persona if not provided', async () => {
      const args = {
        skills: ['project-readability']
      };

      await handlers.handleLoadSkillContext(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          persona: 'senior-engineer'
        })
      );
    });

    it('should handle empty skills array', async () => {
      const args = {
        skills: [],
        persona: 'senior-engineer'
      };

      const result = await handlers.handleLoadSkillContext(args);

      expect(result).toBeDefined();
      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: []
        })
      );
    });
  });

  describe('handleInitProject', () => {
    it('should init project successfully with complete requirements', async () => {
      const args = {
        description: 'nextjs saas app with clerk auth and postgres, solo dev, startup scale',
        persona: 'senior-engineer'
      };

      const result = await handlers.handleInitProject(args);

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(skillManager.getSkill).toHaveBeenCalledWith('project-initializer');
    });

    it('should throw error if skill not found', async () => {
      (skillManager.getSkill as any).mockReturnValue(null);

      const args = {
        description: 'nextjs saas app',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleInitProject(args)).rejects.toThrow(
        'project-initializer skill not found'
      );
    });

    it('should use framework hint if provided', async () => {
      const args = {
        description: 'nextjs saas app with clerk auth and postgres, solo dev, startup scale',
        framework: 'nextjs',
        persona: 'senior-engineer'
      };

      await handlers.handleInitProject(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['nextjs-readability'])
        })
      );
    });

    it('should include project name if provided', async () => {
      const args = {
        description: 'nextjs saas app with auth and postgres, solo dev, startup scale',
        name: 'my-awesome-app',
        persona: 'senior-engineer'
      };

      const result = await handlers.handleInitProject(args);

      expect(result).toBeDefined();
    });

    it('should use override provider if provided', async () => {
      const args = {
        description: 'nextjs saas app with clerk auth and postgres, solo dev, startup scale',
        provider: 'custom-provider',
        persona: 'senior-engineer'
      };

      await handlers.handleInitProject(args);

      expect(providerResolver.resolve).toHaveBeenCalledWith(
        mockSkill,
        'custom-provider'
      );
    });

    it('should include token-efficient-coding skill', async () => {
      const args = {
        description: 'nextjs saas app with clerk auth and postgres, solo dev, startup scale',
        persona: 'senior-engineer'
      };

      await handlers.handleInitProject(args);

      expect(contextBuilder.build).toHaveBeenCalledWith(
        expect.objectContaining({
          skills: expect.arrayContaining(['token-efficient-coding'])
        })
      );
    });

    it('should throw error if execution fails', async () => {
      (providerExecutor.execute as any).mockResolvedValue({
        success: false,
        error: { message: 'Init failed' }
      });

      const args = {
        description: 'nextjs saas app with clerk auth and postgres, solo dev, startup scale',
        persona: 'senior-engineer'
      };

      await expect(handlers.handleInitProject(args)).rejects.toThrow(
        'Project initialization failed: Init failed'
      );
    });
  });

  describe('getFrameworkSkills', () => {
    it('should return framework-specific skills for nextjs', async () => {
      const result = await (handlers as any).getFrameworkSkills('nextjs');

      expect(result).toEqual(['nextjs-readability']);
    });

    it('should return framework-specific skills for expressjs', async () => {
      const result = await (handlers as any).getFrameworkSkills('expressjs');

      expect(result).toEqual(['expressjs-readability']);
    });

    it('should return framework-specific skills for laravel', async () => {
      const result = await (handlers as any).getFrameworkSkills('laravel');

      expect(result).toEqual(['laravel-readability']);
    });

    it('should return framework-specific skills for fastapi', async () => {
      const result = await (handlers as any).getFrameworkSkills('fastapi');

      expect(result).toEqual(['fastapi-readability']);
    });

    it('should return framework-specific skills for golang', async () => {
      const result = await (handlers as any).getFrameworkSkills('golang');

      expect(result).toEqual(['golang-readability']);
    });

    it('should return framework-specific skills for nestjs', async () => {
      const result = await (handlers as any).getFrameworkSkills('nestjs');

      expect(result).toEqual(['nestjs-readability']);
    });

    it('should return framework-specific skills for flutter', async () => {
      const result = await (handlers as any).getFrameworkSkills('flutter');

      expect(result).toEqual(['flutter-readability']);
    });

    it('should return framework-specific skills for react-native', async () => {
      const result = await (handlers as any).getFrameworkSkills('react-native');

      expect(result).toEqual(['react-native-readability']);
    });

    it('should return empty array for unknown framework', async () => {
      const result = await (handlers as any).getFrameworkSkills('unknown-framework');

      expect(result).toEqual([]);
    });
  });
});
