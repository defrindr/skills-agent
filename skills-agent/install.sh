#!/bin/bash

# Skills Agent Installation Script
# Quick one-liner: curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash

set -e

echo "🚀 Installing Skills Agent..."
echo ""

# Detect OS
OS="$(uname -s)"
case "${OS}" in
    Linux*)     PLATFORM=linux;;
    Darwin*)    PLATFORM=macos;;
    *)          PLATFORM="unknown"
esac

if [ "$PLATFORM" = "unknown" ]; then
    echo "❌ Unsupported platform: ${OS}"
    exit 1
fi

echo "✅ Platform detected: $PLATFORM"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+ first."
    echo "   Download from: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required (found: $(node -v))"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Installation directory
INSTALL_DIR="${HOME}/.skills-agent"

echo ""
echo "📦 Installing to: $INSTALL_DIR"

# Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    echo "⚠️  Skills Agent already installed. Updating..."
    cd "$INSTALL_DIR/skills-agent"
    git pull origin main
else
    echo "📥 Cloning repository..."
    mkdir -p "$INSTALL_DIR"
    cd "$INSTALL_DIR"
    git clone https://github.com/defrindr/skills.git .
fi

# Install dependencies
echo "📦 Installing dependencies..."
cd "$INSTALL_DIR/skills-agent"
npm install

# Build project
echo "🔨 Building project..."
npm run build

# Link binary globally (optional)
if command -v npm &> /dev/null; then
    echo "🔗 Linking global command..."
    npm link 2>/dev/null || echo "⚠️  Global link failed (may need sudo)"
fi

echo ""
echo "✅ Installation complete!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run setup wizard:"
echo "      skills-agent setup"
echo ""
echo "   2. Or configure manually:"
echo "      - Get API keys (DeepSeek: https://platform.deepseek.com)"
echo "      - Create ~/.skills-agent/config.yaml"
echo ""
echo "   3. Test with:"
echo "      skills-agent list-skills"
echo ""
echo "📚 Documentation: $INSTALL_DIR/skills-agent/README.md"
echo ""
