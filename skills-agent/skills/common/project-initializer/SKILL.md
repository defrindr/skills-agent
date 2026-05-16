---
name: project-initializer
description: |
  Guide project initialization dengan best practices dari project-readability.
  Gathers project specs FIRST (scale, tech, architecture) sebelum recommend solution.
  Prevents token waste dengan requirements gathering upfront.
  
  Trigger phrases:
  - "init new project"
  - "create new app"
  - "setup new nextjs"
  - "initialize project"
  - "start new project"
  
  Supported frameworks:
  - Next.js, React, Vue, Nuxt, Svelte (frontend)
  - NestJS, Express, Fastify (Node.js backend)
  - Laravel (PHP)
  - FastAPI, Django (Python)
  - Gin, Fiber, Echo (Go)
  - Flutter (mobile)
  - React Native, Expo (mobile)

default_provider: deepseek
complexity: simple
---

# Project Initializer

Goal: Guide user untuk initialize project baru dengan **gathering specs FIRST**, then provide tailored recommendations.

## Prinsip Utama

**SPEC GATHERING FIRST!**

Don't assume. Ask questions BEFORE recommending:
1. **Scale**: MVP, startup, enterprise?
2. **Tech stack**: Frontend? Backend? Full-stack?
3. **Features**: Auth, DB, payments, real-time?
4. **Team**: Solo, small team, large org?
5. **Timeline**: Prototype, production-ready?

**Then recommend**:
1. Official CLI tools (create-next-app, nest new, etc.)
2. Project structure sesuai project-readability
3. Setup commands untuk features
4. Explain reasoning behind recommendations

## Phase 1: Requirements Gathering

### Questions to Ask

**ALWAYS ask these if not provided:**

```
Before I recommend the best setup, let me understand your needs:

1. **Project Type**
   - Frontend only? Backend only? Full-stack?
   - Web app? Mobile app? API?

2. **Scale & Complexity**
   - MVP/prototype (quick start)?
   - Startup (scalable, room to grow)?
   - Enterprise (team collaboration, strict patterns)?

3. **Core Features**
   - Authentication? (social login, magic link, etc.)
   - Database? (which one: PostgreSQL, MongoDB, etc.)
   - Real-time? (websockets, subscriptions)
   - Payments? File uploads? Email?

4. **Tech Preferences**
   - Framework preference? (or should I recommend?)
   - Styling? (Tailwind, CSS modules, Styled Components)
   - State management? (if applicable)

5. **Team & Timeline**
   - Solo dev or team?
   - Quick prototype or production-ready?
   - Deployment target? (Vercel, AWS, Docker)
```

### Conditional Questions

**If frontend:**
- SSR needed? (SEO, performance)
- Mobile-first? Desktop-first?
- PWA requirements?

**If backend:**
- REST or GraphQL?
- Microservices or monolith?
- Queue/background jobs needed?

**If full-stack:**
- Monorepo or separate repos?
- Shared types between FE/BE?

### Why This Matters

**Example: "init nextjs project"**

❌ **Bad (old way):**
```
Run: npx create-next-app@latest
Add features/, shared/ folders
Here are 20 commands for every possible feature...
```
(Wasted tokens if user just needs basic SSG blog)

✅ **Good (new way):**
```
Before recommending setup, tell me:
1. Is this a blog, SaaS app, or something else?
2. Do you need auth? Database?
3. SSR or SSG (static)?
4. Solo project or team?

This helps me recommend the EXACT setup you need, saving time and avoiding unnecessary complexity.
```

## Phase 2: Tailored Recommendations

After gathering specs, provide recommendations based on:

### Decision Matrix

**Scale-based:**
- **MVP**: Minimal setup, fastest path to working app
- **Startup**: Balance speed + maintainability, room to grow
- **Enterprise**: Full patterns, team collaboration, strict structure

**Feature-based:**
- Auth needed → recommend NextAuth/Clerk/Supabase
- DB needed → recommend Prisma/Drizzle + hosting
- Real-time → recommend Pusher/Ably/WebSockets setup

**Team-based:**
- Solo → simpler structure, less ceremony
- Team → stricter patterns, more docs, CI/CD

### Response Template

```markdown
# Project Setup: [Project Name]

Based on your requirements:
- Type: [Full-stack SaaS]
- Scale: [Startup - scalable]
- Features: [Auth, PostgreSQL, payments]
- Team: [Solo → small team]

## Recommended Stack

**Frontend**: Next.js 15 (App Router)
Why: SSR for SEO, React ecosystem, Vercel deployment

**Backend**: Next.js API Routes (same repo)
Why: Simpler for solo dev, share types, deploy together

**Database**: PostgreSQL + Prisma
Why: Relational data, type-safe queries, migrations

**Auth**: Clerk
Why: Fastest to integrate, handles UI, scales well

**Payments**: Stripe
Why: Industry standard, great DX

## Step 1: Initialize

[Specific commands based on choices]

## Step 2: Structure

[Recommended folders based on scale + features]

## Step 3: Add Features

[Only show commands for requested features]

## Cost Estimate

[Quick estimate based on stack choices]

## Next Steps

[Specific to their timeline + goals]
```

## Phase 3: Provide Setup Commands

Only provide commands for **requested features** and **chosen stack**.

### Official Tools (Always Recommend)

```bash
# Next.js
npx create-next-app@latest my-app --typescript --tailwind --app

# NestJS
nest new my-app

# React + Vite
npm create vite@latest my-app -- --template react-ts

# Express
mkdir my-app && cd my-app && npm init -y
npm install express typescript @types/node @types/express

# Flutter
flutter create my_app

# React Native + Expo
npx create-expo-app my-app
```

**Why?** Official tools = up-to-date, maintained, community-vetted.

### Structure Guidance

**Adjust based on scale:**

**MVP (minimal):**
```
src/
├── app/          # Framework folder
├── lib/          # Utilities
└── components/   # Shared components
```

**Startup (feature-first):**
```
src/
├── app/          # Framework folder
├── features/     # Feature modules
│   ├── auth/
│   └── posts/
├── shared/       # Shared code
│   ├── components/
│   └── lib/
└── config/
```

**Enterprise (domain-driven):**
```
src/
├── app/                # Framework folder
├── domains/            # Business domains
│   ├── user/
│   │   ├── features/
│   │   ├── entities/
│   │   └── services/
│   └── billing/
├── shared/
│   ├── infrastructure/
│   └── utils/
└── config/
```

### Feature Commands (Conditional)

**Only include if user requested!**

**Auth:**
```bash
# If Next.js + simple
npm install next-auth@beta

# If scalable + managed
npm install @clerk/nextjs

# If full control
npm install lucia
```

**Database:**
```bash
# If PostgreSQL + type-safe
npm install @prisma/client
npm install -D prisma
npx prisma init

# If MongoDB
npm install mongoose
```

**Styling:**
```bash
# If Tailwind (already in create-next-app)
# Nothing needed

# If shadcn/ui
npx shadcn-ui@latest init

# If Styled Components
npm install styled-components
```

## Real-World Examples

### Example 1: MVP Blog (Minimal)

## Real-World Examples

### Example 1: Insufficient Info

**User:** "init nextjs project"

**Response:**
```
Before I recommend the best setup, let me understand your needs:

1. **What are you building?**
   - Blog/content site?
   - SaaS app?
   - E-commerce?
   - Something else?

2. **Do you need:**
   - Authentication?
   - Database? (which one?)
   - Payments?
   - Real-time features?

3. **Scale & Timeline:**
   - Quick MVP/prototype?
   - Production-ready startup?
   - Team collaboration?

This helps me give you EXACTLY what you need, not a kitchen-sink setup.
```

### Example 2: Clear Specs Provided

**User:** "init nextjs saas app with clerk auth, postgres, and stripe. solo dev, startup scale"

**Response:**
```
# Project Setup: Next.js SaaS

Based on your requirements:
- Type: Full-stack SaaS
- Scale: Startup (scalable)
- Features: Clerk auth, PostgreSQL, Stripe
- Team: Solo dev

## Recommended Stack

✅ **Next.js 15** (App Router, TypeScript, Tailwind)
   Why: SSR for SEO, full-stack in one repo, easy Vercel deploy

✅ **Clerk** (already chosen)
   Why: Handles auth UI, user management, webhooks

✅ **PostgreSQL + Prisma**
   Why: Relational data for billing, type-safe queries

✅ **Stripe**
   Why: Payment processing, subscriptions

## Step 1: Initialize Project

npx create-next-app@latest my-saas \
  --typescript \
  --tailwind \
  --app \
  --eslint

cd my-saas

## Step 2: Project Structure

mkdir -p src/features/{auth,billing,dashboard} src/shared/{components,lib}

Structure:
  src/
  ├── app/              # Next.js App Router
  ├── features/
  │   ├── auth/        # Auth-related pages/components
  │   ├── billing/     # Stripe integration
  │   └── dashboard/   # User dashboard
  └── shared/
      ├── components/  # Shared UI
      └── lib/         # Utilities

## Step 3: Add Clerk Auth

npm install @clerk/nextjs

Create .env.local:
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
  CLERK_SECRET_KEY=sk_test_xxx

Wrap app/layout.tsx with ClerkProvider.
Guide: https://clerk.com/docs/quickstarts/nextjs

## Step 4: Add Database

npm install @prisma/client
npm install -D prisma

npx prisma init

Edit .env:
  DATABASE_URL="postgresql://user:pass@localhost:5432/mysaas"

Create models in prisma/schema.prisma:
  - User (synced from Clerk via webhook)
  - Subscription
  - Usage metrics

npx prisma generate
npx prisma db push

## Step 5: Add Stripe

npm install stripe @stripe/stripe-js

Create lib/stripe.ts for server-side
Create API route: app/api/webhooks/stripe/route.ts

Setup webhooks in Stripe dashboard.
Guide: https://stripe.com/docs/billing/subscriptions/build-subscriptions

## Estimated Timeline

- Day 1: Init + structure + auth (2-3 hours)
- Day 2: Database + Prisma models (2 hours)
- Day 3: Stripe integration (3-4 hours)
- Day 4: Dashboard UI (4 hours)

## Next Steps

1. Start with: npm run dev
2. Setup Clerk (10 min)
3. Design database schema
4. Implement billing flow

Need help implementing any feature? Just ask!
```

### Example 3: Team Enterprise Project

**User:** "init nestjs api for team of 5 devs, enterprise scale, needs auth, postgres, redis, docker"

**Response:**
```
# Project Setup: NestJS Enterprise API

Based on your requirements:
- Type: Backend API
- Scale: Enterprise (team of 5)
- Features: Auth, PostgreSQL, Redis, Docker
- Team: 5 developers

## Recommended Stack

✅ **NestJS** (TypeScript, modular)
   Why: Enterprise patterns, DI, testable, team-friendly

✅ **PostgreSQL + TypeORM**
   Why: Relational, migrations, team can review schema changes

✅ **Redis**
   Why: Caching, sessions, pub/sub

✅ **JWT Auth**
   Why: Stateless, scalable, standard

✅ **Docker + docker-compose**
   Why: Consistent dev environments across team

## Step 1: Initialize

npm i -g @nestjs/cli
nest new my-api

Choose npm (team standard).

## Step 2: Structure (Team Collaboration)

cd my-api

# Create feature modules
nest g module features/auth
nest g module features/users
nest g module shared

mkdir -p src/shared/{guards,decorators,filters,interceptors}

Structure:
  src/
  ├── features/          # Feature modules
  │   ├── auth/
  │   │   ├── auth.controller.ts
  │   │   ├── auth.service.ts
  │   │   ├── auth.module.ts
  │   │   ├── dto/      # Request/response DTOs
  │   │   ├── entities/ # TypeORM entities
  │   │   └── guards/   # Feature-specific guards
  │   └── users/
  ├── shared/            # Shared across features
  │   ├── guards/
  │   ├── decorators/
  │   ├── filters/
  │   └── interceptors/
  ├── config/            # Env config
  └── database/          # Migrations, seeds

## Step 3: Add Dependencies

# Database
npm install @nestjs/typeorm typeorm pg

# Redis
npm install @nestjs/redis ioredis

# Auth
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
npm install -D @types/passport-jwt @types/bcrypt

# Validation
npm install class-validator class-transformer

## Step 4: Docker Setup

Create docker-compose.yml:

version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: myapi
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: devpass
    ports:
      - 5432:5432
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - 6379:6379

  api:
    build: .
    ports:
      - 3000:3000
    depends_on:
      - postgres
      - redis
    env_file: .env

volumes:
  postgres_data:

Create Dockerfile:

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["npm", "run", "start:prod"]

## Step 5: Team Setup

# Add to package.json scripts:
"docker:up": "docker-compose up -d"
"docker:down": "docker-compose down"
"db:migrate": "npm run typeorm migration:run"
"db:seed": "ts-node src/database/seed.ts"

# Create .env.example for team:
DATABASE_URL=postgresql://dev:devpass@localhost:5432/myapi
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Add to README.md:
## Setup
1. cp .env.example .env
2. npm install
3. npm run docker:up
4. npm run db:migrate
5. npm run start:dev

## Step 6: CI/CD (Team Collaboration)

Create .github/workflows/ci.yml:

name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build

## Estimated Timeline

- Day 1: Init + structure + Docker (3 hours, 1 dev)
- Day 2: Auth module (1 day, 2 devs)
- Day 3-4: Core features (2 days, all devs)
- Day 5: Testing + docs (1 day, all devs)

## Team Workflow

1. Each dev works on separate feature module
2. PRs require 1 approval
3. Run tests before commit
4. Document API with @nestjs/swagger

## Next Steps

1. Setup project: npm run docker:up
2. Assign features to team members
3. Create Jira/Linear tickets per module
4. Start with auth module (critical path)

Need help with specific module implementation?
```

### Example 4: Quick MVP

**User:** "init react app, just a landing page, need it fast"

**Response:**
```
# Quick MVP: React Landing Page

Based on your requirements:
- Type: Static landing page
- Scale: MVP (fast!)
- Features: None (just content)

## Fastest Setup

npx create-vite@latest my-landing -- --template react-ts
cd my-landing
npm install

## Add Tailwind (for quick styling)

npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

Edit src/index.css (replace all):
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

## Minimal Structure

src/
├── App.tsx         # Keep simple, no routing needed
├── components/     # Add as you go
└── assets/         # Images, etc.

## Timeline

- Next 30 min: Build landing page in App.tsx
- Deploy: Push to GitHub → import to Vercel (5 min)

## Next Steps

1. npm run dev
2. Edit src/App.tsx
3. Deploy to Vercel when ready

No features, no complexity. Ship fast! 🚀
```

## Decision Trees

### When User Provides Minimal Info

```
User says: "init nextjs"
├─ Ask: Project type?
├─ Ask: Features needed?
├─ Ask: Scale?
└─ Then: Provide tailored setup
```

### When User Provides Full Specs

```
User says: "init nextjs saas, clerk, postgres"
├─ Confirm understanding
├─ Recommend stack
├─ Provide commands
└─ Explain reasoning
```

## Token Optimization

### Old Way (wasteful):
```
User: "init nextjs"
AI: *Provides 50 commands for every possible feature*
     *Shows auth, DB, Redis, Docker, CI/CD, etc.*
     Cost: ~3000 tokens
```

### New Way (efficient):
```
User: "init nextjs"
AI: *Asks 5 questions*
     Cost: ~200 tokens

User: "mvp blog, no auth needed"
AI: *Provides only blog setup*
     Cost: ~500 tokens

Total: ~700 tokens (78% reduction!)
```

## Key Rules

### DO:
- ✅ Ask questions if specs unclear
- ✅ Tailor recommendations to scale
- ✅ Only show commands for requested features
- ✅ Explain reasoning (briefly)
- ✅ Link to official docs
- ✅ Estimate timeline
- ✅ Consider team size

### DON'T:
- ❌ Assume requirements
- ❌ Provide kitchen-sink setup
- ❌ Generate full code files
- ❌ Override framework conventions
- ❌ Make tech choices without context
- ❌ Install unnecessary dependencies

## Summary

Project initializer is **requirements-driven**:

1. **Gather specs** (scale, features, team, timeline)
2. **Recommend stack** (based on specs)
3. **Provide commands** (only what's needed)
4. **Explain reasoning** (briefly)
5. **Estimate timeline** (realistic)

**Result**: Tailored setup, no wasted tokens, faster development.
