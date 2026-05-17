# Skills Agent

> Multi-provider AI agent skills system with MCP integration for OpenCode

**Status:** 🚧 Early development - Install via script, npm publish coming soon

---

## ⚡ Quick Install

**One-command installation:**

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent-installer/main/install.sh)
```

**Prerequisites:**
1. Node.js 18+ and npm
2. GitHub CLI: `brew install gh`
3. Authentication: `gh auth login`
4. Repository access

See [skills-agent-installer](https://github.com/defrindr/skills-agent-installer) for detailed setup guide.

### Manual Installation

```bash
gh repo clone defrindr/skills-agent ~/.skills-agent
cd ~/.skills-agent/skills-agent
npm install && npm run build && npm run setup
```

### Check Version

```bash
~/.skills-agent/skills-agent/check-version.sh
```

**Expected output for v0.2.0:**
- 📦 Version: v0.2.0
- 🔧 MCP Tools: 5
- 📚 Skills: 22
- 🎭 Personas: 10

### Update to Latest

```bash
cd ~/.skills-agent/skills-agent
git pull
npm run build
~/.skills-agent/skills-agent/reload-mcp.sh  # Restart MCP server
```

Or via installer (re-run):
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent-installer/main/install.sh)
```

### Uninstall

```bash
bash ~/.skills-agent/skills-agent/uninstall.sh
```

---

## 🚀 Quick Start

### 1. Install

**Latest version:**

```bash
curl -fsSL https://github.com/defrindr/skills-agent/releases/latest/download/install.sh | bash
```

**Specific version:**

```bash
SKILLS_AGENT_VERSION=v0.1.0 curl -fsSL https://github.com/defrindr/skills-agent/releases/latest/download/install.sh | bash
```

You'll see:
```
✨ Installation complete!
  1. Restart OpenCode (Quit + reopen)
  2. Run: opencode mcp list
  3. Start using MCP tools!
```

### 2. Verify

```bash
opencode mcp list
```

Should show:
```
●  ✓ skills-agent connected
```

### 3. Use in OpenCode

```
use skills-agent_init_project to create a new Next.js 15 app
```

---

## 📦 What's Included

### MCP Tools (5)

Exposed via OpenCode MCP:
- `skills-agent_explore_codebase` - Analyze project architecture **(supports personas)**
- `skills-agent_implement_feature` - Implement features with best practices **(supports personas)**
- `skills-agent_init_project` - Initialize new projects with guidance **(supports personas)**
- `skills-agent_load_skill_context` - Load specific skill content **(supports personas)**
- `skills-agent_agent_planner` - Plan project end-to-end: flows + `.opencode/AGENTS.md` + MCP recommendations **(NEW)**

### Personas (10)

Apply different lenses to skills without modifying underlying patterns:

**Core lenses (3):**
- `senior-engineer` (default) - Professional, pragmatic, maintainability-focused
- `red-team` - Security adversarial, vulnerability-focused, exploit paths
- `minimalist` - Terse, code-first, minimal explanations

**Role-based (7) — NEW:**
- `backend-architect` - API contract first, validate at boundary
- `frontend-specialist` - Small components, camelCase boundary, 3 states always
- `mobile-engineer` - List perf, platform parity, SafeArea
- `database-architect` - STOP/ASK/WAIT/VERIFY Database-First Protocol
- `security-auditor` - Risk-prioritized findings (Critical→Low)
- `ux-stylist` - Design tokens, anti-SMK-2016 rules
- `project-planner` - Discovery, flow mapping, MCP decision matrix

See [`skills/personas/README.md`](skills/personas/README.md) for custom personas.

### Skills (21)

All skills in **Bahasa Indonesia**:

**Common (8):**
- `codebase-explorer` - Deep codebase analysis
- `code-health` - Daily performance & security audit (application-level)
- `database-designer` - Database schema design (Prisma, normalization, indexing)
- `database-optimizer` - Query optimization (N+1 fixes, indexing, caching)
- `feature-architect` - Feature implementation patterns
- `project-initializer` - Project setup guidance
- `project-readability` - Master readability guidelines
- `token-efficient-coding` - Token optimization

**Backend (5):**
- `expressjs-readability`, `fastapi-readability`, `golang-readability`, `laravel-readability`, `nestjs-readability`

**Frontend (6):**
- `general-styling`, `nextjs-readability`, `react-readability`, `tailwind-readability`, `theme-redesign`, `vue-nuxt-svelte-readability`

**Mobile (2):**
- `flutter-readability`, `react-native-readability`

---

## 🎯 Features

### Multi-Provider Support
Route tasks to best provider based on complexity:
- **Free tier**: DeepSeek ($0.0014/1K), Groq (FREE)
- **Premium**: Claude Sonnet ($0.003/1K)
- Smart routing: simple → cheap, complex → premium

### Budget Tracking
- Daily limit: $5 (configurable)
- Per-request tracking
- Usage reports

### Token Optimization
- 40-60% reduction target
- Framework-specific patterns
- Boring code preference

### OpenCode Integration
- Auto-detected on install
- Works with native skills AND MCP tools
- No manual configuration

---

## 📚 Usage Examples

### Initialize Project
```
use skills-agent_init_project framework=nextjs name=my-app features=["auth","postgres"]
```

Returns official CLI commands, structure recommendations, setup instructions.

### Explore Codebase (with Persona)
```
# Default: Professional lens
use skills-agent_explore_codebase path=. depth=normal

# Security audit with red-team lens
use skills-agent_explore_codebase path=. depth=deep persona=red-team

# Quick code-only review
use skills-agent_explore_codebase path=. depth=quick persona=minimalist
```

**Red team output:** Vulnerability reports, exploit paths, severity ratings, remediation steps.

### Implement Feature (with Persona)
```
# Default: Professional implementation
use skills-agent_implement_feature path=. description="add user profile page"

# Security-hardened implementation
use skills-agent_implement_feature path=. description="add auth endpoint" persona=red-team

# Minimalist (just code, no explanations)
use skills-agent_implement_feature path=. description="add cache layer" persona=minimalist
```

---

## 🎭 Personas

Personas change **how** skills are applied without modifying the underlying technical patterns.

### Built-in Personas

**`senior-engineer` (default)**
- Professional, pragmatic tone
- Explains "why", not just "what"
- Focus: Maintainability, readability, scale-appropriate architecture
- Output: Clear explanations with before/after examples

**`red-team`**
- Adversarial security analyst mindset
- Assumes breach mentality
- Focus: Vulnerabilities, exploit paths, blast radius
- Output: `🚨 CRITICAL: SQL Injection` with PoC and remediation

**`minimalist`**
- Code-first, minimal prose
- Skip obvious explanations
- Focus: Working code immediately
- Output: Brief code examples with one-line rationale

### Creating Custom Personas

See [`skills/personas/README.md`](skills/personas/README.md) for:
- Persona file structure
- YAML schema reference
- Custom persona examples
- Best practices

**Example use cases:**
- `startup-cto` - Pragmatic decisions, tech debt focus, MVP vs scale
- `accessibility-auditor` - WCAG compliance, screen reader support
- `performance-engineer` - Bottleneck analysis, optimization strategies
- `beginner-mentor` - Educational, step-by-step, explain fundamentals

---

## ⚙️ Configuration

### Installation Location
- Installed at: `~/.skills-agent/`
- Skills linked to: `~/.agents/skills/`
- OpenCode config: `~/.config/opencode/opencode.json`

### Provider Setup (Optional)

Add API keys to `~/.skills-agent/skills-agent/.env`:
```bash
# Pick at least one:
DEEPSEEK_API_KEY=sk-xxx      # Recommended (cheap & fast)
GROQ_API_KEY=gsk-xxx         # Free (rate-limited)
ANTHROPIC_API_KEY=sk-ant-xxx # Premium
```

If no keys provided, uses OpenCode's configured provider.

---

## 🔧 Manual Setup

If you prefer manual installation:

```bash
# Clone repo
git clone https://github.com/defrindr/skills-agent.git ~/.skills-agent

# Navigate to package
cd ~/.skills-agent/skills-agent

# Install & build
npm install
npm run build

# Run setup
npm run setup
```

---

## 🐛 Troubleshooting

### Re-run Setup

```bash
cd ~/.skills-agent/skills-agent
npm run setup
```

### Check Logs

```bash
tail -f ~/.skills-agent/skills-agent/mcp.log
```

### Verify OpenCode Config

```bash
cat ~/.config/opencode/opencode.json
```

Should have:
```json
{
  "mcp": {
    "skills-agent": {
      "type": "local",
      "enabled": true
    }
  }
}
```

### Uninstall / Clean Reinstall

**Use the bundled uninstall script:**
```bash
bash ~/.skills-agent/skills-agent/uninstall.sh
```

**Manual removal (if script not available):**
```bash
# Remove installation
rm -rf ~/.skills-agent

# Remove skill symlinks (21 skills)
rm -rf ~/.agents/skills/codebase-explorer
rm -rf ~/.agents/skills/code-health
rm -rf ~/.agents/skills/database-*
rm -rf ~/.agents/skills/*-readability
# ... (or remove individually)

# Remove from OpenCode config
# Edit ~/.config/opencode/opencode.json
# Delete "skills-agent" entry from "mcpServers"
```

**To reinstall after uninstall:**
```bash
curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash
```

---

## 📖 Documentation

After install, docs are at:
- `~/.skills-agent/skills-agent/MCP-OPENCODE.md` - Full usage guide
- `~/.skills-agent/skills-agent/QUICKSTART.md` - 5-minute guide

---

## 🤝 Contributing

This is early development. Contributions welcome!

1. Fork repo
2. Make changes
3. Test locally: `npm run build && npm run setup`
4. Submit PR

---

## 🎯 Philosophy

### Boring Code
Predictable over clever. Skills enforce:
- Flat structure over deep nesting
- Standard names over creative ones
- Explicit over implicit

### Token Efficiency
Optimize LLM context without sacrificing readability:
- Remove boilerplate
- Use shorter but clear names
- Flatten structures

### Multi-Provider
No vendor lock-in. Smart routing:
- Prototyping → free/cheap
- Production → premium
- Complex → best available

---

## 📄 License

MIT © defrindr

---

## 🔗 Links

- **GitHub**: https://github.com/defrindr/skills-agent
- **Issues**: https://github.com/defrindr/skills-agent/issues
- **OpenCode**: https://opencode.ai

---

**Made with ❤️ for the Indonesian dev community**

**npm package coming soon** - Currently install via script for easier iteration
