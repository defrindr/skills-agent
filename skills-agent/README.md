# Skills Agent

> Multi-provider AI agent skills system with MCP integration for OpenCode

**Status:** 🚧 Early development - Install via script, npm publish coming soon

---

## ⚡ Quick Install

```bash
curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash
```

Auto-configures:
- ✅ Clones repo to `~/.skills-agent`
- ✅ Builds & installs dependencies
- ✅ Links 15 skills to `~/.agents/skills/`
- ✅ Configures OpenCode MCP server
- ✅ Ready to use!

---

## 🚀 Quick Start

### 1. Install

```bash
curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent/main/install.sh | bash
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

### MCP Tools (4)

Exposed via OpenCode MCP:
- `skills-agent_explore_codebase` - Analyze project architecture
- `skills-agent_implement_feature` - Implement features with best practices
- `skills-agent_init_project` - Initialize new projects with guidance
- `skills-agent_load_skill_context` - Load specific skill content

### Skills (15)

All skills in **Bahasa Indonesia**:

**Core (5):**
- `codebase-explorer` - Deep codebase analysis
- `feature-architect` - Feature implementation patterns
- `project-initializer` - Project setup guidance
- `project-readability` - Master readability guidelines
- `token-efficient-coding` - Token optimization

**Backend (5):**
- `expressjs-readability`, `fastapi-readability`, `golang-readability`, `laravel-readability`, `nestjs-readability`

**Frontend (3):**
- `nextjs-readability`, `react-readability`, `vue-nuxt-svelte-readability`

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

### Explore Codebase
```
use skills-agent_explore_codebase path=. focus=api-endpoints
```

Returns architecture map, code patterns, recommendations.

### Implement Feature
```
use skills-agent_implement_feature path=. description="add user profile page"
```

Returns implementation plan, code changes, test suggestions.

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

### Uninstall

```bash
rm -rf ~/.skills-agent
# Manually remove from ~/.config/opencode/opencode.json
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
