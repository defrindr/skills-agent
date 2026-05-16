/**
 * Persona type definitions
 */

export interface PersonaMetadata {
  name: string;
  display_name: string;
  category: string;
  description: string;
  mindset: string[];
  communication_style: string;
  priorities: string[];
  output_format: string;
}

export interface Persona {
  name: string;
  metadata: PersonaMetadata;
  content: string;
  filePath: string;
}

export type PersonaCompressionLevel = 'full' | 'compact' | 'minimal';
