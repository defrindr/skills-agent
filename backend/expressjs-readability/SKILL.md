---
name: expressjs-readability
description: >
  Panduan membangun dan mereview project Express.js dengan readability tinggi,
  struktur feature-first, middleware yang jelas batasannya, error handling konsisten,
  validasi Zod, dan kode yang tidak terlihat seperti output AI mentah.
  Gunakan skill ini saat init project Express.js, Node.js API tanpa framework besar,
  membuat route handler, service layer, middleware, validasi payload, error handling,
  setup testing, Docker, atau saat kode Express terasa terlalu bertumpuk di satu file,
  handler-nya jadi God function, atau tidak ada struktur yang jelas.
  Trigger: "setup express", "init express", "node api", "express router", "express middleware",
  "express error handling", "express validation", "express testing", "review express",
  "code review express", "express typescript".
---

# Express.js Readability Skill

Skill ini adalah versi Express.js dari `project-readability`.

Express tidak punya opini soal struktur. Itu justru jebakannya — proyek bisa jadi satu file 800 baris, atau folder `routes/`, `controllers/`, `services/`, `middlewares/`, `utils/` yang semuanya ada tapi tidak ada yang punya ownership jelas.

Tujuan skill ini satu: **Express project yang punya boundary, bukan Express project yang bisa dibaca hanya oleh yang menulisnya.**

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Kalau ada konflik antara kebiasaan Express, tutorial YouTube, atau pattern NPM package dengan readability, readability menang.

---

## 0. Taste rules

Berlaku penuh dari `project-readability`.

| Rule | Artinya di Express |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Jangan buru-buru bikin `BaseRepository`, `GenericService<T>`, atau `CrudRouter` kalau belum ada complexity nyata. |
| Prefer boring code over clever code. | Middleware chain yang eksplisit lebih baik dari middleware factory dengan 3 level currying. |
| Kalau nama function butuh komentar, namanya belum jelas. | Rename handler dan service method sebelum tambah komentar. |
| Error message harus bantu langkah berikutnya. | Jangan balikin `Internal Server Error` untuk business error yang sudah diketahui. |

---

## 1. Struktur folder: feature-first

Jangan ini (layer-first, umum di tutorial):

```txt
src/
├── controllers/
├── routes/
├── services/
├── models/
├── middlewares/
└── utils/
```

Pakai ini (feature-first):

```txt
src/
├── features/
│   ├── auth/
│   │   ├── auth.router.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.types.ts
│   │   └── auth.service.test.ts
│   │
│   ├── orders/
│   │   ├── orders.router.ts
│   │   ├── orders.service.ts
│   │   ├── orders.repository.ts
│   │   ├── orders.schema.ts
│   │   ├── orders.types.ts
│   │   └── orders.service.test.ts
│   │
│   └── users/
│       ├── users.router.ts
│       ├── users.service.ts
│       ├── users.repository.ts
│       ├── users.schema.ts
│       └── users.service.test.ts
│
├── shared/
│   ├── api/
│   │   └── api-response.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   └── error-code.ts
│   ├── middleware/
│   │   ├── error-handler.ts
│   │   ├── validate-body.ts
│   │   └── verify-hmac.ts
│   ├── logger/
│   │   └── logger.ts
│   └── db/
│       └── client.ts
│
└── app.ts         ← wiring saja, bukan logic
```

Satu feature = satu tempat. Mau hapus fitur `orders`? Hapus satu folder.

---

## 2. `app.ts` hanya wiring

```ts
// src/app.ts
import express from 'express'
import { authRouter } from './features/auth/auth.router'
import { ordersRouter } from './features/orders/orders.router'
import { usersRouter } from './features/users/users.router'
import { errorHandler } from './shared/middleware/error-handler'

const app = express()

app.use(express.json())
app.use('/auth', authRouter)
app.use('/orders', ordersRouter)
app.use('/users', usersRouter)

// Error handler wajib daftar paling akhir
app.use(errorHandler)

export { app }
```

Tidak ada business logic di `app.ts`. Tidak ada conditional, tidak ada helper, tidak ada constant domain.

---

## 3. Router tipis, service yang berisi use-case

Router hanya:
1. daftarkan route
2. pasang middleware validasi
3. panggil handler
4. balikin response

```ts
// src/features/orders/orders.router.ts
import { Router } from 'express'
import { validateBody } from '../../shared/middleware/validate-body'
import { CreateOrderSchema } from './orders.schema'
import { createOrder, cancelOrder } from './orders.handler'

export const ordersRouter = Router()

ordersRouter.post('/', validateBody(CreateOrderSchema), createOrder)
ordersRouter.post('/:orderId/cancel', cancelOrder)
```

Handler hanya translate antara HTTP dan service:

```ts
// src/features/orders/orders.handler.ts
import { Request, Response } from 'express'
import { ApiResponse } from '../../shared/api/api-response'
import { OrdersService } from './orders.service'

const ordersService = new OrdersService()

export async function createOrder(req: Request, res: Response) {
  const order = await ordersService.createOrder(req.user!.id, req.body)
  res.status(201).json(ApiResponse.success(order))
}

export async function cancelOrder(req: Request, res: Response) {
  const cancelled = await ordersService.cancelOrder(req.params.orderId, req.user!.id)
  res.json(ApiResponse.success(cancelled))
}
```

Service berisi use-case yang nyata:

```ts
// src/features/orders/orders.service.ts
import { AppError } from '../../shared/errors/app-error'
import { ErrorCode } from '../../shared/errors/error-code'
import { OrdersRepository } from './orders.repository'
import type { CreateOrderInput } from './orders.schema'

export class OrdersService {
  private readonly repo = new OrdersRepository()

  async createOrder(userId: string, input: CreateOrderInput) {
    const pendingOrder = await this.repo.findPendingByUserId(userId)

    if (pendingOrder) {
      throw new AppError(
        ErrorCode.CONFLICT,
        'You already have a pending order. Complete or cancel it before creating a new one.',
        409
      )
    }

    return this.repo.create({ ...input, userId })
  }

  async cancelOrder(orderId: string, requestingUserId: string) {
    const order = await this.repo.findById(orderId)

    if (!order) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Order not found.', 404)
    }

    if (order.userId !== requestingUserId) {
      throw new AppError(ErrorCode.FORBIDDEN, 'You are not allowed to cancel this order.', 403)
    }

    if (order.status === 'shipped') {
      throw new AppError(
        ErrorCode.CONFLICT,
        'Order cannot be cancelled because it has already been shipped.',
        409
      )
    }

    return this.repo.updateStatus(orderId, 'cancelled')
  }
}
```

---

## 4. Async handler — jangan lupa catch

Express 4 tidak handle promise rejection secara otomatis. Dua pilihan:

### Pilihan 1 — `express-async-errors` (paling simpel)

```bash
npm i express-async-errors
```

Import sekali di `app.ts`, sebelum semua route:

```ts
import 'express-async-errors'
```

Setelah itu semua async handler akan forward error ke error handler otomatis.

### Pilihan 2 — wrapper eksplisit

```ts
// shared/middleware/async-handler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express'

export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// Pakai di router:
ordersRouter.post('/', asyncHandler(createOrder))
```

Pilih salah satu. Jangan campur.

---

## 5. Validasi dengan Zod

```ts
// shared/middleware/validate-body.ts
import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'
import { AppError } from '../errors/app-error'
import { ErrorCode } from '../errors/error-code'

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        'Request body is invalid.',
        422,
        result.error.flatten()
      )
    }

    req.body = result.data
    next()
  }
}
```

Schema per feature, bukan satu file schema global:

```ts
// src/features/orders/orders.schema.ts
import { z } from 'zod'

export const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
```

---

## 6. Error handling

### AppError

```ts
// shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

### ErrorCode

```ts
// shared/errors/error-code.ts
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_PAYLOAD_SIGNATURE: 'INVALID_PAYLOAD_SIGNATURE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const
```

### Global error handler

```ts
// shared/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../errors/app-error'
import { ErrorCode } from '../errors/error-code'
import { logger } from '../logger/logger'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details ?? null,
      },
    })
  }

  // Error tak terduga — log penuh, jangan expose ke client
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')

  res.status(500).json({
    ok: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'Something went wrong. Please try again later.',
    },
  })
}
```

---

## 7. API response envelope

```ts
// shared/api/api-response.ts
export const ApiResponse = {
  success<T>(data: T, meta?: Record<string, unknown>) {
    return {
      ok: true as const,
      data,
      meta: meta ?? null,
    }
  },

  error(code: string, message: string, details?: unknown) {
    return {
      ok: false as const,
      error: { code, message, details: details ?? null },
    }
  },
}
```

Response selalu `camelCase`. Database kolom boleh `snake_case`, tapi jangan bocor ke response.

---

## 8. Naming

```ts
// ❌
router.get('/', getData)
router.post('/', handleSubmit)
router.put('/:id', update)

// ✅
router.get('/', listActiveOrders)
router.post('/', createOrder)
router.put('/:orderId', updateOrderQuantity)
```

```ts
// ❌
async function process(req, res) {}
async function handle(req, res) {}
async function execute(req, res) {}

// ✅
async function createOrder(req: Request, res: Response) {}
async function cancelOrder(req: Request, res: Response) {}
async function markOrderAsShipped(req: Request, res: Response) {}
```

---

## 9. Testing

Pakai Vitest + supertest. Test di level service (unit) dan level router (integration).

```ts
// src/features/orders/orders.service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OrdersService } from './orders.service'
import { AppError } from '../../shared/errors/app-error'

describe('OrdersService.cancelOrder', () => {
  it('throws NOT_FOUND when order does not exist', async () => {
    const service = new OrdersService()
    vi.spyOn(service['repo'], 'findById').mockResolvedValue(null)

    await expect(service.cancelOrder('nonexistent-id', 'user-1'))
      .rejects.toThrow(AppError)
  })

  it('throws CONFLICT when order has already been shipped', async () => {
    const service = new OrdersService()
    vi.spyOn(service['repo'], 'findById').mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      status: 'shipped',
    } as any)

    await expect(service.cancelOrder('order-1', 'user-1'))
      .rejects.toMatchObject({ code: 'CONFLICT' })
  })
})
```

Nama test = deskripsi behavior, bukan technical description:

```ts
// ❌
it('returns 409', ...)
it('handles error case', ...)

// ✅
it('prevents creating a new order when user already has a pending one', ...)
it('rejects cancellation after order has been shipped', ...)
```

---

## 10. Docker

```dockerfile
# Dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM base AS builder
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
