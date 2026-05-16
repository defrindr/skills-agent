# Skills Agent

Multi-provider AI agent skills system dengan MCP integration untuk OpenCode.

## 🎯 Features

- ✅ **Multi-Provider Support** - DeepSeek, Groq, Claude, OpenRouter, dan custom providers
- ✅ **MCP Integration** - Seamless integration dengan OpenCode/Copilot
- ✅ **Flexible Configuration** - YAML + ENV vars, per-skill overrides, budget controls
- ✅ **Auto Fallback** - Automatic fallback kalau provider down
- ✅ **Budget Tracking** - Track usage, cost, enforce daily limits
- ✅ **Framework Detection** - Auto-detect Next.js, NestJS, React, dll
- ✅ **Skill System** - Modular, extensible skill definitions

## 📦 Installation

```bash
cd skills-agent
npm install
npm run build
```

## ⚙️ Configuration

### 1. Setup Environment Variables

Copy `.env.example` ke `.env` dan isi API keys:

```bash
cp .env.example .env
```

```env
# Provider API Keys
DEEPSEEK_API_KEY=your_key_here
GROQ_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
```

### 2. Configure Providers

Create `~/.skills-agent/config.yaml`:

```yaml
# Global Settings
global:
  default_tier: free
  auto_fallback: true
  max_cost_per_task: 0.50

# Provider Configuration
providers:
  deepseek:
    enabled: true
  groq-mixtral:
    enabled: true
  claude-sonnet:
    enabled: true

# Budget
budget:
  daily_limit: 5.00
  track_usage: true
```

Atau gunakan default config di `config/default-config.yaml`.

## 🔌 OpenCode Integration

### Setup MCP Server

1. Create OpenCode MCP config:

```bash
mkdir -p ~/.opencode
```

Create `~/.opencode/mcp-config.json`:

```json
{
  "mcpServers": {
    "skills-agent": {
      "command": "node",
      "args": ["/path/to/skills-agent/dist/index.js"],
      "env": {
        "SKILLS_DIR": "/path/to/skills"
      }
    }
  }
}
```

2. Restart OpenCode

3. Skills agent tools akan available di Copilot/ChatGPT agent

### Available Tools

#### `explore_codebase`
Map dan analyze codebase - framework detection, architecture patterns, code flow.

```typescript
// Di OpenCode dengan Copilot
> @copilot explore this codebase

// Behind the scenes:
explore_codebase({
  path: "/current/project",
  depth: "normal"
})
```

#### `implement_feature`
Implement new features dengan architectural thinking.

```typescript
> @copilot implement user authentication with NextAuth

implement_feature({
  description: "user authentication with NextAuth",
  path: "/current/project"
})
```

#### `load_skill_context`
Load specific skills into conversation context.

```typescript
load_skill_context({
  skills: ["token-efficient-coding"],
  framework: "nextjs"
})
```

## 🎓 Skills

### Core Skills (MVP)

| Skill | Purpose | Complexity | Default Provider |
|-------|---------|-----------|------------------|
| `codebase-explorer` | Map & analyze codebase | Complex | Claude (premium) |
| `feature-architect` | Design & implement features | Medium | DeepSeek (free) |
| `token-efficient-coding` | Write concise, clear code | Simple | DeepSeek (free) |

### Framework Skills (Auto-loaded)

Automatically loaded when framework detected:

- `nextjs-readability` - Next.js patterns
- `nestjs-readability` - NestJS patterns
- `react-readability` - React patterns
- `expressjs-readability` - Express patterns
- `fastapi-readability` - FastAPI patterns
- `laravel-readability` - Laravel patterns
- `golang-readability` - Go patterns
- `flutter-readability` - Flutter patterns
- `react-native-readability` - React Native patterns

### Master Skill

- `project-readability` - **Always referenced** untuk naming, structure, error handling rules

## 💰 Provider Configuration

### Free Tier (Default)
- **DeepSeek** - Code-focused, fast, $0.0014/1K tokens
- **Groq (Mixtral)** - Super fast, FREE
- **Groq (Llama3)** - Fast, FREE
- **BigPickel (OpenRouter)** - Claude 3.5 Haiku via OpenRouter, FREE

### Premium Tier
- **Claude Sonnet 4** - Best quality, $0.003/1K input
- **GPT-4 Turbo** - OpenAI premium, $0.01/1K input

### Override Provider

**Global override:**
```yaml
# ~/.skills-agent/config.yaml
global:
  default_tier: premium
```

**Per-skill override:**
```yaml
skill_overrides:
  codebase-explorer:
    force_provider: claude-sonnet
```

**Runtime override:**
```typescript
explore_codebase({
  path: "/project",
  provider: "claude-sonnet"  // Override
})
```

### Fallback Chain

Kalau provider fails, auto fallback:
```
Primary Provider (deepseek)
  ↓ FAIL
Fallback 1 (groq-mixtral)
  ↓ FAIL
Fallback 2 (claude-sonnet)
  ↓ SUCCESS
```

## 📊 Budget Tracking

### View Usage

```bash
npm run cli budget
```

Output:
```
💰 Budget Summary (Last 7 days):

  Total Spent: $0.1234
  Total Tokens: 45,678

  By Provider:
    deepseek: $0.0800
    claude-sonnet: $0.0434

  By Skill:
    feature-architect: $0.0800
    codebase-explorer: $0.0434

  Today: $0.0234
```

### Set Limits

```yaml
# ~/.skills-agent/config.yaml
budget:
  daily_limit: 5.00
  warn_threshold: 4.00
  track_usage: true
```

Budget enforcement:
- Warns ketika approaching limit
- Blocks requests kalau exceed limit
- Resets setiap hari

## 🧪 Testing

### List Available Skills

```bash
npm run cli list-skills
```

### List Enabled Providers

```bash
npm run cli list-providers
```

### Start MCP Server Manually

```bash
npm run cli mcp
```

### Test dengan OpenCode

1. Open project di OpenCode
2. Use Copilot agent
3. Try commands:
   ```
   @copilot explore this codebase
   @copilot implement dark mode toggle
   ```

## 🏗️ Project Structure

```
skills-agent/
├── src/
│   ├── mcp/              # MCP server & tools
│   ├── skills/           # Skill management
│   ├── providers/        # Provider implementations
│   ├── budget/           # Usage tracking
│   ├── utils/            # Config, logging, framework detection
│   └── types/            # TypeScript types
├── config/
│   └── default-config.yaml
└── package.json
```

## 🔧 Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Add New Provider

1. Add to `config/default-config.yaml`:
```yaml
providers:
  new-provider:
    enabled: true
    tier: free
    endpoint: https://api.new.com
    model: their-model
    max_tokens: 8000
```

2. Add env var mapping in `src/utils/config.ts`:
```typescript
const envKeyMap = {
  'new-provider': 'NEW_PROVIDER_API_KEY',
  // ...
}
```

3. Test:
```bash
export NEW_PROVIDER_API_KEY=your_key
npm run cli list-providers
```

### Add New Skill

1. Create `common/your-skill/SKILL.md`:
```markdown
---
name: your-skill
description: >
  Skill description dengan trigger keywords

default_provider: deepseek
complexity: medium
---

# Your Skill

Content here...
```

2. Reload skills:
```bash
npm run cli list-skills
```

## 📝 Usage Examples

### Example 1: Explore Codebase

```typescript
// User in OpenCode
> @copilot I'm new to this project, help me understand it

// Copilot calls:
explore_codebase({
  path: "/current/project",
  depth: "normal"
})

// Skills agent:
// 1. Detects Next.js
// 2. Loads: codebase-explorer + nextjs-readability + project-readability
// 3. Provider: claude-sonnet (complex task)
// 4. Returns detailed analysis

// Copilot presents result to user with:
// - Framework & tech stack
// - Folder structure
// - Data flow
// - Recommendations
```

### Example 2: Implement Feature

```typescript
> @copilot add user profile editing with avatar upload

// Copilot calls:
implement_feature({
  description: "user profile editing with avatar upload",
  path: "/current/project",
  framework: "nextjs"  // Already detected
})

// Skills agent:
// 1. Loads: feature-architect + nextjs-readability + token-efficient-coding
// 2. Provider: deepseek (free, good for features)
// 3. Plans architecture
// 4. Generates code

// Copilot implements:
// - Server Actions
// - Form component
// - Image upload logic
// - Validation schemas
```

### Example 3: Budget Control

```typescript
> @copilot do comprehensive security audit

// Skills agent checks budget:
// Daily limit: $5.00
// Current: $4.90
// Estimated: $0.30

⚠️ Budget Warning: Would exceed daily limit

Options:
1. Use free tier (may be slower)
2. Wait until tomorrow
3. Override budget limit

User: Use free tier

// Proceeds with deepseek instead of claude
```

## 🐛 Troubleshooting

### "No skills loaded"

Check `SKILLS_DIR` env var:
```bash
export SKILLS_DIR=/path/to/skills
npm run cli list-skills
```

### "Provider API key missing"

Check `.env` file:
```bash
cat .env | grep API_KEY
```

Add missing keys:
```bash
echo "DEEPSEEK_API_KEY=your_key" >> .env
```

### "Budget limit exceeded"

Reset daily usage atau increase limit:
```yaml
budget:
  daily_limit: 10.00  # Increase
```

Or wait until next day (resets automatically).

### MCP Server not connecting

Check OpenCode config:
```bash
cat ~/.opencode/mcp-config.json
```

Verify paths are absolute and correct.

## 🚀 Roadmap

### MVP (Current)
- [x] MCP server integration
- [x] 3 core skills
- [x] Multi-provider support (DeepSeek, Groq, Claude)
- [x] Basic budget tracking
- [x] Framework detection

### Phase 2 (Next)
- [ ] Add 5 more skills (refactor, optimize, upgrade, review, context-aware)
- [ ] Advanced fallback strategies
- [ ] Caching system
- [ ] Parallel operations
- [ ] More providers (Qwen, Minimax, Gemini)

### Phase 3 (Future)
- [ ] Web UI for configuration
- [ ] Analytics dashboard
- [ ] Skill marketplace
- [ ] Custom skill templates
- [ ] Team collaboration features

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repo
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit PR

## 💬 Support

- Issues: [GitHub Issues](https://github.com/defrindr/skills-agent/issues)
- Docs: This README + skill content
- Examples: `examples/` directory
