# Skills Repository

AI agent skills for OpenCode + Skills Agent MCP server.

---

## ⚡ Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash
```

Auto-configures everything. Restart OpenCode after install.

---

## 📦 Structure

```
skills/
├── install.sh               # One-command installer
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

```bash
git clone https://github.com/defrindr/skills-agent.git
cd skills-agent/skills-agent
npm install
npm run build
npm run setup
```

---

## 📖 Docs

- `skills-agent/README.md` - Full guide
- `skills-agent/MCP-OPENCODE.md` - OpenCode integration
- `skills-agent/QUICKSTART.md` - 5-minute guide

---

**Status:** 🚧 Early development  
**License:** MIT © defrindr
