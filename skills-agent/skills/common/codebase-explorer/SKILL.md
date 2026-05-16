---
name: codebase-explorer
description: >
  Skill untuk mapping dan analyzing codebase secara menyeluruh - baik untuk project baru
  maupun existing codebase yang unfamiliar. Detect framework, architecture patterns,
  folder structure, key components, entry points, data flow, potential issues, dan
  improvement opportunities. Wajib dijalankan pertama kali sebelum ngoding di project yang belum familiar.
  Trigger: "explore codebase", "analyze project", "map architecture", "understand this codebase",
  "what does this project do", "project overview", "codebase structure", "first time here".

# Provider Configuration
default_provider: claude-sonnet
complexity: complex
token_estimate: 10000-20000

providers:
  - name: claude-sonnet
    tier: premium
    reason: "Complex analysis butuh reasoning quality tinggi"
  - name: deepseek
    tier: free
    reason: "Fallback kalau budget terbatas"

fallback: true
max_retries: 2
---

# Codebase Explorer

Skill ini dipakai untuk **memahami codebase dari nol sampai paham architecture, flow, dan pattern-nya**.

Wajib run skill ini sebelum implement feature atau refactor di project yang belum familiar!

---

## Goal

1. **Map struktur project** - folder structure, key files, entry points
2. **Detect framework & patterns** - tech stack, architecture patterns, conventions
3. **Identify components** - core modules, services, utilities, configs
4. **Trace data flow** - bagaimana data mengalir dari request sampai response
5. **Spot potential issues** - technical debt, inconsistencies, security risks
6. **Give improvement ideas** - actionable suggestions untuk code quality

---

## Exploration Levels

### Quick (< 5 menit, 4K tokens)
**Kapan:** Kalau cuma butuh overview basic atau udah ada familiarity

**Fokus:**
- Package.json / requirements.txt / go.mod - tech stack apa yang dipakai
- Folder structure - feature-first, layer-first, atau chaos
- Entry point - di mana app start (main.ts, index.js, app.py, dll)
- README - kalau ada dan update
- Top-level files - config, env example, docker

**Output format:**
```
## Quick Overview
- Framework: [detected]
- Structure: [feature-first | layer-first | mixed]
- Entry: [file path]
- Key folders: [list top 3-5]

## First Impressions
[1-2 paragraph tentang project health]

## Next Steps
[rekomendasi 2-3 actions]
```

---

### Normal (10-15 menit, 8K tokens) ⭐ DEFAULT
**Kapan:** Standard exploration untuk most cases

**Fokus semua di Quick, plus:**
- Config files detail - DB, API endpoints, third-party services
- Core modules - auth, data access, business logic
- Routing structure - URL patterns, middleware, guards
- Data models - schema, types, validation rules
- Shared utilities - helpers, constants, types yang dipakai lintas fitur
- Testing setup - framework, coverage, patterns

**Output format:**
```
## Project Overview
[Framework, version, key dependencies]

## Architecture Patterns
[MVC, Clean Arch, Layered, Microservices, dll + reasoning]

## Folder Structure
[Tree view dengan komentar untuk key folders]

## Core Components
### [Component 1]
- Path: [...]
- Responsibility: [...]
- Dependencies: [...]

### [Component 2]
...

## Data Flow
[Request lifecycle: entry → middleware → controller → service → DB → response]

## Key Observations
### Strengths
[2-3 hal yang bagus]

### Concerns
[2-3 potential issues]

## Recommendations
[3-5 actionable suggestions]
```

---

### Deep (20-30 menit, 16K tokens)
**Kapan:** Project besar, complex domain, atau mau refactor major

**Fokus semua di Normal, plus:**
- Detailed code patterns - recurring patterns, anti-patterns, inconsistencies
- Dependencies analysis - external libs, version conflicts, unused deps
- Security audit - auth flow, input validation, secret management
- Performance patterns - caching, query optimization, bottlenecks
- Error handling - bagaimana errors ditangani di tiap layer
- Database design - tables, relations, indexes, migrations
- API contracts - endpoints, request/response shapes, versioning
- Testing coverage - unit, integration, e2e, coverage percentage
- DevOps setup - CI/CD, deployment, monitoring, logging

**Output format:** Sama seperti Normal tapi dengan deeper analysis di tiap section + tambahan:

```
## Security Analysis
[Auth flow, input validation, secrets, CORS, rate limiting]

## Performance Considerations
[Identified bottlenecks, caching strategy, query patterns]

## Technical Debt
[Prioritized list dengan effort estimation]

## Migration Path
[Kalau ada breaking changes atau modernization needed]
```

---

## Exploration Workflow

### Step 1: Detect Framework
**Prioritas check:**
1. package.json → dependencies (next, react, vue, nestjs, express)
2. requirements.txt / pyproject.toml → Python (fastapi, django, flask)
3. go.mod → Go
4. composer.json → PHP (laravel)
5. pubspec.yaml → Flutter
6. Cargo.toml → Rust

**Auto-load framework-specific skill** - Misal detect Next.js → load nextjs-readability

---

### Step 2: Map Entry Points
**Common patterns:**
- **Next.js**: app/ atau pages/ directory, next.config.js
- **React/Vite**: src/main.tsx atau src/index.tsx
- **NestJS**: src/main.ts dengan bootstrap()
- **Express**: src/server.ts atau src/app.ts
- **FastAPI**: main.py atau app/main.py
- **Laravel**: public/index.php, routes/web.php, routes/api.php
- **Go**: main.go dengan main()

---

### Step 3: Understand Routing
**Patterns by framework:**

**Next.js** → File-based routing
```
app/
├── (auth)/
│   ├── login/page.tsx    → /login
│   └── register/page.tsx → /register
└── dashboard/
    └── page.tsx          → /dashboard
```

**NestJS** → Decorator-based routing
```ts
@Controller('users')
export class UsersController {
  @Get(':id')  // → GET /users/:id
  findOne(@Param('id') id: string) {}
}
```

**Express** → Explicit routing
```ts
app.get('/api/users/:id', (req, res) => {})
```

**Identify:**
- URL patterns
- Middleware / guards applied
- Protected vs public routes
- API versioning strategy

---

### Step 4: Trace Data Flow

**Typical flow:**
```
Request
  ↓
Entry point (main.ts, server.ts)
  ↓
Middleware (auth, logging, validation)
  ↓
Router (match URL)
  ↓
Controller / Handler (orchestrate)
  ↓
Service / Use Case (business logic)
  ↓
Repository / Data Access (DB query)
  ↓
Database
  ↓
← Response (transform, serialize)
```

**Document:**
- Tiap layer apa responsibility-nya
- Di mana validation terjadi
- Di mana auth/authorization check
- Format response (sukses vs error)

---

### Step 5: Identify Core Modules

**Categorize:**
- **Auth/User management** - registration, login, permissions
- **Business logic** - core features (orders, products, posts, dll)
- **Data access** - repositories, ORMs, query builders
- **External integrations** - payment, email, file storage, third-party APIs
- **Shared utilities** - helpers, formatters, validators
- **Configuration** - env management, feature flags

**Per module, note:**
- Responsibility
- Key files
- Dependencies (internal & external)
- Tests coverage

---

### Step 6: Spot Issues

**Common red flags:**

**Structure issues:**
- ❌ Flat folder dengan 50+ files tanpa grouping
- ❌ Generic names: utils.ts, helpers.ts, common.ts tanpa spesific context
- ❌ Mixed patterns: ada feature-first di satu tempat, layer-first di tempat lain

**Code quality:**
- ❌ Massive files (> 500 lines)
- ❌ God objects (class/service yang handle terlalu banyak)
- ❌ Deep nesting (> 4 levels)
- ❌ Magic numbers / strings tanpa constants

**Security:**
- ❌ Secrets di code atau committed .env
- ❌ No input validation
- ❌ SQL injection risks (string concatenation untuk query)
- ❌ Missing auth checks di sensitive endpoints

**Performance:**
- ❌ N+1 queries
- ❌ No caching di expensive operations
- ❌ Large payload tanpa pagination
- ❌ Blocking operations di request path

**Dependencies:**
- ❌ Outdated major versions
- ❌ Unused dependencies
- ❌ Missing peer dependencies

---

### Step 7: Recommendations

**Prioritize by impact vs effort:**

**High Impact, Low Effort** → Do First:
- Fix security issues
- Add missing input validation
- Standardize error responses
- Add logging di critical paths

**High Impact, High Effort** → Plan & Schedule:
- Refactor god objects
- Migrate to better architecture
- Add comprehensive testing
- Database optimization

**Low Impact** → Backlog:
- Rename variables untuk consistency
- Extract small utilities
- Documentation improvements

---

## Output Guidelines

### Tone
- **Objektif, fact-based** - hindari "probably", "might", "seems like"
- **Actionable** - jangan cuma list problems, kasih solusi konkret
- **Prioritized** - urutkan by urgency/impact

### Format
- **Use headings & subheadings** - easy to scan
- **Code examples** - tunjukkan actual code snippets kalau relevan
- **File paths** - always absolute dari project root
- **Stats** - kalau bisa: "23 API endpoints", "12% test coverage", "156 TODO comments"

### What to AVOID
- ❌ Jangan kasih rekomendasi over-engineering
- ❌ Jangan sarankan framework migration unless critical
- ❌ Jangan fokus ke trivial issues (typo di comment)
- ❌ Jangan assume tanpa evidence (e.g., "probably has performance issues")

---

## Integration dengan Framework Skills

Setelah detect framework, **auto-load framework-specific skill** untuk context tambahan.

**Contoh: Detect Next.js**
```
1. Load codebase-explorer (this skill)
2. Detect Next.js dari next.config.js
3. Auto-load nextjs-readability
4. Gabungkan insights:
   - Next.js best practices
   - App Router vs Pages Router patterns
   - Server Components vs Client Components
   - Data fetching patterns
```

**Framework-specific checks:**
- **Next.js**: App Router usage, metadata API, Server Actions
- **NestJS**: Module organization, DI patterns, decorators usage
- **React**: State management, hooks patterns, component composition
- **Express**: Middleware order, error handling, routing organization

---

## Selalu Reference project-readability

Untuk semua observations dan recommendations, **apply taste rules dari project-readability**:

1. ✅ Prefer boring over clever
2. ✅ Feature-first structure
3. ✅ Specific naming
4. ✅ No premature abstraction
5. ✅ Clear error messages
6. ✅ Code optimized for change

Kalau menemukan violations, flag sebagai improvement opportunity.

---

## Example Output (Normal depth)

```markdown
# Codebase Exploration: MyApp

## Project Overview
- **Framework**: Next.js 14.2.1 (App Router)
- **Language**: TypeScript 5.3
- **Key Dependencies**: 
  - Prisma (ORM)
  - NextAuth.js (Auth)
  - TailwindCSS (Styling)
  - React Query (Data fetching)

## Architecture Pattern
**Feature-first with App Router**

The project follows Next.js App Router conventions with feature-based organization under `src/features/`. Each feature is self-contained with its own components, server actions, and schemas.

## Folder Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route group: public auth pages
│   ├── (dashboard)/       # Route group: protected dashboard
│   └── api/               # API routes
├── features/
│   ├── auth/              # ✅ Well-organized
│   ├── orders/            # ✅ Self-contained
│   └── products/
├── lib/
│   ├── db.ts              # Prisma client
│   └── utils.ts           # ⚠️ Growing large (245 lines)
└── components/
    └── ui/                # Shadcn components
```

## Core Components

### Authentication (features/auth/)
- **Path**: `src/features/auth/`
- **Responsibility**: User registration, login, session management
- **Stack**: NextAuth.js + Prisma adapter
- **Coverage**: ✅ Well tested (85%)

### Orders (features/orders/)
- **Path**: `src/features/orders/`
- **Responsibility**: Order creation, payment processing, fulfillment
- **Stack**: Stripe integration + Prisma
- **Concerns**: ⚠️ No tests for payment webhook

## Data Flow
```
Request → middleware.ts (auth check)
        ↓
        app/dashboard/orders/page.tsx (RSC)
        ↓
        features/orders/actions.ts (Server Action)
        ↓
        features/orders/service.ts (Business logic)
        ↓
        lib/db.ts (Prisma)
        ↓
        PostgreSQL
```

## Key Observations

### Strengths ✅
1. **Modern Next.js patterns** - Using App Router, Server Components, and Server Actions effectively
2. **Type safety** - Comprehensive TypeScript usage with Zod validation
3. **Feature organization** - Clean separation of concerns per feature

### Concerns ⚠️
1. **lib/utils.ts growing too large** (245 lines) - Contains formatting helpers, validation utilities, and date functions. Should be split.
2. **Missing webhook tests** - Stripe webhook handler has no test coverage
3. **Inconsistent error handling** - Some Server Actions return `{error}`, others throw exceptions

## Recommendations

### Priority 1 (Do This Week)
1. **Split lib/utils.ts** into:
   - `lib/formatters.ts` (currency, date formatting)
   - `lib/validators.ts` (custom Zod schemas)
   - `features/*/utils.ts` (feature-specific helpers)

2. **Standardize Server Action responses**:
   ```ts
   // Current (inconsistent):
   if (error) return { error: 'Failed' }
   if (error) throw new Error('Failed')
   
   // Recommended:
   type ActionResult<T> = 
     | { success: true; data: T }
     | { success: false; error: string }
   ```

3. **Add Stripe webhook tests** - Critical for payment integrity

### Priority 2 (This Month)
4. Add error boundary untuk better UX di dashboard
5. Implement request logging untuk debugging production issues
6. Add Sentry or similar untuk error tracking

### Nice to Have
7. Extract repeated Tailwind patterns into components
8. Add Storybook untuk UI component documentation
```

---

## Summary

Codebase Explorer = **peta sebelum jalan**.

Jangan skip step ini kalau project unfamiliar - 10-15 menit exploration bisa save hours of confusion later.

Selalu prioritize understanding over speed. Better to spend time mapping architecture dulu than repeatedly hitting dead ends karena salah asumsi.
