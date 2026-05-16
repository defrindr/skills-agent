# OpenCode Setup Guide

Panduan lengkap untuk setup Skills Agent dengan OpenCode.

## Prerequisites

- Node.js 18+
- OpenCode installed
- Git

## Step-by-Step Setup

### 1. Clone & Install Skills Agent

```bash
cd ~/projects  # atau directory lain
git clone <your-repo-url> skills
cd skills/skills-agent
npm install
npm run build
```

### 2. Setup Environment Variables

```bash
cd skills-agent
cp .env.example .env
```

Edit `.env` dan tambahkan API keys:

```env
# Required untuk free tier
DEEPSEEK_API_KEY=sk-xxxxx
GROQ_API_KEY=gsk_xxxxx

# Optional untuk premium
ANTHROPIC_API_KEY=sk-ant-xxxxx
OPENROUTER_API_KEY=sk-or-xxxxx
```

**Cara dapetin API keys:**

**DeepSeek (Free):**
1. Daftar di https://platform.deepseek.com
2. Top up minimal $5 (bisa dipake lama)
3. Generate API key
4. Copy ke `.env`

**Groq (Free):**
1. Daftar di https://console.groq.com
2. Free tier: 14,400 requests/day
3. Generate API key
4. Copy ke `.env`

**Claude (Premium - Optional):**
1. Daftar di https://console.anthropic.com
2. Add credit ($5 minimum)
3. Generate API key
4. Copy ke `.env`

### 3. Test Installation

```bash
npm run cli list-skills
```

Expected output:
```
📚 Available Skills (3):

  • codebase-explorer
    Map dan analyze codebase untuk pertama kali atau setelah perubahan besar...
    Complexity: complex

  • feature-architect
    Skill untuk design dan implement new features dengan architectural thinking...
    Complexity: medium

  • token-efficient-coding
    Skill untuk write code yang token-efficient tanpa sacrificing readability...
    Complexity: simple
```

```bash
npm run cli list-providers
```

Expected output:
```
🔌 Enabled Providers (5):

  • deepseek (free)
    Model: deepseek-chat
    Cost: $0.0014/1K

  • groq-mixtral (free)
    Model: mixtral-8x7b-32768
    Cost: FREE

  • groq-llama3 (free)
    Model: llama-3.1-70b-versatile
    Cost: FREE
    
  ...
```

### 4. Create Configuration File

```bash
mkdir -p ~/.skills-agent
```

Create `~/.skills-agent/config.yaml`:

```yaml
# Global Settings
global:
  default_tier: free
  auto_fallback: true
  max_cost_per_task: 0.50
  prefer_speed: true

# Provider Configuration
providers:
  deepseek:
    enabled: true
    tier: free
    endpoint: https://api.deepseek.com
    model: deepseek-chat
    max_tokens: 16000
    cost_per_1k_input: 0.0014
    cost_per_1k_output: 0.0028
    
  groq-mixtral:
    enabled: true
    tier: free
    endpoint: https://api.groq.com/openai/v1
    model: mixtral-8x7b-32768
    max_tokens: 32000
    cost_per_1k_input: 0.0
    cost_per_1k_output: 0.0
    
  groq-llama3:
    enabled: true
    tier: free
    endpoint: https://api.groq.com/openai/v1
    model: llama-3.1-70b-versatile
    max_tokens: 8000
    cost_per_1k_input: 0.0
    cost_per_1k_output: 0.0
    
  claude-sonnet:
    enabled: true  # Set false kalau ga punya API key
    tier: premium
    endpoint: https://api.anthropic.com
    model: claude-sonnet-4
    max_tokens: 200000
    cost_per_1k_input: 0.003
    cost_per_1k_output: 0.015

# Skill-Specific Overrides
skill_overrides:
  codebase-explorer:
    prefer_tier: premium
    providers:
      - claude-sonnet
      - deepseek
      
  feature-architect:
    prefer_tier: free
    providers:
      - deepseek
      - groq-mixtral

# Budget Configuration
budget:
  daily_limit: 5.00
  warn_threshold: 4.00
  track_usage: true
```

### 5. Configure OpenCode MCP

Create atau edit `~/.opencode/mcp-config.json`:

```bash
mkdir -p ~/.opencode
```

```json
{
  "mcpServers": {
    "skills-agent": {
      "command": "node",
      "args": [
        "/Users/YOUR_USERNAME/projects/skills/skills-agent/dist/index.js"
      ],
      "env": {
        "SKILLS_DIR": "/Users/YOUR_USERNAME/projects/skills",
        "DEEPSEEK_API_KEY": "your_key_here",
        "GROQ_API_KEY": "your_key_here"
      }
    }
  }
}
```

**⚠️ IMPORTANT:** 
- Replace `/Users/YOUR_USERNAME` dengan actual path
- Gunakan **absolute paths**, bukan `~` atau relative
- Pastikan `dist/index.js` sudah ada (run `npm run build` kalau belum)

**Cara cek path:**
```bash
cd ~/projects/skills/skills-agent
pwd  # Copy output ini
```

### 6. Restart OpenCode

```bash
# Close OpenCode completely
# Reopen OpenCode
```

### 7. Test Integration

Open any project di OpenCode dan try:

```
@copilot list available skills
```

Expected: Copilot should be able to call skills-agent tools.

Try exploring:
```
@copilot explore this codebase in detail
```

Try implementing:
```
@copilot implement a dark mode toggle in the settings page
```

## Verification Checklist

- [ ] Skills agent installed (`npm install` success)
- [ ] Built successfully (`npm run build`)
- [ ] API keys configured (`.env` file)
- [ ] Can list skills (`npm run cli list-skills`)
- [ ] Can list providers (`npm run cli list-providers`)
- [ ] Config file created (`~/.skills-agent/config.yaml`)
- [ ] MCP config created (`~/.opencode/mcp-config.json`)
- [ ] OpenCode restarted
- [ ] Can call skills from Copilot

## Common Issues

### Issue 1: "Skills agent not found"

**Symptom:** Copilot doesn't recognize skills-agent tools

**Fix:**
1. Check MCP config path:
   ```bash
   cat ~/.opencode/mcp-config.json
   ```
2. Verify `dist/index.js` exists:
   ```bash
   ls ~/projects/skills/skills-agent/dist/index.js
   ```
3. If missing, rebuild:
   ```bash
   cd ~/projects/skills/skills-agent
   npm run build
   ```
4. Restart OpenCode

### Issue 2: "API key invalid"

**Symptom:** Provider fails with 401/403

**Fix:**
1. Check `.env` file:
   ```bash
   cat ~/projects/skills/skills-agent/.env
   ```
2. Verify key format (no spaces, quotes, etc)
3. Test API key directly:
   ```bash
   curl https://api.deepseek.com/chat/completions \
     -H "Authorization: Bearer YOUR_KEY" \
     -H "Content-Type: application/json" \
     -d '{"model":"deepseek-chat","messages":[{"role":"user","content":"test"}]}'
   ```
4. If invalid, regenerate key from provider dashboard

### Issue 3: "No skills loaded"

**Symptom:** `list-skills` returns empty

**Fix:**
1. Check `SKILLS_DIR` in MCP config points to correct directory
2. Verify skills exist:
   ```bash
   ls ~/projects/skills/common/*/SKILL.md
   ```
3. Should show:
   - `codebase-explorer/SKILL.md`
   - `feature-architect/SKILL.md`
   - `token-efficient-coding/SKILL.md`

### Issue 4: "Budget limit exceeded"

**Symptom:** Requests blocked

**Fix:**
1. Check current usage:
   ```bash
   cd ~/projects/skills/skills-agent
   npm run cli budget
   ```
2. Either:
   - Wait until tomorrow (resets daily)
   - Or increase limit in `~/.skills-agent/config.yaml`:
     ```yaml
     budget:
       daily_limit: 10.00  # Increase
     ```

### Issue 5: "Provider not responding"

**Symptom:** Timeouts or errors

**Fix:**
1. Check provider status (their website/status page)
2. Try different provider:
   ```
   @copilot explore this codebase using groq
   ```
3. Check fallback is enabled:
   ```yaml
   global:
     auto_fallback: true
   ```

## Advanced Configuration

### Use Only Free Tier

```yaml
# ~/.skills-agent/config.yaml
global:
  default_tier: free

providers:
  deepseek:
    enabled: true
  groq-mixtral:
    enabled: true
  groq-llama3:
    enabled: true
  # Disable premium
  claude-sonnet:
    enabled: false

budget:
  daily_limit: 0.50  # Low limit since mostly free
```

### Prioritize Speed

```yaml
global:
  prefer_speed: true

skill_overrides:
  # Use Groq for everything (fastest)
  feature-architect:
    providers:
      - groq-mixtral
  codebase-explorer:
    providers:
      - groq-llama3
      - deepseek
```

### Prioritize Quality (Expensive)

```yaml
global:
  default_tier: premium

skill_overrides:
  # Use Claude for everything
  feature-architect:
    force_provider: claude-sonnet
  codebase-explorer:
    force_provider: claude-sonnet

budget:
  daily_limit: 20.00  # Higher budget needed
```

## Testing Your Setup

### Test 1: Simple Exploration

```
@copilot quickly explore this codebase
```

Should:
- Detect framework
- Show folder structure
- Identify key components
- Use free tier (deepseek or groq)

### Test 2: Feature Implementation

```
@copilot implement a user logout button
```

Should:
- Plan implementation
- Generate code
- Follow framework patterns
- Use free tier

### Test 3: Provider Override

```
@copilot explore this codebase in detail with claude
```

Should:
- Use Claude (premium)
- Deeper analysis
- Show cost in output

### Test 4: Budget Tracking

After a few requests:
```bash
npm run cli budget
```

Should show:
- Total spent
- By provider breakdown
- By skill breakdown
- Today's usage

## Next Steps

1. **Read skill content** to understand capabilities:
   - `common/codebase-explorer/SKILL.md`
   - `common/feature-architect/SKILL.md`
   - `common/token-efficient-coding/SKILL.md`

2. **Experiment with different providers:**
   - Try same task with different providers
   - Compare quality vs speed vs cost

3. **Customize configuration:**
   - Adjust budget limits
   - Add more providers
   - Create skill-specific overrides

4. **Monitor usage:**
   - Check `npm run cli budget` regularly
   - Optimize provider selection based on patterns

## Getting Help

If stuck:
1. Check this guide's troubleshooting section
2. Check main README.md
3. Check OpenCode docs: https://opencode.ai/docs
4. Open issue on GitHub

## Tips & Best Practices

1. **Start with free tier** - Test everything before enabling premium
2. **Set conservative budget** - Start low ($1-2/day), increase if needed
3. **Enable auto fallback** - Prevents failures when provider down
4. **Monitor usage weekly** - Check what's consuming tokens
5. **Override when needed** - Use premium only for complex tasks
6. **Keep API keys secure** - Never commit `.env` to git

Happy coding! 🚀
