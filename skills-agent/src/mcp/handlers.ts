/**
 * MCP Tool handlers - business logic for each tool
 */

import { Skill } from '../types/skill.js';
import { Message } from '../types/provider.js';
import { skillManager } from '../skills/manager.js';
import { providerResolver } from '../providers/resolver.js';
import { providerExecutor } from '../providers/executor.js';
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

  async handleInitProject(args: any): Promise<string> {
    const { 
      description, 
      framework: frameworkHint, 
      name: projectName,
      provider: overrideProvider 
    } = args;

    logger.info(`Init project request: ${description.substring(0, 50)}...`);

    // Load project-initializer skill
    const skill = skillManager.getSkill('project-initializer');
    if (!skill) {
      throw new Error('project-initializer skill not found');
    }

    // Analyze description to extract requirements
    const requirements = this.parseProjectRequirements(description, frameworkHint, projectName);

    // Check if we have enough info
    if (!requirements.hasEnoughInfo) {
      return this.buildRequirementsGatheringResponse(requirements);
    }

    // Load relevant skills
    const skillsToLoad = ['project-initializer', 'project-readability', 'token-efficient-coding'];
    
    // Add framework-specific skill if detected
    if (requirements.framework) {
      const frameworkSkills = await this.getFrameworkSkills(requirements.framework);
      skillsToLoad.push(...frameworkSkills);
    }

    const context = await this.buildSkillContext(skillsToLoad);

    // Resolve provider (prefer free tier for init)
    const selectedProvider = providerResolver.resolve(skill, overrideProvider);

    // Build tailored prompt
    const prompt: Message[] = [
      {
        role: 'system',
        content: `You are a project initialization expert following the project-initializer skill guidelines.

CRITICAL: You have ALL the requirements. DO NOT ask questions. Provide the complete setup guide immediately.

${context}`
      },
      {
        role: 'user',
        content: this.buildInitPrompt(requirements)
      }
    ];

    // Execute
    const result = await providerExecutor.execute({
      provider: selectedProvider,
      messages: prompt,
      max_tokens: 4000,
    });

    if (!result.success || !result.response) {
      throw new Error(`Project initialization failed: ${result.error?.message}`);
    }

    return `# 🚀 Project Setup Guide

**Requirements Summary:**
${this.formatRequirementsSummary(requirements)}

**Provider:** ${result.response.provider}
**Cost:** $${result.response.cost?.toFixed(4) || '0.0000'}

---

${result.response.content}

---

💡 **Next:** After setup, I can help you:
- Explore generated codebase
- Implement features
- Add testing, Docker, CI/CD

Just ask!`;
  }

  // Parse project requirements from description
  private parseProjectRequirements(
    description: string, 
    frameworkHint?: string, 
    projectName?: string
  ) {
    const desc = description.toLowerCase();
    
    // Extract type
    const typeKeywords = {
      web: ['web app', 'website', 'saas', 'dashboard', 'admin'],
      api: ['api', 'backend', 'server', 'microservice'],
      mobile: ['mobile', 'ios', 'android', 'app'],
      fullstack: ['fullstack', 'full-stack', 'full stack']
    };
    
    let type = frameworkHint ? 'web' : undefined;
    for (const [key, keywords] of Object.entries(typeKeywords)) {
      if (keywords.some(kw => desc.includes(kw))) {
        type = key;
        break;
      }
    }

    // Extract scale
    const scaleKeywords = {
      mvp: ['mvp', 'prototype', 'quick', 'fast', 'simple', 'basic', 'landing'],
      startup: ['startup', 'scalable', 'grow', 'production'],
      enterprise: ['enterprise', 'team', 'large', 'organization', 'company']
    };
    
    let scale = undefined;
    for (const [key, keywords] of Object.entries(scaleKeywords)) {
      if (keywords.some(kw => desc.includes(kw))) {
        scale = key;
        break;
      }
    }

    // Extract features
    const features: string[] = [];
    const featureKeywords = [
      'auth', 'authentication', 'login',
      'database', 'postgres', 'mongodb', 'mysql', 'db',
      'payment', 'stripe', 'billing',
      'realtime', 'websocket', 'live',
      'email', 'notification',
      'upload', 'file',
      'docker', 'container'
    ];
    
    featureKeywords.forEach(kw => {
      if (desc.includes(kw)) features.push(kw);
    });

    // Extract framework
    const frameworkKeywords = {
      'nextjs': ['nextjs', 'next.js', 'next'],
      'react': ['react', 'vite'],
      'vue': ['vue', 'nuxt'],
      'nestjs': ['nestjs', 'nest'],
      'express': ['express', 'expressjs'],
      'fastapi': ['fastapi', 'fast api'],
      'laravel': ['laravel'],
      'flutter': ['flutter'],
      'react-native': ['react native', 'react-native', 'expo']
    };
    
    let framework = frameworkHint;
    if (!framework) {
      for (const [key, keywords] of Object.entries(frameworkKeywords)) {
        if (keywords.some(kw => desc.includes(kw))) {
          framework = key;
          break;
        }
      }
    }

    // Extract team info
    const teamKeywords = {
      solo: ['solo', 'myself', 'alone', 'personal'],
      small: ['small team', '2-5', 'few devs'],
      large: ['team', 'devs', 'developers', 'engineers']
    };
    
    let teamSize = undefined;
    for (const [key, keywords] of Object.entries(teamKeywords)) {
      if (keywords.some(kw => desc.includes(kw))) {
        teamSize = key;
        break;
      }
    }

    // Determine if we have enough info
    const hasEnoughInfo = !!(framework && scale);

    return {
      description,
      type,
      scale,
      features,
      framework,
      teamSize,
      projectName,
      hasEnoughInfo
    };
  }

  // Build response asking for more requirements
  private buildRequirementsGatheringResponse(requirements: any): string {
    const missing: string[] = [];
    
    if (!requirements.framework) missing.push('Framework/tech stack');
    if (!requirements.scale) missing.push('Project scale (MVP/startup/enterprise)');
    
    return `# 📋 Project Requirements Needed

I need more information to recommend the best setup. Please provide:

${missing.map(m => `- **${m}**`).join('\n')}

## Quick Questions:

1. **What are you building?**
   - Type: ${requirements.type || 'Web app? API? Mobile app?'}
   ${!requirements.framework ? '\n   - Framework preference: Next.js? NestJS? React? Flutter? (or should I recommend?)' : ''}

2. **Scale & Complexity:**
   ${!requirements.scale ? '- MVP/prototype (quick start)?\n   - Startup (scalable, production-ready)?\n   - Enterprise (team collaboration)?' : `- ${requirements.scale}`}

3. **Core Features:**
   ${requirements.features.length > 0 ? `- Already mentioned: ${requirements.features.join(', ')}` : '- Authentication? Database? Payments? Real-time?'}
   - Any other features?

4. **Team & Timeline:**
   ${requirements.teamSize ? `- Team: ${requirements.teamSize}` : '- Solo dev or team?'}
   - Quick prototype or production-ready?

## Example of Complete Request:

"Init Next.js SaaS app with Clerk auth and PostgreSQL. Solo dev, startup scale, need Stripe payments."

**Once I have this info, I'll provide:**
- Tailored tech stack recommendations
- Exact setup commands
- Project structure
- Timeline estimate

**No unnecessary complexity, just what you need!** 🎯`;
  }

  // Build prompt for project init with full requirements
  private buildInitPrompt(requirements: any): string {
    return `Initialize a new project with these requirements:

**Type:** ${requirements.type || 'web'}
**Framework:** ${requirements.framework}
**Scale:** ${requirements.scale}
**Features:** ${requirements.features.length > 0 ? requirements.features.join(', ') : 'base setup only'}
**Team:** ${requirements.teamSize || 'not specified'}
**Project Name:** ${requirements.projectName || 'my-app'}

Follow the project-initializer skill guidelines:

1. **Confirm requirements** (1-2 sentences summary)
2. **Recommend tech stack** (with reasoning for each choice based on scale + features)
3. **Provide initialization commands** (official CLI tools)
4. **Project structure** (tailored to scale: MVP = minimal, startup = feature-first, enterprise = domain-driven)
5. **Feature setup commands** (ONLY for requested features)
6. **Timeline estimate** (realistic based on features)
7. **Next steps** (specific to their requirements)

Be specific with commands. Only include features they requested. Match structure to scale.`;
  }

  // Format requirements summary
  private formatRequirementsSummary(requirements: any): string {
    const lines: string[] = [];
    
    if (requirements.type) lines.push(`- Type: ${requirements.type}`);
    if (requirements.framework) lines.push(`- Framework: ${requirements.framework}`);
    if (requirements.scale) lines.push(`- Scale: ${requirements.scale}`);
    if (requirements.features.length > 0) lines.push(`- Features: ${requirements.features.join(', ')}`);
    if (requirements.teamSize) lines.push(`- Team: ${requirements.teamSize}`);
    if (requirements.projectName) lines.push(`- Name: ${requirements.projectName}`);
    
    return lines.join('\n');
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
