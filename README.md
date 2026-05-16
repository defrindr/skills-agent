# Skills Repository

AI agent skills for OpenCode + Skills Agent MCP server.

---

## ⚡ Quick Install

**One-command installation via public installer:**

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent-installer/main/install.sh)
```

**Prerequisites:**
1. Node.js 18+ and npm
2. GitHub CLI: `brew install gh` (or: https://cli.github.com)
3. Authentication: `gh auth login`
4. Repository access (request from owner if needed)

The installer will:
- ✅ Check dependencies and authentication
- ✅ Clone private repository
- ✅ Install & build
- ✅ Link 21 skills to `~/.agents/skills/`
- ✅ Configure OpenCode MCP server

See [skills-agent-installer](https://github.com/defrindr/skills-agent-installer) for full documentation.

### Manual Installation

If you prefer manual steps:

```bash
# Clone with gh CLI (recommended)
gh repo clone defrindr/skills-agent ~/.skills-agent

# Or with SSH
git clone git@github.com:defrindr/skills-agent.git ~/.skills-agent

# Build and setup
cd ~/.skills-agent/skills-agent
npm install && npm run build && npm run setup
```

### Uninstall

```bash
bash ~/.skills-agent/skills-agent/uninstall.sh
```

Removes installation, all 21 skill symlinks, and OpenCode MCP configuration.

---

## 📦 Structure

```
skills/
├── .github/
│   └── workflows/
│       └── release.yml      # Auto-release CI/CD
├── scripts/
│   └── prepare-release.sh   # Local release testing
├── install.sh               # One-command installer (from releases)
├── uninstall.sh             # One-command uninstaller
├── AGENTS.md                # Repository guidelines
└── skills-agent/            # MCP server package
    ├── skills/              # 21 skills (Bahasa Indonesia)
    │   ├── backend/        # Express, FastAPI, Go, Laravel, NestJS
    │   ├── common/         # Core: explorer, architect, initializer, code-health, etc.
    │   ├── frontend/       # General-styling, Next.js, React, Vue/Nuxt/Svelte, Tailwind, Theme-redesign
    │   └── mobile/         # Flutter, React Native
    ├── src/                # MCP server source
    └── dist/               # Compiled
```

---

## 📚 Skills (21 total)

All skills written in **Bahasa Indonesia**:

**Common (8)** - codebase-explorer, code-health, database-designer, database-optimizer, feature-architect, project-initializer, project-readability, token-efficient-coding

**Backend (5)** - expressjs, fastapi, golang, laravel, nestjs readability

**Frontend (6)** - general-styling, nextjs, react, tailwind, theme-redesign, vue/nuxt/svelte readability

**Mobile (2)** - flutter, react-native readability

---

## 🚀 Usage

After install:

```bash
# In OpenCode
use skills-agent_init_project to create a Next.js app

use skills-agent_explore_codebase to analyze this project

use skills-agent_implement_feature to add user auth
```

---

## 🔧 Development

**Clone repository:**

```bash
git clone git@github.com:defrindr/skills-agent.git
cd skills-agent/skills-agent
npm install
npm run build
npm run setup
```

**Create a release:**

```bash
# Test release locally
bash scripts/prepare-release.sh v0.1.0

# Create git tag and push
git tag v0.1.0
git push origin v0.1.0

# GitHub Actions will automatically create the release
```

**Manual release (if needed):**

```bash
gh release create v0.1.0 \
  skills-agent-v0.1.0.tar.gz \
  install.sh \
  uninstall.sh \
  --title "Skills Agent v0.1.0" \
  --notes "See release notes"
```

---

## 📖 Docs

- `skills-agent/README.md` - Full guide
- `skills-agent/MCP-OPENCODE.md` - OpenCode integration
- `skills-agent/QUICKSTART.md` - 5-minute guide

---

**Status:** 🚧 Early development  
**License:** MIT © defrindr
