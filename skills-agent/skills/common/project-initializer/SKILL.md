---
name: project-initializer
description: |
  Guide project initialization dengan best practices dari project-readability.
  Gathers project specs FIRST (scale, tech, architecture) sebelum recommend solution.
  Prevents token waste dengan requirements gathering upfront.
  Trigger: "init new project", "create new app", "setup new nextjs",
  "initialize project", "start new project".
  Supported: Next.js, React, Vue, Nuxt, Svelte, NestJS, Express, Fastify,
  Laravel, FastAPI, Django, Gin, Fiber, Echo, Flutter, React Native, Expo.
---

# Project Initializer

Spec gathering first. Don't assume. Ask questions BEFORE recommending.

---

## Phase 1: Requirements Gathering

Always ask: project type, scale (MVP/startup/enterprise), core features (auth, DB, payments, real-time), tech preferences, team (solo/team), timeline.

```
Before I recommend setup:
1. Project Type — frontend/backend/fullstack? web/mobile/API?
2. Scale — MVP (quick), startup (scalable), enterprise (team)?
3. Core Features — auth? database? payments? real-time?
4. Tech Preferences — framework? styling? state management?
5. Team & Timeline — solo or team? prototype or production?
```

---

## Phase 2: Tailored Recommendations

| Factor | MVP | Startup | Enterprise |
|--------|-----|---------|------------|
| Structure | Minimal (lib/, components/) | Feature-first (features/, shared/) | Domain-driven (domains/) |
| Auth | next-auth simple | Clerk/Supabase | Custom + SSO |
| DB | Prisma quick | Prisma + pooling | Sharding + replicas |

### Response Template
```
## Recommended Stack
Frontend: [framework] — Why: [reason]
Backend: [framework] — Why: [reason]
Database: [DB + ORM] — Why: [reason]
Auth: [solution] — Why: [reason]

## Steps
1. [init command]
2. [structure]
3. [feature commands]
```

---

## Phase 3: Setup Commands — Only for Requested Features

### Official Init Tools
```bash
npx create-next-app@latest my-app --typescript --tailwind --app   # Next.js
nest new my-app                                                     # NestJS
npm create vite@latest my-app -- --template react-ts                # React
flutter create my_app                                               # Flutter
npx create-expo-app my-app                                          # React Native
```

### Conditional Feature Commands
```bash
# Auth (if requested)
npm install next-auth@beta     # Next.js simple
npm install @clerk/nextjs      # Managed

# Database (if requested)
npm install @prisma/client && npm install -D prisma && npx prisma init

# Styling (if requested)
npx shadcn-ui@latest init     # shadcn/ui
npm install styled-components  # CSS-in-JS
```

### Structure — Scale-Aware

**MVP:** `src/{app, lib, components}`
**Startup:** `src/{app, features/{auth,billing,dashboard}, shared/{components,lib}}`
**Enterprise:** `src/{app, domains/{user,billing}, shared/{infrastructure,utils}}`

---

## Token Optimization

Don't provide 50 commands for every possible feature. Ask first, then show only what's needed.

| Approach | Tokens |
|----------|--------|
| Kitchen-sink (old) | ~3000 |
| Ask + tailored (new) | ~700 (78% reduction) |

---

## Key Rules

- Ask questions if specs unclear — don't assume
- Tailor recommendations to scale
- Only show commands for requested features
- Explain reasoning briefly
- Link to official docs
- No kitchen-sink setup, no full code files, no unnecessary dependencies

## Referensi

- Naming & structure → `project-readability`
- Framework specifics → `*-readability` masing-masing
- Code audit → `code-health`
