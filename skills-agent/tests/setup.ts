/**
 * Test setup and global mocks
 */

import { vi } from 'vitest';
import path from 'path';

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.SKILLS_DIR = path.join(process.cwd(), 'tests', 'fixtures', 'skills');

// Global test utilities
export const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'fixtures');
export const SKILLS_FIXTURES_DIR = path.join(FIXTURES_DIR, 'skills');
export const PROJECTS_FIXTURES_DIR = path.join(FIXTURES_DIR, 'projects');

// Mock logger to suppress logs during tests
vi.mock('../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));
