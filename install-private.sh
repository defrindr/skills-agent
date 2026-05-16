#!/bin/bash

# Skills Agent Installer (Private Repo)
# Usage: bash <(curl -fsSL https://gist.githubusercontent.com/defrindr/{gist-id}/raw/install.sh)

set -e

REPO="defrindr/skills-agent"
INSTALL_DIR="$HOME/.skills-agent"
BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RED="\033[31m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}🚀 Skills Agent Installer${RESET}\n"

# Check dependencies
echo "Checking dependencies..."
command -v node >/dev/null 2>&1 || { echo -e "${RED}❌ Node.js required. Install from https://nodejs.org${RESET}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${RED}❌ npm required.${RESET}"; exit 1; }
command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ git required.${RESET}"; exit 1; }

echo -e "${GREEN}✅ Node.js $(node --version)${RESET}"
echo -e "${GREEN}✅ npm $(npm --version)${RESET}"
echo -e "${GREEN}✅ git $(git --version | head -1)${RESET}"
echo ""

# Check GitHub authentication
echo -e "${BLUE}Checking GitHub authentication...${RESET}"

AUTH_METHOD=""

# Check gh CLI
if command -v gh >/dev/null 2>&1 && gh auth status &>/dev/null; then
  echo -e "${GREEN}✅ GitHub CLI authenticated${RESET}"
  AUTH_METHOD="gh"
# Check SSH key
elif ssh -T git@github.com 2>&1 | grep -q "successfully authenticated"; then
  echo -e "${GREEN}✅ SSH key configured${RESET}"
  AUTH_METHOD="ssh"
else
  echo -e "${RED}❌ GitHub authentication required${RESET}"
  echo ""
  echo -e "${YELLOW}This installs from a private repository. Choose authentication method:${RESET}"
  echo ""
  echo "  ${BOLD}Option 1: GitHub CLI (Recommended)${RESET}"
  echo "    brew install gh"
  echo "    gh auth login"
  echo ""
  echo "  ${BOLD}Option 2: SSH Key${RESET}"
  echo "    ssh-keygen -t ed25519 -C \"your@email.com\""
  echo "    cat ~/.ssh/id_ed25519.pub"
  echo "    # Add to: https://github.com/settings/keys"
  echo ""
  echo "  ${BOLD}Option 3: HTTPS Token${RESET}"
  echo "    # Create token: https://github.com/settings/tokens"
  echo "    git config --global credential.helper store"
  echo ""
  exit 1
fi
echo ""

# Remove old installation if exists
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}⚠️  Existing installation found at $INSTALL_DIR${RESET}"
  echo -e "${YELLOW}   Removing old installation...${RESET}"
  rm -rf "$INSTALL_DIR"
fi

# Clone repository
echo -e "${BLUE}📦 Cloning repository...${RESET}"

if [ "$AUTH_METHOD" = "gh" ]; then
  # Use gh CLI
  gh repo clone $REPO "$INSTALL_DIR" 2>&1 | grep -v "Cloning into" || true
elif [ "$AUTH_METHOD" = "ssh" ]; then
  # Use SSH
  git clone --depth 1 git@github.com:$REPO.git "$INSTALL_DIR" 2>&1 | grep -v "Cloning into" || true
else
  # Use HTTPS (will prompt for credentials if needed)
  git clone --depth 1 https://github.com/$REPO.git "$INSTALL_DIR" 2>&1 | grep -v "Cloning into" || true
fi

if [ ! -d "$INSTALL_DIR" ]; then
  echo -e "${RED}❌ Clone failed. Check authentication and try again.${RESET}"
  exit 1
fi

echo -e "${GREEN}✅ Cloned successfully${RESET}"
echo ""

# Navigate to skills-agent package
cd "$INSTALL_DIR/skills-agent"

# Install dependencies
echo -e "${BLUE}📦 Installing dependencies...${RESET}"
npm install --silent 2>&1 | grep -E "(added|removed|changed)" || true
echo -e "${GREEN}✅ Dependencies installed${RESET}"
echo ""

# Build
echo -e "${BLUE}🔨 Building...${RESET}"
npm run build --silent
echo -e "${GREEN}✅ Build complete${RESET}"
echo ""

# Run setup
echo -e "${BLUE}⚙️  Running setup...${RESET}"
node dist/setup.js

echo ""
echo -e "${GREEN}${BOLD}✨ Installation complete!${RESET}\n"

# Add to PATH suggestion
SKILLS_BIN="$INSTALL_DIR/skills-agent/dist"
if [[ ":$PATH:" != *":$SKILLS_BIN:"* ]]; then
  echo -e "${YELLOW}💡 Optional: Add CLI to PATH${RESET}"
  echo ""
  
  # Detect shell
  if [ -n "$ZSH_VERSION" ]; then
    SHELL_RC="$HOME/.zshrc"
  elif [ -n "$BASH_VERSION" ]; then
    SHELL_RC="$HOME/.bashrc"
  else
    SHELL_RC="$HOME/.profile"
  fi
  
  echo "   Add this to your $SHELL_RC:"
  echo ""
  echo "   export PATH=\"\$PATH:$SKILLS_BIN\""
  echo ""
  echo "   Then run: source $SHELL_RC"
  echo ""
fi

echo -e "${BLUE}📚 Documentation:${RESET}"
echo "   $INSTALL_DIR/skills-agent/MCP-OPENCODE.md"
echo ""
echo -e "${GREEN}${BOLD}Next steps:${RESET}"
echo "   1. Restart OpenCode (Quit + reopen)"
echo "   2. Run: ${BOLD}opencode mcp list${RESET}"
echo "   3. Start using MCP tools!"
echo ""
echo -e "${YELLOW}To uninstall:${RESET}"
echo "   ${BOLD}bash $INSTALL_DIR/skills-agent/uninstall.sh${RESET}"
echo ""
echo -e "${BLUE}GitHub:${RESET} https://github.com/$REPO"
