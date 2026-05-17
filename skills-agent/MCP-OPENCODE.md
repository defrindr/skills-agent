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

## ⚡ Provider Fallback & Reliability

Skills Agent implements intelligent fallback and retry logic for maximum reliability:

### Error Classification

Errors are classified as **retryable** or **fatal**:

**Retryable errors (automatic retry):**
- Rate limit exceeded (429)
- Request timeout (ETIMEDOUT)
- Server errors (5xx)
- Quota exceeded

**Fatal errors (no retry):**
- Authentication failures (401, 403)
- Invalid request (400)
- Context length exceeded
- Unknown errors

### Retry Strategy

**Exponential backoff:**
- Attempt 1: immediate
- Attempt 2: wait 1s
- Attempt 3: wait 2s
- Attempt 4: wait 4s
- Max wait: 10s

**Max retries:** 2 (configurable via `MAX_RETRIES` env var)

**Same tier preference:**
- Free tier providers fallback to other free providers first
- Premium tier providers fallback to other premium providers first
- Cross-tier fallback only if same-tier exhausted

### Timeout Handling

**Default timeout:** 30s per request (configurable via `REQUEST_TIMEOUT` env var)

**Behavior:**
- Wraps provider execution with `Promise.race`
- Throws `ETIMEDOUT` error code on timeout
- Classified as retryable error → automatic fallback

### Execution Metadata

All MCP tool calls include attempt tracking in response:

```json
{
  "result": "Implementation complete...",
  "metadata": {
    "attempts": [
      {
        "provider": "deepseek",
        "status": "rate_limit",
        "latency": 1234
      },
      {
        "provider": "groq",
        "status": "success",
        "latency": 892
      }
    ],
    "total_latency": 2126,
    "fatal": false
  }
}
```

**Fields:**
- `attempts`: Array of all providers tried (in order)
- `total_latency`: Sum of all attempt latencies (ms)
- `fatal`: Whether failure was fatal (no retries)

### Logging

**Retry attempts:**
- Logged as warnings: `Provider deepseek failed (rate_limit), trying groq...`
- Not visible to OpenCode user (silent fallback)
- Logged to `~/.skills-agent/mcp.log`

**Fatal errors:**
- Logged with full context and stack trace
- Visible to user as error response

**Performance metrics:**
- Per-provider latency tracked
- Success/failure rates logged
- Cache hit/miss ratios tracked

### Configuration

Add to `.env` for custom behavior:

```bash
# Retry configuration
MAX_RETRIES=2                    # Default: 2
REQUEST_TIMEOUT=30000            # Default: 30s (in ms)
FALLBACK_SAME_TIER_FIRST=true    # Default: true

# Backoff configuration
MIN_BACKOFF=1000                 # Default: 1s
MAX_BACKOFF=10000                # Default: 10s
```

### Example: Rate Limit Fallback

```
User: use skills-agent_implement_feature to add login

Execution flow:
1. Try DeepSeek (free tier)
   → Rate limit (429)
   → Log: "Provider deepseek rate limited, retrying with groq..."

2. Try Groq (free tier, same tier preference)
   → Success (200)
   → Return result

Metadata:
{
  "attempts": [
    { "provider": "deepseek", "status": "rate_limit", "latency": 412 },
    { "provider": "groq", "status": "success", "latency": 1123 }
  ],
  "total_latency": 1535,
  "fatal": false
}
```

### Example: Fatal Error (No Retry)

```
User: use skills-agent_implement_feature to add login

Execution flow:
1. Try DeepSeek
   → Auth error (401)
   → Classify as fatal
   → No retry, return error immediately

Metadata:
{
  "attempts": [
    { "provider": "deepseek", "status": "auth_error", "latency": 234 }
  ],
  "total_latency": 234,
  "fatal": true
}
```

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
