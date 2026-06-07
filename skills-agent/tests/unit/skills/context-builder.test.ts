/**
 * Unit tests for ContextBuilder
 */

import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import { ContextBuilder } from '../../../src/skills/context-builder.js';
import { skillManager } from '../../../src/skills/manager.js';
import { personaManager } from '../../../src/skills/persona-manager.js';

// Mock dependencies
vi.mock('../../../src/skills/manager.js');
vi.mock('../../../src/skills/persona-manager.js');

describe('ContextBuilder', () => {
  let builder: ContextBuilder;

  const mockSkill1 = {
    name: 'project-readability',
    description: 'Readability guidelines',
    content: 'Content for project-readability skill',
    metadata: {},
    filePath: '/path/to/project-readability.md',
    partials: [
      { name: 'project-readability/naming', content: 'Naming partial content', filePath: '/path/to/partials/naming.md' },
    ],
  };

  const mockSkill2 = {
    name: 'token-efficient-coding',
    description: 'Token efficiency guidelines',
    content: 'Content for token-efficient-coding skill',
    metadata: {},
    filePath: '/path/to/token-efficient-coding.md',
    partials: [],
  };

  const mockPersona = {
    name: 'backend-architect',
    metadata: {
      name: 'backend-architect',
      display_name: 'Backend Architect',
      category: 'role',
      description: 'API-first backend specialist',
      mindset: ['Contract-first API design'],
      communication_style: 'Technical and structured',
      priorities: ['API design', 'Validation', 'Error handling'],
      output_format: 'Structured with implementation steps'
    },
    content: 'Backend architect persona content'
  };

  const mockSeniorEngineerPersona = {
    name: 'senior-engineer',
    metadata: {
      name: 'senior-engineer',
      display_name: 'Senior Engineer',
      category: 'core',
      description: 'Professional pragmatic engineer',
      mindset: ['Maintainability first'],
      communication_style: 'Clear and concise',
      priorities: ['Readability', 'Simplicity'],
      output_format: 'Practical with examples'
    },
    content: 'Senior engineer persona content'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    builder = new ContextBuilder();

    // Default mocks
    (skillManager.getSkillsByNames as any).mockReturnValue([mockSkill1, mockSkill2]);
    (personaManager.load as any).mockReturnValue(mockPersona);
    (personaManager.formatPersona as any).mockReturnValue('Formatted persona content');
  });

  describe('build', () => {
    it('should build context with persona and skills', async () => {
      const options = {
        persona: 'backend-architect',
        skills: ['project-readability', 'token-efficient-coding'],
        compressionLevel: 'full' as const
      };

      const result = await builder.build(options);

      expect(result).toBeDefined();
      expect(result).toContain('Formatted persona content');
      expect(result).toContain('Skills Context');
      expect(result).toContain('project-readability');
      expect(result).toContain('token-efficient-coding');
      expect(personaManager.load).toHaveBeenCalledWith('backend-architect');
      expect(personaManager.formatPersona).toHaveBeenCalledWith(mockPersona, 'full');
      expect(skillManager.getSkillsByNames).toHaveBeenCalledWith([
        'project-readability',
        'token-efficient-coding'
      ]);
    });

    it('should handle senior-engineer persona with minimal prefix', async () => {
      (personaManager.load as any).mockReturnValue(mockSeniorEngineerPersona);

      const options = {
        persona: 'senior-engineer',
        skills: ['project-readability'],
        compressionLevel: 'full' as const
      };

      const result = await builder.build(options);

      expect(result).toBeDefined();
      expect(result).toContain('Persona: Senior Engineer');
      expect(result).toContain('Professional pragmatic engineer');
      expect(result).toContain('Skills Context');
      expect(personaManager.load).toHaveBeenCalledWith('senior-engineer');
      expect(personaManager.formatPersona).not.toHaveBeenCalled(); // Should not format for default persona
    });

    it('should build context without persona when not specified', async () => {
      const options = {
        skills: ['project-readability', 'token-efficient-coding']
      };

      const result = await builder.build(options);

      expect(result).toBeDefined();
      expect(result).not.toContain('Persona:');
      expect(result).not.toContain('Skills Context');
      expect(result).toContain('project-readability');
      expect(result).toContain('token-efficient-coding');
      expect(personaManager.load).not.toHaveBeenCalled();
      expect(personaManager.formatPersona).not.toHaveBeenCalled();
    });

    it('should handle persona not found gracefully', async () => {
      (personaManager.load as any).mockReturnValue(null);

      const options = {
        persona: 'nonexistent-persona',
        skills: ['project-readability'],
        compressionLevel: 'full' as const
      };

      const result = await builder.build(options);

      expect(result).toBeDefined();
      expect(result).toContain('project-readability');
      expect(result).not.toContain('Persona:');
      expect(personaManager.load).toHaveBeenCalledWith('nonexistent-persona');
    });

    it('should use compact compression level', async () => {
      const options = {
        persona: 'backend-architect',
        skills: ['project-readability'],
        compressionLevel: 'compact' as const
      };

      await builder.build(options);

      expect(personaManager.formatPersona).toHaveBeenCalledWith(mockPersona, 'compact');
    });

    it('should default to full compression level when not specified', async () => {
      const options = {
        persona: 'backend-architect',
        skills: ['project-readability']
      };

      await builder.build(options);

      expect(personaManager.formatPersona).toHaveBeenCalledWith(mockPersona, 'full');
    });

    it('should return empty string when no skills loaded', async () => {
      (skillManager.getSkillsByNames as any).mockReturnValue([]);

      const options = {
        persona: 'backend-architect',
        skills: ['nonexistent-skill']
      };

      const result = await builder.build(options);

      expect(result).toBe('');
    });

    it('should format skills with separators', async () => {
      const options = {
        skills: ['project-readability', 'token-efficient-coding']
      };

      const result = await builder.build(options);

      expect(result).toContain('## Skill: project-readability');
      expect(result).toContain('Content for project-readability skill');
      expect(result).toContain('## Skill: token-efficient-coding');
      expect(result).toContain('Content for token-efficient-coding skill');
      expect(result).toContain('---'); // Separator between skills
    });

    it('should apply persona lens directive when persona specified', async () => {
      const options = {
        persona: 'backend-architect',
        skills: ['project-readability'],
        compressionLevel: 'full' as const
      };

      const result = await builder.build(options);

      expect(result).toContain('Apply the persona lens above to these technical patterns');
    });
  });

  describe('buildSkillsOnly', () => {
    it('should build context with only skills', async () => {
      const result = await builder.buildSkillsOnly([
        'project-readability',
        'token-efficient-coding'
      ]);

      expect(result).toBeDefined();
      expect(result).toContain('## Skill: project-readability');
      expect(result).toContain('Content for project-readability skill');
      expect(result).toContain('## Skill: token-efficient-coding');
      expect(result).toContain('Content for token-efficient-coding skill');
      expect(result).toContain('---'); // Separator
      expect(result).not.toContain('Persona:');
      expect(result).not.toContain('Skills Context');
      expect(personaManager.load).not.toHaveBeenCalled();
      expect(personaManager.formatPersona).not.toHaveBeenCalled();
    });

    it('should return empty string when no skills loaded', async () => {
      (skillManager.getSkillsByNames as any).mockReturnValue([]);

      const result = await builder.buildSkillsOnly(['nonexistent-skill']);

      expect(result).toBe('');
    });

    it('should handle single skill', async () => {
      (skillManager.getSkillsByNames as any).mockReturnValue([mockSkill1]);

      const result = await builder.buildSkillsOnly(['project-readability']);

      expect(result).toBeDefined();
      expect(result).toContain('## Skill: project-readability');
      expect(result).toContain('Content for project-readability skill');
      expect(result).not.toContain('token-efficient-coding');
    });

    it('should format multiple skills with separators', async () => {
      const result = await builder.buildSkillsOnly([
        'project-readability',
        'token-efficient-coding'
      ]);

      const separatorCount = (result.match(/---/g) || []).length;
      expect(separatorCount).toBe(1); // One separator between two skills
    });

    it('should call skillManager with correct skill names', async () => {
      const skillNames = ['skill1', 'skill2', 'skill3'];

      await builder.buildSkillsOnly(skillNames);

      expect(skillManager.getSkillsByNames).toHaveBeenCalledWith(skillNames);
    });

    it('should show partial index in compact mode', async () => {
      const result = await builder.buildSkillsOnly(['project-readability'], 'compact');

      expect(result).toContain('Content for project-readability skill');
      expect(result).toContain('Available Partials');
      expect(result).toContain('project-readability/naming');
      expect(result).not.toContain('Naming partial content'); // NOT inlined
    });

    it('should inline all partials in full mode', async () => {
      const result = await builder.buildSkillsOnly(['project-readability'], 'full');

      expect(result).toContain('Content for project-readability skill');
      expect(result).toContain('Naming partial content'); // Inlined in full mode
    });
  });
});
