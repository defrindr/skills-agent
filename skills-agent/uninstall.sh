#!/bin/bash

# Skills Agent Uninstaller
# Usage: bash ~/.skills-agent/skills-agent/uninstall.sh
# Or from repo: bash skills-agent/uninstall.sh

set -e

INSTALL_DIR="$HOME/.skills-agent"
SKILLS_DIR="$HOME/.agents/skills"
OPENCODE_CONFIG="$HOME/.config/opencode/opencode.json"

BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${BOLD}${RED}🗑️  Skills Agent Uninstaller${RESET}\n"

# Confirm uninstall
echo -e "${YELLOW}This will remove:${RESET}"
echo "  - Installation directory: $INSTALL_DIR"
echo "  - Skill symlinks: $SKILLS_DIR/*-readability, etc."
echo "  - OpenCode MCP configuration for skills-agent"
echo ""
read -p "Continue? [y/N] " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo -e "${BLUE}Uninstall cancelled.${RESET}"
  exit 0
fi

echo ""

# 1. Remove installation directory
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${BLUE}📦 Removing installation directory...${RESET}"
  rm -rf "$INSTALL_DIR"
  echo -e "${GREEN}✅ Removed $INSTALL_DIR${RESET}"
else
  echo -e "${YELLOW}⚠️  Installation directory not found (already removed?)${RESET}"
fi

# 2. Remove skill symlinks
if [ -d "$SKILLS_DIR" ]; then
  echo -e "${BLUE}🔗 Removing skill symlinks...${RESET}"
  
  # List of skills to remove (all 21 skills)
  SKILLS=(
    # Common (8)
    "codebase-explorer"
    "code-health"
    "database-designer"
    "database-optimizer"
    "feature-architect"
    "project-initializer"
    "project-readability"
    "token-efficient-coding"
    # Backend (5)
    "expressjs-readability"
    "fastapi-readability"
    "golang-readability"
    "laravel-readability"
    "nestjs-readability"
    # Frontend (6)
    "general-styling"
    "nextjs-readability"
    "react-readability"
    "tailwind-readability"
    "theme-redesign"
    "vue-nuxt-svelte-readability"
    # Mobile (2)
    "flutter-readability"
    "react-native-readability"
  )
  
  REMOVED_COUNT=0
  for skill in "${SKILLS[@]}"; do
    if [ -L "$SKILLS_DIR/$skill" ] || [ -d "$SKILLS_DIR/$skill" ]; then
      rm -rf "$SKILLS_DIR/$skill"
      ((REMOVED_COUNT++))
    fi
  done
  
  if [ $REMOVED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✅ Removed $REMOVED_COUNT skill symlinks${RESET}"
  else
    echo -e "${YELLOW}⚠️  No skill symlinks found (already removed?)${RESET}"
  fi
else
  echo -e "${YELLOW}⚠️  Skills directory not found${RESET}"
fi

# 3. Remove OpenCode MCP configuration
if [ -f "$OPENCODE_CONFIG" ]; then
  echo -e "${BLUE}⚙️  Removing OpenCode MCP configuration...${RESET}"
  
  # Check if jq is available for clean JSON manipulation
  if command -v jq >/dev/null 2>&1; then
    # Use jq to remove skills-agent server
    TEMP_CONFIG=$(mktemp)
    jq 'del(.mcpServers["skills-agent"])' "$OPENCODE_CONFIG" > "$TEMP_CONFIG"
    mv "$TEMP_CONFIG" "$OPENCODE_CONFIG"
    echo -e "${GREEN}✅ Removed skills-agent from OpenCode MCP config${RESET}"
  else
    # Fallback: Manual instruction
    echo -e "${YELLOW}⚠️  jq not installed. Manual cleanup required:${RESET}"
    echo ""
    echo "   Edit: $OPENCODE_CONFIG"
    echo "   Remove the \"skills-agent\" entry from \"mcpServers\""
    echo ""
  fi
else
  echo -e "${YELLOW}⚠️  OpenCode config not found${RESET}"
fi

# 4. Remove from PATH (if added)
echo -e "${BLUE}🔍 Checking PATH configuration...${RESET}"

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
  SHELL_RC="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
  SHELL_RC="$HOME/.bashrc"
else
  SHELL_RC="$HOME/.profile"
fi

if [ -f "$SHELL_RC" ]; then
  if grep -q "\.skills-agent" "$SHELL_RC"; then
    echo -e "${YELLOW}⚠️  Found skills-agent in $SHELL_RC${RESET}"
    echo ""
    echo "   Please manually remove this line:"
    echo "   ${BOLD}export PATH=\"\$PATH:$INSTALL_DIR/skills-agent/dist\"${RESET}"
    echo ""
    echo "   Then run: ${BOLD}source $SHELL_RC${RESET}"
    echo ""
  else
    echo -e "${GREEN}✅ No PATH configuration found${RESET}"
  fi
fi

# 5. Summary
echo ""
echo -e "${GREEN}${BOLD}✨ Uninstall complete!${RESET}\n"
echo -e "${BLUE}What was removed:${RESET}"
echo "  ✅ Installation directory ($INSTALL_DIR)"
echo "  ✅ Skill symlinks (21 skills)"
echo "  ✅ OpenCode MCP configuration"
echo ""
echo -e "${YELLOW}${BOLD}Next steps:${RESET}"
echo "  1. Restart OpenCode (Quit + reopen)"
echo "  2. Verify: ${BOLD}opencode mcp list${RESET} (skills-agent should be gone)"
echo "  3. Optional: Remove PATH entry from $SHELL_RC (if added)"
echo ""
echo -e "${BLUE}To reinstall:${RESET}"
echo "  ${BOLD}curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash${RESET}"
echo "  ${YELLOW}(Note: Requires public repo or git clone manually)${RESET}"
echo ""
