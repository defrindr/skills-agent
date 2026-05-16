#!/bin/bash

# Skills Agent Installer (GitHub Release)
# Usage: curl -fsSL https://github.com/defrindr/skills-agent/releases/latest/download/install.sh | bash

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
command -v tar >/dev/null 2>&1 || { echo -e "${RED}❌ tar required.${RESET}"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e "${RED}❌ curl required.${RESET}"; exit 1; }

echo -e "${GREEN}✅ Node.js $(node --version)${RESET}"
echo -e "${GREEN}✅ npm $(npm --version)${RESET}"
echo ""

# Detect version to install
if [ -n "$SKILLS_AGENT_VERSION" ]; then
  VERSION="$SKILLS_AGENT_VERSION"
  echo -e "${BLUE}Installing specific version: ${VERSION}${RESET}"
else
  echo -e "${BLUE}Fetching latest release...${RESET}"
  VERSION=$(curl -fsSL https://api.github.com/repos/$REPO/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
  
  if [ -z "$VERSION" ]; then
    echo -e "${RED}❌ Failed to fetch latest release. Check your internet connection.${RESET}"
    exit 1
  fi
  
  echo -e "${GREEN}✅ Latest version: ${VERSION}${RESET}"
fi
echo ""

# Remove old installation if exists
if [ -d "$INSTALL_DIR" ]; then
  echo -e "${YELLOW}⚠️  Existing installation found at $INSTALL_DIR${RESET}"
  echo -e "${YELLOW}   Removing old installation...${RESET}"
  rm -rf "$INSTALL_DIR"
fi

# Create installation directory
mkdir -p "$INSTALL_DIR"

# Download release archive
echo -e "${BLUE}📦 Downloading skills-agent ${VERSION}...${RESET}"
ARCHIVE_URL="https://github.com/$REPO/releases/download/${VERSION}/skills-agent-${VERSION}.tar.gz"

if ! curl -fsSL -o "$INSTALL_DIR/skills-agent.tar.gz" "$ARCHIVE_URL"; then
  echo -e "${RED}❌ Failed to download release archive.${RESET}"
  echo -e "${YELLOW}URL: $ARCHIVE_URL${RESET}"
  echo ""
  echo -e "${YELLOW}Possible solutions:${RESET}"
  echo "  1. Check if release $VERSION exists: https://github.com/$REPO/releases"
  echo "  2. Try specific version: SKILLS_AGENT_VERSION=v0.1.0 bash install.sh"
  echo "  3. Check internet connection"
  rm -rf "$INSTALL_DIR"
  exit 1
fi

echo -e "${GREEN}✅ Downloaded successfully${RESET}"
echo ""

# Extract archive
echo -e "${BLUE}📦 Extracting archive...${RESET}"
cd "$INSTALL_DIR"
tar -xzf skills-agent.tar.gz
rm skills-agent.tar.gz

if [ ! -d "$INSTALL_DIR/skills-agent" ]; then
  echo -e "${RED}❌ Extraction failed. Archive structure unexpected.${RESET}"
  exit 1
fi

echo -e "${GREEN}✅ Extracted successfully${RESET}"
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
echo -e "${BLUE}Version installed:${RESET} ${VERSION}"
echo -e "${BLUE}GitHub:${RESET} https://github.com/$REPO"
