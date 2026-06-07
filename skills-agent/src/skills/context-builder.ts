/**
 * Context builder - compose persona + skills into LLM context
 */

import { Skill } from '../types/skill.js';
import { PersonaCompressionLevel } from '../types/persona.js';
import { skillManager } from './manager.js';
import { personaManager } from './persona-manager.js';
import { logger } from '../utils/logger.js';

export interface ContextOptions {
  persona?: string;
  skills: string[];
  compressionLevel?: PersonaCompressionLevel;
}

export class ContextBuilder {
  /**
   * Build context by composing persona + skills
   * Persona acts as a wrapper/lens, skills remain unchanged
   */
  async build(options: ContextOptions): Promise<string> {
    const parts: string[] = [];
    
    // 1. Load persona prefix (if specified and not default)
    if (options.persona && options.persona !== 'senior-engineer') {
      const persona = personaManager.load(options.persona);
      if (persona) {
        const level = options.compressionLevel || 'full';
        parts.push(personaManager.formatPersona(persona, level));
        parts.push('\n# Skills Context\n');
        parts.push('**Apply the persona lens above to these technical patterns:**\n');
      } else {
        logger.warn(`Persona ${options.persona} not found, using default behavior`);
      }
    } else if (options.persona === 'senior-engineer') {
      // Explicitly using default persona - add minimal prefix for consistency
      const persona = personaManager.load('senior-engineer');
      if (persona) {
        parts.push(`# Persona: ${persona.metadata.display_name}\n`);
        parts.push(`${persona.metadata.description}\n`);
        parts.push('---\n');
        parts.push('\n# Skills Context\n');
      }
    }
    
    // 2. Load skills
    const skills = skillManager.getSkillsByNames(options.skills);
    
    if (skills.length === 0) {
      logger.warn('No skills loaded for context');
      return '';
    }

    const compressionLevel = options.compressionLevel || 'full';
    const skillsSections = skills.map(skill => {
      return this.formatSkill(skill, compressionLevel);
    });

    parts.push(skillsSections.join('\n\n---\n\n'));
    
    return parts.join('\n');
  }

  /**
   * Build context with just skills (no persona)
   */
  async buildSkillsOnly(skillNames: string[], compressionLevel: PersonaCompressionLevel = 'full'): Promise<string> {
    const skills = skillManager.getSkillsByNames(skillNames);
    
    if (skills.length === 0) {
      logger.warn('No skills loaded for context');
      return '';
    }

    const sections = skills.map(skill => {
      return this.formatSkill(skill, compressionLevel);
    });

    return sections.join('\n\n---\n\n');
  }

  /**
   * Format a single skill for context output.
   * Compact mode: main content + partial index (partials listed but not inlined)
   * Full mode: main content + all partials appended
   */
  private formatSkill(skill: Skill, compressionLevel: PersonaCompressionLevel): string {
    if (skill.partials.length === 0) {
      return `## Skill: ${skill.name}\n\n${skill.content}`;
    }

    if (compressionLevel === 'full') {
      const allContent = [skill.content, ...skill.partials.map(p => p.content)].join('\n\n');
      return `## Skill: ${skill.name}\n\n${allContent}`;
    }

    // Compact/minimal: main content + partial index
    const partialIndex = skill.partials
      .map(p => `- \`${p.name}\``)
      .join('\n');
    return `## Skill: ${skill.name}\n\n${skill.content}\n\n### Available Partials\n\n${partialIndex}`;
  }
}

export const contextBuilder = new ContextBuilder();
