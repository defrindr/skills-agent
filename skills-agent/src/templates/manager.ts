import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import type { ProjectTemplate, FeatureTemplate } from '../types/template.js';

export class TemplateManager {
  private templatesDir: string;
  private cache: Map<string, ProjectTemplate | FeatureTemplate> = new Map();

  constructor(templatesDir?: string) {
    this.templatesDir = templatesDir || path.join(__dirname, '../../templates');
  }

  loadBaseTemplate(framework: string): ProjectTemplate {
    const cacheKey = `base-${framework}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as ProjectTemplate;
    }

    const templatePath = path.join(this.templatesDir, `${framework}-base.yaml`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found for framework: ${framework}`);
    }

    const content = fs.readFileSync(templatePath, 'utf-8');
    const template = yaml.parse(content) as ProjectTemplate;
    
    this.cache.set(cacheKey, template);
    return template;
  }

  loadFeatureTemplate(feature: string, framework?: string): FeatureTemplate {
    const cacheKey = framework ? `${framework}-${feature}` : feature;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey) as FeatureTemplate;
    }

    // Try framework-specific feature first
    if (framework) {
      const frameworkPath = path.join(this.templatesDir, 'features', `${framework}-${feature}.yaml`);
      if (fs.existsSync(frameworkPath)) {
        const content = fs.readFileSync(frameworkPath, 'utf-8');
        const template = yaml.parse(content) as FeatureTemplate;
        this.cache.set(cacheKey, template);
        return template;
      }
    }

    // Fallback to generic feature
    const genericPath = path.join(this.templatesDir, 'features', `${feature}.yaml`);
    if (!fs.existsSync(genericPath)) {
      throw new Error(`Feature template not found: ${feature}`);
    }

    const content = fs.readFileSync(genericPath, 'utf-8');
    const template = yaml.parse(content) as FeatureTemplate;
    
    this.cache.set(cacheKey, template);
    return template;
  }

  loadCodeTemplate(templateName: string): string {
    const templatePath = path.join(this.templatesDir, 'code', `${templateName}.template`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Code template not found: ${templateName}`);
    }

    return fs.readFileSync(templatePath, 'utf-8');
  }

  listAvailableFrameworks(): string[] {
    const files = fs.readdirSync(this.templatesDir);
    return files
      .filter(f => f.endsWith('-base.yaml'))
      .map(f => f.replace('-base.yaml', ''));
  }

  listAvailableFeatures(): string[] {
    const featuresDir = path.join(this.templatesDir, 'features');
    if (!fs.existsSync(featuresDir)) {
      return [];
    }

    const files = fs.readdirSync(featuresDir);
    return [...new Set(files
      .filter(f => f.endsWith('.yaml'))
      .map(f => {
        // Remove framework prefix if exists
        const name = f.replace('.yaml', '');
        const parts = name.split('-');
        return parts.length > 1 ? parts.slice(1).join('-') : name;
      }))];
  }

  renderTemplate(template: string, variables: Record<string, any>): string {
    let result = template;

    // Replace simple variables: {{VAR}}
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    });

    // Handle conditionals: {{#if VAR}}...{{/if}}
    result = result.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    // Handle negation: {{^if VAR}}...{{/if}}
    result = result.replace(/{{\\^if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, varName, content) => {
      return !variables[varName] ? content : '';
    });

    return result;
  }
}

export const templateManager = new TemplateManager();
