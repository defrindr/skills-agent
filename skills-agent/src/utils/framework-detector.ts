/**
 * Framework detection utilities
 */

import fs from 'fs';
import path from 'path';
import { Framework } from '../types/skill.js';

const FRAMEWORK_PATTERNS: Record<string, {
  files: string[];
  dependencies?: string[];
  type: Framework['type'];
}> = {
  'nextjs': {
    files: ['next.config.js', 'next.config.mjs', 'next.config.ts'],
    dependencies: ['next'],
    type: 'fullstack'
  },
  'react': {
    files: ['vite.config.js', 'vite.config.ts'],
    dependencies: ['react', 'vite'],
    type: 'frontend'
  },
  'vue': {
    files: ['vite.config.js', 'vite.config.ts'],
    dependencies: ['vue'],
    type: 'frontend'
  },
  'nuxt': {
    files: ['nuxt.config.js', 'nuxt.config.ts'],
    dependencies: ['nuxt'],
    type: 'fullstack'
  },
  'svelte': {
    files: ['svelte.config.js'],
    dependencies: ['svelte'],
    type: 'frontend'
  },
  'nestjs': {
    files: ['nest-cli.json'],
    dependencies: ['@nestjs/core'],
    type: 'backend'
  },
  'expressjs': {
    dependencies: ['express'],
    files: [],
    type: 'backend'
  },
  'fastapi': {
    files: ['main.py', 'app/main.py'],
    dependencies: [],
    type: 'backend'
  },
  'laravel': {
    files: ['artisan', 'composer.json'],
    dependencies: [],
    type: 'backend'
  },
  'golang': {
    files: ['go.mod'],
    dependencies: [],
    type: 'backend'
  },
  'flutter': {
    files: ['pubspec.yaml', 'lib/main.dart'],
    dependencies: [],
    type: 'mobile'
  },
  'react-native': {
    files: ['metro.config.js', 'app.json'],
    dependencies: ['react-native'],
    type: 'mobile'
  }
};

export class FrameworkDetector {
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  async detect(): Promise<Framework | null> {
    // Check for config files
    for (const [name, pattern] of Object.entries(FRAMEWORK_PATTERNS)) {
      // Check files
      for (const file of pattern.files) {
        const filePath = path.join(this.projectPath, file);
        if (fs.existsSync(filePath)) {
          return {
            name,
            type: pattern.type,
            skills: this.getFrameworkSkills(name)
          };
        }
      }

      // Check dependencies
      if (pattern.dependencies && pattern.dependencies.length > 0) {
        const hasAllDeps = await this.checkDependencies(pattern.dependencies);
        if (hasAllDeps) {
          return {
            name,
            type: pattern.type,
            skills: this.getFrameworkSkills(name)
          };
        }
      }
    }

    return null;
  }

  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      return dependencies.every(dep => dep in allDeps);
    } catch (error) {
      return false;
    }
  }

  private getFrameworkSkills(framework: string): string[] {
    const skillMap: Record<string, string[]> = {
      'nextjs': ['nextjs-readability', 'project-readability'],
      'react': ['react-readability', 'project-readability'],
      'vue': ['vue-nuxt-svelte-readability', 'project-readability'],
      'nuxt': ['vue-nuxt-svelte-readability', 'project-readability'],
      'svelte': ['vue-nuxt-svelte-readability', 'project-readability'],
      'nestjs': ['nestjs-readability', 'project-readability'],
      'expressjs': ['expressjs-readability', 'project-readability'],
      'fastapi': ['fastapi-readability', 'project-readability'],
      'laravel': ['laravel-readability', 'project-readability'],
      'golang': ['golang-readability', 'project-readability'],
      'flutter': ['flutter-readability', 'project-readability'],
      'react-native': ['react-native-readability', 'project-readability']
    };

    return skillMap[framework] || ['project-readability'];
  }
}

export async function detectFramework(projectPath: string): Promise<Framework | null> {
  const detector = new FrameworkDetector(projectPath);
  return detector.detect();
}
