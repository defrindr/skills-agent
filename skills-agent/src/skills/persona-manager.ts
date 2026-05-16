/**
 * Persona manager - load and manage personas
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import { Persona, PersonaMetadata, PersonaCompressionLevel } from '../types/persona.js';
import { logger } from '../utils/logger.js';

// Personas are in skills/personas/ relative to project root
const DEFAULT_PERSONAS_DIR = path.join(process.cwd(), 'skills', 'personas');

export class PersonaManager {
  private personas: Map<string, Persona> = new Map();
  private personasDir: string;
  private loaded: boolean = false;

  constructor(personasDir?: string) {
    this.personasDir = personasDir || process.env.PERSONAS_DIR || DEFAULT_PERSONAS_DIR;
  }

  async loadAll(): Promise<void> {
    if (this.loaded) {
      return;
    }

    logger.info(`Loading personas from ${this.personasDir}`);

    try {
      // Find all persona files in core/ and user/ subdirectories
      const personaFiles = await glob('**/*.md', {
        cwd: this.personasDir,
        absolute: true,
        ignore: ['**/README.md']
      });

      logger.debug(`Found ${personaFiles.length} persona files`);

      // Parse each persona
      for (const filePath of personaFiles) {
        const persona = this.parsePersona(filePath);
        if (persona) {
          this.personas.set(persona.name, persona);
          logger.debug(`Loaded persona: ${persona.name}`);
        }
      }

      this.loaded = true;
      logger.info(`Loaded ${this.personas.size} personas total`);

    } catch (error) {
      logger.error('Failed to load personas:', error);
      // Don't throw - personas are optional enhancement
      logger.warn('Continuing without personas (core skills will work normally)');
    }
  }

  private parsePersona(filePath: string): Persona | null {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Extract YAML frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (!frontmatterMatch) {
        logger.warn(`Invalid persona format (missing frontmatter): ${filePath}`);
        return null;
      }

      const [, frontmatter, markdown] = frontmatterMatch;
      const metadata = this.parseFrontmatter(frontmatter);

      if (!metadata || !metadata.name) {
        logger.warn(`Invalid persona metadata: ${filePath}`);
        return null;
      }

      return {
        name: metadata.name,
        metadata,
        content: markdown.trim(),
        filePath
      };

    } catch (error) {
      logger.error(`Failed to parse persona: ${filePath}`, error);
      return null;
    }
  }

  private parseFrontmatter(frontmatter: string): PersonaMetadata | null {
    try {
      const lines = frontmatter.split('\n');
      const metadata: any = {};
      let currentKey: string | null = null;
      let currentValue: string[] = [];

      for (const line of lines) {
        // Check if this is a new key
        const keyMatch = line.match(/^(\w+):\s*(.*)$/);
        if (keyMatch) {
          // Save previous key if exists
          if (currentKey) {
            metadata[currentKey] = this.parseValue(currentKey, currentValue);
          }
          
          currentKey = keyMatch[1];
          currentValue = keyMatch[2] ? [keyMatch[2]] : [];
        } else if (currentKey) {
          // Continuation of previous value
          const trimmed = line.trim();
          if (trimmed.startsWith('- ')) {
            // Array item
            currentValue.push(trimmed.substring(2));
          } else if (trimmed) {
            // Multi-line string
            currentValue.push(trimmed);
          }
        }
      }

      // Save last key
      if (currentKey) {
        metadata[currentKey] = this.parseValue(currentKey, currentValue);
      }

      return metadata as PersonaMetadata;

    } catch (error) {
      logger.error('Failed to parse frontmatter', error);
      return null;
    }
  }

  private parseValue(key: string, value: string[]): any {
    if (value.length === 0) return '';
    if (value.length === 1) return value[0];
    
    // Check if this should be an array (mindset, priorities)
    if (['mindset', 'priorities'].includes(key)) {
      return value;
    }
    
    // Multi-line string
    return value.join('\n');
  }

  load(name: string): Persona | null {
    const persona = this.personas.get(name);
    if (!persona) {
      logger.warn(`Persona not found: ${name}, using default`);
      return this.personas.get('senior-engineer') || null;
    }
    return persona;
  }

  getAllPersonas(): Persona[] {
    return Array.from(this.personas.values());
  }

  hasPersona(name: string): boolean {
    return this.personas.has(name);
  }

  formatPersona(persona: Persona, level: PersonaCompressionLevel = 'full'): string {
    const { metadata, content } = persona;

    if (level === 'minimal') {
      // Just name and core mindset
      return `# Persona: ${metadata.display_name}

${metadata.mindset.map(m => `- ${m}`).join('\n')}

---`;
    }

    if (level === 'compact') {
      // Mindset + priorities, no full content
      return `# Persona: ${metadata.display_name}

${metadata.description}

## Mindset
${metadata.mindset.map(m => `- ${m}`).join('\n')}

## Priorities
${metadata.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Communication Style
${metadata.communication_style}

---`;
    }

    // Full content
    return `# Persona: ${metadata.display_name}

${metadata.description}

## Mindset
${metadata.mindset.map(m => `- ${m}`).join('\n')}

## Communication Style
${metadata.communication_style}

## Priorities
${metadata.priorities.map((p, i) => `${i + 1}. ${p}`).join('\n')}

## Output Format
${metadata.output_format}

---

${content}

---

**Apply the skills below through this ${metadata.name} lens.**`;
  }

  async reload(): Promise<void> {
    this.personas.clear();
    this.loaded = false;
    await this.loadAll();
  }
}

export const personaManager = new PersonaManager();
