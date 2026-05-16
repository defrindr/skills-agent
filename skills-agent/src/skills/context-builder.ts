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
    
    // 2. Load skills (UNCHANGED - load as-is)
    const skills = skillManager.getSkillsByNames(options.skills);
    
    if (skills.length === 0) {
      logger.warn('No skills loaded for context');
      return '';
    }

    const skillsSections = skills.map(skill => {
      return `## Skill: ${skill.name}\n\n${skill.content}`;
    });

    parts.push(skillsSections.join('\n\n---\n\n'));
    
    return parts.join('\n');
  }

  /**
   * Build context with just skills (no persona)
   * Used when persona system is disabled or not needed
   */
  async buildSkillsOnly(skillNames: string[]): Promise<string> {
    const skills = skillManager.getSkillsByNames(skillNames);
    
    if (skills.length === 0) {
      logger.warn('No skills loaded for context');
      return '';
    }

    const sections = skills.map(skill => {
      return `## Skill: ${skill.name}\n\n${skill.content}`;
    });

    return sections.join('\n\n---\n\n');
  }
}

export const contextBuilder = new ContextBuilder();
