/**
 * MCP Tool handlers - business logic for each tool
 */

import { Skill } from '../types/skill.js';
import { Message } from '../types/provider.js';
import { skillManager } from '../skills/manager.js';
import { providerResolver } from '../providers/resolver.js';
import { providerExecutor } from '../providers/executor.js';
import { budgetTracker } from '../budget/tracker.js';
import { detectFramework } from '../utils/framework-detector.js';
import { logger } from '../utils/logger.js';

export class ToolHandlers {
  async handleExploreCodebase(args: any): Promise<string> {
    const { path, depth = 'normal', provider: overrideProvider } = args;

    logger.info(`Exploring codebase at ${path} with depth: ${depth}`);

    // Load codebase-explorer skill
    const skill = skillManager.getSkill('codebase-explorer');
    if (!skill) {
      throw new Error('codebase-explorer skill not found');
    }

    // Detect framework
    const framework = await detectFramework(path);
    const frameworkInfo = framework 
      ? `\nDetected Framework: ${framework.name} (${framework.type})`
      : '\nFramework: Not detected, using generic patterns';

    // Build context with relevant skills
    const skillsToLoad = ['codebase-explorer', 'project-readability'];
    if (framework) {
      skillsToLoad.push(...framework.skills);
    }

    const context = await this.buildSkillContext(skillsToLoad);

    // Resolve provider
    const selectedProvider = providerResolver.resolve(skill, overrideProvider);

    // Build prompt
    const prompt = this.buildExplorePrompt(path, depth, context, frameworkInfo);

    // Execute
    const result = await providerExecutor.execute({
      provider: selectedProvider,
      messages: prompt,
      max_tokens: depth === 'deep' ? 16000 : depth === 'normal' ? 8000 : 4000,
    });

    if (!result.success || !result.response) {
      throw new Error(`Exploration failed: ${result.error?.message}`);
    }

    // Track usage
    await budgetTracker.track('codebase-explorer', result.response);

    return this.formatExploreResult(result.response, path, depth);
  }

  async handleImplementFeature(args: any): Promise<string> {
    const { description, path, framework: frameworkHint, provider: overrideProvider } = args;

    logger.info(`Implementing feature: ${description.substring(0, 50)}...`);

    // Load feature-architect skill
    const skill = skillManager.getSkill('feature-architect');
    if (!skill) {
      throw new Error('feature-architect skill not found');
    }

    // Detect framework
    const framework = frameworkHint 
      ? { name: frameworkHint, type: 'fullstack' as const, skills: [] }
      : await detectFramework(path);

    // Build context
    const skillsToLoad = ['feature-architect', 'token-efficient-coding', 'project-readability'];
    if (framework) {
      const frameworkSkills = await this.getFrameworkSkills(framework.name);
      skillsToLoad.push(...frameworkSkills);
    }

    const context = await this.buildSkillContext(skillsToLoad);

    // Resolve provider
    const selectedProvider = providerResolver.resolve(skill, overrideProvider);

    // Build prompt
    const prompt = this.buildFeaturePrompt(description, path, framework, context);

    // Execute
    const result = await providerExecutor.execute({
      provider: selectedProvider,
      messages: prompt,
      max_tokens: 12000,
    });

    if (!result.success || !result.response) {
      throw new Error(`Feature implementation failed: ${result.error?.message}`);
    }

    // Track usage
    await budgetTracker.track('feature-architect', result.response);

    return this.formatFeatureResult(result.response);
  }

  async handleLoadSkillContext(args: any): Promise<string> {
    const { skills, framework } = args;

    const skillsToLoad: string[] = skills || [];
    
    if (framework) {
      const frameworkSkills = await this.getFrameworkSkills(framework);
      skillsToLoad.push(...frameworkSkills);
    }

    const context = await this.buildSkillContext(skillsToLoad);

    return `# Loaded Skills Context\n\n${context}\n\n**Ready to use these skills in your task!**`;
  }

  // Helper methods

  private async buildSkillContext(skillNames: string[]): Promise<string> {
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

  private async getFrameworkSkills(framework: string): Promise<string[]> {
    const skillMap: Record<string, string[]> = {
      'nextjs': ['nextjs-readability'],
      'react': ['react-readability'],
      'nestjs': ['nestjs-readability'],
      'expressjs': ['expressjs-readability'],
      'laravel': ['laravel-readability'],
      'fastapi': ['fastapi-readability'],
      'golang': ['golang-readability'],
      'flutter': ['flutter-readability'],
      'react-native': ['react-native-readability'],
    };

    return skillMap[framework] || [];
  }

  private buildExplorePrompt(path: string, depth: string, context: string, frameworkInfo: string): Message[] {
    return [
      {
        role: 'system',
        content: `You are a codebase exploration expert. Use the provided skills to analyze the codebase thoroughly and provide actionable insights.\n\n${context}`
      },
      {
        role: 'user',
        content: `Please explore the codebase at: ${path}\n\nDepth: ${depth}${frameworkInfo}\n\nProvide:\n1. Project structure overview\n2. Key components and their responsibilities\n3. Architecture patterns used\n4. Entry points and flow\n5. Potential issues or improvements\n6. Framework-specific insights\n\nBe concise but thorough.`
      }
    ];
  }

  private buildFeaturePrompt(description: string, path: string, framework: any, context: string): Message[] {
    const frameworkInfo = framework ? `\nFramework: ${framework.name}` : '';
    
    return [
      {
        role: 'system',
        content: `You are a senior software engineer implementing features with best practices. Use the provided skills to guide your implementation.\n\n${context}`
      },
      {
        role: 'user',
        content: `Implement this feature:\n\n${description}\n\nProject path: ${path}${frameworkInfo}\n\nFollow:\n1. Plan the implementation (affected files, new files, changes needed)\n2. Implement with clean, readable code\n3. Follow framework-specific patterns\n4. Include error handling\n5. Suggest tests\n\nProvide clear implementation plan and code.`
      }
    ];
  }

  private formatExploreResult(response: any, path: string, depth: string): string {
    return `# Codebase Exploration Result\n\n**Path:** ${path}\n**Depth:** ${depth}\n**Provider:** ${response.provider}\n**Tokens:** ${response.usage.total_tokens}\n**Cost:** $${response.cost?.toFixed(4) || '0.0000'}\n\n---\n\n${response.content}`;
  }

  private formatFeatureResult(response: any): string {
    return `# Feature Implementation\n\n**Provider:** ${response.provider}\n**Tokens:** ${response.usage.total_tokens}\n**Cost:** $${response.cost?.toFixed(4) || '0.0000'}\n\n---\n\n${response.content}`;
  }
}

export const toolHandlers = new ToolHandlers();
