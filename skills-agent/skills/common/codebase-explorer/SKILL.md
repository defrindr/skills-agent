---
name: codebase-explorer
description: >
  Skill untuk mapping dan analyzing codebase secara menyeluruh - baik untuk project baru
  maupun existing codebase yang unfamiliar. Detect framework, architecture patterns,
  folder structure, key components, entry points, data flow, potential issues, dan
  improvement opportunities. Wajib dijalankan sebelum ngoding di project yang belum familiar.
  Trigger: "explore codebase", "analyze project", "map architecture", "understand this codebase",
  "what does this project do", "project overview", "codebase structure", "first time here".
---

# Codebase Explorer

Peta sebelum jalan. Jangan skip step ini kalau project unfamiliar — 10-15 menit exploration bisa save hours of confusion.

---

## Goal

1. Map struktur project — folder, key files, entry points
2. Detect framework & patterns — tech stack, architecture, conventions
3. Identify components — core modules, services, utilities
4. Trace data flow — request → response lifecycle
5. Spot potential issues — technical debt, security risks
6. Give improvement ideas — actionable suggestions

---

## Exploration Levels

### Quick (< 5 menit)

**Kapan:** Butuh overview basic atau sudah ada familiarity.

**Fokus:** package.json/requirements.txt/go.mod, folder structure, entry point, README, top-level files.

**Output:**
```
## Quick Overview
- Framework: [detected]
- Structure: [feature-first | layer-first | mixed]
- Entry: [file path]
- Key folders: [top 3-5]

## First Impressions
[1-2 paragraph]

## Next Steps
[2-3 actions]
```

### Normal (10-15 menit) ⭐ Default

**Fokus:** Semua di Quick, plus config detail, core modules, routing, data models, shared utilities, testing setup.

**Output:**
```
## Project Overview
[Framework, version, key dependencies]

## Architecture Patterns
[MVC, Clean Arch, Layered, Microservices]

## Folder Structure
[Tree with comments]

## Core Components
### [Name] — Path, Responsibility, Dependencies

## Data Flow
[Request lifecycle]

## Key Observations
### Strengths [2-3]
### Concerns [2-3]

## Recommendations
[3-5 actionable]
```

### Deep (20-30 menit)

**Kapan:** Project besar, complex domain, atau refactor major.

**Fokus tambahan:** Detailed code patterns, dependency analysis, security audit, performance patterns, error handling di tiap layer, database design, API contracts, testing coverage, DevOps.

**Output tambahan:**
```
## Security Analysis
## Performance Considerations
## Technical Debt
## Migration Path
```

---

## Exploration Workflow

### Step 1: Detect Framework

1. package.json → dependencies (next, react, vue, nestjs, express)
2. requirements.txt / pyproject.toml → Python (fastapi, django)
3. go.mod → Go
4. composer.json → PHP (laravel)
5. pubspec.yaml → Flutter

Detected framework → auto-load framework-specific skill.

### Step 2: Map Entry Points

- **Next.js**: app/ atau pages/ directory
- **React/Vite**: src/main.tsx
- **NestJS**: src/main.ts dengan bootstrap()
- **Express**: src/server.ts atau src/app.ts
- **FastAPI**: main.py
- **Laravel**: public/index.php, routes/web.php
- **Go**: main.go

### Step 3: Understand Routing

- URL patterns, middleware/guards, protected vs public, API versioning

### Step 4: Trace Data Flow

```
Request → Entry → Middleware → Router → Controller → Service → Repository → DB → Response
```

Dokumentasi: tiap layer responsibility, di mana validation/auth terjadi, response format.

### Step 5: Identify Core Modules

Kategorikan: auth, business logic, data access, external integrations, shared utilities, config.

Per module: responsibility, key files, dependencies, test coverage.

### Step 6: Spot Issues

**Structure:** flat folder >50 files, generic names (utils/helpers/common), mixed patterns.
**Code:** massive files >500 lines, god objects, deep nesting >4, magic numbers/strings.
**Security:** secrets committed, no input validation, SQL injection, missing auth.
**Performance:** N+1, no caching, large payload without pagination, blocking operations.
**Dependencies:** outdated majors, unused deps, missing peer deps.

### Step 7: Recommendations

Prioritize by impact vs effort:

- **High impact, low effort** → Do first: security, validation, error responses, logging
- **High impact, high effort** → Plan & schedule: refactor god objects, migrate architecture, add tests
- **Low impact** → Backlog: rename variables, extract utilities, docs

---

## Output Guidelines

- **Objektif, fact-based** — avoid "probably", "might"
- **Actionable** — kasih solusi konkret, bukan cuma list problems
- **Prioritized** — urutkan by urgency/impact
- **File paths** — selalu absolute dari project root

### Hindari

- Jangan rekomendasi over-engineering
- Jangan sarankan framework migration unless critical
- Jangan fokus ke trivial issues (typo di comment)
- Jangan assume tanpa evidence

---

## Integrasi Framework Skills

Setelah detect framework, auto-load framework-specific skill. Contoh:

```
Detect Next.js → load nextjs-readability + project-readability
Gabungkan insights: App Router patterns, Server Components, data fetching
```

Framework-specific checks:
- **Next.js**: App Router, metadata API, Server Actions
- **NestJS**: Module organization, DI patterns
- **React**: State management, hooks, component composition
- **Express**: Middleware order, error handling, routing

---

## Reference project-readability

Terapkan taste rules dari `project-readability`: boring over clever, feature-first, specific naming, no premature abstraction, clear error messages, optimized for change.
