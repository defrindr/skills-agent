/**
 * Skill manager - load and manage skills
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { glob } from 'glob';
import { Skill } from '../types/skill.js';
import { skillParser } from './parser.js';
import { logger } from '../utils/logger.js';

const DEFAULT_SKILLS_DIR = path.join(process.cwd(), '..', 'common');
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
    return this.skills.get(name);
  }

  getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  getSkillsByNames(names: string[]): Skill[] {
    return names
      .map(name => this.skills.get(name))
      .filter((skill): skill is Skill => skill !== undefined);
  }

  hasSkill(name: string): boolean {
    return this.skills.has(name);
  }

  async reload(): Promise<void> {
    this.skills.clear();
    this.loaded = false;
    await this.loadAll();
  }
}

export const skillManager = new SkillManager();
