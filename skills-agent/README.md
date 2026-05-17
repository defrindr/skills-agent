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

**Post-install (optional):**
Install OpenCode agents for conversational access:
```bash
# Global (all projects)
cp ~/.skills-agent/skills-agent/opencode-agents/*.md ~/.config/opencode/agents/

# Per-project
mkdir -p .opencode/agents
cp ~/.skills-agent/skills-agent/opencode-agents/*.md .opencode/agents/
```

Then restart OpenCode to load agents.

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
- 🤖 OpenCode Agents: 10 (if installed)

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

### OpenCode Agents (10) — NEW

Conversational agents with pre-loaded skills:
- `@backend-architect`, `@frontend-specialist`, `@mobile-engineer`, `@project-planner`
- `@database-architect`, `@security-auditor`, `@ux-stylist`
- `@senior-engineer`, `@red-team`, `@minimalist`

See [Hybrid Approach](#-hybrid-approach-mcp-tools--opencode-agents) for usage patterns.

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

## 🔀 Hybrid Approach: MCP Tools + OpenCode Agents

Skills Agent provides **two ways** to access the same underlying skills:

### 1. MCP Tools (Programmatic)
Direct function calls with explicit parameters:
```
use skills-agent_implement_feature path=. description="add user login"
```

**Best for:**
- Automation workflows
- Explicit control over parameters
- Integration with other MCP tools
- Scripts and batch operations

### 2. OpenCode Agents (Conversational)
Natural language interaction with loaded skill context:
```
@backend-architect implement user login with JWT
```

**Best for:**
- Interactive development
- Role-specific guidance
- Complex multi-step tasks
- Code reviews and discussions

### OpenCode Agents (10)

Specialized agents with pre-loaded skills and persona:

**Architecture & Planning:**
- `@backend-architect` - API-first, validation at boundaries, domain-driven design
- `@frontend-specialist` - Component patterns, state management, UI/UX best practices
- `@mobile-engineer` - Platform parity, performance optimization, native patterns
- `@project-planner` - Discovery, flow mapping, MCP recommendations, sprint planning

**Technical Specialists:**
- `@database-architect` - Schema design, query optimization, migration strategies (read-only mode)
- `@security-auditor` - Threat modeling, vulnerability assessment, compliance (read-only mode)
- `@ux-stylist` - Design systems, tokens, accessibility, professional styling

**Code Quality:**
- `@senior-engineer` - Maintainability, readability, pragmatic architecture (default persona)
- `@red-team` - Adversarial security testing, exploit paths, hardening (read-only mode)
- `@minimalist` - Terse, code-first, no explanations, maximum speed

### Installing OpenCode Agents

**Global installation** (available in all projects):
```bash
cp ~/.skills-agent/skills-agent/opencode-agents/*.md ~/.config/opencode/agents/
```

**Per-project installation** (project-specific):
```bash
mkdir -p .opencode/agents
cp ~/.skills-agent/skills-agent/opencode-agents/*.md .opencode/agents/
```

**Restart OpenCode** to load agents:
```
Quit OpenCode → Reopen
```

See [`opencode-agents/README.md`](opencode-agents/README.md) for detailed usage.

### When to Use Which?

| Scenario | Use MCP Tool | Use OpenCode Agent |
|----------|--------------|-------------------|
| Initialize new project | `skills-agent_init_project` | `@project-planner` |
| Explore unfamiliar codebase | `skills-agent_explore_codebase` | `@senior-engineer explore this codebase` |
| Implement specific feature | `skills-agent_implement_feature` | `@backend-architect add user auth` |
| Security review | `skills-agent_explore_codebase persona=red-team` | `@security-auditor review security` |
| Database schema design | `skills-agent_load_skill_context framework=database-designer` | `@database-architect design schema for...` |
| UI styling review | `skills-agent_load_skill_context framework=general-styling` | `@ux-stylist review this component` |
| Quick code generation | `skills-agent_implement_feature persona=minimalist` | `@minimalist add cache layer` |

### Agent Delegation

Agents can invoke other agents or MCP tools:

```
@backend-architect implement user login

Agent internally:
1. Loads project-readability + expressjs-readability skills
2. Asks @database-architect to review schema changes
3. Invokes skills-agent_implement_feature for structured implementation
4. Returns complete implementation with best practices
```

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

## ⚡ Performance & Reliability

### Intelligent Caching Layer

Skills Agent implements multi-level LRU caching with automatic invalidation:

**Skill Cache:**
- TTL: 1 hour (3600s)
- Max size: 50 entries
- Invalidation: File hash-based (MD5 content comparison)
- Benefits: 40-60% faster skill loading on repeated access

**Framework Detection Cache:**
- TTL: 5 minutes (300s)
- Max size: 20 entries
- Invalidation: `package.json` hash-based (auto-invalidates on dependency changes)
- Benefits: Instant framework detection on repeated calls

**Persona Cache:**
- TTL: 30 minutes (1800s)
- Max size: 30 entries
- Invalidation: File hash-based
- Benefits: Faster persona loading for multi-step workflows

**Cache Metrics:**
```bash
# View cache performance
npm run cache:stats  # Coming soon

# Clear cache manually
npm run cache:clear  # Coming soon
```

**LRU Eviction Strategy:**
- Least recently accessed entries evicted when at capacity
- Recent access moves entry to end of queue
- Tracks hit/miss ratio for performance monitoring

### Provider Fallback & Retry

Automatic failover ensures reliability across providers:

**Error Classification:**
- **Retryable:** Rate limit, timeout, 5xx errors, quota exceeded
- **Fatal:** Auth errors, 400 bad request, context length exceeded

**Retry Strategy:**
- Max retries: 2 (configurable)
- Exponential backoff: 1s → 2s → 4s → 8s (max 10s)
- Silent fallback: Auto-retry with different provider
- Same tier preference: Free → Free, Premium → Premium before cross-tier fallback

**Timeout Handling:**
- Default timeout: 30s per request
- Configurable per provider tier
- Wraps provider execution with `Promise.race`

**Execution Metadata:**
All provider calls include attempt tracking:
```typescript
{
  result: "...",
  metadata: {
    attempts: [
      { provider: "deepseek", status: "rate_limit", latency: 1234 },
      { provider: "groq", status: "success", latency: 892 }
    ],
    total_latency: 2126,
    fatal: false
  }
}
```

**Logging:**
- Retries logged as warnings (not visible to user)
- Fatal errors logged with full context
- Performance metrics tracked per provider

**Configuration:**
```bash
# .env
MAX_RETRIES=2
REQUEST_TIMEOUT=30000
FALLBACK_SAME_TIER_FIRST=true
```

### Testing & Quality

**Test Coverage:**
- Target: 80%+ coverage
- Framework: Vitest (native ESM support)
- CI: GitHub Actions on push/PR (Node 18/20)

**Test Suites:**
- Unit tests: 52 passing (SkillManager, FrameworkDetector, Cache, Errors)
- Integration tests: Coming in v0.3.1
- E2E tests: Coming in v0.4.0

**Run Tests:**
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
```

**CI Workflow:**
- Runs on: `push` to main/develop, `pull_request`
- Matrix: Node 18.x, 20.x
- Steps: Build → Test → Coverage check
- Codecov integration (optional)

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
