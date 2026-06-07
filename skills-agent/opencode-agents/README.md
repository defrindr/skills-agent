# OpenCode Agents for Skills Agent

14 specialized OpenCode agents that integrate with Skills Agent MCP server.

## Quick Install

**Option 1: Global (recommended)**

```bash
mkdir -p ~/.config/opencode/agents
cp opencode-agents/*.md ~/.config/opencode/agents/
```

**Option 2: Per-project**

```bash
mkdir -p .opencode/agents
cp ~/.skills-agent/skills-agent/opencode-agents/*.md .opencode/agents/
```

Restart OpenCode to load the agents.

## Available Agents

### Role-Based (8)

1. **@backend-architect** - Backend API specialist with contract-first approach
   - Laravel, NestJS, Express, FastAPI, Go
   - API contract → validation → implementation
   - Database-First Protocol enforced

2. **@frontend-specialist** - Frontend component design and state management
   - React, Next.js, Vue, Nuxt, Svelte
   - Component tree → API client → form library
   - snake_case → camelCase transformation

3. **@mobile-engineer** - Mobile performance and platform parity
   - Flutter, React Native
   - List performance, SafeArea, platform checks
   - Offline-first thinking

4. **@database-architect** - Database schema and migration safety
   - STOP/ASK/WAIT/VERIFY protocol mandatory
   - Schema design, indexing, query optimization
   - Read-only mode, requires approval for changes

5. **@security-auditor** - Security vulnerability assessment
   - Threat modeling, exploit path mapping
   - Auth/authz, injection, secrets, dependencies
   - Read-only, provides findings with severity

6. **@ux-stylist** - Design system discipline and professional styling
   - Design tokens, spacing scale, typography
   - Anti-SMK-2016 patterns
   - Accessibility baseline

7. **@project-planner** - Flow-driven project planning
   - Discovery → flows → AGENTS.md → MCP recommendations
   - Invokes `agent_planner` MCP tool
   - Generates `.opencode/` artifacts

### Service Agents (4)

8. **@code-health** - Performance & security audit
   - Memory leaks, N+1, XSS, SQL injection, auth gaps
   - Prioritized report with severity and remediation
   - Read-only, audit mode

9. **@codebase-explorer** - First-time codebase mapping and analysis
   - Framework detection, entry points, data flow
   - Pattern assessment and quick wins
   - Read-only, analysis mode

10. **@feature-architect** - Feature design and implementation planning
    - API contracts, data models, state, error handling
    - Test strategy included
    - Design first, code second

11. **@token-efficiency** - Token-efficient coding specialist
    - Dense code, minimal verbosity
    - DeepSeek-powered for cost efficiency
    - Full edit access for speed

### Core Lenses (3)

12. **@senior-engineer** - Default professional pragmatic lens
   - Boring code, scale-appropriate, maintainable
   - Balance between MVP and over-engineering

9. **@red-team** - Adversarial security assessment
   - Assume breach mentality, exploit paths
   - Attack surface analysis, blast radius mapping

14. **@minimalist** - Terse code-first minimal explanations
    - No fluff, show don't tell
    - For when you know what you want

## Usage

### Direct @ Mention

```
@backend-architect review this API endpoint
@database-architect should I add an index on user_id?
@frontend-specialist refactor this 300-line component
@security-auditor audit the authentication flow
@ux-stylist review button styles
@project-planner generate flows for a booking system
```

### vs MCP Tools

**OpenCode Agents** (role-based, user-facing):
- `@backend-architect` - loads backend skills, enforces patterns
- Quick, conversational, domain-specific guidance

**MCP Tools** (action-oriented, programmatic):
- `use skills-agent_implement_feature` - actual implementation
- `use skills-agent_explore_codebase` - codebase analysis
- `use skills-agent_agent_planner` - flow generation

**Hybrid Usage:**

```
# Agent recommends, then invokes MCP tool
@backend-architect implement login endpoint

# Agent loads skills, MCP tool executes
@frontend-specialist add user profile component
```

Agents can invoke MCP tools internally:
```
use skills-agent_implement_feature path=. description="..." persona=backend-architect
```

## How They Work

1. **Load Skills**: Agents load relevant skills via `skill` tool
   ```
   use skill name=project-readability
   use skill name=backend-readability
   ```

2. **Apply Lens**: Domain-specific guidance and patterns

3. **Invoke MCP Tools** (optional): For actual implementation
   ```
   use skills-agent_implement_feature persona=backend-architect
   ```

## Configuration

Agents use these permissions by default:

- **backend-architect**: `edit: ask`, `bash: ask` (safe commands allowed)
- **frontend-specialist**: `edit: ask`, `bash: ask` (npm/git allowed)
- **mobile-engineer**: `edit: ask`, `bash: ask` (flutter/npm allowed)
- **database-architect**: `edit: deny`, read-only (requires explicit approval)
- **security-auditor**: `edit: deny`, `bash: deny`, read-only audit mode
- **code-health**: `edit: deny`, `bash: deny`, read-only audit mode
- **codebase-explorer**: `edit: deny`, `bash: deny`, read-only analysis mode
- **feature-architect**: `edit: ask`, `bash: ask` (safe commands allowed)
- **ux-stylist**: `edit: ask`, `bash: deny`, styling focus
- **project-planner**: `edit: ask`, `bash: deny`, planning mode
- **token-efficiency**: `edit: allow`, `bash: allow`, full access for speed
- **senior-engineer**: `edit: ask`, `bash: ask`, balanced permissions
- **red-team**: `edit: deny`, `bash: deny`, read-only threat model
- **minimalist**: `edit: allow`, `bash: allow`, full access for speed

## Customization

Override agent config in `~/.config/opencode/opencode.json`:

```json
{
  "agent": {
    "backend-architect": {
      "model": "anthropic/claude-opus-4-20250514",
      "permission": {
        "edit": "allow"
      }
    }
  }
}
```

## Examples

### Backend API Development

```
@backend-architect implement user registration endpoint with email verification
```

Agent will:
1. Load `project-readability`, `backend-readability`, `database-designer`
2. Define API contract (method, path, request/response)
3. Ask about rate limiting, caching strategy
4. Check if DB schema change needed (enforce DB-First Protocol)
5. Implement with framework-specific patterns
6. Include tests (happy path + error cases)

### Database Schema Change

```
@database-architect add index on users.email for login query
```

Agent will:
1. Read current schema
2. Check if index already exists
3. Propose migration (forward + rollback)
4. ASK: "Approval needed for index creation: [plan]"
5. WAIT for user confirmation
6. VERIFY post-migration

### Security Audit

```
@security-auditor review the payment processing flow
```

Agent will:
1. Map attack surface (entry points, boundaries)
2. Identify sensitive operations (payment, PII)
3. Document exploit paths with severity
4. Suggest remediations (defense in depth)
5. Output findings: Critical → Low priority

### Project Planning

```
@project-planner plan a NextJS e-commerce app with Stripe
```

Agent will:
1. Ask discovery questions (scale, team, timeline)
2. Recommend stack
3. Map flows (5-7 for startup)
4. Generate `.opencode/AGENTS.md` + `flows/*.md`
5. Recommend MCPs (playwright, dbhub, github)

## Version

Compatible with Skills Agent v0.3.0:
- 5 MCP tools
- 22 skills
- 14 personas
- 14 OpenCode agents

## See Also

- [Skills Agent README](../README.md)
- [OpenCode Agents Docs](https://opencode.ai/docs/agents)
- [MCP Server Documentation](../MCP-OPENCODE.md)
