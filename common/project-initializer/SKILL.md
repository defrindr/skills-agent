---
name: project-initializer
description: |
  Initialize project baru dengan best practices dari project-readability.
  
  Trigger phrases:
  - "init new project"
  - "create new app"
  - "scaffold nextjs"
  - "setup new nestjs"
  - "initialize react project"
  - "start new project with"
  - "generate project structure"
  
  Supports:
  - Next.js (App Router)
  - NestJS
  - React + Vite
  - Express.js
  - FastAPI
  - Laravel
  - Go (Gin/Fiber)
  - Flutter
  - React Native
  
  Features (optional):
  - Authentication
  - Database (Prisma, Drizzle, TypeORM)
  - Docker setup
  - Testing (Jest, Vitest, Playwright)
  - CI/CD (GitHub Actions)

default_provider: deepseek
complexity: medium
providers:
  - name: deepseek
    cost_cap: 0.30
  - name: groq-mixtral
    cost_cap: 0
  - name: claude-sonnet
    cost_cap: 0.50
fallback_enabled: true
max_retries: 2
---

# Project Initializer

Goal: Generate struktur project baru yang follows best practices dari `project-readability`, dengan setup lengkap siap pakai.

## Prinsip Utama

Semua project yang di-generate HARUS follow principles dari `project-readability`:

1. **Boring > Clever** - Gunakan patterns yang familiar dan mudah dipahami
2. **Feature-first structure** - Organize by feature, bukan by type
3. **Explicit > Implicit** - Clear naming, no magic
4. **One way to do things** - Consistency over flexibility
5. **Flat is better than nested** - Max 3 levels deep
6. **Colocation** - Related code stays together

## Template Selection

Ketika user request init project, detect atau ask:

1. **Framework/stack** - Next.js? NestJS? React? Express?
2. **Features wanted** - Auth? DB? Docker? Testing?
3. **Project name** - Default to folder name

Example user inputs:
```
"init new Next.js project with auth and postgres"
"create NestJS API with MongoDB and Docker"
"scaffold React app with Vite"
"setup Express.js with TypeScript"
```

Parse menjadi:
```typescript
{
  framework: "nextjs",
  name: "my-app",
  features: ["auth", "postgres"],
  typescript: true
}
```

## Universal Structure

Semua project punya base structure ini:

```
project-name/
├── .env.example              # ENV vars template
├── .gitignore                # Git ignore rules
├── README.md                 # Project-specific docs
├── package.json / requirements.txt / go.mod
├── tsconfig.json / pyproject.toml / etc
└── [framework-specific folders]
```

## Next.js Template

### Base Structure

```
nextjs-app/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── app/
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   ├── globals.css           # Global styles
│   └── api/                  # API routes (optional)
│       └── health/route.ts
├── features/                 # Feature-first structure
│   └── home/
│       ├── components/
│       │   └── hero.tsx
│       └── actions.ts
├── shared/                   # Shared utilities
│   ├── components/           # Reusable components
│   │   ├── button.tsx
│   │   └── input.tsx
│   ├── lib/
│   │   ├── utils.ts
│   │   └── constants.ts
│   └── types/
│       └── common.ts
└── public/
    └── favicon.ico
```

### With Authentication

```
+ features/
    └── auth/
        ├── components/
        │   ├── login-form.tsx
        │   ├── register-form.tsx
        │   └── auth-provider.tsx
        ├── actions.ts           # Server actions
        ├── schema.ts            # Zod validation
        └── types.ts
+ app/
    └── (auth)/              # Route group
        ├── login/page.tsx
        └── register/page.tsx
+ shared/
    └── lib/
        └── auth.ts          # Auth utilities
```

### With Database

```
+ prisma/
    ├── schema.prisma
    └── seed.ts
+ shared/
    └── lib/
        └── db.ts           # Prisma client
```

### With Docker

```
+ Dockerfile
+ docker-compose.yml
+ .dockerignore
```

### package.json Template

```json
{
  "name": "{{PROJECT_NAME}}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "react-dom": "18.3.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "14.2.0"
  }
}
```

Add conditional dependencies:
- **Auth:** `next-auth@beta`, `@auth/prisma-adapter`
- **DB (Prisma):** `@prisma/client`, `prisma` (dev)
- **DB (Drizzle):** `drizzle-orm`, `drizzle-kit` (dev)
- **Validation:** `zod`
- **Styling:** `tailwindcss`, `autoprefixer`, `postcss`
- **Testing:** `jest`, `@testing-library/react`, `@testing-library/jest-dom`

## NestJS Template

### Base Structure

```
nestjs-api/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── nest-cli.json
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── features/            # Feature modules
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── health.module.ts
│   ├── shared/              # Shared code
│   │   ├── dto/
│   │   ├── guards/
│   │   ├── decorators/
│   │   ├── filters/
│   │   └── interceptors/
│   └── config/
│       ├── database.config.ts
│       └── app.config.ts
└── test/
    ├── app.e2e-spec.ts
    └── jest-e2e.json
```

### With Auth

```
+ src/
    └── features/
        └── auth/
            ├── auth.controller.ts
            ├── auth.service.ts
            ├── auth.module.ts
            ├── dto/
            │   ├── login.dto.ts
            │   └── register.dto.ts
            ├── guards/
            │   └── jwt.guard.ts
            └── strategies/
                └── jwt.strategy.ts
```

### With Database (TypeORM)

```
+ src/
    └── shared/
        └── entities/
            └── base.entity.ts
+ ormconfig.ts
```

## React + Vite Template

```
react-app/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── features/
│   │   └── home/
│   │       ├── components/
│   │       │   └── hero.tsx
│   │       └── home-page.tsx
│   ├── shared/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── types/
│   └── styles/
│       └── index.css
└── public/
```

## Express.js Template

```
express-api/
├── .env.example
├── .gitignore
├── README.md
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── features/
│   │   └── health/
│   │       ├── health.controller.ts
│   │       ├── health.service.ts
│   │       └── health.routes.ts
│   ├── shared/
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── types/
│   └── config/
│       └── database.ts
└── tests/
```

## File Generation Guidelines

### 1. Configuration Files

#### .gitignore
```
node_modules/
dist/
build/
.env
.env.local
*.log
.DS_Store
coverage/
.next/
out/
```

#### .env.example
```
# App
NODE_ENV=development
PORT=3000

# Database (if DB feature enabled)
DATABASE_URL=postgresql://user:pass@localhost:5432/dbname

# Auth (if auth feature enabled)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
```

#### README.md Template

```markdown
# {{PROJECT_NAME}}

{{FRAMEWORK}} project initialized dengan Skills Agent.

## Tech Stack

- {{FRAMEWORK}} {{VERSION}}
{{#if AUTH}}- Authentication: {{AUTH_LIB}}{{/if}}
{{#if DB}}- Database: {{DB_TYPE}} dengan {{ORM}}{{/if}}
{{#if DOCKER}}- Docker & docker-compose{{/if}}

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Copy environment variables:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. {{#if DB}}Setup database:
   \`\`\`bash
   npx prisma generate
   npx prisma db push
   \`\`\`
   {{/if}}

4. Run development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Project Structure

Follows feature-first architecture dari project-readability:

- \`features/\` - Feature modules (auth, users, posts, etc.)
- \`shared/\` - Shared code (components, utils, types)
- \`app/\` - Next.js App Router pages (Next.js only)

## Development

- \`npm run dev\` - Start dev server
- \`npm run build\` - Build for production
- \`npm run lint\` - Run linter
- \`npm run type-check\` - Check TypeScript types
{{#if TEST}}- \`npm test\` - Run tests{{/if}}

## Learn More

- [Project Readability Guide](../project-readability/)
- [{{FRAMEWORK}} Docs]({{FRAMEWORK_DOCS_URL}})
```

### 2. Starter Code Files

#### Next.js app/layout.tsx

```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "{{PROJECT_NAME}}",
  description: "Generated with Skills Agent",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### Next.js app/page.tsx

```typescript
export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-4xl font-bold">Welcome to {{PROJECT_NAME}}</h1>
      <p className="mt-4 text-gray-600">
        Your Next.js app is ready. Start building in features/
      </p>
    </main>
  );
}
```

#### NestJS src/main.ts

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));
  
  app.enableCors();
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 App running on http://localhost:${port}`);
}

bootstrap();
```

## Docker Templates

### Dockerfile (Next.js)

```dockerfile
FROM node:20-alpine AS base

# Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      - db
    restart: unless-stopped

  {{#if DB_POSTGRES}}
  db:
    image: postgres:16-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB={{PROJECT_NAME}}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
  {{/if}}

  {{#if DB_MONGO}}
  db:
    image: mongo:7-alpine
    ports:
      - "27017:27017"
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=admin
      - MONGO_INITDB_DATABASE={{PROJECT_NAME}}
    volumes:
      - mongo_data:/data/db
    restart: unless-stopped
  {{/if}}

volumes:
  {{#if DB_POSTGRES}}postgres_data:{{/if}}
  {{#if DB_MONGO}}mongo_data:{{/if}}
```

## Generation Process

Ketika `init_project` tool dipanggil:

### 1. Parse Input

```typescript
// Input examples:
"init new Next.js project with auth and postgres"
"create NestJS API with MongoDB"
"scaffold React app"

// Parse to:
{
  framework: "nextjs" | "nestjs" | "react-vite" | ...,
  name: "my-app",
  features: ["auth", "postgres"] | ["mongodb"] | [],
  path: "./my-app" // target directory
}
```

### 2. Load Templates

Based on framework, load structure dari template YAML:

```yaml
# templates/nextjs-base.yaml
name: nextjs-base
framework: nextjs
dependencies:
  required:
    - next@14.2.0
    - react@18.3.0
    - react-dom@18.3.0
    - typescript@5
  dev:
    - "@types/node@^20"
    - "@types/react@^18"
    - eslint@^8
    - eslint-config-next@14.2.0

structure:
  - path: app/layout.tsx
    template: nextjs-layout
  - path: app/page.tsx
    template: nextjs-home
  - path: app/globals.css
    template: nextjs-globals-css
  - path: features/.gitkeep
  - path: shared/components/.gitkeep
  - path: shared/lib/.gitkeep
  - path: shared/types/.gitkeep
  - path: public/.gitkeep

configs:
  - name: package.json
    template: nextjs-package-json
  - name: tsconfig.json
    template: nextjs-tsconfig
  - name: next.config.js
    template: nextjs-config
  - name: .gitignore
    template: base-gitignore
  - name: .env.example
    template: nextjs-env
  - name: README.md
    template: nextjs-readme
```

### 3. Add Feature Modules

If features requested:

**Auth:**
```yaml
# templates/features/nextjs-auth.yaml
dependencies:
  - next-auth@beta
  - "@auth/prisma-adapter"
  - zod

structure:
  - path: features/auth/components/login-form.tsx
    template: auth-login-form
  - path: features/auth/components/register-form.tsx
    template: auth-register-form
  - path: features/auth/actions.ts
    template: auth-actions
  - path: features/auth/schema.ts
    template: auth-schema
  - path: app/(auth)/login/page.tsx
    template: auth-login-page
  - path: app/(auth)/register/page.tsx
    template: auth-register-page
  - path: shared/lib/auth.ts
    template: auth-lib
  - path: app/api/auth/[...nextauth]/route.ts
    template: auth-route
```

**Database (Prisma):**
```yaml
# templates/features/prisma.yaml
dependencies:
  - "@prisma/client"
dev_dependencies:
  - prisma

structure:
  - path: prisma/schema.prisma
    template: prisma-schema
  - path: prisma/seed.ts
    template: prisma-seed
  - path: shared/lib/db.ts
    template: prisma-client

scripts:
  - "prisma:generate": "prisma generate"
  - "prisma:push": "prisma db push"
  - "prisma:seed": "tsx prisma/seed.ts"
```

### 4. Generate Files

Loop through structure, generate each file:

```typescript
for (const file of structure) {
  const template = loadTemplate(file.template);
  const content = renderTemplate(template, {
    PROJECT_NAME: projectName,
    FRAMEWORK: framework,
    ...variables
  });
  
  writeFile(file.path, content);
}
```

### 5. Install Dependencies

```bash
npm install
```

### 6. Run Post-Init Commands

```typescript
if (hasDatabase) {
  exec("npx prisma generate");
  exec("npx prisma db push");
}

if (hasGit) {
  exec("git init");
  exec("git add .");
  exec('git commit -m "chore: initial commit from skills-agent"');
}
```

### 7. Show Summary

```
✅ Project initialized successfully!

📁 Structure:
   - features/auth (authentication)
   - features/home
   - shared/components
   - shared/lib

🔧 Next steps:
   1. cd my-app
   2. cp .env.example .env
   3. npm run dev

📚 Documentation:
   - README.md (setup instructions)
   - features/ (feature modules)
   
🚀 Ready to build!
```

## Token Optimization

Init bisa generate banyak files → banyak tokens. Optimize dengan:

### 1. Use Templates (Pre-written)

Don't generate code from scratch. Load pre-written templates dan substitute variables only.

```typescript
// ❌ Bad: Generate code with LLM
const code = await llm.generate("create a Next.js layout component");

// ✅ Good: Use template
const template = loadTemplate("nextjs-layout");
const code = template.replace("{{PROJECT_NAME}}", projectName);
```

### 2. Minimal Prompts

Prompt to LLM should only be untuk decision-making, bukan code generation:

```typescript
// Prompt ke LLM:
`User wants: "${userInput}"

Detect:
1. Framework: nextjs | nestjs | react-vite | ...
2. Features: auth? database? docker?
3. Database type (if requested): postgres | mongodb | mysql

Return JSON only:
{
  "framework": "nextjs",
  "features": ["auth", "postgres"],
  "name": "my-app"
}
`
```

LLM returns 50 tokens instead of 5000 tokens.

### 3. Lazy Loading

Only generate files that differ from template. For common files, just copy:

```typescript
// Static files (no LLM needed)
const staticFiles = [
  ".gitignore",
  ".env.example",
  "tsconfig.json",
];

// Dynamic files (need variable substitution, but no LLM)
const dynamicFiles = [
  "package.json",    // Replace {{PROJECT_NAME}}
  "README.md",       // Replace variables
];

// Only use LLM for complex logic (if needed)
const llmFiles = [
  // Usually none! Templates cover everything
];
```

### 4. Cost Estimate

Target cost untuk init:
- **Framework detection:** ~100 tokens = $0.0001
- **File generation:** 0 tokens (templates only) = $0
- **Total:** < $0.001 per init

Compare to previous (without templates):
- **Generate all code:** ~10,000 tokens = $0.01-0.03

**Savings: 90-95%**

## Error Handling

### Directory Already Exists

```
❌ Error: Directory "my-app" already exists

Options:
  1. Choose different name
  2. Use --force to overwrite (dangerous!)
  3. Cancel
```

### Missing API Keys

```
❌ Error: No provider API key configured

Please setup:
  npx @defrindr/skills-agent setup

Or set environment variable:
  export DEEPSEEK_API_KEY=your_key
```

### Invalid Framework

```
❌ Error: Framework "unknownjs" not supported

Supported frameworks:
  - nextjs
  - nestjs
  - react-vite
  - expressjs
  - fastapi
  - laravel
  - golang-gin
  - flutter
  - react-native
```

## Validation

After generation, validate:

1. ✅ All files created
2. ✅ package.json valid JSON
3. ✅ TypeScript config valid
4. ✅ No syntax errors in generated code
5. ✅ Build succeeds (`npm run build`)

If validation fails, rollback dan show error.

## Testing Generated Projects

After generation, automatically run:

```bash
# Install
npm install

# Type check
npm run type-check

# Lint
npm run lint

# Build
npm run build

# If all pass:
✅ Project validated successfully!
```

## Summary

Project initializer:
1. **Detects** framework dan features dari user input
2. **Loads** templates (YAML + code templates)
3. **Generates** files dengan variable substitution
4. **Installs** dependencies
5. **Validates** generated project
6. **Shows** next steps

**Token efficient:** < 200 tokens per init (mostly template-based)
**Fast:** < 30 seconds total
**Reliable:** Validated, tested templates
**Consistent:** Follows project-readability principles

Generated projects are **production-ready** dengan proper structure, configuration, dan documentation.
