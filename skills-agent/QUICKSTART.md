# Skills Agent - Quickstart

Get started dengan Skills Agent dalam 5 menit!

## ⚡ Quick Setup

### 1. Install
```bash
cd skills/skills-agent
npm install
npm run build
```

### 2. Configure API Keys
```bash
cp .env.example .env
# Edit .env, tambahkan minimal 1 API key:
# DEEPSEEK_API_KEY=sk-xxxxx (free, recommended)
# atau GROQ_API_KEY=gsk_xxxxx (free, super fast)
```

### 3. Test
```bash
node dist/cli.js list-skills
node dist/cli.js list-providers
```

### 4. Configure OpenCode

Create `~/.opencode/mcp-config.json`:

```json
{
  "mcpServers": {
    "skills-agent": {
      "command": "node",
      "args": ["/ABSOLUTE/PATH/TO/skills-agent/dist/index.js"],
      "env": {
        "SKILLS_DIR": "/ABSOLUTE/PATH/TO/skills",
        "DEEPSEEK_API_KEY": "your_key_here"
      }
    }
  }
}
```

Replace `/ABSOLUTE/PATH/TO` dengan actual path dari `pwd`.

### 5. Restart OpenCode & Try

```
@copilot explore this codebase
@copilot implement dark mode toggle
```

## 🎯 Core Concepts

### Skills
Pre-defined expertise yang AI agent bisa load on-demand:

- **codebase-explorer** - Understand project structure (Complex, uses Claude)
- **feature-architect** - Design & implement features (Medium, uses DeepSeek)
- **token-efficient-coding** - Write concise code (Simple, uses DeepSeek)

Plus 11 framework-specific skills (auto-loaded).

### Providers
LLM backends dengan different tiers:

**Free Tier (Recommended for MVP):**
- DeepSeek - $0.0014/1K, code-focused
- Groq (Mixtral/Llama) - FREE, super fast

**Premium Tier:**
- Claude Sonnet 4 - $0.003/1K, best quality

### Configuration
Priority order:
1. Runtime override (`provider: "claude-sonnet"`)
2. Skill-specific config (`~/.skills-agent/config.yaml`)
3. Global default (`default_tier: free`)

### Budget Tracking
```bash
node dist/cli.js budget
```

Enforces daily limits, warns when approaching threshold.

## 🚀 Usage Examples

### Explore Codebase
```
@copilot explore this codebase in detail
```

**What happens:**
1. Detects framework (e.g., Next.js)
2. Loads skills: codebase-explorer + nextjs-readability + project-readability
3. Uses Claude (premium) - complex analysis
4. Returns: structure, patterns, issues, recommendations

### Implement Feature
```
@copilot implement user profile editing with avatar upload
```

**What happens:**
1. Loads skills: feature-architect + token-efficient-coding + framework skill
2. Uses DeepSeek (free) - good for features
3. Plans architecture
4. Generates code
5. Returns: files to create/modify, implementation

### Override Provider
```
@copilot explore codebase using groq for speed
```

Forces Groq (fast but lower quality than Claude).

## 🔧 Configuration Examples

### Free-Only Mode
```yaml
# ~/.skills-agent/config.yaml
global:
  default_tier: free

providers:
  deepseek:
    enabled: true
  groq-mixtral:
    enabled: true
  claude-sonnet:
    enabled: false  # Disable premium
```

### Speed-Optimized
```yaml
global:
  prefer_speed: true

skill_overrides:
  feature-architect:
    providers:
      - groq-mixtral  # Fastest free option
```

### Quality-Optimized (Expensive)
```yaml
global:
  default_tier: premium

skill_overrides:
  feature-architect:
    force_provider: claude-sonnet
  codebase-explorer:
    force_provider: claude-sonnet
```

## 📊 Monitoring

### Check Usage
```bash
node dist/cli.js budget
```

Shows:
- Total spent (last 7 days)
- By provider breakdown
- By skill breakdown
- Today's usage

### Track Costs
Each tool call output includes:
```
Provider: deepseek (free)
Tokens: 8,430
Cost: $0.0118
```

## 🐛 Common Issues

### "Skills not found"
**Fix:** Check `SKILLS_DIR` in MCP config points to `/path/to/skills` (not `skills-agent`).

### "Provider API key missing"
**Fix:** Add to `.env`:
```
DEEPSEEK_API_KEY=sk-xxxxx
```
Or in MCP config `env` section.

### "Budget exceeded"
**Fix:** 
- Wait until tomorrow (resets daily)
- Or increase: `budget.daily_limit: 10.00`

### "No response from provider"
**Fix:**
- Check provider status
- Enable auto fallback: `global.auto_fallback: true`
- Try different provider

## 📚 Learn More

- **Full docs:** `README.md`
- **Setup guide:** `examples/opencode-setup.md`
- **Skill content:** `common/*/SKILL.md`

## 💡 Tips

1. **Start free** - DeepSeek + Groq cover 90% of use cases
2. **Use Claude for complex** - Architecture, exploration, refactoring
3. **Monitor usage** - Check `budget` weekly
4. **Fallback enabled** - Prevents failures when provider down
5. **Framework skills auto-load** - Just use the tools, context handled automatically

## 🎯 Next Steps

1. Try exploring your own project
2. Implement a small feature
3. Check cost in budget report
4. Adjust config based on usage patterns
5. Read skill content to understand capabilities

Happy coding! 🚀
