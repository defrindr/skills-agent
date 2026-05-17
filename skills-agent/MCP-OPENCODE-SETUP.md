# Skills Agent + OpenCode Integration Guide

## How It Works

Skills Agent MCP automatically detects and uses credentials available in your environment when running under OpenCode.

### Architecture

```
OpenCode
  ├─ Detects: model, API keys from env
  ├─ Spawns: skills-agent MCP server
  │  ├─ Receives: environment variables (API keys, model info)
  │  ├─ Initializes: provider selection based on available credentials
  │  └─ Executes: skills with auto-detected credentials
  └─ Results: structured output from skill execution
```

### Credential Detection Flow

1. **Environment Variables** → Detected by setup script
   ```bash
   export ANTHROPIC_API_KEY="sk-ant-..."
   export GROQ_API_KEY="gsk_..."
   export OPENROUTER_API_KEY="sk-or-..."
   ```

2. **Setup Script** → Auto-injects into OpenCode config
   ```bash
   cd ~/.skills-agent/skills-agent
   npm run setup
   ```

3. **OpenCode Config** → Passes to MCP server
   ```json
   {
     "mcp": {
       "skills-agent": {
         "environment": {
           "ANTHROPIC_API_KEY": "sk-ant-...",
           "GROQ_API_KEY": "gsk-...",
           "OPENROUTER_API_KEY": "sk-or-..."
         }
       }
     }
   }
   ```

4. **Skills Agent** → Uses first available provider
   - Tries providers in priority order: Anthropic → OpenAI → Groq → OpenRouter
   - Falls back to free tier (bigpickel/OpenRouter) if no paid keys available

## Setup

### Quick Start

1. **Set your API keys in shell profile**:
   ```bash
   # Add to ~/.bashrc, ~/.zshrc, etc.
   export ANTHROPIC_API_KEY="your-key-here"
   export OPENROUTER_API_KEY="your-key-here"
   ```

2. **Reopen terminal** (so exports are available)

3. **Run setup**:
   ```bash
   cd ~/.skills-agent/skills-agent
   npm run setup
   ```

4. **Restart OpenCode** and verify:
   ```bash
   opencode mcp list
   ```

### Manual Configuration

If setup script doesn't detect your keys, manually add them to `~/.config/opencode/opencode.json`:

```json
{
  "mcp": {
    "skills-agent": {
      "type": "local",
      "command": [...],
      "environment": {
        "SKILLS_DIR": "...",
        "ANTHROPIC_API_KEY": "sk-ant-...",
        "GROQ_API_KEY": "gsk-..."
      }
    }
  }
}
```

## Supported API Keys

| Provider | Environment Variable | Free? | Notes |
|----------|---------------------|-------|-------|
| Anthropic Claude | `ANTHROPIC_API_KEY` | ❌ | Premium inference |
| OpenAI GPT-4 | `OPENAI_API_KEY` | ❌ | Premium inference |
| Groq | `GROQ_API_KEY` | ✅ | Free inference, fast |
| OpenRouter | `OPENROUTER_API_KEY` | ✅ | Free tier + paid models |
| Deepseek | `DEEPSEEK_API_KEY` | ✅ | Free tier available |

## Provider Selection Logic

Skills Agent selects providers in this order:

1. **OpenCode auto-detected model** (from `~/.config/opencode/opencode.json`)
   - If found + has credentials → use immediately

2. **Skill-specific override** (from skill SKILL.md `providers` field)
   - Uses first available from skill's preferred list

3. **Global preference** (tier: premium/free)
   - Premium: Anthropic → OpenAI
   - Free: Groq → OpenRouter (bigpickel)

4. **First enabled provider** (fallback)
   - Uses whatever is available

### Example: No Premium Keys

If only `GROQ_API_KEY` is set:
```
cloudbase-explorer: 
  ✓ Available: groq-mixtral, groq-llama3
  ✓ Selected: groq-mixtral (faster)
```

If only `OPENROUTER_API_KEY` is set:
```
cloudbase-explorer:
  ✓ Available: bigpickel
  ✓ Selected: bigpickel (free)
```

If no keys at all:
```
cloudbase-explorer:
  ✗ No providers available
  → Error: "No enabled providers available"
```

## Troubleshooting

### "No enabled providers available"

**Cause**: No API keys found in environment

**Fix**:
```bash
# Check what keys are exported
echo $ANTHROPIC_API_KEY
echo $OPENROUTER_API_KEY

# If empty, set them:
export OPENROUTER_API_KEY="your-key"

# Re-run setup
cd ~/.skills-agent/skills-agent && npm run setup

# Restart OpenCode
```

### "Authentication failed"

**Cause**: API key is invalid or expired

**Fix**:
- Check if your API key is still valid on the provider's dashboard
- Update the key in environment variable
- Re-run setup: `npm run setup`

### "Provider X failed, falling back to Y"

**Normal behavior**: Skills Agent tried primary provider, it failed, now trying next in fallback chain. This is intentional.

## Debugging

Enable detailed logs:

```bash
DEBUG=true opencode run "explore codebase"
```

Check logs:
```bash
tail -50 ~/.skills-agent/mcp.log | grep "Provider\|Enabled\|resolved"
```

## Manual MCP Testing

Test skills-agent directly (without OpenCode):

```bash
# Check available tools
opencode mcp list

# Call a tool
opencode mcp call skills-agent_explore_codebase --path /some/project
```

---

**Questions?** See [README.md](./README.md) or file an issue at https://github.com/anomalyco/opencode
