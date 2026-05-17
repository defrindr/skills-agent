/**
 * Skill parser - parse SKILL.md files with YAML frontmatter
 */

import fs from 'fs';
import matter from 'gray-matter';
import { Skill, SkillMetadata } from '../types/skill.js';
import { logger } from '../utils/logger.js';

export class SkillParser {
  parse(filePath: string): Skill | null {
    try {
      if (!fs.existsSync(filePath)) {
        logger.warn(`Skill file not found: ${filePath}`);
        return null;
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const { data, content: markdown } = matter(content);

      // Validate required fields
      if (!data.name) {
        logger.warn(`Skill missing 'name' field: ${filePath}`);
        return null;
      }

      const skill: Skill = {
        name: data.name,
        description: data.description || '',
        content: markdown.trim(),
        metadata: this.parseMetadata(data),
        filePath: filePath // Store file path for cache invalidation
      };

      logger.debug(`Parsed skill: ${skill.name}`);
      return skill;

    } catch (error) {
      logger.error(`Failed to parse skill ${filePath}:`, error);
      return null;
    }
  }

  private parseMetadata(data: any): SkillMetadata {
    return {
      default_provider: data.default_provider,
      complexity: data.complexity || 'medium',
      token_estimate: data.token_estimate,
      providers: data.providers || [],
      fallback: data.fallback !== false, // Default true
      max_retries: data.max_retries || 2,
      triggers: data.triggers || [],
      ...data // Include any additional metadata
    };
  }
}

export const skillParser = new SkillParser();
