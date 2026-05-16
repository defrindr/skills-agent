#!/bin/bash

# Skills Agent Uninstaller
# Removes all components of Skills Agent installation

set -e

INSTALL_DIR="$HOME/.skills-agent"
SKILLS_DIR="$HOME/.agents/skills"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"
BOLD="\033[1m"
RED="\033[31m"
YELLOW="\033[33m"
GREEN="\033[32m"
BLUE="\033[34m"
RESET="\033[0m"

echo -e "${BOLD}${RED}"
echo "╔════════════════════════════════════════╗"
echo "║     Skills Agent Uninstaller          ║"
echo "╚════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""

# Check if installed
if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}⚠  Skills Agent is not installed${RESET}"
  echo ""
  echo "Installation directory not found: $INSTALL_DIR"
  exit 0
fi

# Show what will be removed
echo -e "${BOLD}The following will be removed:${RESET}"
echo ""
echo "  ❌ Installation: $INSTALL_DIR"
echo "  ❌ Skill symlinks: $SKILLS_DIR/{common,backend,frontend,mobile}"
echo "  ❌ OpenCode config: $OPENCODE_CONFIG (skills-agent entry)"
echo ""

# Confirmation
read -p "$(echo -e ${YELLOW}Proceed with uninstallation? \(y/N\): ${RESET})" -n 1 -r
echo ""
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Uninstallation cancelled${RESET}"
  exit 0
fi

# Remove installation directory
echo -e "${BLUE}Removing installation directory...${RESET}"
rm -rf "$INSTALL_DIR"
echo -e "${GREEN}✓ Removed: $INSTALL_DIR${RESET}"
echo ""

# Remove skill symlinks
echo -e "${BLUE}Removing skill symlinks...${RESET}"

SKILLS=(
  # Common
  "common/codebase-explorer"
  "common/code-health"
  "common/database-designer"
  "common/database-optimizer"
  "common/feature-architect"
  "common/project-initializer"
  "common/project-readability"
  "common/token-efficient-coding"
  
  # Backend
  "backend/expressjs-readability"
  "backend/fastapi-readability"
  "backend/golang-readability"
  "backend/laravel-readability"
  "backend/nestjs-readability"
  
  # Frontend
  "frontend/general-styling"
  "frontend/nextjs-readability"
  "frontend/react-readability"
  "frontend/tailwind-readability"
  "frontend/theme-redesign"
  "frontend/vue-nuxt-svelte-readability"
  
  # Mobile
  "mobile/flutter-readability"
  "mobile/react-native-readability"
)

REMOVED_COUNT=0
for skill in "${SKILLS[@]}"; do
  SKILL_PATH="$SKILLS_DIR/$skill"
  if [ -L "$SKILL_PATH" ]; then
    rm "$SKILL_PATH"
    REMOVED_COUNT=$((REMOVED_COUNT + 1))
  fi
done

echo -e "${GREEN}✓ Removed $REMOVED_COUNT skill symlinks${RESET}"
echo ""

# Remove empty category directories
for category in common backend frontend mobile; do
  if [ -d "$SKILLS_DIR/$category" ] && [ -z "$(ls -A $SKILLS_DIR/$category)" ]; then
    rmdir "$SKILLS_DIR/$category"
  fi
done

# Remove OpenCode MCP config entry
if [ -f "$OPENCODE_CONFIG" ]; then
  echo -e "${BLUE}Removing OpenCode MCP configuration...${RESET}"
  
  # Create backup
  cp "$OPENCODE_CONFIG" "$OPENCODE_CONFIG.backup"
  
  # Remove skills-agent entry (simple approach: remove line containing skills-agent)
  # Note: This assumes the config follows standard JSON formatting
  if command -v node >/dev/null 2>&1; then
    # Use Node.js to properly edit JSON
    node -e "
      const fs = require('fs');
      const config = JSON.parse(fs.readFileSync('$OPENCODE_CONFIG', 'utf8'));
      if (config.mcp?.servers?.['skills-agent']) {
        delete config.mcp.servers['skills-agent'];
        fs.writeFileSync('$OPENCODE_CONFIG', JSON.stringify(config, null, 2));
        console.log('✓ Removed skills-agent from OpenCode config');
      }
    " 2>/dev/null || echo -e "${YELLOW}⚠  Could not automatically remove OpenCode config. Please edit manually: $OPENCODE_CONFIG${RESET}"
  else
    echo -e "${YELLOW}⚠  Node.js not found. Please manually remove 'skills-agent' entry from: $OPENCODE_CONFIG${RESET}"
  fi
  
  echo -e "${GREEN}✓ OpenCode config updated${RESET}"
  echo -e "${BLUE}   Backup saved: $OPENCODE_CONFIG.backup${RESET}"
  echo ""
fi

# Check PATH
echo -e "${BLUE}Checking PATH entries...${RESET}"
if echo "$PATH" | grep -q ".skills-agent"; then
  echo -e "${YELLOW}⚠  Found .skills-agent in PATH${RESET}"
  echo ""
  echo "You may want to remove this from your shell config:"
  
  if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
  elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
  else
    SHELL_RC="$HOME/.profile"
  fi
  
  echo "  File: $SHELL_RC"
  echo "  Look for lines containing: .skills-agent"
  echo ""
else
  echo -e "${GREEN}✓ No PATH entries found${RESET}"
  echo ""
fi

# Success
echo -e "${GREEN}${BOLD}"
echo "╔════════════════════════════════════════╗"
echo "║     Uninstallation Complete! ✓        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${RESET}"
echo ""

echo -e "${BOLD}Next steps:${RESET}"
echo "  1. Restart OpenCode (Cmd+Q / Ctrl+Q and reopen)"
echo -e "  2. Verify removal: ${BLUE}opencode mcp list${RESET}"
echo "     skills-agent should NOT appear"
echo ""

echo -e "${YELLOW}To reinstall:${RESET}"
echo -e "  ${BLUE}bash <(curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent-installer/main/install.sh)${RESET}"
echo ""

echo -e "${GREEN}Thank you for using Skills Agent! 👋${RESET}"
