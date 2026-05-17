/**
 * Skill manager - load and manage skills
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { glob } from 'glob';
import { Skill } from '../types/skill.js';
import { skillParser } from './parser.js';
import { skillCache, getFileHash } from '../utils/cache.js';
import { logger } from '../utils/logger.js';

const DEFAULT_SKILLS_DIR = path.join(process.cwd(), 'skills', 'common');
const USER_SKILLS_DIR = path.join(homedir(), '.skills-agent', 'skills');

export class SkillManager {
  private skills: Map<string, Skill> = new Map();
  private skillsDir: string;
  private loaded: boolean = false;

  constructor(skillsDir?: string) {
    this.skillsDir = skillsDir || process.env.SKILLS_DIR || DEFAULT_SKILLS_DIR;
  }

  async loadAll(): Promise<void> {
    if (this.loaded) {
      return;
    }

    logger.info(`Loading skills from ${this.skillsDir}`);

    try {
      // Find all SKILL.md files
      const skillFiles = await glob('**/SKILL.md', {
        cwd: this.skillsDir,
        absolute: true
      });

      logger.debug(`Found ${skillFiles.length} skill files`);

      // Parse each skill
      for (const filePath of skillFiles) {
        const skill = skillParser.parse(filePath);
        if (skill) {
          this.skills.set(skill.name, skill);
          logger.debug(`Loaded skill: ${skill.name}`);
        }
      }

      // Also load from parent directories if available
      await this.loadFromParentDirs();

      this.loaded = true;
      logger.info(`Loaded ${this.skills.size} skills total`);

    } catch (error) {
      logger.error('Failed to load skills:', error);
      throw error;
    }
  }

  private async loadFromParentDirs(): Promise<void> {
    // Try to load from backend/, frontend/, mobile/ directories
    const rootDir = path.join(this.skillsDir, '..');
    const categories = ['common', 'backend', 'frontend', 'mobile'];

    for (const category of categories) {
      const categoryPath = path.join(rootDir, category);
      if (fs.existsSync(categoryPath)) {
        try {
          const skillFiles = await glob('**/SKILL.md', {
            cwd: categoryPath,
            absolute: true
          });

          for (const filePath of skillFiles) {
            const skill = skillParser.parse(filePath);
            if (skill && !this.skills.has(skill.name)) {
              this.skills.set(skill.name, skill);
            }
          }
        } catch (error) {
          logger.debug(`Could not load from ${category}:`, error);
        }
      }
    }
  }

  getSkill(name: string): Skill | undefined {
    // Try cache first
    const cacheKey = `skill:${name}`;
    const cached = skillCache.get(cacheKey);
    if (cached) {
      logger.debug(`Cache HIT: skill ${name}`);
      return cached;
    }

    // Cache miss - get from map
    const skill = this.skills.get(name);
    if (skill) {
      // Cache for 1 hour with file hash for invalidation
      const fileHash = skill.filePath ? getFileHash(skill.filePath) : undefined;
      skillCache.set(cacheKey, skill, 3600000, fileHash);
      logger.debug(`Cache MISS: skill ${name} (cached now)`);
    }
    
    return skill;
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkillsByNames(names: string[]): Skill[] {
    return names
      .map(name => this.getSkill(name)) // Use getSkill to leverage cache
      .filter((skill): skill is Skill => skill !== undefined);
  }

  hasSkill(name: string): boolean {
    return this.skills.has(name);
  }

  async reload(): Promise<void> {
    this.skills.clear();
    this.loaded = false;
    // Clear skill cache on reload
    skillCache.clear();
    await this.loadAll();
  }
}

export const skillManager = new SkillManager();
