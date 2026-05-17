/**
 * Unit tests for FrameworkDetector
 */

import { describe, it, expect } from 'vitest';
import { FrameworkDetector, detectFramework } from '../../../src/utils/framework-detector.js';
import { PROJECTS_FIXTURES_DIR } from '../../setup.js';
import path from 'path';

describe('FrameworkDetector', () => {
  describe('detect - Next.js', () => {
    it('should detect Next.js from next.config.js', async () => {
      const projectPath = path.join(PROJECTS_FIXTURES_DIR, 'nextjs');
      const detector = new FrameworkDetector(projectPath);
      
      const framework = await detector.detect();
      
      expect(framework).toBeDefined();
      expect(framework?.name).toBe('nextjs');
      expect(framework?.type).toBe('fullstack');
      expect(framework?.skills).toContain('nextjs-readability');
      expect(framework?.skills).toContain('project-readability');
    });
  });

  describe('detect - Express.js', () => {
    it('should detect Express.js from package.json dependencies', async () => {
      const projectPath = path.join(PROJECTS_FIXTURES_DIR, 'expressjs');
      const detector = new FrameworkDetector(projectPath);
      
      const framework = await detector.detect();
      
      expect(framework).toBeDefined();
      expect(framework?.name).toBe('expressjs');
      expect(framework?.type).toBe('backend');
      expect(framework?.skills).toContain('expressjs-readability');
    });
  });

  describe('detect - Unknown framework', () => {
    it('should return null for unknown frameworks', async () => {
      const projectPath = path.join(PROJECTS_FIXTURES_DIR, 'unknown');
      const detector = new FrameworkDetector(projectPath);
      
      const framework = await detector.detect();
      
      expect(framework).toBeNull();
    });
  });

  describe('detectFramework helper', () => {
    it('should work as standalone function', async () => {
      const projectPath = path.join(PROJECTS_FIXTURES_DIR, 'nextjs');
      
      const framework = await detectFramework(projectPath);
      
      expect(framework).toBeDefined();
      expect(framework?.name).toBe('nextjs');
    });
  });
});
