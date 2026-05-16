---
name: expressjs-readability
description: >
  Panduan membangun dan mereview project Express.js + TypeScript dengan middleware
  pipeline yang bersih, error handling konsisten via next(error), validasi env di startup,
  dan struktur domain-first yang tidak terasa seperti tutorial.
  Gunakan skill ini saat init project Express, membuat route baru, code review,
  refactor handler, validasi request body, setup testing, atau Docker.
  Trigger: "setup express", "init express", "express router", "express middleware",
  "express typescript", "express error handling", "express zod", "express prisma",
  "review express", "nodejs api", "expressjs structure", "express best practice".
---

# Express.js Readability Skill

Express adalah DSL untuk membangun middleware pipeline. Bukan MVC framework, bukan opinionated — hanya fungsi yang masuk dari atas, lewat tiap middleware satu per satu, keluar sebagai response di bawah.

> Untuk naming, folder structure, komentar, test naming, Git, dan API response shape — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk Express dan Node.js.

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

## 1. Struktur folder

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

## 2. Validasi env di startup

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

## 3. `catchAsync` — hapus boilerplate try-catch

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

## 4. Validasi request — Zod

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

## 5. Testing

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

## 6. Tooling

```bash
npm install express zod prisma @prisma/client pino
npm install -D typescript vitest @types/express tsx

# scripts di package.json
"dev": "tsx watch src/server.ts"
"build": "tsc"
"test": "vitest run"
```

---

## 7. Docker

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
