---
name: expressjs-readability
description: >
  Panduan membangun dan mereview project Express.js + TypeScript dengan middleware
  pipeline yang bersih, error handling via next(error), validasi env di startup,
  dan struktur domain-first.
  Gunakan saat init project Express, membuat route baru, code review,
  refactor handler, validasi request body, setup testing, Docker.
  Trigger: "setup express", "init express", "express router", "express middleware",
  "express typescript", "express error handling", "express zod", "review express",
  "nodejs api", "expressjs structure".
  EXCLUDES: Database schema design, migrations, query optimization.
  Defer ke database-designer dan database-optimizer.
---

# Express.js Readability Skill

Express adalah DSL untuk middleware pipeline — fungsi yang masuk dari atas, lewat tiap middleware, keluar sebagai response.

> Untuk naming, folder structure, API response, error handling — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal spesifik untuk Express dan Node.js.
> **Jangan over-engineer**: struktur sesuaikan dengan skala project.

---

## 0. Karakter Express yang harus dijaga

### Middleware IS the model

```typescript
type Handler = (req: Request, res: Response, next: NextFunction) => void

// 1. Do something + lanjut
app.use((req, res, next) => { req.requestId = crypto.randomUUID(); next() })

// 2. Short-circuit
app.use((req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ ok: false })
  next()
})

// 3. Forward error
app.use(async (req, res, next) => {
  try { res.json(await doSomething()) }
  catch (err) { next(err) }
})
```

### Error handler — 4 parameter

```typescript
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false, error: { code: err.code, message: err.message },
    })
  }
  logger.error({ err, path: req.path }, "Unhandled error")
  res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } })
})
```

### Urutan registrasi matters

```typescript
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
```

---

## 1. Database Work

Ikuti protocol: **STOP → ASK → WAIT → VERIFY**. Jangan generate code yang akses database sebelum user konfirmasi schema siap. Schema design → `database-designer`. Query optimization → `database-optimizer`.

Setelah schema siap:

```bash
npx prisma migrate dev --name add_orders
npx prisma generate
```

```typescript
// src/db.ts
import { PrismaClient } from '@prisma/client'
export const db = new PrismaClient()

// features/orders/orders.service.ts
export async function createOrder(userId: string, input: CreateOrderInput) {
  return db.order.create({
    data: { userId, ...input },
    include: { items: true },
  })
}
```

---

## 2. Struktur folder — scale-aware

- **Simple** (< 5 routes): `src/routes/` + `src/middleware/` + `db.ts` + `config.ts`
- **Medium** (5-15 routes): `src/features/{orders,products}/` + `src/shared/`
- **Complex** (> 15 routes): tambah `src/shared/domain/` + repository pattern

---

## 3. Validasi env di startup

```typescript
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
```

---

## 4. catchAsync — hapus boilerplate try-catch

```typescript
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}

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
export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

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
describe("OrdersService.cancelOrder", () => {
  it("throws NOT_FOUND when order does not exist", async () => {
    const service = new OrdersService()
    vi.spyOn(service["repo"], "findById").mockResolvedValue(null)
    await expect(service.cancelOrder("user-1", "order-1")).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})
```

---

## 7. Tooling

```bash
npm install express zod prisma @prisma/client pino
npm install -D typescript vitest @types/express tsx
```

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist ./dist
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "dist/server.js"]
```
