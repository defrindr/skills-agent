#!/usr/bin/env node

/**
 * Skills Agent Setup Script
 * Auto-configures everything for OpenCode integration
 */

import fs from 'fs';
import path from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message: string, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function success(message: string) {
  log(`✅ ${message}`, COLORS.green);
}

function info(message: string) {
  log(`ℹ️  ${message}`, COLORS.blue);
}

function warn(message: string) {
  log(`⚠️  ${message}`, COLORS.yellow);
}

function error(message: string) {
  log(`❌ ${message}`, COLORS.red);
}

// Get package installation directory
function getPackageRoot(): string {
  // When installed globally via npm, __dirname will be in node_modules
  // We need to find the actual package root
  const currentDir = path.dirname(new URL(import.meta.url).pathname);
  
  // Try to find package.json upwards
  let dir = currentDir;
  while (dir !== '/') {
    if (fs.existsSync(path.join(dir, 'package.json'))) {
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      if (pkg.name === '@defrindr/skills-agent') {
        return dir;
      }
    }
    dir = path.dirname(dir);
  }
  
  return currentDir;
}

// Detect node executable path (NVM support)
function getNodePath(): string {
  try {
    const nodePath = execSync('which node', { encoding: 'utf-8' }).trim();
    return nodePath;
  } catch {
    return 'node'; // fallback
  }
}

// Step 1: Link skills to ~/.agents/skills/
function setupSkills() {
  info('Setting up skills...');
  
  const packageRoot = getPackageRoot();
  const skillsSource = path.join(packageRoot, 'skills');
  const skillsTarget = path.join(homedir(), '.agents', 'skills');
  
  if (!fs.existsSync(skillsSource)) {
    error(`Skills directory not found: ${skillsSource}`);
    process.exit(1);
  }
  
  // Create target directory
  if (!fs.existsSync(skillsTarget)) {
    fs.mkdirSync(skillsTarget, { recursive: true });
  }
  
  // Link all skill categories
  const categories = ['common', 'backend', 'frontend', 'mobile'];
  let linkedCount = 0;
  
  for (const category of categories) {
    const categoryPath = path.join(skillsSource, category);
    if (!fs.existsSync(categoryPath)) {
      warn(`Category not found: ${category}`);
      continue;
    }
    
    const skills = fs.readdirSync(categoryPath);
    
    for (const skill of skills) {
      const skillPath = path.join(categoryPath, skill);
      const targetPath = path.join(skillsTarget, skill);
      
      // Skip if not a directory or if SKILL.md doesn't exist
      if (!fs.statSync(skillPath).isDirectory()) continue;
      if (!fs.existsSync(path.join(skillPath, 'SKILL.md'))) continue;
      
      // Remove existing symlink/directory
      if (fs.existsSync(targetPath)) {
        try {
          if (fs.lstatSync(targetPath).isSymbolicLink()) {
            fs.unlinkSync(targetPath);
          } else {
            // If it's a real directory, skip (user might have custom setup)
            warn(`Skipping ${skill}: exists as real directory`);
            continue;
          }
        } catch (err: any) {
          warn(`Failed to remove existing ${skill}: ${err.message}`);
          continue;
        }
      }
      
      // Create symlink
      try {
        fs.symlinkSync(skillPath, targetPath, 'dir');
        linkedCount++;
      } catch (err: any) {
        warn(`Failed to link ${skill}: ${err.message}`);
      }
    }
  }
  
  success(`Linked ${linkedCount} skills to ${skillsTarget}`);
}

// Step 2: Configure OpenCode MCP server
function setupOpenCodeMCP() {
  info('Configuring OpenCode MCP server...');
  
  const packageRoot = getPackageRoot();
  const serverPath = path.join(packageRoot, 'dist', 'index.js');
  const nodePath = getNodePath();
  const skillsDir = path.join(packageRoot, 'skills');
  
  if (!fs.existsSync(serverPath)) {
    error(`MCP server not found: ${serverPath}`);
    error('Run "npm run build" first');
    process.exit(1);
  }
  
  const opencodeConfigDir = path.join(homedir(), '.config', 'opencode');
  const opencodeConfigPath = path.join(opencodeConfigDir, 'opencode.json');
  
  // Create config directory
  if (!fs.existsSync(opencodeConfigDir)) {
    fs.mkdirSync(opencodeConfigDir, { recursive: true });
  }
  
  // Load existing config or create new
  let config: any = {
    "$schema": "https://opencode.ai/config.json"
  };
  
  if (fs.existsSync(opencodeConfigPath)) {
    try {
      config = JSON.parse(fs.readFileSync(opencodeConfigPath, 'utf-8'));
    } catch {
      warn('Failed to parse existing OpenCode config, creating new one');
    }
  }
  
  // Add MCP server config
  if (!config.mcp) {
    config.mcp = {};
  }
  
  config.mcp['skills-agent'] = {
    type: 'local',
    command: [nodePath, serverPath],
    environment: {
      SKILLS_DIR: skillsDir
    },
    enabled: true,
    timeout: 10000
  };
  
  // Write config
  fs.writeFileSync(opencodeConfigPath, JSON.stringify(config, null, 2));
  
  success(`OpenCode MCP configured at ${opencodeConfigPath}`);
}

// Step 3: Verify installation
function verifyInstallation() {
  info('Verifying installation...');
  
  const checks = [
    {
      name: 'Skills directory',
      path: path.join(homedir(), '.agents', 'skills'),
      check: (p: string) => fs.existsSync(p) && fs.readdirSync(p).length > 0
    },
    {
      name: 'OpenCode config',
      path: path.join(homedir(), '.config', 'opencode', 'opencode.json'),
      check: (p: string) => {
        if (!fs.existsSync(p)) return false;
        const config = JSON.parse(fs.readFileSync(p, 'utf-8'));
        return config.mcp && config.mcp['skills-agent'];
      }
    },
    {
      name: 'MCP server',
      path: path.join(getPackageRoot(), 'dist', 'index.js'),
      check: (p: string) => fs.existsSync(p)
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      if (check.check(check.path)) {
        success(`${check.name}: OK`);
      } else {
        error(`${check.name}: FAILED`);
        allPassed = false;
      }
    } catch (err) {
      error(`${check.name}: ERROR`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

// Main setup
async function main() {
  log('\n🚀 Skills Agent Setup\n', COLORS.blue);
  
  try {
    // Step 1: Setup skills
    setupSkills();
    
    // Step 2: Configure OpenCode MCP
    setupOpenCodeMCP();
    
    // Step 3: Verify
    log('');
    const verified = verifyInstallation();
    
    if (verified) {
      log('\n✨ Setup complete!\n', COLORS.green);
      info('Next steps:');
      console.log('  1. Restart OpenCode (Quit + reopen)');
      console.log('  2. Run: opencode mcp list');
      console.log('  3. Use tools: skills-agent_init_project, skills-agent_explore_codebase, etc.\n');
      
      info('Documentation:');
      console.log(`  ${path.join(getPackageRoot(), 'MCP-OPENCODE.md')}\n`);
    } else {
      error('\nSetup completed with errors. Check messages above.');
      process.exit(1);
    }
  } catch (err: any) {
    error(`\nSetup failed: ${err.message}`);
    process.exit(1);
  }
}

main();
