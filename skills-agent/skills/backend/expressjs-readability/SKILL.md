---
name: expressjs-readability
description: >
  Panduan membangun dan mereview project Express.js + TypeScript dengan middleware
  pipeline yang bersih, error handling konsisten via next(error), validasi env di startup,
  dan struktur domain-first yang tidak terasa seperti tutorial.
  Gunakan skill ini saat init project Express, membuat route baru, code review,
  refactor handler, validasi request body, setup testing, atau Docker.
  
  Trigger: "setup express", "init express", "express router", "express middleware",
  "express typescript", "express error handling", "express zod", "review express",
  "nodejs api", "expressjs structure", "express best practice".
  
  EXCLUDES: Database schema design, migrations, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer skills.
---

# Express.js Readability Skill

Express adalah DSL untuk membangun middleware pipeline. Bukan MVC framework, bukan opinionated — hanya fungsi yang masuk dari atas, lewat tiap middleware satu per satu, keluar sebagai response di bawah.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk Express dan Node.js.
> 
> **Jangan over-engineer**: Simple project ≠ butuh service layer, startup ≠ butuh repository pattern, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

---

## 0. Karakter Express yang harus dijaga

### Middleware IS the model

```typescript
// Tiga bentuk middleware — semua fungsi dengan signature yang sama
type Handler = (req: Request, res: Response, next: NextFunction) => void

// 1. Do something + lanjut
app.use((req, res, next) => {
  req.requestId = crypto.randomUUID()
  next()
})

// 2. Short-circuit
app.use((req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ ok: false })
  next()
})

// 3. Forward error ke error handler
app.use(async (req, res, next) => {
  try {
    const result = await doSomething()
    res.json(result)
  } catch (err) {
    next(err)  // bukan throw, bukan console.error
  }
})
```

### Error handler — 4 parameter, bukan 3

```typescript
// ❌ 3-param — Express tidak panggil ini untuk error
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: "Something went wrong" })
})

// ✅ 4-param — dipanggil saat next(err) dipanggil
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: { code: err.code, message: err.message },
    })
  }
  logger.error({ err, path: req.path }, "Unhandled error")
  res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } })
})
```

### Urutan registrasi matters

```typescript
// ❌ Error handler sebelum routes — tidak catch apa pun
app.use(errorHandler)
app.use("/orders", ordersRouter)

// ✅ Routes dulu, error handler paling bawah
app.use("/auth", authRouter)
app.use("/orders", ordersRouter)
app.use(notFoundHandler)  // 404 catch-all
app.use(errorHandler)     // selalu paling akhir
```

### TypeScript — extend Request type

```typescript
// src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: AuthUser
    requestId: string
  }
}

// Sekarang req.user fully typed di semua handler tanpa cast
```

---

## 1. Database Work — DATABASE-FIRST PROTOCOL

**CRITICAL**: Skill ini untuk **application code** (routes, middleware, services), **bukan database design**.

### Protocol: JANGAN NGIDE, ALWAYS TANYA DULU

**MANDATORY UNTUK SEMUA DATABASE WORK:**

Ketika user minta feature/endpoint/code yang touch database:

1. **STOP** — jangan langsung generate code
2. **ASK** — tanya user tentang database setup
3. **WAIT** — tunggu user response sebelum proceed
4. **VERIFY** — pastikan schema ready sebelum coding

### Phase 1: Database Verification (WAJIB — JANGAN SKIP!)

**SEBELUM generate ANY code yang akses database, TANYA user:**

```
Sebelum bikin [feature-name], saya perlu cek database setup dulu:

Database Checklist:
1. Schema Design
   - Apakah schema [entity-name] sudah di-design? (ERD, relationships)
   - Apakah ada relasi ke entity lain (User, Product, dll)?
   
2. Prisma Setup
   - Apakah Prisma schema sudah ada di schema.prisma?
   - Apakah migration sudah dibuat dan di-run?
   
3. Indexes & Performance
   - Apakah sudah ada index untuk common queries?
   - (Contoh: userId, createdAt, status)

Please confirm status:
- [ ] Schema sudah di-design
- [ ] Prisma schema sudah ada
- [ ] Migration sudah di-run

Silakan jawab dengan status setiap item. Jangan skip checklist ini.
```

**JANGAN PROCEED sampai user confirm!**

### Phase 2: Design Schema (jika belum ada)

**IF user jawab "belum" atau "tidak yakin":**

```
Schema belum ready. Saya HARUS invoke database-designer dulu sebelum generate code.

Saya akan design:
- Entity: [entity-name]
- Relationships: [list relasi yang dibutuhkan]
- Indexes: [common query patterns]

Boleh saya invoke database-designer sekarang? (y/n)
```

**WAIT for user approval** — jangan auto-invoke tanpa izin!

### Phase 3: Generate Application Code (hanya setelah confirmed)

**ONLY after user confirm "schema ready":**

```
Perfect! Schema sudah ready. Sekarang saya generate Express code:

Will create:
- routes/[name].router.ts (HTTP endpoints)
- services/[name].service.ts (business logic)  
- schemas/[name].schema.ts (Zod validation)

Reminder: Pastikan index sudah ada di [list columns]. Check database-optimizer jika query lambat.

Proceeding...
```

**Kemudian** baru generate code.

### Skill Boundary

✅ **Skill ini handle:**
- Middleware pipeline dan error handling
- Router/service/repository patterns (application layer)
- Transaction management (scale-aware)
- Testing database logic (mocking, integration tests)

❌ **Skill ini TIDAK handle:**
- Schema design → `database-designer`
- Migrations (Prisma migrate, SQL files) → `database-designer`
- Query optimization (EXPLAIN, indexes) → `database-optimizer`
- Normalization (1NF, 2NF, 3NF) → `database-designer`

### Anti-Pattern: JANGAN LAKUKAN INI

**❌ WRONG — Langsung generate tanpa tanya:**
```typescript
// AI langsung generate tanpa cek schema:
ordersRouter.post("/", async (req, res) => {
  const order = await db.order.create({ data: { ...req.body } })
  res.json(order)
})
```

**Why wrong:**
- Assume schema exists
- Tidak tahu relasi apa yang ada
- Tidak tahu index apa yang perlu
- User belum confirm setup ready

**✅ CORRECT — Tanya dulu, generate kemudian:**
```
AI: "Apakah schema Order sudah di-design? Please confirm checklist..."
User: "Belum"
AI: "OK, saya invoke database-designer dulu. Boleh?"
User: "Ya"
AI: [invoke database-designer]
User: [run migration]
User: "Done"
AI: "Great! Sekarang generate Express code..." [generate code]
```

### Prisma Tips (after schema designed)

**Generate Prisma client** setelah migration:
```bash
npx prisma migrate dev --name add_orders
npx prisma generate
```

**Di application code:**
```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()

// features/orders/orders.service.ts
import { db } from '@/db'

export async function createOrder(userId: string, input: CreateOrderInput) {
  return db.order.create({
    data: { userId, ...input },
    include: { items: true }  // jika relasi sudah di-design
  })
}
```

---

## 2. Struktur folder — scale-aware

**Aturan**: Ikuti `common/project-readability` untuk scale-aware architecture. Contoh di bawah untuk referensi saja.

### Simple project (< 5 routes, 1-2 dev, CRUD API)

```
src/
├── routes/
│   ├── orders.ts          ← handler langsung di router
│   └── products.ts
├── middleware/
│   ├── authenticate.ts
│   └── validate.ts
├── db.ts                   ← Prisma client atau DB connection
├── config.ts               ← env validation
└── app.ts

// orders.ts — no service layer, langsung panggil DB
ordersRouter.post("/", authenticate, validate(schema), catchAsync(async (req, res) => {
  const order = await db.order.create({ data: { userId: req.user!.id, ...req.body } })
  res.status(201).json(ApiSuccess(order))
}))
```

### Medium project (5-15 routes, 3-5 dev, business logic mulai kompleks)

```
src/
├── features/
│   ├── orders/
│   │   ├── orders.router.ts    ← wiring
│   │   ├── orders.service.ts   ← use-case / business logic
│   │   └── orders.schema.ts    ← Zod
│   └── products/
│       ├── products.router.ts
│       └── products.service.ts
├── shared/
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   └── validate.ts
│   ├── api/response.ts
│   └── errors/AppError.ts
├── db.ts
└── app.ts

// orders.service.ts — business logic terpisah dari router
export class OrdersService {
  async createOrder(userId: string, input: CreateOrderInput) {
    const product = await db.product.findUnique({ where: { id: input.productId } })
    if (!product || product.stock < input.quantity) throw new AppError("OUT_OF_STOCK", 400)
    return db.order.create({ data: { userId, ...input } })
  }
}
```

### Complex project (> 15 routes, > 5 dev, multiple domains, high business complexity)

```
src/
├── features/
│   ├── orders/
│   │   ├── orders.router.ts
│   │   ├── orders.service.ts
│   │   ├── orders.repository.ts  ← abstraksi DB queries
│   │   └── orders.schema.ts
│   └── inventory/
│       ├── inventory.service.ts
│       └── inventory.repository.ts
├── shared/
│   ├── domain/                    ← shared business rules
│   │   └── pricing/
│   │       └── calculateDiscount.ts
│   ├── middleware/
│   └── api/
└── app.ts

// Gunakan repository pattern HANYA jika:
// - Perlu switch DB provider (Prisma → TypeORM)
// - Complex query reuse (10+ use cases pakai query yang sama)
// - Testing perlu banyak mock DB calls
```

**Anti-pattern**: Jangan paksa struktur complex untuk project simple. Kalau cuma 3 CRUD endpoints, feature-first + service layer sudah overkill — langsung handler + DB call di router cukup.

---

## 2. Feature-first default (untuk medium+)

Feature-first sesuai `common/project-readability`. Tambahan untuk Express:

```
src/
├── features/
│   └── orders/
│       ├── orders.router.ts     ← hanya wiring route + middleware
│       ├── orders.service.ts    ← use-case / business logic
│       ├── orders.repository.ts ← query ke DB
│       └── orders.schema.ts     ← Zod schema
├── shared/
│   ├── api/
│   │   ├── response.ts          ← ApiSuccess helper
│   │   └── catchAsync.ts
│   ├── errors/AppError.ts
│   └── middleware/
│       ├── authenticate.ts
│       └── validate.ts
├── types/express.d.ts
└── app.ts
```

---

## 3. Validasi env di startup

```typescript
// src/shared/config.ts
import { z } from "zod"

const env = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).safeParse(process.env)

if (!env.success) {
  console.error(env.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = env.data
// Tidak ada lagi process.env.* di tempat lain
```

Kalau `.env` salah, crash saat startup dengan pesan yang jelas — jauh lebih baik dari crash di tengah request pertama.

---

## 4. `catchAsync` — hapus boilerplate try-catch

```typescript
// src/shared/api/catchAsync.ts
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}

// Router jadi bersih:
ordersRouter.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  catchAsync(async (req, res) => {
    const order = await service.createOrder(req.user!.id, req.body)
    res.status(201).json(ApiSuccess(order))
  }),
)
```

---

## 5. Validasi request — Zod

```typescript
// src/features/orders/orders.schema.ts
import { z } from "zod"

export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

// src/shared/middleware/validate.ts
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(422).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Request body is invalid.", details: result.error.flatten().fieldErrors },
      })
    }
    req.body = result.data
    next()
  }
}
```

---

## 6. Testing

```typescript
// Vitest + supertest
import { describe, it, expect, vi } from "vitest"
import { OrdersService } from "./orders.service"
import { AppError } from "../../shared/errors/AppError"

describe("OrdersService.cancelOrder", () => {
  it("throws NOT_FOUND when order does not exist", async () => {
    const service = new OrdersService()
    vi.spyOn(service["repo"], "findById").mockResolvedValue(null)

    await expect(service.cancelOrder("user-1", "order-1")).rejects.toMatchObject({
      code: "NOT_FOUND",
    })
  })
})
```

Nama test mengikuti `common/project-readability` — natural language, dokumentasikan behavior.

---

## 7. Tooling

```bash
npm install express zod prisma @prisma/client pino
npm install -D typescript vitest @types/express tsx

# scripts di package.json
"dev": "tsx watch src/server.ts"
"build": "tsc"
"test": "vitest run"
```

---

## 8. Docker

```dockerfile
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```
