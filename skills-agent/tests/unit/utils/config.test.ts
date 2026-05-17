/**
 * Unit tests for ConfigManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConfigManager } from '../../../src/utils/config.js';
import fs from 'fs';
import path from 'path';
import { homedir } from 'os';

// Mock fs
vi.mock('fs');

describe('ConfigManager', () => {
  let manager: ConfigManager;
  let mockConfigPath: string;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfigPath = path.join(homedir(), '.skills-agent', 'test-config.yaml');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should use provided config path', () => {
      const customPath = '/custom/path/config.yaml';
      manager = new ConfigManager(customPath);
      expect(manager).toBeDefined();
    });

    it('should use environment variable if no path provided', () => {
      process.env.SKILLS_AGENT_CONFIG = '/env/path/config.yaml';
      manager = new ConfigManager();
      expect(manager).toBeDefined();
      delete process.env.SKILLS_AGENT_CONFIG;
    });

    it('should use default path if no path or env provided', () => {
      manager = new ConfigManager();
      expect(manager).toBeDefined();
    });
  });

  describe('load', () => {
    it('should load config from user path', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
    endpoint: https://api.deepseek.com/v1
    model: deepseek-chat
    max_tokens: 4096
global:
  default_tier: free
  auto_fallback: true
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      const config = await manager.load();

      expect(config).toBeDefined();
      expect(config.providers).toBeDefined();
      expect(config.global).toBeDefined();
      expect(config.providers.deepseek).toBeDefined();
      expect(config.providers.deepseek.enabled).toBe(true);
    });

    it('should load default config if user config not found', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockDefaultConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
    endpoint: https://api.deepseek.com/v1
    model: deepseek-chat
    max_tokens: 4096
global:
  default_tier: free
  auto_fallback: true
`;

      // User config doesn't exist, default config exists
      (fs.existsSync as any).mockImplementation((path: string) => {
        return path.includes('default-config.yaml');
      });
      (fs.readFileSync as any).mockReturnValue(mockDefaultConfig);

      const config = await manager.load();

      expect(config).toBeDefined();
      expect(config.providers.deepseek).toBeDefined();
    });

    it('should throw error if no config found', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      (fs.existsSync as any).mockReturnValue(false);

      await expect(manager.load()).rejects.toThrow('No configuration file found');
    });

    it('should inject env vars into config', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
    endpoint: https://api.deepseek.com/v1
    model: deepseek-chat
    max_tokens: 4096
global:
  default_tier: free
  auto_fallback: true
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);
      
      process.env.DEEPSEEK_API_KEY = 'test-api-key-123';

      const config = await manager.load();

      expect(config.providers.deepseek.api_key).toBe('test-api-key-123');
      
      delete process.env.DEEPSEEK_API_KEY;
    });

    it('should return cached config on subsequent calls', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      const config1 = await manager.load();
      const config2 = await manager.load();

      expect(config1).toBe(config2);
      expect(fs.readFileSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('getConfig', () => {
    it('should return loaded config', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      await manager.load();
      const config = manager.getConfig();

      expect(config).toBeDefined();
      expect(config.providers.deepseek).toBeDefined();
    });

    it('should throw error if config not loaded', () => {
      manager = new ConfigManager(mockConfigPath);

      expect(() => manager.getConfig()).toThrow('Config not loaded. Call load() first.');
    });
  });

  describe('getProvider', () => {
    it('should return specific provider', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
  groq-llama3:
    enabled: true
    tier: free
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      await manager.load();
      const provider = manager.getProvider('deepseek');

      expect(provider).toBeDefined();
      expect(provider.enabled).toBe(true);
      expect(provider.tier).toBe('free');
    });
  });

  describe('getEnabledProviders', () => {
    it('should return only enabled providers', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
  groq-llama3:
    enabled: false
    tier: free
  claude-sonnet:
    enabled: true
    tier: premium
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      await manager.load();
      const providers = manager.getEnabledProviders();

      expect(providers).toHaveLength(2);
      expect(providers.every(p => p.enabled)).toBe(true);
      expect(providers.some(p => p.name === 'deepseek')).toBe(true);
      expect(providers.some(p => p.name === 'claude-sonnet')).toBe(true);
      expect(providers.some(p => p.name === 'groq-llama3')).toBe(false);
    });

    it('should add name field to providers', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      await manager.load();
      const providers = manager.getEnabledProviders();

      expect(providers[0].name).toBe('deepseek');
    });
  });

  describe('getProvidersByTier', () => {
    it('should return providers filtered by tier', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
    tier: free
  groq-llama3:
    enabled: true
    tier: free
  claude-sonnet:
    enabled: true
    tier: premium
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);

      await manager.load();
      
      const freeProviders = manager.getProvidersByTier('free');
      const premiumProviders = manager.getProvidersByTier('premium');

      expect(freeProviders).toHaveLength(2);
      expect(premiumProviders).toHaveLength(1);
      expect(freeProviders.every(p => p.tier === 'free')).toBe(true);
      expect(premiumProviders[0].tier).toBe('premium');
    });
  });

  describe('save', () => {
    it('should save config to file', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
global:
  default_tier: free
`;

      (fs.existsSync as any).mockReturnValue(true);
      (fs.readFileSync as any).mockReturnValue(mockConfig);
      (fs.mkdirSync as any).mockReturnValue(undefined);
      (fs.writeFileSync as any).mockReturnValue(undefined);

      await manager.load();
      await manager.save();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        mockConfigPath,
        expect.any(String),
        'utf-8'
      );
    });

    it('should create directory if not exists', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const mockConfig = `
providers:
  deepseek:
    enabled: true
global:
  default_tier: free
`;

      (fs.existsSync as any).mockImplementation((path: string) => {
        // Config file exists, but directory doesn't
        return path.endsWith('config.yaml');
      });
      (fs.readFileSync as any).mockReturnValue(mockConfig);
      (fs.mkdirSync as any).mockReturnValue(undefined);
      (fs.writeFileSync as any).mockReturnValue(undefined);

      await manager.load();
      await manager.save();

      expect(fs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });

    it('should throw error if no config to save', async () => {
      manager = new ConfigManager(mockConfigPath);

      await expect(manager.save()).rejects.toThrow('No config to save');
    });

    it('should save provided config', async () => {
      manager = new ConfigManager(mockConfigPath);
      
      const customConfig: any = {
        providers: {
          'test-provider': {
            enabled: true,
            tier: 'free'
          }
        },
        global: {
          default_tier: 'free',
          auto_fallback: true
        }
      };

      (fs.existsSync as any).mockReturnValue(true);
      (fs.mkdirSync as any).mockReturnValue(undefined);
      (fs.writeFileSync as any).mockReturnValue(undefined);

      await manager.save(customConfig);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });
});
