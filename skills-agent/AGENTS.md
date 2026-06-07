# OpenCode Agents vs MCP Tools: Usage Guide

> **tl;dr:** Use `@agent` for conversations, use MCP tools for automation.

---

## Two Layers, Same Skills

Skills Agent provides **two interfaces** to the same underlying 22 skills:

| Interface | Style | Best For |
|-----------|-------|----------|
| **MCP Tools** | Programmatic function calls | Scripts, automation, explicit parameters |
| **OpenCode Agents** | Conversational with context | Interactive dev, code review, discussions |

Both access the **same skills library** — choose based on your workflow.

---

## MCP Tools (Programmatic Layer)

### Available Tools (5)

```bash
# 1. Explore codebase
use skills-agent_explore_codebase path=. depth=normal persona=senior-engineer

# 2. Implement feature
use skills-agent_implement_feature path=. description="add user auth" persona=backend-architect

# 3. Initialize project
use skills-agent_init_project description="nextjs saas with auth" framework=nextjs

# 4. Load skill context
use skills-agent_load_skill_context framework=nextjs

# 5. Plan project (NEW)
use skills-agent_agent_planner path=.
```

### When to Use MCP Tools

✅ **Automation & Workflows**
```bash
# Batch processing multiple projects
for dir in projects/*/; do
  use skills-agent_explore_codebase path=$dir depth=quick
done
```

✅ **Explicit Parameter Control**
```bash
# Precise configuration
use skills-agent_implement_feature \
  path=./backend \
  description="add rate limiting middleware" \
  framework=expressjs \
  persona=security-auditor
```

✅ **Integration with Other MCP Tools**
```bash
# Chain with github-mcp
use skills-agent_explore_codebase path=. persona=red-team
use github_create_issue title="Security findings" body="..."
```

✅ **Scripted Tasks**
```bash
# Repeatable operations
use skills-agent_init_project description="microservice template"
use skills-agent_load_skill_context framework=nestjs
```

---

## OpenCode Agents (Conversational Layer)

### Available Agents (14)

**Architecture & Planning:**
- `@backend-architect` - API-first, domain-driven, validation at boundaries
- `@frontend-specialist` - Component patterns, state management, UI/UX
- `@mobile-engineer` - Platform parity, performance, native patterns
- `@project-planner` - Discovery, flows, MCP recommendations
- `@feature-architect` - Feature design, API contracts, test strategy

**Technical Specialists:**
- `@database-architect` - Schema design, query optimization (read-only)
- `@security-auditor` - Threat modeling, vulnerability assessment (read-only)
- `@ux-stylist` - Design systems, tokens, professional styling
- `@code-health` - Performance & security audit (read-only)
- `@codebase-explorer` - Codebase mapping & analysis (read-only)

**Code Quality:**
- `@senior-engineer` - Maintainability, readability, pragmatic architecture
- `@red-team` - Adversarial security, exploit paths (read-only)
- `@minimalist` - Terse, code-first, no explanations
- `@token-efficiency` - Compact, token-efficient code

### When to Use OpenCode Agents

✅ **Interactive Development**
```
@backend-architect implement user login with JWT tokens

Agent:
1. I'll load expressjs-readability and project-readability skills
2. Let me check existing auth patterns in your codebase
3. Here's the implementation with validation at boundaries...
```

✅ **Code Reviews & Discussions**
```
@security-auditor review this authentication flow

Agent:
🚨 CRITICAL: No rate limiting on /auth/login
🔴 HIGH: JWT secret hardcoded in source
🟡 MEDIUM: Missing CSRF protection
```

✅ **Complex Multi-Step Tasks**
```
@project-planner plan e-commerce system

Agent:
1. Let me analyze requirements and recommend tech stack
2. Mapping 8 core flows: authentication, checkout, inventory...
3. Recommending MCP servers: playwright-mcp, stripe-mcp, dbhub
4. Generating .opencode/AGENTS.md with team conventions...
```

✅ **Role-Specific Guidance**
```
@ux-stylist review this button component

Agent (loads general-styling skill):
❌ Avoid: random blue (#3B82F6), no spacing system
✅ Use: design tokens (primary-600), 4px grid (spacing-2)
```

---

## Decision Matrix

| Task | MCP Tool | OpenCode Agent |
|------|----------|----------------|
| **Init new project** | `skills-agent_init_project description="..."` | `@project-planner I need to build...` |
| **Explore codebase first time** | `skills-agent_explore_codebase path=. depth=deep` | `@codebase-explorer map this project` |
| **Add specific feature** | `skills-agent_implement_feature description="..."` | `@feature-architect design order cancellation` |
| **Implement feature** | `skills-agent_implement_feature description="..."` | `@backend-architect implement user registration` |
| **Security audit** | `skills-agent_explore_codebase persona=red-team` | `@security-auditor find vulnerabilities` |
| **Code health check** | `skills-agent_explore_codebase persona=security-auditor` | `@code-health audit this codebase` |
| **Database schema** | `skills-agent_load_skill_context framework=database-designer` | `@database-architect design schema for orders` |
| **UI/styling review** | `skills-agent_load_skill_context framework=general-styling` | `@ux-stylist review this component` |
| **Quick code-only** | `skills-agent_implement_feature persona=minimalist` | `@minimalist add redis cache layer` |
| **Token-efficient coding** | `skills-agent_implement_feature persona=minimalist` | `@token-efficiency compress this component` |
| **Batch automation** | `for ... do use skills-agent_explore_codebase; done` | _(not suitable, use MCP tools)_ |
| **Sprint planning** | `skills-agent_agent_planner path=.` | `@project-planner plan next sprint` |

---

## Agent Delegation Patterns

Agents can invoke other agents or MCP tools internally:

### Example 1: Backend Architect → Database Architect
```
User: @backend-architect implement user management API

Agent flow:
1. Loads expressjs-readability + project-readability
2. Detects database schema changes needed
3. Asks: "@database-architect should I create users table or use existing?"
4. Database architect (read-only) reviews schema
5. Backend architect proceeds with approved design
6. Invokes: use skills-agent_implement_feature internally
```

### Example 2: Security Auditor → Red Team
```
User: @security-auditor audit authentication

Agent flow:
1. Loads code-health + project-readability
2. Performs static analysis
3. Delegates: "@red-team try to exploit this auth flow"
4. Red team (adversarial) attempts bypasses
5. Security auditor compiles findings (Critical → Low)
```

### Example 3: Project Planner → Multiple Agents
```
User: @project-planner plan mobile app launch

Agent flow:
1. Asks discovery questions (scale, features, timeline)
2. Invokes: use skills-agent_agent_planner path=.
3. Delegates: "@mobile-engineer validate tech stack choice"
4. Delegates: "@ux-stylist define design system tokens"
5. Generates: .opencode/AGENTS.md, flows/*.md, recommended-mcps.json
```

---

## Installation & Setup

### MCP Tools (Auto-Installed)
✅ Installed by default via:
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/defrindr/skills-agent-installer/main/install.sh)
```

No additional steps needed. Tools available immediately after OpenCode restart.

### OpenCode Agents (Manual Installation)

**Global (all projects):**
```bash
cp ~/.skills-agent/skills-agent/opencode-agents/*.md ~/.config/opencode/agents/
```

**Per-project (project-specific):**
```bash
mkdir -p .opencode/agents
cp ~/.skills-agent/skills-agent/opencode-agents/*.md .opencode/agents/
```

**Restart OpenCode** to load agents:
```
Cmd+Q → Reopen
```

Verify with:
```
@senior-engineer hello
```

---

## Permission Models

Different agents have different access levels:

| Agent | Edit Files | Run Bash | Rationale |
|-------|-----------|----------|-----------|
| `@senior-engineer` | ask | allow (safe) | Interactive dev, needs full access |
| `@backend-architect` | ask | allow (safe) | Implementation tasks |
| `@frontend-specialist` | ask | allow (safe) | Implementation tasks |
| `@mobile-engineer` | ask | allow (safe) | Implementation tasks |
| `@feature-architect` | ask | allow (safe) | Feature planning & design |
| `@token-efficiency` | allow | allow | Speed priority, full access |
| `@database-architect` | **deny** | **deny** | Read-only, STOP/ASK/WAIT/VERIFY protocol |
| `@security-auditor` | **deny** | deny (audit only) | Read-only, adversarial audit |
| `@code-health` | **deny** | deny (audit only) | Read-only, code health audit |
| `@codebase-explorer` | **deny** | deny (audit only) | Read-only, codebase mapping |
| `@red-team` | **deny** | deny (audit only) | Read-only, exploit finding |
| `@ux-stylist` | ask | deny | Style guidance, no bash needed |
| `@project-planner` | ask | allow (git) | Planning tasks, git access |
| `@minimalist` | allow | allow | Speed priority, full access |

**`edit: ask`** means agent prompts user before writing files.  
**`edit: deny`** means agent cannot write files (read-only mode).  
**`bash: allow (safe)`** means allow `git`, `npm`, etc. but block destructive commands.

---

## Philosophy: Why Two Layers?

### MCP Tools = Explicit Control
- Predictable behavior
- Auditable parameters
- Scriptable workflows
- No conversation overhead

### OpenCode Agents = Human Collaboration
- Natural language interaction
- Context-aware decisions
- Role-specific guidance
- Multi-step reasoning

**Use both:** MCP tools for automation, agents for conversations.

---

## Real-World Workflows

### Workflow 1: New Feature End-to-End

**Step 1:** Plan with agent
```
@project-planner I need to add payment processing
```
Agent generates flow, recommends stripe-mcp, creates .opencode/flows/payment.md

**Step 2:** Implement with MCP tool
```
use skills-agent_implement_feature \
  path=./backend \
  description="Stripe payment webhook handler" \
  framework=nestjs
```

**Step 3:** Security review with agent
```
@security-auditor review payment webhook security
```
Agent finds HMAC validation missing, suggests fix

**Step 4:** Apply fix with minimalist
```
@minimalist add HMAC validation to webhook
```
Agent generates code immediately, no explanations

---

### Workflow 2: Security Audit

**Step 1:** Automated scan with MCP
```
use skills-agent_explore_codebase path=. depth=deep persona=red-team
```
Generates structured findings report

**Step 2:** Interactive review with agent
```
@security-auditor explain these findings and prioritize
```
Agent provides context, severity ratings, remediation steps

**Step 3:** Delegate to specialists
```
@database-architect review SQL injection findings
@backend-architect review auth bypass findings
```
Agents provide domain-specific recommendations

---

### Workflow 3: Code Review Session

**Step 1:** Initial review (conversational)
```
@senior-engineer review this PR
```
Agent reads changes, provides high-level feedback

**Step 2:** Styling review (specialist)
```
@ux-stylist check component styling
```
Agent checks design tokens, spacing, colors

**Step 3:** Security check (automated)
```
use skills-agent_explore_codebase path=. persona=security-auditor
```
Automated vulnerability scan

**Step 4:** Performance review (specialist)
```
@minimalist optimize this component
```
Agent suggests performance improvements, terse output

---

## FAQ

### Q: Can agents use MCP tools internally?
**A:** Yes! Agents can invoke MCP tools:
```
@backend-architect implement auth

Agent internally:
use skills-agent_implement_feature description="JWT auth" framework=expressjs
```

### Q: Can MCP tools use agents internally?
**A:** No. MCP tools are low-level, agents are high-level. One-way delegation only.

### Q: Which is faster?
**A:** MCP tools are faster (no conversation overhead). Use agents when you need guidance, use tools when you know exactly what you want.

### Q: Can I create custom agents?
**A:** Yes! Copy any agent from `opencode-agents/*.md`, modify YAML frontmatter and workflow, save to `~/.config/opencode/agents/`. Restart OpenCode.

### Q: Do I need both installed?
**A:** MCP tools install automatically. OpenCode agents are optional (manual install). You can use just MCP tools if you prefer programmatic access.

### Q: Which personas work with which agents?
**A:** Agents have built-in personas:
- `@senior-engineer` = `persona=senior-engineer`
- `@red-team` = `persona=red-team`
- `@minimalist` = `persona=minimalist`
- `@token-efficiency` = `persona=minimalist` (DeepSeek-powered)
- Other agents map to role-based personas (backend-architect, frontend-specialist, etc.)

You can override via MCP tools:
```bash
use skills-agent_implement_feature persona=backend-architect  # explicit override
@backend-architect implement feature  # persona implicit in agent
```

---

## Next Steps

1. **Read agent definitions:** `~/.skills-agent/skills-agent/opencode-agents/README.md`
2. **Try an agent:** `@senior-engineer hello`
3. **Compare with MCP:** `use skills-agent_explore_codebase path=.`
4. **Pick your workflow:** Agents for conversations, MCP for automation

---

**Questions?** Open an issue: https://github.com/defrindr/skills-agent/issues
