#!/bin/bash
# Update Skills Agent to latest version

INSTALL_DIR="$HOME/.skills-agent/skills-agent"
REPO_URL="https://github.com/defrindr/skills-agent.git"
TMP_DIR="/tmp/skills-agent-update-$$"

echo "🔄 Updating Skills Agent..."
echo ""

# Clone latest to temp
git clone --depth 1 "$REPO_URL" "$TMP_DIR" || {
  echo "❌ Failed to clone repository"
  exit 1
}

# Backup current config
if [ -f "$INSTALL_DIR/config/config.yaml" ]; then
  cp "$INSTALL_DIR/config/config.yaml" /tmp/skills-agent-config-backup.yaml
  echo "💾 Backed up config"
fi

# Sync files (preserve config)
# Note: repo has skills-agent/ subdirectory, sync that instead of root
rsync -av --delete \
  --exclude='config/config.yaml' \
  --exclude='node_modules' \
  --exclude='.git' \
  "$TMP_DIR/skills-agent/" "$INSTALL_DIR/"

cd "$INSTALL_DIR"
npm install --silent
npm run build

# Restore config if needed
if [ -f /tmp/skills-agent-config-backup.yaml ]; then
  mv /tmp/skills-agent-config-backup.yaml "$INSTALL_DIR/config/config.yaml"
fi

# Cleanup
rm -rf "$TMP_DIR"

echo ""
echo "✅ Updated to:"
node -e "console.log('   Version:', require('./package.json').version)"

# Restart MCP
if [ -f "$INSTALL_DIR/reload-mcp.sh" ]; then
  bash "$INSTALL_DIR/reload-mcp.sh"
fi

echo ""
echo "💡 Verify: $INSTALL_DIR/check-version.sh"
