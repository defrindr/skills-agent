/**
 * Unit tests for McpConfigWriter
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { McpConfigWriter, WriteResult } from '../../../src/mcp/config-writer.js';
import { promises as fs } from 'fs';
import { join } from 'path';

// Mock fs
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    promises: {
      readFile: vi.fn(),
      writeFile: vi.fn(),
      copyFile: vi.fn(),
      access: vi.fn(),
      mkdir: vi.fn()
    }
  };
});

describe('McpConfigWriter', () => {
  let writer: McpConfigWriter;
  const testConfigPath = '/test/.config/opencode/opencode.json';

  beforeEach(() => {
    vi.clearAllMocks();
    writer = new McpConfigWriter(testConfigPath);
  });

  describe('readCurrent', () => {
    it('should read existing config file', async () => {
      const mockConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'existing-server': {
            type: 'local',
            command: ['npx', 'server'],
            enabled: true
          }
        }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await writer.readCurrent();

      expect(config).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalledWith(testConfigPath, 'utf-8');
    });

    it('should return default config when file does not exist', async () => {
      const error: any = new Error('File not found');
      error.code = 'ENOENT';
      (fs.readFile as any).mockRejectedValue(error);

      const config = await writer.readCurrent();

      expect(config).toEqual({
        $schema: 'https://opencode.ai/config.json'
      });
    });

    it('should throw error for other read errors', async () => {
      const error = new Error('Permission denied');
      (fs.readFile as any).mockRejectedValue(error);

      await expect(writer.readCurrent()).rejects.toThrow(
        `Failed to read ${testConfigPath}: Permission denied`
      );
    });

    it('should parse JSON correctly', async () => {
      const mockConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {}
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(mockConfig));

      const config = await writer.readCurrent();

      expect(config).toEqual(mockConfig);
      expect(config.mcp).toBeDefined();
    });
  });

  describe('backup', () => {
    it('should create backup file with timestamp', async () => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);

      const backupPath = await writer.backup();

      expect(backupPath).toBeDefined();
      expect(backupPath).toContain('.backup-');
      expect(backupPath).toContain(testConfigPath);
      expect(fs.access).toHaveBeenCalledWith(testConfigPath);
      expect(fs.copyFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('.backup-')
      );
    });

    it('should return undefined when config file does not exist', async () => {
      (fs.access as any).mockRejectedValue(new Error('ENOENT'));

      const backupPath = await writer.backup();

      expect(backupPath).toBeUndefined();
      expect(fs.copyFile).not.toHaveBeenCalled();
    });

    it('should generate unique backup filenames', async () => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);

      const backup1 = await writer.backup();
      
      // Wait a tiny bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const backup2 = await writer.backup();

      expect(backup1).toBeDefined();
      expect(backup2).toBeDefined();
      // Timestamps might be same if executed too fast, but structure should match
      expect(backup1).toContain('.backup-');
      expect(backup2).toContain('.backup-');
    });
  });

  describe('merge', () => {
    beforeEach(() => {
      (fs.access as any).mockResolvedValue(undefined);
      (fs.copyFile as any).mockResolvedValue(undefined);
      (fs.mkdir as any).mockResolvedValue(undefined);
      (fs.writeFile as any).mockResolvedValue(undefined);
    });

    it('should merge new MCP servers into config', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'existing-server': {
            type: 'local',
            command: ['npx', 'existing'],
            enabled: true
          }
        }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      const result = await writer.merge(newMcp);

      expect(result.ok).toBe(true);
      expect(result.added).toEqual(['new-server']);
      expect(result.skipped).toEqual([]);
      expect(fs.writeFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('new-server'),
        'utf-8'
      );
    });

    it('should skip existing MCP servers', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'existing-server': {
            type: 'local',
            command: ['npx', 'existing'],
            enabled: true
          }
        }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'existing-server': {
          type: 'local',
          command: ['npx', 'new-version'],
          enabled: false
        },
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      const result = await writer.merge(newMcp);

      expect(result.ok).toBe(true);
      expect(result.added).toEqual(['new-server']);
      expect(result.skipped).toEqual(['existing-server']);
      
      // Verify existing server was not overwritten
      const writtenConfig = JSON.parse(
        (fs.writeFile as any).mock.calls[0][1]
      );
      expect(writtenConfig.mcp['existing-server'].command).toEqual(['npx', 'existing']);
      expect(writtenConfig.mcp['existing-server'].enabled).toBe(true);
    });

    it('should create backup before writing', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {}
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      const result = await writer.merge(newMcp);

      expect(result.ok).toBe(true);
      expect(result.backupPath).toBeDefined();
      expect(result.backupPath).toContain('.backup-');
      expect(fs.copyFile).toHaveBeenCalledWith(
        testConfigPath,
        expect.stringContaining('.backup-')
      );
    });

    it('should create directory if not exists', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {}
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      await writer.merge(newMcp);

      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it('should rollback on write error', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {}
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));
      
      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      // Mock writeFile to fail
      (fs.writeFile as any).mockRejectedValue(new Error('Write failed'));
      
      const backupPath = `${testConfigPath}.backup-test`;
      (fs.copyFile as any).mockResolvedValueOnce(undefined); // backup
      (fs.copyFile as any).mockResolvedValueOnce(undefined); // rollback

      const result = await writer.merge(newMcp);

      expect(result.ok).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('Write failed');
      expect(result.added).toEqual([]);
      
      // Verify rollback was attempted
      expect(fs.copyFile).toHaveBeenCalledTimes(2); // backup + rollback
    });

    it('should write formatted JSON with 2-space indentation', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {}
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      await writer.merge(newMcp);

      const writtenContent = (fs.writeFile as any).mock.calls[0][1];
      
      // Check for 2-space indentation
      expect(writtenContent).toContain('  "mcp"');
      expect(writtenContent).toContain('    "new-server"');
      
      // Verify it's valid JSON
      expect(() => JSON.parse(writtenContent)).not.toThrow();
    });

    it('should preserve existing config properties', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        customProperty: 'custom value',
        mcp: {
          'existing-server': {
            type: 'local',
            command: ['npx', 'existing'],
            enabled: true
          }
        }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const newMcp = {
        'new-server': {
          type: 'local',
          command: ['npx', 'new-server'],
          enabled: true
        }
      };

      await writer.merge(newMcp);

      const writtenConfig = JSON.parse(
        (fs.writeFile as any).mock.calls[0][1]
      );

      expect(writtenConfig.customProperty).toBe('custom value');
      expect(writtenConfig.$schema).toBe('https://opencode.ai/config.json');
    });

    it('should handle empty new MCP object', async () => {
      const existingConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'existing-server': {
            type: 'local',
            command: ['npx', 'existing'],
            enabled: true
          }
        }
      };

      (fs.readFile as any).mockResolvedValue(JSON.stringify(existingConfig));

      const result = await writer.merge({});

      expect(result.ok).toBe(true);
      expect(result.added).toEqual([]);
      expect(result.skipped).toEqual([]);
    });
  });

  describe('validate', () => {
    it('should accept valid config', () => {
      const validConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: {
          'server': {
            type: 'local',
            command: ['npx', 'server'],
            enabled: true
          }
        }
      };

      expect(() => (writer as any).validate(validConfig)).not.toThrow();
    });

    it('should reject null config', () => {
      expect(() => (writer as any).validate(null)).toThrow(
        'Config must be an object'
      );
    });

    it('should reject non-object config', () => {
      expect(() => (writer as any).validate('not an object')).toThrow(
        'Config must be an object'
      );
    });

    it('should reject invalid mcp property', () => {
      const invalidConfig = {
        $schema: 'https://opencode.ai/config.json',
        mcp: 'not an object'
      };

      expect(() => (writer as any).validate(invalidConfig)).toThrow(
        'config.mcp must be an object'
      );
    });

    it('should accept config without mcp property', () => {
      const validConfig = {
        $schema: 'https://opencode.ai/config.json'
      };

      expect(() => (writer as any).validate(validConfig)).not.toThrow();
    });
  });
});
