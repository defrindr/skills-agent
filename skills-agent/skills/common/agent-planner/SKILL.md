---
name: agent-planner
description: |
  Flow-driven project planner yang bikin .opencode/AGENTS.md + .opencode/flows/*.md
  SEBELUM coding dimulai. Tujuan: bikin model gratis (DeepSeek, Groq, Qwen) serasa Claude Opus
  dengan ngasih explicit flow + scope + skillset context.

  Trigger phrases:
  - "plan project"
  - "init project with flows"
  - "setup agents.md"
  - "design app flow"
  - "agent planner"
  - "generate flows"
  - "scope project"

  Extends project-initializer dengan 3 fase tambahan:
  - Phase 4: Flow mapping (.opencode/flows/*.md)
  - Phase 5: Agent config (.opencode/AGENTS.md)
  - Phase 6: MCP recommendations + auto-config

default_provider: deepseek
complexity: medium
---

# Agent Planner

**Goal**: Generate project scope, flow documentation, dan skill configuration SEBELUM build.
Free models ngigo karena ga punya context lengkap — skill ini fix itu.

## Prinsip Utama

**FLOW-FIRST, CODE-LATER.**

1. Tanya requirements (sama kayak project-initializer)
2. Recommend stack
3. **Map flows**: identify semua user-facing flows
4. **Generate flow docs**: tulis spec per flow di `.opencode/flows/`
5. **Generate AGENTS.md**: define skill triggers + workflows
6. **Recommend MCPs**: based on project type

## Output Structure

```
.opencode/
├── AGENTS.md              # Project-specific skill config
├── flows/
│   ├── auth-flow.md       # Per major user flow
│   ├── checkout-flow.md
│   └── data-sync-flow.md
└── recommended-mcps.json  # MCP servers to install
```

## Phase 1-3: Requirements & Stack (Inherit from project-initializer)

Tanya:
- Project type (web/api/mobile/fullstack)
- Scale (mvp/startup/enterprise)
- Features (auth, db, payments, realtime, dll)
- Team size
- Tech preferences

Lalu recommend stack dengan reasoning. **SAMA KAYAK project-initializer.**

## Phase 4: Flow Mapping (NEW)

Setelah stack confirmed, identify major flows berdasarkan features.

### Flow Detection Matrix

| Feature | Required Flows |
|---------|----------------|
| Auth | `auth-flow.md` (register, login, logout, password reset) |
| CRUD | `data-flow.md` per main entity |
| E-commerce | `checkout-flow.md`, `cart-flow.md` |
| Payments | `payment-flow.md`, `subscription-flow.md` |
| Real-time | `websocket-flow.md`, `notification-flow.md` |
| File upload | `upload-flow.md` |
| Multi-tenant | `tenant-flow.md`, `permission-flow.md` |
| SaaS onboarding | `onboarding-flow.md` |

### Flow Document Template

Setiap file di `.opencode/flows/[name].md` HARUS punya struktur ini:

```markdown
# [Flow Name] Flow

## Overview
Satu paragraf: tujuan flow ini buat apa.

## Actors
- User roles (guest, member, admin)
- External systems (Stripe, SendGrid, dll)

## Preconditions
- State yang harus ada sebelum flow ini bisa run

## Steps

### Step 1: [Action Name]
- **Trigger**: Apa yang start step ini
- **Endpoint** (kalau ada): `POST /api/...`
- **Payload**: Schema input
- **Validation**: Rules
- **Action**: Apa yang terjadi di backend/frontend
- **State change**: Database/cache changes
- **Output**: Response/redirect
- **Errors**: Possible errors + handling
- **Next**: Step berikutnya

### Step 2: ...

## API Contracts

### POST /api/[endpoint]
**Request:**
\`\`\`json
{ "field": "type" }
\`\`\`

**Response (200):**
\`\`\`json
{ "result": "type" }
\`\`\`

**Errors:**
- 400: validation error
- 401: unauthorized
- 422: business rule violation

## State Management
- Frontend state (Zustand/Redux/Context)
- Backend state (DB tables affected)
- Cache invalidation strategy

## Database Touchpoints
- Tables read: `users`, `sessions`
- Tables written: `audit_logs`
- Transactions needed: yes/no

## Security
- Auth requirement: required/optional
- Permission check: which roles
- Input validation: which fields
- Rate limiting: yes (limit) / no

## Testing
- Unit tests: list of functions
- Integration: API endpoint tests
- E2E: user journey scenarios

## Related Flows
- Depends on: `[other-flow.md]`
- Triggers: `[other-flow.md]`
```

### Flow Generation Rules

1. **JANGAN bikin flow untuk hal trivial** (e.g., "view homepage"). Focus on multi-step actions.
2. **Maksimal 5-7 flows per project init** untuk MVP/startup. Enterprise boleh lebih.
3. **Setiap flow standalone**: bisa dibaca sendiri tanpa context lain.
4. **Reference flow lain** pake link `[name](./other-flow.md)`.

## Phase 5: Agent Configuration (NEW)

Generate `.opencode/AGENTS.md` yang define:
- Project context (stack, scale)
- Active skills (relevant ke project)
- Workflows (multi-skill combinations)
- Flow references
- MCP servers used

### AGENTS.md Template

```markdown
# Skills Agent Configuration

## Project Context

- **Name**: [project name]
- **Type**: [web-app / backend-api / fullstack / mobile]
- **Stack**: [framework + db + auth + dll]
- **Scale**: [mvp / startup / enterprise]
- **Created**: [YYYY-MM-DD]

## Active Skills

Skills yang relevan untuk project ini (auto-loaded di task tertentu):

### Core
- `project-readability` - naming, structure, boring code
- `token-efficient-coding` - dense code, no fluff

### Framework
- `[framework]-readability` - framework-specific patterns

### Database (kalau ada DB)
- `database-designer` - schema design
- `database-optimizer` - query optimization

### Quality
- `code-health` - performance & security audit

## Workflows

### Workflow: Implement Feature
Trigger: "implement [feature]", "add [feature]", "build [feature]"

Steps:
1. Load `feature-architect` → plan feature
2. Read relevant flow doc dari `.opencode/flows/`
3. Load `[framework]-readability` → implement
4. Load `database-designer` (kalau touch DB)
5. Load `code-health` → audit setelah implementasi

### Workflow: Code Review
Trigger: "review", "audit code", "check this"

Steps:
1. Load `project-readability`
2. Load `[framework]-readability`
3. Load `code-health`

### Workflow: Add New Flow
Trigger: "new flow", "design flow"

Steps:
1. Use flow template di agent-planner SKILL
2. Save to `.opencode/flows/[name].md`
3. Update this AGENTS.md flow references
4. Then implement

## Flow References

Documented flows (lihat `.opencode/flows/`):
- [Auth Flow](./flows/auth-flow.md) - user authentication
- [Checkout Flow](./flows/checkout-flow.md) - purchase flow
- [Payment Flow](./flows/payment-flow.md) - Stripe integration

## MCP Servers

Recommended MCPs untuk project ini (lihat `.opencode/recommended-mcps.json`):
- `playwright-mcp` - E2E testing
- `dbhub` - database inspection
- `github-mcp` - git workflow

## Conventions

Project-specific overrides (kalau ada):
- API response format: `{ data, error, meta }`
- Naming: camelCase frontend, snake_case backend → response transform di API client
- Error handling: throw `AppError` class, handler di middleware

## Notes

[Optional: project-specific gotchas, decisions, dll]
```

## Phase 6: MCP Recommendations (NEW)

Based on project type + features, recommend MCP servers.

### MCP Decision Matrix

| Project Type | Required MCPs | Optional MCPs |
|--------------|---------------|---------------|
| Web app (frontend) | `playwright-mcp`, `chrome-devtools-mcp` | `github-mcp` |
| Backend API | `dbhub` (kalau ada DB) | `github-mcp` |
| Fullstack | `playwright-mcp`, `dbhub` | `chrome-devtools-mcp`, `github-mcp` |
| Mobile | - | `github-mcp` |

### Recommendation Output

Tulis ke `.opencode/recommended-mcps.json`:

\`\`\`json
{
  "recommended": [
    {
      "name": "playwright-mcp",
      "reason": "E2E testing untuk web app",
      "install": "npm install -D @playwright/mcp",
      "config": {
        "type": "local",
        "command": ["npx", "@playwright/mcp"],
        "enabled": true,
        "timeout": 10000
      },
      "docs": "https://github.com/microsoft/playwright-mcp"
    },
    {
      "name": "dbhub",
      "reason": "Inspect PostgreSQL schema & query",
      "install": "npm install -D @bytebase/dbhub",
      "config": {
        "type": "local",
        "command": ["npx", "@bytebase/dbhub"],
        "environment": { "DATABASE_URL": "${DATABASE_URL}" },
        "enabled": true,
        "timeout": 10000
      },
      "docs": "https://github.com/bytebase/dbhub"
    }
  ]
}
\`\`\`

### Auto-Config Flow

Setelah generate file, tanya user:

\`\`\`
MCP servers yang gue recommend:

1. playwright-mcp (E2E testing) - REQUIRED
2. dbhub (DB inspection) - REQUIRED
3. github-mcp (git workflow) - OPTIONAL

Mau gue:
[A] Auto-add ke ~/.config/opencode/opencode.json (backup dulu)
[B] Save aja recommendations, lo install manual
[C] Skip
\`\`\`

Kalau [A]: backup file → merge mcp config → validate JSON → write. Kalau gagal, restore backup.

## Real-World Example

**User**: "init nextjs saas dengan clerk auth, postgres, stripe. solo dev, startup scale"

**Output:**

```
# Project Setup: Next.js SaaS

[... Phase 1-3 dari project-initializer ...]

## Phase 4: Generated Flows

Gue identify 5 major flows untuk SaaS lo:

1. .opencode/flows/auth-flow.md - Clerk auth (register, login, webhook sync)
2. .opencode/flows/onboarding-flow.md - first-time user setup
3. .opencode/flows/subscription-flow.md - Stripe subscription create/update
4. .opencode/flows/payment-flow.md - one-time payments
5. .opencode/flows/dashboard-flow.md - main dashboard data loading

[Generated semua file dengan template]

## Phase 5: Agent Config

Generated .opencode/AGENTS.md dengan:
- Skills: project-readability, nextjs-readability, database-designer, code-health
- Workflows: implement-feature, code-review, add-flow
- Flow refs: ke 5 flow files

## Phase 6: MCP Recommendations

Recommended:
- playwright-mcp (E2E SaaS critical paths)
- dbhub (Postgres inspection)
- github-mcp (PR workflow)

Mau auto-config? [A/B/C]
```

## Decision Rules

### DO
- Generate flows BEFORE code
- Keep flows actionable (steps, contracts, errors)
- Reference flows from AGENTS.md
- Recommend MCPs based on actual project needs

### DON'T
- Generate flow untuk hal trivial (homepage, about page)
- Bikin 20+ flows di MVP (5-7 max)
- Auto-modify opencode.json tanpa user confirm
- Skip Phase 4-6 (itu yang bikin agent planner beda dari project-initializer)

## Why This Works for Free Models

Model gratis (DeepSeek, Groq, Qwen) sering ngigo karena:
1. Ga punya context full app structure
2. Guess random patterns
3. Generate kode yang ga match overall architecture

Dengan flow docs + AGENTS.md:
1. Model baca flow dulu sebelum code
2. Pattern udah explicit (auth pakai Clerk webhook, dll)
3. Skills auto-loaded sesuai task
4. Hasil = code yang konsisten + match design

**Bottom line**: 1 jam plan = 10 jam ga ngigo.
