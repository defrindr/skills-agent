/**
 * MCP Tool handlers - business logic for each tool
 */

import { Skill } from '../types/skill.js';
import { Message } from '../types/provider.js';
import { skillManager } from '../skills/manager.js';
import { contextBuilder } from '../skills/context-builder.js';
import { providerResolver } from '../providers/resolver.js';
import { providerExecutor } from '../providers/executor.js';
import { detectFramework } from '../utils/framework-detector.js';
import { logger } from '../utils/logger.js';
import { mcpRecommender } from './recommender.js';
import { mcpConfigWriter } from './config-writer.js';
import { ProjectType } from './registry.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export class ToolHandlers {
  async handleExploreCodebase(args: any): Promise<string> {
    const { path, depth = 'normal', persona = 'senior-engineer', provider: overrideProvider } = args;

    logger.info(`Exploring codebase at ${path} with depth: ${depth}, persona: ${persona}`);

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

    // Build context with persona
    const compressionLevel = depth === 'quick' ? 'compact' : 'full';
    const context = await contextBuilder.build({
      persona,
      skills: skillsToLoad,
      compressionLevel
    });

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
    const { description, path, framework: frameworkHint, persona = 'senior-engineer', provider: overrideProvider } = args;

    logger.info(`Implementing feature: ${description.substring(0, 50)}... with persona: ${persona}`);

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

    const context = await contextBuilder.build({
      persona,
      skills: skillsToLoad,
      compressionLevel: 'full'
    });

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
    const { skills, framework, persona = 'senior-engineer' } = args;

    const skillsToLoad: string[] = skills || [];
    
    if (framework) {
      const frameworkSkills = await this.getFrameworkSkills(framework);
      skillsToLoad.push(...frameworkSkills);
    }

    const context = await contextBuilder.build({
      persona,
      skills: skillsToLoad,
      compressionLevel: 'full'
    });

    return `# Loaded Skills Context\n\n${context}\n\n**Ready to use these skills in your task!**`;
  }

  async handleInitProject(args: any): Promise<string> {
    const { 
      description, 
      framework: frameworkHint, 
      name: projectName,
      persona = 'senior-engineer',
      provider: overrideProvider 
    } = args;

    logger.info(`Init project request: ${description.substring(0, 50)}... with persona: ${persona}`);

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

    const context = await contextBuilder.build({
      persona,
      skills: skillsToLoad,
      compressionLevel: 'full'
    });

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

  // ============================================================
  // agent_planner — Phase 1 of agent-planner skill
  // ============================================================

  async handleAgentPlanner(args: any): Promise<string> {
    const {
      description,
      path: targetPath = process.cwd(),
      framework: frameworkHint,
      projectType: typeHint,
      writeFiles = false,
      autoConfigMcp = false,
      persona = 'project-planner',
      provider: overrideProvider,
    } = args;

    logger.info(`agent_planner: ${description.substring(0, 60)}... write=${writeFiles}`);

    const requirements = this.parseProjectRequirements(description, frameworkHint);
    if (!requirements.hasEnoughInfo) {
      return this.buildRequirementsGatheringResponse(requirements);
    }

    const projectType = (typeHint ?? this.inferProjectType(requirements)) as ProjectType;
    const hasDatabase = requirements.features.some(f =>
      ['database', 'postgres', 'mysql', 'mongodb', 'db'].includes(f)
    );

    // Step 1: Recommend MCP servers
    const mcpRecs = mcpRecommender.recommend({
      projectType,
      framework: requirements.framework,
      hasDatabase,
      hasBrowser: projectType === 'web' || projectType === 'fullstack',
      hasVcs: true,
    });
    const mcpSnippet = mcpRecommender.buildConfigSnippet(mcpRecs);

    // Step 2: Generate AGENTS.md + flow stubs via skill context
    const skill = skillManager.getSkill('agent-planner');
    if (!skill) {
      throw new Error('agent-planner skill not found');
    }

    const skillsToLoad = ['agent-planner', 'project-readability', 'project-initializer'];
    if (requirements.framework) {
      skillsToLoad.push(...(await this.getFrameworkSkills(requirements.framework)));
    }

    const context = await contextBuilder.build({
      persona,
      skills: skillsToLoad,
      compressionLevel: 'compact',
    });

    const selectedProvider = providerResolver.resolve(skill, overrideProvider);

    const prompt: Message[] = [
      {
        role: 'system',
        content: `You are a project planner following the agent-planner skill. Output PLAIN MARKDOWN sections in this order:

## FLOWS
List 3-7 user flows. For each: name, 1-line description.

## AGENTS_MD
Full content for .opencode/AGENTS.md following the template (Project Context, Active Skills, Workflows, Flow References, MCP Servers, Conventions).

## FLOW_DOCS
For each flow, output: \`### {flow-name}\` then full flow doc body (Overview, Actors, Steps, API Contracts, Errors, Testing).

Be concise. No fluff. No emoji.

${context}`,
      },
      {
        role: 'user',
        content: `Plan this project:

**Type:** ${projectType}
**Framework:** ${requirements.framework}
**Scale:** ${requirements.scale}
**Features:** ${requirements.features.join(', ') || 'base setup'}

Output the three sections (FLOWS, AGENTS_MD, FLOW_DOCS).`,
      },
    ];

    const result = await providerExecutor.execute({
      provider: selectedProvider,
      messages: prompt,
      max_tokens: 6000,
    });

    if (!result.success || !result.response) {
      throw new Error(`agent_planner failed: ${result.error?.message}`);
    }

    const parsed = this.parsePlannerOutput(result.response.content);

    // Step 3: Preview or write
    const sections: string[] = [];
    sections.push(`# Agent Planner Result\n`);
    sections.push(`**Project:** ${requirements.framework} ${projectType} (${requirements.scale})`);
    sections.push(`**Provider:** ${result.response.provider}`);
    sections.push(`**Cost:** $${result.response.cost?.toFixed(4) ?? '0.0000'}\n`);

    sections.push(`## Recommended MCP Servers\n`);
    for (const rec of mcpRecs) {
      sections.push(`- **${rec.server.displayName}** [${rec.priority}] — ${rec.reason}`);
    }

    sections.push(`\n## Detected Flows\n${parsed.flows || '(none)'}\n`);

    if (writeFiles) {
      const writeResult = await this.writePlannerArtifacts(targetPath, parsed, mcpSnippet);
      sections.push(`## Files Written\n`);
      writeResult.forEach(f => sections.push(`- ${f}`));
    } else {
      sections.push(`## Preview (writeFiles=false)\n`);
      sections.push(`Call again with \`writeFiles: true\` to generate:\n`);
      sections.push(`- ${join(targetPath, '.opencode/AGENTS.md')}`);
      sections.push(`- ${join(targetPath, '.opencode/flows/*.md')}`);
      sections.push(`- ${join(targetPath, '.opencode/recommended-mcps.json')}`);
    }

    if (autoConfigMcp) {
      sections.push(`\n## MCP Auto-Config\n`);
      const writeRes = await mcpConfigWriter.merge(mcpSnippet.mcp as Record<string, unknown>);
      if (writeRes.ok) {
        sections.push(`Updated: ${writeRes.path}`);
        if (writeRes.backupPath) sections.push(`Backup: ${writeRes.backupPath}`);
        if (writeRes.added.length) sections.push(`Added: ${writeRes.added.join(', ')}`);
        if (writeRes.skipped.length) sections.push(`Skipped (already exists): ${writeRes.skipped.join(', ')}`);
      } else {
        sections.push(`Failed: ${writeRes.error}`);
        if (writeRes.backupPath) sections.push(`Rolled back from: ${writeRes.backupPath}`);
      }
    } else {
      sections.push(`\n## MCP Config Snippet (not applied)\n`);
      sections.push(`\`\`\`json\n${JSON.stringify(mcpSnippet, null, 2)}\n\`\`\``);
      sections.push(`\nCall again with \`autoConfigMcp: true\` to merge into ~/.config/opencode/opencode.json (with backup).`);
    }

    return sections.join('\n');
  }

  private inferProjectType(req: any): ProjectType {
    if (req.type) return req.type as ProjectType;
    if (['flutter', 'react-native'].includes(req.framework)) return 'mobile';
    if (['laravel', 'nestjs', 'expressjs', 'fastapi', 'golang'].includes(req.framework)) return 'api';
    if (['nextjs', 'react', 'vue', 'nuxt'].includes(req.framework)) return 'web';
    return 'fullstack';
  }

  private parsePlannerOutput(content: string): { flows: string; agentsMd: string; flowDocs: string } {
    const grab = (start: string, end?: string) => {
      const re = end
        ? new RegExp(`##\\s*${start}\\s*([\\s\\S]*?)(?=##\\s*${end})`, 'i')
        : new RegExp(`##\\s*${start}\\s*([\\s\\S]*)$`, 'i');
      return (content.match(re)?.[1] ?? '').trim();
    };
    return {
      flows: grab('FLOWS', 'AGENTS_MD'),
      agentsMd: grab('AGENTS_MD', 'FLOW_DOCS'),
      flowDocs: grab('FLOW_DOCS'),
    };
  }

  private async writePlannerArtifacts(
    targetPath: string,
    parsed: { flows: string; agentsMd: string; flowDocs: string },
    mcpSnippet: Record<string, unknown>
  ): Promise<string[]> {
    const opencodeDir = join(targetPath, '.opencode');
    const flowsDir = join(opencodeDir, 'flows');
    await fs.mkdir(flowsDir, { recursive: true });

    const written: string[] = [];

    const agentsPath = join(opencodeDir, 'AGENTS.md');
    await fs.writeFile(agentsPath, parsed.agentsMd || '# Project Agents\n\n(generated)\n', 'utf-8');
    written.push(agentsPath);

    // Split FLOW_DOCS by `### {name}` headings
    const flowSections = parsed.flowDocs.split(/^###\s+/m).filter(s => s.trim());
    for (const section of flowSections) {
      const firstLine = section.split('\n')[0].trim();
      const slug = firstLine.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!slug) continue;
      const flowPath = join(flowsDir, `${slug}.md`);
      await fs.writeFile(flowPath, `# ${firstLine}\n\n${section.split('\n').slice(1).join('\n')}`, 'utf-8');
      written.push(flowPath);
    }

    const mcpPath = join(opencodeDir, 'recommended-mcps.json');
    await fs.writeFile(mcpPath, JSON.stringify(mcpSnippet, null, 2), 'utf-8');
    written.push(mcpPath);

    return written;
  }

  // ============================================================
  // (original helpers continue below)
  // ============================================================

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
