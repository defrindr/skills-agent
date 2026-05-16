# ✅ Skills-Agent MCP Server - OpenCode Integration

## Status: WORKING! 🎉

MCP server berhasil connected ke OpenCode!

---

## 🔧 Configuration

### OpenCode Config
Location: `~/.config/opencode/opencode.json`

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "skills-agent": {
      "type": "local",
      "command": [
        "/Users/defrindr/.nvm/versions/node/v22.19.0/bin/node",
        "/Applications/projects/me/skills/skills-agent/dist/index.js"
      ],
      "environment": {
        "SKILLS_DIR": "/Applications/projects/me/skills"
      },
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

---

## 🚀 Available MCP Tools (4 total)

Skills-agent exposes 4 tools to OpenCode via MCP:

### 1. `skills-agent_explore_codebase`
Analyze codebase architecture and patterns.

**Usage in OpenCode:**
```
use skills-agent_explore_codebase to analyze this project structure
```

**Input:**
- `path`: project directory
- `focus`: what to explore (api-endpoints, database-schema, components, etc.)

**Output:**
- Architecture map
- Code patterns found
- Recommendations

---

### 2. `skills-agent_implement_feature`
Implement features following best practices from skills.

**Usage in OpenCode:**
```
use skills-agent_implement_feature to add user profile page
```

**Input:**
- `path`: project directory
- `description`: feature description
- `files`: optional list of files to modify

**Output:**
- Implementation plan
- Code changes
- Tests to add

---

### 3. `skills-agent_init_project`
Initialize new projects with framework-specific guidance.

**Usage in OpenCode:**
```
use skills-agent_init_project to create a new nextjs app with auth
```

**Input:**
- `framework`: nextjs, nestjs, react, vue, express, laravel, fastapi, golang, flutter, react-native
- `name`: project name
- `features`: array of features (auth, database, api, etc.)

**Output:**
- Official CLI commands to run
- Project structure recommendations
- Setup instructions

---

### 4. `skills-agent_load_skill_context`
Load specific skill content for context.

**Usage in OpenCode:**
```
use skills-agent_load_skill_context feature-architect
```

**Input:**
- `skill_name`: name of skill to load

**Output:**
- Skill guidelines and rules

---

## 🧪 Testing in OpenCode

### Test 1: Check MCP Connection

```bash
cd /Applications/projects/another/test
opencode mcp list
```

Should show:
```
●  ✓ skills-agent connected
```

### Test 2: List Available Tools

In OpenCode TUI, ask:
```
what mcp tools are available?
```

Or:
```
list all skills-agent tools
```

### Test 3: Use Explore Tool

```
use skills-agent_explore_codebase to analyze /Applications/projects/me/skills/skills-agent
```

### Test 4: Init New Project

```
use skills-agent_init_project to create a new Next.js 15 app with TypeScript and Tailwind
```

---

## 🎯 MCP Tools vs Native Skills

You now have **BOTH** available:

| Feature | MCP Tools | Native Skills |
|---------|-----------|---------------|
| Format | Structured tools with inputs | Markdown guidelines |
| Loading | Called explicitly | Loaded on-demand |
| Execution | Via provider (DeepSeek/Claude) | Direct by OpenCode |
| Budget tracking | ✅ Built-in | ❌ Not available |
| Multi-provider | ✅ Smart routing | ❌ Uses OpenCode provider |
| Token optimization | ✅ Automatic | ❌ Manual |

---

## 💡 When to Use Which?

### Use MCP Tools When:
- ✅ Complex multi-step workflows (explore → implement → test)
- ✅ Need provider flexibility (route to cheap/fast models)
- ✅ Want budget tracking ($5/day limit)
- ✅ Token efficiency matters (DeepSeek $0.0014/1K vs Claude $0.003/1K)
- ✅ Structured inputs/outputs needed

### Use Native Skills When:
- ✅ Simple guideline reference (just need readability rules)
- ✅ Quick context loading
- ✅ No external API calls needed
- ✅ Simpler mental model

---

## 📊 Cost Comparison

With MCP skills-agent (DeepSeek default):
- **init_project**: ~1K tokens = **$0.0014**
- **explore_codebase**: ~5K tokens (Claude) = **$0.015**
- **implement_feature**: ~2K tokens = **$0.003**
- **Daily limit**: $5 (configurable)

With OpenCode native (depends on your provider):
- Uses whatever model you configured in OpenCode
- No budget tracking
- No provider routing

---

## 🐛 Troubleshooting

### MCP Server Not Connected

1. Check config:
```bash
cat ~/.config/opencode/opencode.json
```

2. Check logs:
```bash
tail -f ~/.skills-agent/mcp.log
```

3. Test manually:
```bash
cd /Applications/projects/me/skills/skills-agent
SKILLS_DIR=/Applications/projects/me/skills node dist/index.js
```

### Tools Not Available

1. Restart OpenCode completely (Quit + reopen)

2. Verify server connected:
```bash
opencode mcp list
```

3. Check tool names have prefix:
```
skills-agent_explore_codebase  ← correct
explore_codebase               ← incorrect
```

### API Key Errors

MCP server needs API keys in `.env`:

```bash
cd /Applications/projects/me/skills/skills-agent
cat .env

# Should have at least one:
DEEPSEEK_API_KEY=sk-xxx
# OR
GROQ_API_KEY=gsk-xxx
# OR
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

## ✅ What's Working

- ✅ MCP server connected to OpenCode
- ✅ 4 tools exposed (explore, implement, init, load_skill)
- ✅ Logs to `~/.skills-agent/mcp.log` (not stdout)
- ✅ Config loaded from package directory
- ✅ 15 skills available
- ✅ 5 providers configured (DeepSeek, Groq x2, BigPickel, Claude)
- ✅ Budget tracking enabled ($5/day default)

---

## 🚀 Next Steps

1. **Add API key** to `.env` if you want to test with real LLM calls
2. **Try in OpenCode**: use `skills-agent_init_project` to create a project
3. **Check budget**: `node dist/cli.js budget` to see usage
4. **Customize**: Edit `~/.skills-agent/config.yaml` to override providers

---

**MCP server is ready to use!** 🎉

Log file: `~/.skills-agent/mcp.log`
Config: `~/.config/opencode/opencode.json`
Skills: `~/.agents/skills/` (17 available)
