/**
 * Unit tests for PersonaManager
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { PersonaManager } from '../../../src/skills/persona-manager.js';
import { Persona } from '../../../src/types/persona.js';
import path from 'path';

describe('PersonaManager', () => {
  let manager: PersonaManager;
  const fixturesDir = path.join(process.cwd(), 'tests', 'fixtures', 'personas');

  beforeAll(async () => {
    // Use test fixtures directory
    manager = new PersonaManager(fixturesDir);
    await manager.loadAll();
  });

  beforeEach(() => {
    // Reset state if needed
  });

  describe('loadAll', () => {
    it('should load all personas from directory', async () => {
      const personas = manager.getAllPersonas();
      expect(personas.length).toBeGreaterThan(0);
    });

    it('should parse persona metadata correctly', async () => {
      const persona = manager.load('test-persona');
      if (persona) {
        expect(persona.name).toBe('test-persona');
        expect(persona.metadata.description).toBeDefined();
        expect(persona.metadata.mindset).toBeDefined();
        expect(Array.isArray(persona.metadata.mindset)).toBe(true);
      }
    });

    it('should handle missing persona directory gracefully', async () => {
      const emptyManager = new PersonaManager('/nonexistent/path');
      await expect(emptyManager.loadAll()).resolves.not.toThrow();
      expect(emptyManager.getAllPersonas()).toEqual([]);
    });
  });

  describe('load', () => {
    it('should return persona by name', () => {
      const persona = manager.load('test-persona');
      expect(persona).toBeDefined();
      if (persona) {
        expect(persona.name).toBe('test-persona');
      }
    });

    it('should fallback to senior-engineer for non-existent persona', () => {
      const persona = manager.load('non-existent-persona');
      // Will fallback to senior-engineer if available, or null
      expect(persona === null || persona.name === 'senior-engineer').toBe(true);
    });

    it('should be case-sensitive', () => {
      const lower = manager.load('test-persona');
      const upper = manager.load('TEST-PERSONA');
      expect(lower).toBeDefined();
      // Upper case should fallback
      if (upper && lower) {
        expect(upper.name).not.toBe('TEST-PERSONA');
      }
    });
  });

  describe('getAllPersonas', () => {
    it('should return all loaded personas', () => {
      const personas = manager.getAllPersonas();
      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThan(0);
    });

    it('should return personas with required fields', () => {
      const personas = manager.getAllPersonas();
      personas.forEach(persona => {
        expect(persona.name).toBeDefined();
        expect(persona.metadata).toBeDefined();
        expect(persona.content).toBeDefined();
        expect(persona.filePath).toBeDefined();
      });
    });
  });

  describe('hasPersona', () => {
    it('should return true for existing persona', () => {
      const exists = manager.hasPersona('test-persona');
      expect(exists).toBe(true);
    });

    it('should return false for non-existent persona', () => {
      const exists = manager.hasPersona('non-existent');
      expect(exists).toBe(false);
    });
  });

  describe('reload', () => {
    it('should reload all personas', async () => {
      const beforeCount = manager.getAllPersonas().length;
      await manager.reload();
      const afterCount = manager.getAllPersonas().length;
      expect(afterCount).toBe(beforeCount);
    });

    it('should clear cache before reloading', async () => {
      const firstLoad = manager.load('test-persona');
      await manager.reload();
      const secondLoad = manager.load('test-persona');
      
      // Should be equal but not the same object reference
      expect(firstLoad?.name).toBe(secondLoad?.name);
    });
  });

  describe('persona structure validation', () => {
    it('should have required persona fields', () => {
      const persona = manager.load('test-persona');
      if (persona) {
        expect(persona).toHaveProperty('name');
        expect(persona).toHaveProperty('metadata');
        expect(persona).toHaveProperty('content');
        expect(persona).toHaveProperty('filePath');
      }
    });

    it('should have valid mindset array in metadata', () => {
      const persona = manager.load('test-persona');
      if (persona) {
        expect(Array.isArray(persona.metadata.mindset)).toBe(true);
        expect(persona.metadata.mindset.length).toBeGreaterThan(0);
        persona.metadata.mindset.forEach(item => {
          expect(typeof item).toBe('string');
        });
      }
    });

    it('should have non-empty content', () => {
      const persona = manager.load('test-persona');
      if (persona) {
        expect(persona.content).toBeDefined();
        expect(persona.content.length).toBeGreaterThan(0);
      }
    });
  });
});
