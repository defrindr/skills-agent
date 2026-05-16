import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import type { InitProjectInput, GeneratedProject, ProjectTemplate, FeatureTemplate } from '../types/template.js';
import { templateManager } from '../templates/manager.js';
import { logger } from '../utils/logger.js';

export class ProjectGenerator {
  async generate(input: InitProjectInput): Promise<GeneratedProject> {
    logger.info(`Generating ${input.framework} project: ${input.name}`);

    const projectPath = path.resolve(input.path);
    
    // Validate directory doesn't exist
    if (fs.existsSync(projectPath)) {
      throw new Error(`Directory already exists: ${projectPath}`);
    }

    // Load base template
    const baseTemplate = templateManager.loadBaseTemplate(input.framework);
    
    // Load feature templates
    const featureTemplates: FeatureTemplate[] = [];
    if (input.features && input.features.length > 0) {
      for (const feature of input.features) {
        try {
          const featureTemplate = templateManager.loadFeatureTemplate(feature, input.framework);
          featureTemplates.push(featureTemplate);
        } catch (error) {
          logger.warn(`Feature template not found: ${feature}, skipping...`);
        }
      }
    }

    // Create project directory
    fs.mkdirSync(projectPath, { recursive: true });

    const generatedFiles: string[] = [];
    const variables = this.buildVariables(input, featureTemplates);

    try {
      // Generate base structure
      await this.generateStructure(projectPath, baseTemplate.structure, variables);
      generatedFiles.push(...baseTemplate.structure.map((s: any) => s.path));

      // Generate feature structures
      for (const featureTemplate of featureTemplates) {
        await this.generateStructure(projectPath, featureTemplate.structure, variables);
        generatedFiles.push(...featureTemplate.structure.map((s: any) => s.path));
      }

      // Generate config files
      await this.generateConfigs(projectPath, baseTemplate, featureTemplates, variables);
      generatedFiles.push(...baseTemplate.configs.map((c: any) => c.name));

      // Generate package.json with merged dependencies
      await this.generatePackageJson(projectPath, baseTemplate, featureTemplates, input);
      generatedFiles.push('package.json');

      // Install dependencies
      logger.info('Installing dependencies...');
      execSync('npm install', { cwd: projectPath, stdio: 'pipe' });

      // Run post-init commands
      await this.runPostInit(projectPath, featureTemplates);

      logger.info(`✅ Project generated successfully at ${projectPath}`);

      return {
        path: projectPath,
        files: generatedFiles,
        nextSteps: this.buildNextSteps(input, featureTemplates),
      };
    } catch (error) {
      // Rollback on error
      logger.error(`Failed to generate project: ${error}`);
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
      }
      throw error;
    }
  }

  private async generateStructure(
    projectPath: string,
    structure: Array<{ path: string; template?: string; condition?: string }>,
    variables: Record<string, any>
  ): Promise<void> {
    for (const file of structure) {
      // Check condition
      if (file.condition && !variables[file.condition]) {
        continue;
      }

      const filePath = path.join(projectPath, file.path);
      const fileDir = path.dirname(filePath);

      // Create directory
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      // Generate file content
      if (file.template) {
        const template = templateManager.loadCodeTemplate(file.template);
        const content = templateManager.renderTemplate(template, variables);
        fs.writeFileSync(filePath, content, 'utf-8');
      } else if (file.path.endsWith('.gitkeep')) {
        // Create empty .gitkeep
        fs.writeFileSync(filePath, '', 'utf-8');
      }
    }
  }

  private async generateConfigs(
    projectPath: string,
    baseTemplate: ProjectTemplate,
    featureTemplates: FeatureTemplate[],
    variables: Record<string, any>
  ): Promise<void> {
    for (const config of baseTemplate.configs) {
      const template = templateManager.loadCodeTemplate(config.template);
      const content = templateManager.renderTemplate(template, variables);
      const filePath = path.join(projectPath, config.name);
      fs.writeFileSync(filePath, content, 'utf-8');
    }

    // Generate .env.example with feature-specific vars
    const envVars: string[] = [];
    for (const feature of featureTemplates) {
      if (feature.envVars) {
        envVars.push(...feature.envVars);
      }
    }

    if (envVars.length > 0) {
      const envPath = path.join(projectPath, '.env.example');
      let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';
      envContent += '\n' + envVars.join('\n');
      fs.writeFileSync(envPath, envContent.trim(), 'utf-8');
    }
  }

  private async generatePackageJson(
    projectPath: string,
    baseTemplate: ProjectTemplate,
    featureTemplates: FeatureTemplate[],
    input: InitProjectInput
  ): Promise<void> {
    const dependencies: Record<string, string> = { ...baseTemplate.dependencies.required };
    const devDependencies: Record<string, string> = { ...baseTemplate.dependencies.dev };
    const scripts: Record<string, string> = { ...baseTemplate.scripts };

    // Merge feature dependencies
    for (const feature of featureTemplates) {
      if (feature.dependencies) {
        feature.dependencies.forEach((dep: string) => {
          const [name, version = 'latest'] = dep.split('@');
          dependencies[name] = version;
        });
      }
      if (feature.devDependencies) {
        feature.devDependencies.forEach((dep: string) => {
          const [name, version = 'latest'] = dep.split('@');
          devDependencies[name] = version;
        });
      }
      if (feature.scripts) {
        Object.assign(scripts, feature.scripts);
      }
    }

    const packageJson = {
      name: input.name,
      version: '0.1.0',
      private: true,
      scripts,
      dependencies,
      devDependencies,
    };

    const filePath = path.join(projectPath, 'package.json');
    fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2), 'utf-8');
  }

  private async runPostInit(projectPath: string, featureTemplates: FeatureTemplate[]): Promise<void> {
    // Check if any feature needs Prisma
    const hasPrisma = featureTemplates.some((f: FeatureTemplate) => 
      f.dependencies?.some((d: string) => d.startsWith('@prisma/client')) ||
      f.devDependencies?.some((d: string) => d.startsWith('prisma'))
    );

    if (hasPrisma) {
      logger.info('Running Prisma setup...');
      try {
        execSync('npx prisma generate', { cwd: projectPath, stdio: 'pipe' });
      } catch (error) {
        logger.warn('Prisma generate failed, skipping...');
      }
    }

    // Initialize git
    logger.info('Initializing git repository...');
    try {
      execSync('git init', { cwd: projectPath, stdio: 'pipe' });
      execSync('git add .', { cwd: projectPath, stdio: 'pipe' });
      execSync('git commit -m "chore: initial commit from skills-agent"', { 
        cwd: projectPath, 
        stdio: 'pipe' 
      });
    } catch (error) {
      logger.warn('Git init failed, skipping...');
    }
  }

  private buildVariables(input: InitProjectInput, featureTemplates: FeatureTemplate[]): Record<string, any> {
    const features = input.features || [];
    
    return {
      PROJECT_NAME: input.name,
      FRAMEWORK: input.framework,
      TYPESCRIPT: input.typescript !== false,
      
      // Feature flags
      hasAuth: features.includes('auth'),
      hasDatabase: features.includes('postgres') || features.includes('mongodb') || features.includes('mysql'),
      hasPostgres: features.includes('postgres'),
      hasMongoDB: features.includes('mongodb'),
      hasMySQL: features.includes('mysql'),
      hasDocker: features.includes('docker'),
      hasTesting: features.includes('testing'),
      hasCI: features.includes('ci'),
      
      // Computed values
      DB_TYPE: features.includes('postgres') ? 'PostgreSQL' : 
               features.includes('mongodb') ? 'MongoDB' :
               features.includes('mysql') ? 'MySQL' : null,
      
      AUTH_LIB: input.framework === 'nextjs' ? 'NextAuth.js' :
                input.framework === 'nestjs' ? 'Passport + JWT' :
                'Custom',
      
      ORM: features.includes('postgres') || features.includes('mysql') ? 'Prisma' :
           features.includes('mongodb') ? 'Prisma (MongoDB)' : null,
    };
  }

  private buildNextSteps(input: InitProjectInput, featureTemplates: FeatureTemplate[]): string[] {
    const steps: string[] = [
      `cd ${input.name}`,
      'cp .env.example .env',
    ];

    const hasPrisma = featureTemplates.some((f: FeatureTemplate) => 
      f.dependencies?.some((d: string) => d.startsWith('@prisma/client'))
    );

    if (hasPrisma) {
      steps.push('Edit .env with your database URL');
      steps.push('npm run prisma:push');
    }

    steps.push('npm run dev');

    return steps;
  }

  async validateProject(projectPath: string): Promise<boolean> {
    try {
      logger.info('Validating generated project...');

      // Check package.json exists and valid
      const packageJsonPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        throw new Error('package.json not found');
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      if (!packageJson.name || !packageJson.scripts) {
        throw new Error('Invalid package.json structure');
      }

      // Run type check if TypeScript
      const hasTsConfig = fs.existsSync(path.join(projectPath, 'tsconfig.json'));
      if (hasTsConfig && packageJson.scripts['type-check']) {
        logger.info('Running type check...');
        execSync('npm run type-check', { cwd: projectPath, stdio: 'pipe' });
      }

      // Run lint if available
      if (packageJson.scripts.lint) {
        logger.info('Running linter...');
        execSync('npm run lint', { cwd: projectPath, stdio: 'pipe' });
      }

      logger.info('✅ Project validation passed');
      return true;
    } catch (error) {
      logger.error(`❌ Project validation failed: ${error}`);
      return false;
    }
  }
}

export const projectGenerator = new ProjectGenerator();
