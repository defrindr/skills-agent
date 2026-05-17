/**
 * Performance benchmarks for Skills Agent
 * Measures cache hit rates, fallback latency, and provider performance
 */

import { performance } from 'perf_hooks';
import { SkillManager } from '../skills/manager.js';
import { ProviderExecutor } from '../providers/executor.js';
import { ProviderResolver } from '../providers/resolver.js';
import { configManager } from '../utils/config.js'; // Use singleton
import { getCacheStats, clearAllCaches } from '../utils/cache.js';
import { LLMRequest, Provider, ProviderTier } from '../types/provider.js';

interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

class PerformanceBenchmark {
  private skillManager: SkillManager;
  private resolver: ProviderResolver;
  private executor: ProviderExecutor;

  constructor() {
    this.skillManager = new SkillManager();
    this.resolver = new ProviderResolver();
    this.executor = new ProviderExecutor();
  }

  async setup() {
    console.log('🔧 Setting up benchmarks...\n');
    await configManager.load(); // Load singleton config
    await this.skillManager.loadAll();
  }

  /**
   * Benchmark: Cache hit rate for skill loading
   */
  async benchmarkCacheHitRate(): Promise<void> {
    console.log('📊 Benchmark: Cache Hit Rate (Skill Loading)');
    console.log('=' .repeat(60));

    // Clear caches
    clearAllCaches();

    // First load (cache miss)
    const skill1Start = performance.now();
    this.skillManager.getSkill('project-readability');
    const skill1Time = performance.now() - skill1Start;

    // Second load (cache hit)
    const skill2Start = performance.now();
    this.skillManager.getSkill('project-readability');
    const skill2Time = performance.now() - skill2Start;

    // Multiple loads
    const iterations = 1000;
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      this.skillManager.getSkill('project-readability');
    }
    const totalTime = performance.now() - start;

    const cacheStats = getCacheStats();
    const hitRate = (cacheStats.skill.hits / (cacheStats.skill.hits + cacheStats.skill.misses)) * 100;

    console.log(`First load (cache miss):  ${skill1Time.toFixed(3)}ms`);
    console.log(`Second load (cache hit):  ${skill2Time.toFixed(3)}ms`);
    console.log(`Speedup:                  ${(skill1Time / skill2Time).toFixed(2)}x faster`);
    console.log(`\nBatch load (${iterations} iterations):`);
    console.log(`Total time:               ${totalTime.toFixed(2)}ms`);
    console.log(`Average time:             ${(totalTime / iterations).toFixed(3)}ms`);
    console.log(`Ops/second:               ${(iterations / (totalTime / 1000)).toFixed(0)}`);
    console.log(`\nCache statistics:`);
    console.log(`Hit rate:                 ${hitRate.toFixed(2)}%`);
    console.log(`Hits:                     ${cacheStats.skill.hits}`);
    console.log(`Misses:                   ${cacheStats.skill.misses}`);
    console.log(`Evictions:                ${cacheStats.skill.evictions}`);
    console.log('');
  }

  /**
   * Benchmark: Provider fallback latency
   */
  async benchmarkProviderFallback(): Promise<void> {
    console.log('📊 Benchmark: Provider Fallback Latency');
    console.log('=' .repeat(60));

    // Get enabled providers
    const config = configManager.getConfig();
    const enabledProviders = Object.entries(config.providers)
      .filter(([_, p]) => p.enabled)
      .map(([name, p]) => ({ ...p, name }));

    if (enabledProviders.length < 2) {
      console.log('⚠️  Need at least 2 enabled providers to test fallback');
      console.log('');
      return;
    }

    const mockProvider = enabledProviders[0];

    // Test getNextProvider speed
    const iterations = 10000;
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      this.resolver.getNextProvider(mockProvider);
      times.push(performance.now() - start);
    }

    const totalTime = times.reduce((a, b) => a + b, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);

    console.log(`Iterations:               ${iterations}`);
    console.log(`Total time:               ${totalTime.toFixed(2)}ms`);
    console.log(`Average time:             ${avgTime.toFixed(3)}ms`);
    console.log(`Min time:                 ${minTime.toFixed(3)}ms`);
    console.log(`Max time:                 ${maxTime.toFixed(3)}ms`);
    console.log(`Ops/second:               ${(iterations / (totalTime / 1000)).toFixed(0)}`);
    console.log('');
  }

  /**
   * Benchmark: Skill manager operations
   */
  async benchmarkSkillOperations(): Promise<void> {
    console.log('📊 Benchmark: Skill Manager Operations');
    console.log('=' .repeat(60));

    // Benchmark getAllSkills
    const getAllStart = performance.now();
    const iterations1 = 10000;
    for (let i = 0; i < iterations1; i++) {
      this.skillManager.getAllSkills();
    }
    const getAllTime = performance.now() - getAllStart;

    // Benchmark getSkill
    const getSkillStart = performance.now();
    const iterations2 = 10000;
    for (let i = 0; i < iterations2; i++) {
      this.skillManager.getSkill('project-readability');
    }
    const getSkillTime = performance.now() - getSkillStart;

    // Benchmark hasSkill
    const hasSkillStart = performance.now();
    const iterations3 = 10000;
    for (let i = 0; i < iterations3; i++) {
      this.skillManager.hasSkill('project-readability');
    }
    const hasSkillTime = performance.now() - hasSkillStart;

    console.log(`getAllSkills() - ${iterations1} calls:`);
    console.log(`  Total: ${getAllTime.toFixed(2)}ms | Avg: ${(getAllTime / iterations1).toFixed(3)}ms | Ops/s: ${(iterations1 / (getAllTime / 1000)).toFixed(0)}`);
    
    console.log(`\ngetSkill() - ${iterations2} calls:`);
    console.log(`  Total: ${getSkillTime.toFixed(2)}ms | Avg: ${(getSkillTime / iterations2).toFixed(3)}ms | Ops/s: ${(iterations2 / (getSkillTime / 1000)).toFixed(0)}`);
    
    console.log(`\nhasSkill() - ${iterations3} calls:`);
    console.log(`  Total: ${hasSkillTime.toFixed(2)}ms | Avg: ${(hasSkillTime / iterations3).toFixed(3)}ms | Ops/s: ${(iterations3 / (hasSkillTime / 1000)).toFixed(0)}`);
    console.log('');
  }

  /**
   * Benchmark: Memory usage
   */
  async benchmarkMemoryUsage(): Promise<void> {
    console.log('📊 Benchmark: Memory Usage');
    console.log('=' .repeat(60));

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const before = process.memoryUsage();

    // Load all skills multiple times
    for (let i = 0; i < 100; i++) {
      this.skillManager.getAllSkills();
    }

    const after = process.memoryUsage();

    console.log(`Heap used:                ${(before.heapUsed / 1024 / 1024).toFixed(2)}MB → ${(after.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`Heap total:               ${(before.heapTotal / 1024 / 1024).toFixed(2)}MB → ${(after.heapTotal / 1024 / 1024).toFixed(2)}MB`);
    console.log(`External:                 ${(before.external / 1024 / 1024).toFixed(2)}MB → ${(after.external / 1024 / 1024).toFixed(2)}MB`);
    console.log(`RSS:                      ${(before.rss / 1024 / 1024).toFixed(2)}MB → ${(after.rss / 1024 / 1024).toFixed(2)}MB`);
    console.log('');
  }

  async runAll() {
    await this.setup();
    
    console.log('⚡ Skills Agent Performance Benchmarks');
    console.log('=' .repeat(60));
    console.log('');

    await this.benchmarkCacheHitRate();
    await this.benchmarkProviderFallback();
    await this.benchmarkSkillOperations();
    await this.benchmarkMemoryUsage();

    console.log('✅ Benchmarks completed!\n');
  }
}

// Run benchmarks
const benchmark = new PerformanceBenchmark();
benchmark.runAll().catch(console.error);
