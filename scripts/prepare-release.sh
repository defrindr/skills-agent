#!/bin/bash

# Local release preparation script
# Usage: bash scripts/prepare-release.sh v0.1.0

set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: bash scripts/prepare-release.sh v0.1.0"
  exit 1
fi

# Validate version format
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in format v0.1.0"
  exit 1
fi

BOLD="\033[1m"
GREEN="\033[32m"
BLUE="\033[34m"
YELLOW="\033[33m"
RESET="\033[0m"

echo -e "${BOLD}${BLUE}📦 Preparing Release: ${VERSION}${RESET}\n"

# 1. Build the package
echo -e "${BLUE}1. Building skills-agent...${RESET}"
cd skills-agent
npm install
npm run build
cd ..
echo -e "${GREEN}✅ Build complete${RESET}\n"

# 2. Create archive
echo -e "${BLUE}2. Creating release archive...${RESET}"
tar -czf skills-agent-${VERSION}.tar.gz \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.github' \
  --exclude='*.log' \
  --exclude='.DS_Store' \
  skills-agent/

echo -e "${GREEN}✅ Archive created: skills-agent-${VERSION}.tar.gz${RESET}"
ls -lh skills-agent-${VERSION}.tar.gz
echo ""

# 3. Verify archive contents
echo -e "${BLUE}3. Verifying archive contents...${RESET}"
echo "First 20 files:"
tar -tzf skills-agent-${VERSION}.tar.gz | head -20
echo "..."
echo ""

# 4. Test extraction
echo -e "${BLUE}4. Testing extraction...${RESET}"
TEST_DIR=$(mktemp -d)
tar -xzf skills-agent-${VERSION}.tar.gz -C "$TEST_DIR"
if [ -d "$TEST_DIR/skills-agent" ]; then
  echo -e "${GREEN}✅ Extraction test passed${RESET}"
  echo "Test directory: $TEST_DIR"
  rm -rf "$TEST_DIR"
else
  echo -e "${RED}❌ Extraction test failed${RESET}"
  exit 1
fi
echo ""

# 5. Summary
echo -e "${GREEN}${BOLD}✨ Release preparation complete!${RESET}\n"
echo -e "${YELLOW}Next steps:${RESET}"
echo "  1. Review the archive: tar -tzf skills-agent-${VERSION}.tar.gz"
echo "  2. Create git tag: git tag ${VERSION}"
echo "  3. Push tag: git push origin ${VERSION}"
echo "  4. GitHub Actions will automatically create the release"
echo ""
echo -e "${BLUE}Or manually create release:${RESET}"
echo "  gh release create ${VERSION} \\"
echo "    skills-agent-${VERSION}.tar.gz \\"
echo "    install.sh \\"
echo "    uninstall.sh \\"
echo "    --title \"Skills Agent ${VERSION}\" \\"
echo "    --notes \"See CHANGELOG for details\""
echo ""
