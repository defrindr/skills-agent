---
name: agent-planner
description: >
  Flow-driven project planner yang bikin .opencode/AGENTS.md + .opencode/flows/*.md
  SEBELUM coding dimulai. Bikin model gratis (DeepSeek, Groq, Qwen) serasa Claude Opus
  dengan explicit flow + scope + skillset context.
  Trigger: "plan project", "init project with flows", "setup agents.md",
  "design app flow", "agent planner", "generate flows", "scope project".
  Extends project-initializer: Phase 4 Flow mapping, Phase 5 Agent config, Phase 6 MCP.
---

# Agent Planner

**Goal**: Generate project scope, flow documentation, dan skill configuration SEBELUM build. Free models ngigo karena ga punya context lengkap — skill ini fix itu.

## Prinsip: FLOW-FIRST, CODE-LATER

1. Tanya requirements (sama kayak project-initializer)
2. Recommend stack
3. Map flows: identify semua user-facing flows
4. Generate flow docs: tulis spec per flow di `.opencode/flows/`
5. Generate AGENTS.md: define skill triggers + workflows
6. Recommend MCPs: based on project type

## Output Structure

```
.opencode/
├── AGENTS.md
├── flows/
│   ├── auth-flow.md
│   ├── checkout-flow.md
│   └── data-sync-flow.md
└── recommended-mcps.json
```

---

## Phase 1-3: Requirements & Stack

Tanya: project type (web/api/mobile/fullstack), scale (mvp/startup/enterprise), features, team size, tech preferences. Lalu recommend stack dengan reasoning. Sama seperti project-initializer.

---

## Phase 4: Flow Mapping

Setelah stack confirmed, identify major flows dari features.

### Flow Detection Matrix

| Feature | Required Flows |
|---------|----------------|
| Auth | auth-flow.md (register, login, logout, reset) |
| CRUD | data-flow.md per main entity |
| E-commerce | checkout-flow.md, cart-flow.md |
| Payments | payment-flow.md, subscription-flow.md |
| Real-time | websocket-flow.md, notification-flow.md |
| File upload | upload-flow.md |
| Multi-tenant | tenant-flow.md, permission-flow.md |
| SaaS onboarding | onboarding-flow.md |

### Flow Document Template

```markdown
# [Name] Flow

## Overview
Satu paragraf tujuan flow ini.

## Actors
User roles, External systems

## Preconditions
State yang harus ada sebelum flow bisa run.

## Steps
### Step N: [Action Name]
- **Trigger**, **Endpoint**, **Payload**, **Validation**
- **Action**, **State change**, **Output**, **Errors**, **Next**

## API Contracts
**Request** / **Response** / **Errors**

## State Management
Frontend, Backend, Cache

## Database Touchpoints
Tables read/written, transactions

## Security
Auth, permissions, input validation, rate limiting

## Testing
Unit, Integration, E2E

## Related Flows
Depends on / Triggers [other-flow.md]
```

### Rules
1. Jangan bikin flow trivial (view homepage). Fokus multi-step.
2. Maksimal 5-7 flows per project init untuk MVP/startup.
3. Setiap flow standalone, reference flow lain pakai link.

---

## Phase 5: Agent Configuration

Generate `.opencode/AGENTS.md` dengan:
- Project context (stack, scale)
- Active skills per kategori (core, framework, database, quality)
- Workflows: implement-feature, code-review, add-new-flow
- Flow references
- MCP servers dari recommended-mcps.json
- Conventions (API response, naming, error handling)

---

## Phase 6: MCP Recommendations

### Decision Matrix

| Project Type | Required | Optional |
|--------------|----------|----------|
| Web app | playwright-mcp, chrome-devtools-mcp | github-mcp |
| Backend API | dbhub | github-mcp |
| Fullstack | playwright-mcp, dbhub | chrome-devtools-mcp |
| Mobile | - | github-mcp |

Tulis ke `.opencode/recommended-mcps.json` dengan name, reason, install, config, docs.

Setelah generate, tanya user: [A] Auto-add ke opencode.json (backup dulu), [B] Save saja, [C] Skip.

---

## Decision Rules

- Generate flows BEFORE code
- Keep flows actionable (steps, contracts, errors)
- Jangan generate flow trivial
- Jangan bikin 20+ flows di MVP
- Jangan auto-modify opencode.json tanpa user confirm
- Jangan skip Phase 4-6

---

## Why This Works for Free Models

Model gratis ngigo karena ga punya context full app structure. Dengan flow docs + AGENTS.md: model baca flow dulu, pattern explicit, skills auto-loaded, hasil konsisten.

**1 jam plan = 10 jam ga ngigo.**
