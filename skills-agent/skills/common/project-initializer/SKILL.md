---
name: project-initializer
description: |
  Guide project initialization dengan best practices dari project-readability.
  Provides commands dan structure recommendations berdasarkan framework.
  
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

Goal: Guide user untuk initialize project baru dengan best practices dari `project-readability`, tanpa hardcoded templates.

## Prinsip Utama

**NO HARDCODED TEMPLATES!** 

Ini bukan code generator. Ini adalah **guide** yang:
1. Recommend official CLI tools (create-next-app, nest new, etc.)
2. Suggest project structure sesuai project-readability
3. Provide setup commands untuk features
4. Explain reasoning behind recommendations

## Approach

### 1. Use Official Tools First

Always recommend official framework CLI:

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
```

**Why?** Official tools = up-to-date, maintained, community-vetted.

### 2. Structure Guidance (Post-Init)

After official tool, suggest structure adjustments:

#### Feature-First Structure

```
my-app/
├── app/                # Next.js App Router (atau pages/ untuk Pages Router)
├── features/           # Feature modules (ADD THIS)
│   ├── auth/
│   │   ├── components/
│   │   ├── actions.ts  # Server actions
│   │   ├── schema.ts   # Validation
│   │   └── types.ts
│   └── posts/
├── shared/             # Shared code (ADD THIS)
│   ├── components/
│   ├── lib/
│   └── types/
└── public/
```

**Key adjustments:**
- Add `features/` for feature modules
- Add `shared/` for shared code
- Keep framework folders (`app/`, `pages/`, `src/`) as-is

### 3. Feature Setup Commands

Provide specific commands, not generated code:

**Authentication:**
```bash
# Next.js
npm install next-auth@beta
npx auth secret

# Create: app/api/auth/[...nextauth]/route.ts
# Follow: https://authjs.dev/getting-started/installation
```

**Database (Prisma):**
```bash
npm install @prisma/client
npm install -D prisma

npx prisma init
# Edit prisma/schema.prisma
npx prisma generate
npx prisma db push
```

**Docker:**
```bash
# Create Dockerfile, docker-compose.yml
# Provide sample configs (inline, not files)
```

## Framework-Specific Guidance

### Next.js

**Init command:**
```bash
npx create-next-app@latest my-app \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --src-dir
```

**Structure adjustments:**
```
src/
├── app/              # App Router (keep)
├── features/         # ADD: Feature modules
└── shared/           # ADD: Shared code
```

**Reasoning:**
- Use App Router (modern, recommended)
- TypeScript (type safety)
- Tailwind (utility-first, productive)
- src-dir (cleaner root)

**Feature additions:**

*Auth:*
```bash
npm install next-auth@beta @auth/prisma-adapter
# Create: src/lib/auth.ts
# Create: src/app/api/auth/[...nextauth]/route.ts
```

*Database:*
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### NestJS

**Init command:**
```bash
nest new my-app
cd my-app
```

**Structure adjustments:**
```
src/
├── features/         # ADD: Feature modules
│   ├── users/
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.module.ts
│   │   ├── dto/
│   │   └── entities/
│   └── auth/
├── shared/           # ADD: Shared code
│   ├── guards/
│   ├── decorators/
│   ├── filters/
│   └── interceptors/
└── config/
```

**Reasoning:**
- Feature modules over CRUD generators
- Shared code centralized
- DI pattern (NestJS built-in)

**Feature additions:**

*Auth:*
```bash
npm install @nestjs/passport passport passport-local
npm install @nestjs/jwt passport-jwt
npm install bcrypt
npm install -D @types/passport-local @types/passport-jwt @types/bcrypt

nest g module features/auth
nest g service features/auth
nest g controller features/auth
```

*Database (TypeORM):*
```bash
npm install @nestjs/typeorm typeorm pg
# Create ormconfig.ts
```

### React + Vite

**Init command:**
```bash
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install
```

**Structure adjustments:**
```
src/
├── features/         # ADD: Feature modules
├── shared/           # ADD: Shared code
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── types/
└── App.tsx
```

**Add router:**
```bash
npm install react-router-dom
```

**Add styling:**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Express.js

**Init command:**
```bash
mkdir my-app && cd my-app
npm init -y
npm install express
npm install -D typescript @types/node @types/express ts-node nodemon

npx tsc --init
```

**Structure (create manually):**
```
src/
├── features/
│   └── health/
│       ├── health.controller.ts
│       ├── health.service.ts
│       └── health.routes.ts
├── shared/
│   ├── middleware/
│   ├── utils/
│   └── types/
├── config/
└── index.ts
```

**Feature additions:**

*Validation:*
```bash
npm install zod
```

*Database (Prisma):*
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

## Response Format

When user requests init, provide:

### 1. Quick Start Section
```
# Quick Start

Run this command:
  npx create-next-app@latest my-app --typescript --app

This will:
  - Create Next.js 14 project
  - Setup TypeScript
  - Configure App Router
  - Add ESLint
```

### 2. Structure Adjustments
```
# Recommended Structure Adjustments

After init, create these folders:

  mkdir -p src/features src/shared/components src/shared/lib

Why?
  - features/ = feature-first architecture
  - shared/ = reusable code
  - Keeps framework folders unchanged
```

### 3. Feature Setup (if requested)
```
# Adding Authentication

Install dependencies:
  npm install next-auth@beta

Create auth config:
  src/lib/auth.ts (see https://authjs.dev)

Create API route:
  src/app/api/auth/[...nextauth]/route.ts

Full guide: https://authjs.dev/getting-started
```

### 4. Next Steps
```
# Next Steps

1. cd my-app && npm run dev
2. Open http://localhost:3000
3. Start building in src/features/

Need help?
  - Add feature: "implement user login"
  - Explore: "analyze this codebase"
  - Setup: "add database with Prisma"
```

## Key Rules

### DO:
- ✅ Recommend official CLI tools
- ✅ Provide specific commands
- ✅ Explain reasoning
- ✅ Link to official docs
- ✅ Suggest structure adjustments
- ✅ Follow project-readability principles

### DON'T:
- ❌ Generate full code files
- ❌ Create custom templates
- ❌ Override framework conventions
- ❌ Make opinionated tech choices (unless asked)
- ❌ Install unnecessary dependencies

## Examples

### Example 1: Basic Next.js

**User:** "init new nextjs project called my-blog"

**Response:**
```
# Initialize Next.js Project: my-blog

## Quick Start

npx create-next-app@latest my-blog \
  --typescript \
  --tailwind \
  --app \
  --eslint

This creates a Next.js 14 project with:
- TypeScript (type safety)
- Tailwind CSS (styling)
- App Router (modern routing)
- ESLint (code quality)

## Recommended Structure

After init, add these folders:

mkdir -p src/features src/shared/components src/shared/lib

Structure:
  src/
  ├── app/              # Next.js App Router
  ├── features/         # Feature modules (blog posts, comments, etc.)
  └── shared/           # Reusable components & utilities

Why? Feature-first architecture from project-readability.

## Next Steps

1. cd my-blog
2. npm run dev
3. Create your first feature: mkdir -p src/features/posts

Ready to build! Need help implementing features?
```

### Example 2: Next.js with Auth + DB

**User:** "init nextjs project with auth and postgres"

**Response:**
```
# Initialize Next.js Project with Auth & Database

## Step 1: Create Project

npx create-next-app@latest my-app --typescript --app --tailwind

## Step 2: Add Structure

cd my-app
mkdir -p src/features src/shared/lib

## Step 3: Setup Database (Prisma + PostgreSQL)

npm install @prisma/client
npm install -D prisma

npx prisma init

This creates:
- prisma/schema.prisma (edit database schema here)
- .env (add DATABASE_URL)

Edit .env:
  DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"

## Step 4: Setup Authentication (NextAuth.js)

npm install next-auth@beta @auth/prisma-adapter

Create auth config:
  src/lib/auth.ts

Create API route:
  src/app/api/auth/[...nextauth]/route.ts

Full guide: https://authjs.dev/getting-started/installation

## Step 5: Create User Model

Edit prisma/schema.prisma, add User model, then:

npx prisma generate
npx prisma db push

## Next Steps

1. npm run dev
2. Visit http://localhost:3000
3. Implement login UI in src/features/auth/

Want me to help implement the auth UI?
```

### Example 3: NestJS API

**User:** "init nestjs api"

**Response:**
```
# Initialize NestJS API

## Quick Start

npm i -g @nestjs/cli
nest new my-api

Choose package manager (npm recommended).

## Recommended Structure

After init, organize by features:

nest g module features/users
nest g module features/auth
nest g module features/posts

Create shared folder:
  mkdir -p src/shared/{guards,decorators,filters}

Structure:
  src/
  ├── features/        # Feature modules
  │   ├── users/
  │   ├── auth/
  │   └── posts/
  ├── shared/          # Shared code
  │   ├── guards/
  │   └── decorators/
  └── config/

Why? Feature-first, not CRUD generators.

## Next Steps

1. cd my-api
2. npm run start:dev
3. Visit http://localhost:3000

Need database? Ask: "add postgres to nestjs"
```

## Token Optimization

Keep responses concise:
- Commands first, explanation second
- Link to docs instead of repeating them
- Focus on "what" and "why", not "how" (docs cover that)
- ~500-1000 tokens per response (not 5000!)

## Cost Estimate

Using DeepSeek (free tier):
- Average response: ~800 tokens
- Cost: ~$0.001 per init
- Very affordable

## Summary

Project initializer is a **guide**, not a **generator**:
- Recommends official tools
- Suggests structure adjustments
- Provides setup commands
- Links to documentation
- Follows project-readability principles

NO hardcoded templates. Just smart guidance based on framework skills.
