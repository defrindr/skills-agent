/**
 * Unit tests for SkillManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SkillManager } from '../../../src/skills/manager.js';
import { SKILLS_FIXTURES_DIR } from '../../setup.js';
import path from 'path';

describe('SkillManager', () => {
  let skillManager: SkillManager;

  beforeEach(() => {
    // Create fresh instance with fixtures directory
    skillManager = new SkillManager(SKILLS_FIXTURES_DIR);
  });

  describe('loadAll', () => {
    it('should load all SKILL.md files from directory', async () => {
      await skillManager.loadAll();
      
      const skills = skillManager.getAllSkills();
      expect(skills.length).toBeGreaterThan(0);
      
      // Should have loaded test-skill
      const testSkill = skillManager.getSkill('test-skill');
      expect(testSkill).toBeDefined();
      expect(testSkill?.name).toBe('test-skill');
    });

    it('should not reload if already loaded', async () => {
      await skillManager.loadAll();
      const firstLoadCount = skillManager.getAllSkills().length;
      
      // Try loading again
      await skillManager.loadAll();
      const secondLoadCount = skillManager.getAllSkills().length;
      
      expect(secondLoadCount).toBe(firstLoadCount);
    });

    it('should handle invalid SKILL.md gracefully', async () => {
      await skillManager.loadAll();
      
      // Invalid skill should not be loaded
      const invalidSkill = skillManager.getSkill('invalid-skill');
      expect(invalidSkill).toBeUndefined();
    });
  });

  describe('getSkill', () => {
    it('should return skill if exists', async () => {
      await skillManager.loadAll();
      
      const skill = skillManager.getSkill('test-skill');
      expect(skill).toBeDefined();
      expect(skill?.name).toBe('test-skill');
      expect(skill?.metadata.description).toBe('A test skill for unit testing');
    });

    it('should return undefined for non-existent skill', async () => {
      await skillManager.loadAll();
      
      const skill = skillManager.getSkill('non-existent-skill');
      expect(skill).toBeUndefined();
    });
  });

  describe('getAllSkills', () => {
    it('should return array of all loaded skills', async () => {
      await skillManager.loadAll();
      
      const skills = skillManager.getAllSkills();
      expect(Array.isArray(skills)).toBe(true);
      expect(skills.length).toBeGreaterThan(0);
    });

    it('should return empty array if no skills loaded', () => {
      const skills = skillManager.getAllSkills();
      expect(skills).toEqual([]);
    });
  });

  describe('getSkillsByNames', () => {
    it('should return array of requested skills', async () => {
      await skillManager.loadAll();
      
      const skills = skillManager.getSkillsByNames(['test-skill']);
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('test-skill');
    });

    it('should filter out non-existent skills', async () => {
      await skillManager.loadAll();
      
      const skills = skillManager.getSkillsByNames(['test-skill', 'non-existent']);
      expect(skills.length).toBe(1);
      expect(skills[0].name).toBe('test-skill');
    });

    it('should return empty array for all non-existent skills', async () => {
      await skillManager.loadAll();
      
      const skills = skillManager.getSkillsByNames(['non-existent-1', 'non-existent-2']);
      expect(skills).toEqual([]);
    });
  });

  describe('hasSkill', () => {
    it('should return true if skill exists', async () => {
      await skillManager.loadAll();
      
      expect(skillManager.hasSkill('test-skill')).toBe(true);
    });

    it('should return false if skill does not exist', async () => {
      await skillManager.loadAll();
      
      expect(skillManager.hasSkill('non-existent')).toBe(false);
    });
  });

  describe('reload', () => {
    it('should clear and reload all skills', async () => {
      await skillManager.loadAll();
      const firstSkills = skillManager.getAllSkills();
      
      await skillManager.reload();
      const reloadedSkills = skillManager.getAllSkills();
      
      // Should have same skills after reload
      expect(reloadedSkills.length).toBe(firstSkills.length);
    });
  });
});
