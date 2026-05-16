---
name: nestjs-readability
description: >
  Panduan membangun dan mereview project NestJS dengan readability tinggi,
  feature-first architecture, API contract yang konsisten, error handling yang jelas,
  validation yang aman, observability, Docker, dan style kode yang tidak terlihat seperti output AI mentah.
  Gunakan skill ini setiap kali init project NestJS, membuat module baru, code review,
  refactor service/controller, standarisasi response/error/request, validasi payload,
  setup logging/Sentry, Docker containerization, atau saat kode terasa terlalu generic,
  over-engineered, robotic, atau keliatan AI banget.
  
  EXCLUDES: Database schema design, entity relationships, migrations, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer skills.
---

# NestJS Readability Skill

Skill ini adalah turunan khusus NestJS dari `project-readability`.
Semua aturan readability tetap wajib: boring code, nama jelas, feature-first, error message yang actionable, jangan abstraction prematur, dan jangan membuat `shared/` jadi tempat sampah.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk NestJS.
> 
> **Jangan over-engineer**: Simple project ≠ butuh module per feature, startup ≠ butuh CQRS, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

Tujuan utamanya: NestJS project yang enak dibaca, mudah diubah, dan punya boundary API yang konsisten.

---

## 0. Prinsip utama

Kalau ada konflik antara kebiasaan NestJS, tutorial internet, dan aturan readability, pilih yang paling mudah dibaca dan paling mudah diubah besok.

| Rule | Praktik di NestJS |
|---|---|
| Jangan bikin abstraction sebelum pola terbukti | Jangan langsung bikin `BaseService`, `BaseRepository`, `AbstractCrudController`, atau generic module kalau baru dipakai sekali. |
| Prefer boring code | Service yang eksplisit lebih baik daripada decorator/magic helper yang butuh lompat file berkali-kali. |
| Nama harus menjelaskan intent | `createOrder`, `cancelOrder`, `markInvoiceAsPaid` lebih baik daripada `handle`, `process`, `execute`. |
| Error harus actionable | Jangan return `Bad Request`. Jelaskan field, aturan, dan langkah berikutnya. |
| Feature-first | Satu domain = satu folder. Jangan pisahkan semua controller/service/dto ke folder global. |
| Shared hanya untuk yang benar-benar shared | Helper domain-specific tetap tinggal di feature-nya. |

---

## 1. Database Work — DATABASE-FIRST PROTOCOL

**CRITICAL**: Skill ini untuk **application code** (modules, controllers, services), **bukan database design**.

### Protocol: JANGAN NGIDE, ALWAYS TANYA DULU

**MANDATORY UNTUK SEMUA DATABASE WORK:**

Ketika user minta feature/module/endpoint yang touch database:

1. **STOP** — jangan langsung generate code
2. **ASK** — tanya user tentang database setup
3. **WAIT** — tunggu user response sebelum proceed
4. **VERIFY** — pastikan entity ready sebelum coding

### PENTING: `.schema.ts` ≠ Database Schema!

**Di NestJS:**
- `orders.schema.ts` = **Zod validation schema** (request/response validation)
- `orders.entity.ts` = **Database model** (TypeORM/Prisma entity)

Jangan bingung! Validation schema beda sama database schema.

```typescript
// orders.schema.ts = REQUEST VALIDATION (Zod)
import { z } from 'zod'

export const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
```

```typescript
// orders.entity.ts = DATABASE MODEL (TypeORM/Prisma)
import { Entity, PrimaryColumn, Column, ManyToOne } from 'typeorm'

@Entity('orders')
export class Order {
  @PrimaryColumn('uuid') id: string
  @Column('uuid') userId: string
  @Column('uuid') productId: string
  @Column('int') quantity: number
  @ManyToOne(() => User) user: User
  @ManyToOne(() => Product) product: Product
}
```

### Phase 1: Database Verification (WAJIB — JANGAN SKIP!)

**SEBELUM generate ANY code yang akses database, TANYA user:**

```
Sebelum bikin [module-name], saya perlu cek database setup dulu:

Database Checklist:
1. Entity Design
   - Apakah entity [EntityName] sudah di-design? (ERD, relationships)
   - Apakah ada relasi ke entity lain (@ManyToOne, @OneToMany)?
   
2. TypeORM/Prisma Setup
   - Apakah entity file (orders.entity.ts) sudah ada?
   - Apakah migration sudah dibuat dan di-run?
   
3. Indexes & Performance
   - Apakah sudah ada index untuk common queries?
   - (Contoh: userId, status, createdAt)

Please confirm status:
- [ ] Entity sudah di-design
- [ ] Entity file sudah ada
- [ ] Migration sudah di-run

Silakan jawab dengan status setiap item. Jangan skip checklist ini.
```

**JANGAN PROCEED sampai user confirm!**

### Phase 2: Design Entity (jika belum ada)

**IF user jawab "belum" atau "tidak yakin":**

```
Entity belum ready. Saya HARUS invoke database-designer dulu sebelum generate code.

Saya akan design:
- Entity: [EntityName]
- Relationships: [list relasi yang dibutuhkan, e.g., @ManyToOne ke User]
- Indexes: [common query patterns]

Boleh saya invoke database-designer sekarang? (y/n)
```

**WAIT for user approval** — jangan auto-invoke tanpa izin!

### Phase 3: Generate Application Code (hanya setelah confirmed)

**ONLY after user confirm "entity ready":**

```
Perfect! Entity sudah ready. Sekarang saya generate NestJS module:

Will create:
- orders.schema.ts (Zod validation — request/response)
- orders.entity.ts (Database model — from database-designer)
- orders.repository.ts (Database queries)
- orders.service.ts (Business logic)
- orders.controller.ts (HTTP layer)

Reminder: Pastikan index sudah ada di [list columns]. Check database-optimizer jika query lambat.

Proceeding...
```

**Kemudian** baru generate code.
  @PrimaryColumn('uuid') id: string
  @Column('uuid') userId: string
  @Column('uuid') productId: string
  @Column('int') quantity: number
  @ManyToOne(() => User) user: User
  @ManyToOne(() => Product) product: Product
}
```

**Jangan sampai bingung**: validation schema ≠ database schema design!

### Skill Boundary

✅ **Skill ini handle:**
- Feature-first module structure
- Controller → Service → Repository pattern (application layer)
- DTO dan validation schemas (Zod/class-validator)
- Error handling (AppError, HttpException)
- Testing (unit tests dengan mock repository, integration tests)

❌ **Skill ini TIDAK handle:**
- Database schema design → `database-designer`
- TypeORM entity relationships (@ManyToOne, @OneToMany) → `database-designer`
- Migrations (TypeORM, Prisma) → `database-designer`
- Query performance (EXPLAIN, indexes) → `database-optimizer`

### Anti-Pattern: JANGAN LAKUKAN INI

**❌ WRONG — Langsung generate entity tanpa tanya:**
```typescript
// AI langsung generate tanpa cek entity:
@Entity()
export class Order {
  @PrimaryGeneratedColumn() id: number
  @Column() userId: number  // ← tipe data? relasi? index?
  @Column() total: number   // ← decimal precision? currency?
}
```

**Why wrong:**
- Assume entity design exists
- Tidak tahu relasi apa yang ada (@ManyToOne? @OneToMany?)
- Tidak tahu index apa yang perlu
- User belum confirm setup ready

**✅ CORRECT — Tanya dulu, generate kemudian:**
```
AI: "Apakah entity Order sudah di-design? Please confirm checklist..."
User: "Belum"
AI: "OK, saya invoke database-designer dulu. Boleh?"
User: "Ya"
AI: [invoke database-designer]
User: [run migration]
User: "Done"
AI: "Great! Sekarang generate NestJS module..." [generate code]
```

### TypeORM/Prisma Tips (after entity confirmed ready)

**Generate migration** setelah entity di-design:
```bash
# TypeORM
npm run typeorm migration:generate -- src/migrations/AddOrders
npm run typeorm migration:run

# Prisma
npx prisma migrate dev --name add_orders
npx prisma generate
```

**Di application code:**
```typescript
// orders.repository.ts (after entity designed)
@Injectable()
export class OrdersRepository {
  constructor(
    @InjectRepository(Order) private repo: Repository<Order>,
  ) {}
  
  async findByUserId(userId: string): Promise<Order[]> {
    return this.repo.find({
      where: { userId },
      relations: ['items', 'user'],  // jika relasi sudah di-design
      order: { createdAt: 'DESC' },
    })
  }
}
```

---

## 2. Struktur folder — scale-aware feature-first

**Aturan**: Ikuti `common/project-readability` untuk scale-aware architecture. Contoh di bawah untuk referensi saja.

### Simple project (< 5 endpoints, 1-2 dev, CRUD API)

```txt
src/
├── main.ts
├── app.module.ts           ← single module, tanpa feature separation
├── orders/
│   ├── orders.controller.ts
│   ├── orders.service.ts   ← langsung panggil DB, no repository
│   └── orders.schema.ts
├── products/
│   ├── products.controller.ts
│   ├── products.service.ts
│   └── products.schema.ts
└── shared/
    ├── api-response.ts
    └── app-error.ts

// orders.service.ts — langsung panggil ORM/DB, no repository layer
@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}
  
  async createOrder(input: CreateOrderInput): Promise<Order> {
    const order = this.repo.create(input)
    return this.repo.save(order)
  }
}
```

### Medium project (5-15 endpoints, 3-5 dev, business logic mulai kompleks)

```txt
src/
├── main.ts
├── app.module.ts
├── features/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts   ← business logic di sini
│   │   └── auth.schema.ts
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       └── orders.schema.ts
└── shared/
    ├── api/api-response.ts
    ├── errors/app-error.ts
    └── middleware/

// orders.service.ts — business logic terpisah, masih langsung panggil ORM
@Injectable()
export class OrdersService {
  constructor(@InjectRepository(Order) private repo: Repository<Order>) {}
  
  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.repo.findOne({ where: { id: orderId } })
    if (!order) throw new AppError(ErrorCode.NOT_FOUND, "Order not found.")
    if (order.status === "shipped") throw new AppError(ErrorCode.CONFLICT, "Order already shipped.")
    
    order.status = "cancelled"
    return this.repo.save(order)
  }
}
```

### Complex project (> 15 endpoints, > 5 dev, multiple domains, high business complexity)

```txt
src/
├── main.ts
├── app.module.ts
├── features/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.repository.ts  ← abstraksi DB queries
│   │   ├── auth.schema.ts
│   │   └── auth.types.ts
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       ├── orders.repository.ts
│       ├── orders.schema.ts
│       └── orders.types.ts
└── shared/
    ├── api/
    ├── errors/
    ├── middleware/
    └── domain/              ← shared business rules
        └── pricing/
            └── calculate-discount.ts

// Gunakan repository pattern HANYA jika:
// - Perlu switch ORM provider (TypeORM → Prisma → raw SQL)
// - Complex query reuse (10+ use cases pakai query yang sama)
// - Testing perlu banyak mock DB calls
```

**Anti-pattern**: Jangan paksa module/repository/CQRS untuk project simple. Kalau cuma 3 CRUD endpoints, langsung controller + service + ORM cukup.

---

## 2. Naming & prinsip (berlaku di semua scale)

### Complex project (> 15 endpoints, > 5 dev, multiple domains, high business complexity)

```txt
src/
├── app.module.ts
├── main.ts
├── config/
│   ├── env.schema.ts
│   └── app.config.ts
├── features/
│   ├── auth/
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts
│   │   ├── auth.types.ts
│   │   ├── auth.repository.ts
│   │   └── auth.service.spec.ts
│   ├── users/
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.schema.ts
│   │   ├── users.types.ts
│   │   └── users.repository.ts
│   └── orders/
│       ├── orders.module.ts
│       ├── orders.controller.ts
│       ├── orders.service.ts
│       ├── orders.schema.ts
│       ├── orders.types.ts
│       └── orders.repository.ts
├── shared/
│   ├── api/
│   │   ├── api-response.ts
│   │   └── response.interceptor.ts
│   ├── errors/
│   │   ├── app-error.ts
│   │   ├── error-code.ts
│   │   └── global-exception.filter.ts
│   ├── logger/
│   │   └── logger.service.ts
│   ├── middleware/
│   │   ├── request-id.middleware.ts
│   │   └── raw-body.middleware.ts
│   ├── security/
│   │   └── verify-hmac-signature.ts
│   ├── utils/
│   │   ├── case-converter.ts
│   │   ├── date.ts
│   │   ├── number.ts
│   │   └── string.ts
│   └── validation/
│       ├── zod-validation.pipe.ts
│       └── common.schema.ts
└── tests/
    └── setup.ts
```

**Kenapa bukan ini?**

```txt
src/
├── controllers/
├── services/
├── repositories/
├── dto/
└── entities/
```

Karena saat ingin menghapus fitur `orders`, kamu harus mencari file-nya di banyak tempat. Feature-first membuat domain mudah dipindah, direview, dan dihapus.

---

## 2. App module hanya wiring, bukan tempat logic

`app.module.ts` cukup untuk komposisi module global.
Jangan taruh business logic, constant domain, atau provider aneh di sini.

```ts
// src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './features/auth/auth.module'
import { UsersModule } from './features/users/users.module'
import { OrdersModule } from './features/orders/orders.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

Kalau `app.module.ts` mulai terasa penuh, biasanya masalahnya bukan butuh abstraction baru, tapi module boundary belum rapi.

---

## 3. Module per feature

Satu feature punya module sendiri. Export hanya provider yang benar-benar dibutuhkan feature lain.

```ts
// src/features/users/users.module.ts
import { Module } from '@nestjs/common'
import { UsersController } from './users.controller'
import { UsersRepository } from './users.repository'
import { UsersService } from './users.service'

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

Jangan export semua provider cuma karena “biar gampang”. Itu membuat coupling makin liar.

---

## 4. Controller tipis, service yang punya use-case

Controller hanya bertugas:

- menerima request
- validasi input
- memanggil service
- mengembalikan hasil

Controller tidak boleh berisi business rule panjang.

```ts
// src/features/orders/orders.controller.ts
import { Body, Controller, Param, Post, UsePipes } from '@nestjs/common'
import { ZodValidationPipe } from '../../shared/validation/zod-validation.pipe'
import { CreateOrderSchema, type CreateOrderInput } from './orders.schema'
import { OrdersService } from './orders.service'

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  async createOrder(@Body() input: CreateOrderInput) {
    return this.ordersService.createOrder(input)
  }

  @Post(':orderId/cancel')
  async cancelOrder(@Param('orderId') orderId: string) {
    return this.ordersService.cancelOrder(orderId)
  }
}
```

Service berisi use-case yang eksplisit.

```ts
// src/features/orders/orders.service.ts
import { Injectable } from '@nestjs/common'
import { AppError } from '../../shared/errors/app-error'
import { ErrorCode } from '../../shared/errors/error-code'
import { OrdersRepository } from './orders.repository'
import type { CreateOrderInput } from './orders.schema'

@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}

  async createOrder(input: CreateOrderInput) {
    const existingPendingOrder = await this.ordersRepository.findPendingOrderByUserId(input.userId)

    if (existingPendingOrder) {
      throw new AppError(
        ErrorCode.CONFLICT,
        'User already has a pending order. Complete or cancel it before creating a new one.',
        409
      )
    }

    return this.ordersRepository.createOrder(input)
  }

  async cancelOrder(orderId: string) {
    const order = await this.ordersRepository.findById(orderId)

    if (!order) {
      throw new AppError(ErrorCode.NOT_FOUND, 'Order does not exist.', 404)
    }

    if (order.status === 'shipped') {
      throw new AppError(
        ErrorCode.CONFLICT,
        'Order cannot be cancelled because it has already been shipped.',
        409
      )
    }

    return this.ordersRepository.cancelOrder(orderId)
  }
}
```

---

## 5. Naming khusus NestJS

### File naming

Gunakan kebab-case dan suffix NestJS yang jelas.

```txt
orders.controller.ts
orders.service.ts
orders.repository.ts
orders.schema.ts
orders.types.ts
orders.module.ts
```

Hindari:

```txt
orderHandler.ts
orderManager.ts
orderLogic.ts
orderUtils.ts
```

### Function naming

Gunakan verb + noun.

```ts
// Buruk
async getData() {}
async process() {}
async handle() {}
async execute() {}

// Baik
async findUserByEmail(email: string) {}
async createPasswordResetToken(userId: string) {}
async markInvoiceAsPaid(invoiceId: string) {}
async cancelPendingOrder(orderId: string) {}
```

### Boolean naming

```ts
const isExpired = token.expiresAt < new Date()
const hasReachedLimit = orderCount >= MAX_ACTIVE_ORDER_COUNT
const canCancelOrder = order.status === 'pending'
const shouldSendWelcomeEmail = user.loginCount === 0
```

---

## 6. DTO vs Zod schema

Prefer Zod untuk runtime validation dan type inference.
NestJS DTO class boleh dipakai kalau project sudah standard dengan `class-validator`, tapi jangan campur dua gaya tanpa alasan.

Rekomendasi default: **Zod schema per feature**.

```ts
// src/features/orders/orders.schema.ts
import { z } from 'zod'
import { UuidSchema } from '../../shared/validation/common.schema'

export const CreateOrderSchema = z.object({
  userId: UuidSchema,
  productId: UuidSchema,
  quantity: z.coerce.number().int().min(1).max(99),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>
```

Common schema hanya untuk primitive yang benar-benar reused.

```ts
// src/shared/validation/common.schema.ts
import { z } from 'zod'

export const UuidSchema = z.string().uuid()
export const EmailSchema = z.string().email().toLowerCase()
export const SlugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must use lowercase letters, numbers, and hyphens only')

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

---

## 7. Zod validation pipe

```ts
// src/shared/validation/zod-validation.pipe.ts
import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common'
import type { ZodSchema } from 'zod'

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value)

    if (!result.success) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Request payload is invalid.',
        details: result.error.flatten(),
      })
    }

    return result.data
  }
}
```

Untuk body:

```ts
@Post()
@UsePipes(new ZodValidationPipe(CreateOrderSchema))
async createOrder(@Body() input: CreateOrderInput) {
  return this.ordersService.createOrder(input)
}
```

Untuk query, buat pipe kecil yang eksplisit. Jangan bikin satu pipe super fleksibel kalau belum perlu.

---

## 8. API response envelope wajib konsisten

Semua response sukses harus punya shape:

```ts
// src/shared/api/api-response.ts
export type ApiSuccess<T> = {
  ok: true
  data: T
  meta?: {
    page?: number
    total?: number
    tookMs?: number
  }
}

export type ApiError = {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError
```

Catatan: di boundary publik NestJS, gunakan `camelCase` untuk response JSON aplikasi.
Kalau database atau backend dependency pakai `snake_case`, transform di boundary repository/client, bukan di controller.

---

## 9. Response interceptor

Interceptor membungkus response sukses menjadi envelope.

```ts
// src/shared/api/response.interceptor.ts
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map, Observable } from 'rxjs'
import { toCamelCaseDeep } from '../utils/case-converter'
import type { ApiSuccess } from './api-response'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(
      map((data) => ({
        ok: true,
        data: toCamelCaseDeep(data) as T,
      }))
    )
  }
}
```

Register global di `main.ts`.

```ts
// src/main.ts
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { ResponseInterceptor } from './shared/api/response.interceptor'
import { GlobalExceptionFilter } from './shared/errors/global-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true })

  app.useGlobalInterceptors(new ResponseInterceptor())
  app.useGlobalFilters(new GlobalExceptionFilter())

  await app.listen(process.env.PORT ?? 3000)
}

void bootstrap()
```

---

## 10. Wajib convert semua response ke camelCase

Backend dependency, database, atau external API boleh `snake_case`.
NestJS response keluar ke client wajib `camelCase`.

Implementasi central:

```ts
// src/shared/utils/case-converter.ts
type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function toCamelCase(value: string): string {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

export function toCamelCaseDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => toCamelCaseDeep(item)) as T
  }

  if (!isPlainObject(value)) {
    return value
  }

  const convertedEntries = Object.entries(value).map(([key, entryValue]) => [
    toCamelCase(key),
    toCamelCaseDeep(entryValue),
  ])

  return Object.fromEntries(convertedEntries) as T
}
```

Aturan penting:

- Convert response di interceptor atau API client boundary.
- Jangan convert manual di tiap controller.
- Jangan biarkan component/frontend tahu ada `snake_case`.
- Jangan convert class instance, `Date`, `Buffer`, `File`, atau stream sembarangan.
- Untuk response besar, pertimbangkan mapping eksplisit di repository agar tidak membebani runtime.

Contoh repository boleh menerima snake_case dari database:

```ts
// src/features/users/users.repository.ts
@Injectable()
export class UsersRepository {
  async findById(userId: string) {
    const userRecord = await this.database.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        created_at: true,
        updated_at: true,
      },
    })

    return userRecord
  }
}
```

Response keluar tetap:

```json
{
  "ok": true,
  "data": {
    "id": "...",
    "email": "user@app.com",
    "createdAt": "2026-05-16T10:00:00.000Z",
    "updatedAt": "2026-05-16T10:00:00.000Z"
  }
}
```

---

## 11. Error code pakai konstanta

```ts
// src/shared/errors/error-code.ts
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_PAYLOAD_SIGNATURE: 'INVALID_PAYLOAD_SIGNATURE',

  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]
```

Jangan hardcode string error di banyak file.

---

## 12. AppError untuk domain error

```ts
// src/shared/errors/app-error.ts
import type { ErrorCode } from './error-code'

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

Pakai di service:

```ts
throw new AppError(
  ErrorCode.NOT_FOUND,
  'User does not exist. Check the user ID and try again.',
  404
)
```

Hindari:

```ts
throw new Error('not found')
throw new BadRequestException('bad request')
```

Nest exception boleh dipakai di infrastructure boundary, tapi domain service lebih rapi pakai `AppError`.

---

## 13. Global exception filter

```ts
// src/shared/errors/global-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common'
import { AppError } from './app-error'
import { ErrorCode } from './error-code'
import { toCamelCaseDeep } from '../utils/case-converter'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse()

    if (error instanceof AppError) {
      return response.status(error.statusCode).json({
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          details: toCamelCaseDeep(error.details),
        },
      })
    }

    if (error instanceof HttpException) {
      const statusCode = error.getStatus()
      const exceptionResponse = error.getResponse()

      return response.status(statusCode).json({
        ok: false,
        error: normalizeHttpException(exceptionResponse),
      })
    }

    // Log error tak terduga ke logger/Sentry di implementasi asli.
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      ok: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Something went wrong. Please try again later.',
      },
    })
  }
}

function normalizeHttpException(exceptionResponse: string | object) {
  if (typeof exceptionResponse === 'string') {
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: exceptionResponse,
    }
  }

  const responseBody = toCamelCaseDeep(exceptionResponse) as Record<string, unknown>

  return {
    code: typeof responseBody.code === 'string' ? responseBody.code : ErrorCode.INTERNAL_ERROR,
    message: typeof responseBody.message === 'string' ? responseBody.message : 'Request failed.',
    details: responseBody.details,
  }
}
```

---

## 14. Repository: data access, bukan business logic

Repository hanya bicara dengan database/external persistence.
Business rule tetap di service.

```ts
@Injectable()
export class OrdersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(orderId: string) {
    return this.database.order.findUnique({
      where: { id: orderId },
    })
  }

  async createOrder(input: CreateOrderInput) {
    return this.database.order.create({
      data: input,
    })
  }

  async cancelOrder(orderId: string) {
    return this.database.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    })
  }
}
```

Hindari repository yang punya rule seperti `if order shipped then throw`. Itu service layer.

---

## 15. Dependency injection: eksplisit, jangan magic

NestJS sudah DI-friendly. Gunakan constructor injection.

```ts
@Injectable()
export class PaymentService {
  constructor(
    private readonly ordersRepository: OrdersRepository,
    private readonly paymentGateway: PaymentGatewayClient,
    private readonly logger: LoggerService
  ) {}
}
```

Hindari instansiasi manual dependency di dalam service.

```ts
// Buruk
private readonly paymentGateway = new MidtransClient()
```

Itu susah di-test dan susah diganti.

---

## 16. Jangan overuse decorator custom

Custom decorator boleh dipakai kalau benar-benar menghapus noise yang berulang.
Jangan membuat decorator yang menyembunyikan logic penting.

Baik:

```ts
export const CurrentUser = createParamDecorator((_data, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest()
  return request.user
})
```

Buruk:

```ts
@MagicOrderFlow()
async createOrder() {}
```

Kalau pembaca tidak tahu logic penting terjadi di mana, decorator itu merusak readability.

---

## 17. Guard, interceptor, pipe, middleware: pakai sesuai tanggung jawab

| Tool NestJS | Gunakan untuk | Jangan gunakan untuk |
|---|---|---|
| Middleware | request ID, raw body, logging request dasar | business validation |
| Guard | auth, permission, access control | transform response |
| Pipe | validation dan transform input | query database |
| Interceptor | response envelope, timing, serialization | business rule |
| Filter | error normalization | menyembunyikan error domain yang harus jelas |

---

## 18. Request ID wajib

```ts
// src/shared/middleware/request-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: any, response: any, next: () => void) {
    const requestId = request.headers['x-request-id'] ?? randomUUID()

    request.requestId = requestId
    response.setHeader('x-request-id', requestId)

    next()
  }
}
```

Register:

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*')
  }
}
```

---

## 19. Logging: jangan pakai console.log

Gunakan logger service. Implementasi boleh pakai Pino.

```bash
npm i nestjs-pino pino pino-pretty
```

```ts
// app.module.ts
import { LoggerModule } from 'nestjs-pino'

LoggerModule.forRoot({
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? { target: 'pino-pretty' }
        : undefined,
  },
})
```

Pakai structured log:

```ts
this.logger.info({ userId, orderId }, 'Order created')
this.logger.error({ err, requestId }, 'Failed to process payment')
```

Hindari:

```ts
console.log('masuk sini')
console.log(user)
```

---

## 20. Sentry setup minimal

```bash
npm i @sentry/node
```

```ts
// src/instrument.ts
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
})

export const captureException = Sentry.captureException.bind(Sentry)
```

Import paling awal di `main.ts`:

```ts
import './instrument'
```

Di exception filter, capture error tidak terduga.

---

## 21. Environment validation

Crash early kalau env salah.

```ts
// src/config/env.schema.ts
import { z } from 'zod'

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  WEBHOOK_SECRET: z.string().min(32),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

export type Env = z.infer<typeof EnvSchema>
```

```ts
// src/config/app.config.ts
import { EnvSchema } from './env.schema'

export const config = EnvSchema.parse(process.env)
```

---

## 22. HMAC signature untuk webhook

Untuk webhook atau internal service-to-service, validasi payload mentah.

```ts
// src/shared/security/verify-hmac-signature.ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyHmacSignature(params: {
  rawBody: Buffer
  signatureHeader: string | undefined
  secret: string
}): boolean {
  const { rawBody, signatureHeader, secret } = params

  if (!signatureHeader) return false

  const [algorithm, receivedHash] = signatureHeader.split('=')

  if (algorithm !== 'sha256' || !receivedHash) return false

  const expectedHash = createHmac('sha256', secret).update(rawBody).digest('hex')

  return timingSafeEqual(Buffer.from(receivedHash, 'hex'), Buffer.from(expectedHash, 'hex'))
}
```

Webhook guard:

```ts
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest()

    const isValid = verifyHmacSignature({
      rawBody: request.rawBody,
      signatureHeader: request.headers['x-signature-256'],
      secret: process.env.WEBHOOK_SECRET!,
    })

    if (!isValid) {
      throw new AppError(
        ErrorCode.INVALID_PAYLOAD_SIGNATURE,
        'Webhook signature is invalid.',
        401
      )
    }

    return true
  }
}
```

Aktifkan raw body:

```ts
const app = await NestFactory.create(AppModule, { rawBody: true })
```

---

## 23. Testing sebagai dokumentasi

Nama test harus bisa dibaca non-engineer.

```ts
// Buruk
it('returns 401', async () => {})
it('handles edge case', async () => {})

// Baik
it('rejects login when password is incorrect', async () => {})
it('prevents users from creating a second pending order', async () => {})
it('does not allow shipped orders to be cancelled', async () => {})
```

Service test harus fokus business rule.
Controller test cukup cek wiring dan validation kalau perlu.

```ts
it('does not allow shipped orders to be cancelled', async () => {
  ordersRepository.findById.mockResolvedValue({
    id: 'order-1',
    status: 'shipped',
  })

  await expect(service.cancelOrder('order-1')).rejects.toMatchObject({
    code: ErrorCode.CONFLICT,
  })
})
```

---

## 24. ESLint rules yang disarankan

```bash
npm i -D eslint @typescript-eslint/eslint-plugin eslint-plugin-unicorn eslint-plugin-sonarjs
```

Rules penting:

```js
rules: {
  'max-lines-per-function': ['error', { max: 30 }],
  'no-nested-ternary': 'error',
  'sonarjs/cognitive-complexity': ['error', 10],
  'sonarjs/no-duplicate-string': 'error',
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],
}
```

Untuk `no-magic-numbers`, boleh aktifkan bertahap karena NestJS decorator sering butuh angka HTTP/status/testing.
Kalau aktif, ignore angka umum seperti `0`, `1`, `-1`, `200`, `201`, `400`, `401`, `403`, `404`, `409`, `422`, `500`.

---

## 25. TypeScript strict

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Jangan jadikan `any` sebagai pelarian default.
Kalau data external belum jelas, pakai `unknown`, lalu validasi dengan Zod.

---

## 26. Docker untuk NestJS

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup -S appgroup && adduser -S appuser -G appgroup

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

USER appuser

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

`.dockerignore`:

```txt
node_modules
dist
.env*
*.log
coverage
.git
```

`docker-compose.yml` untuk dev:

```yaml
services:
  api:
    build:
      context: .
      target: builder
    command: npm run start:dev
    volumes:
      - .:/app
      - /app/node_modules
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
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 27. Git convention

```bash
feat(auth): add password reset flow
fix(orders): prevent cancelling shipped orders
refactor(users): move profile lookup into users service
test(auth): cover expired token login
chore(docker): add production Dockerfile
```

Hindari:

```bash
fix bug
update
changes
wip
```

---

## 28. Anti-AI language audit

Hapus atau ganti kata yang terlalu AI/marketing:

| Hindari | Ganti dengan |
|---|---|
| seamlessly | jelaskan prosesnya |
| robust | jelaskan tahan terhadap apa |
| leverage | gunakan |
| utilize | gunakan |
| facilitate | bantu / memungkinkan |
| comprehensive | lengkap, lalu sebutkan cakupannya |
| cutting-edge | sebut versi/teknologi spesifik |

Komentar juga harus manusiawi.

```ts
// Buruk: cuma menjelaskan kode
// Check if order exists
if (!order) throw new AppError(...)

// Baik: menjelaskan alasan bisnis
// Order yang sudah dihapus tetap tidak boleh dibuat ulang dengan ID lama
// karena ID dipakai untuk audit payment provider.
if (!order) throw new AppError(...)
```

---

## 29. DRY: centralize knowledge, bukan semua kemiripan

Masuk `shared/` hanya kalau lulus 3 pertanyaan:

1. Dipakai lebih dari satu feature domain?
2. Logikanya generic, bukan domain-specific?
3. Kalau feature asalnya dihapus, helper ini masih berguna?

Layak shared:

```ts
formatCurrency(amount, 'IDR')
toCamelCaseDeep(response)
parseIsoDate(dateString)
PaginationSchema
```

Tidak layak shared:

```ts
calculateOrderDiscount(order)
buildShippingLabel(shipment)
formatUserDisplayName(user)
```

Taruh helper domain-specific di folder feature.

```txt
features/orders/
├── orders.service.ts
├── orders.repository.ts
├── orders.schema.ts
└── order-pricing.ts
```

---

## 30. SOLID dalam NestJS secara praktis

### Single Responsibility

Controller menerima HTTP. Service menjalankan use-case. Repository bicara database.
Jangan campur semua di service raksasa.

Smell:

- `users.service.ts` lebih dari 300 baris
- function bernama `createAndNotifyAndSyncUser`
- satu service import 10+ dependency

### Open/Closed

Kalau ada provider baru, jangan edit `if/else` panjang.
Gunakan mapping atau provider interface.

```ts
interface PaymentProvider {
  charge(amount: number): Promise<PaymentResult>
}
```

### Liskov Substitution

Jangan buat subclass yang override method lalu mengubah kontrak.
Di NestJS, composition lebih sering lebih jelas daripada inheritance.

### Interface Segregation

Jangan buat interface repository terlalu gemuk.

```ts
interface UserReader {
  findById(userId: string): Promise<User | null>
}

interface UserWriter {
  createUser(input: CreateUserInput): Promise<User>
}
```

### Dependency Inversion

Depend ke abstraction saat dependency memang bisa diganti.
Tapi jangan bikin interface untuk semua class kalau baru ada satu implementasi dan belum ada alasan testability yang kuat.

---

## 31. Clean code refactor rules

### Guard clause

```ts
if (!order) {
  throw new AppError(ErrorCode.NOT_FOUND, 'Order does not exist.', 404)
}

if (order.status !== 'pending') {
  throw new AppError(ErrorCode.CONFLICT, 'Only pending orders can be cancelled.', 409)
}

return this.ordersRepository.cancelOrder(order.id)
```

Hindari nested if.

### Extract function kalau blok butuh komentar

```ts
const totalAmount = calculateOrderTotal(orderItems)
assertUserCanCheckout(user, totalAmount)
```

### Parameter object kalau parameter lebih dari 3

```ts
type CreateReportOptions = {
  userId: string
  dateRange: { start: Date; end: Date }
  format: 'pdf' | 'csv'
  includeArchived: boolean
}
```

---

## 32. README template untuk NestJS

```md
# Project Name

API NestJS untuk [siapa] yang menangani [masalah utama].

## Kenapa project ini ada?

Jelaskan tradeoff, bukan marketing copy.

## Quickstart

\`\`\`bash
npm install
cp .env.example .env
npm run start:dev
\`\`\`

## Struktur folder

Project ini pakai feature-first:

- `src/features/*` untuk domain aplikasi
- `src/shared/*` untuk helper lintas domain
- `src/config/*` untuk konfigurasi runtime

## API contract

Semua response sukses:

\`\`\`json
{ "ok": true, "data": {} }
\`\`\`

Semua response error:

\`\`\`json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Request payload is invalid.",
    "details": {}
  }
}
\`\`\`

Response JSON publik selalu `camelCase`, walaupun database/external API memakai `snake_case`.
```

---

## 33. Checklist sebelum PR

```txt
Taste rules
[ ] Tidak ada abstraction baru yang belum terbukti berulang minimal 3x
[ ] Tidak ada clever one-liner yang butuh lebih dari 5 detik untuk dipahami
[ ] Nama function jelas tanpa komentar penjelasan
[ ] Error message memberi langkah berikutnya
[ ] Helper baru di shared sudah lulus 3 pertanyaan DRY

NestJS structure
[ ] Feature baru ada di src/features/<feature-name>
[ ] Controller tipis dan tidak berisi business logic
[ ] Service berisi use-case yang eksplisit
[ ] Repository hanya data access
[ ] Module hanya export provider yang benar-benar dibutuhkan
[ ] Tidak ada folder global controllers/services/dto layer-first

API contract
[ ] Response sukses pakai envelope { ok: true, data }
[ ] Response error pakai envelope { ok: false, error }
[ ] Response keluar sudah camelCase
[ ] Tidak ada snake_case bocor ke client
[ ] Error code pakai ErrorCode, bukan string hardcode

Validation & security
[ ] Input external divalidasi Zod
[ ] Tidak ada any untuk payload external tanpa validasi
[ ] Webhook pakai HMAC signature
[ ] Secret tidak di-hardcode
[ ] Env divalidasi saat startup

Readability
[ ] Function maksimal 30 baris, kecuali ada alasan kuat
[ ] Tidak ada nested if lebih dari 2 level
[ ] Tidak ada komentar yang cuma menerjemahkan kode
[ ] Nama test bisa dibaca non-engineer
[ ] Tidak ada kata AI-ish: seamlessly, robust, leverage, utilize, facilitate

Observability
[ ] Request ID aktif
[ ] Log pakai logger, bukan console.log
[ ] Error tak terduga masuk logger/Sentry
[ ] Log memakai object context, bukan string panjang doang

Deployment
[ ] Dockerfile multi-stage
[ ] .dockerignore lengkap
[ ] .env.example update kalau ada env baru
[ ] docker compose bisa jalan lokal
```

---

## Referensi cepat

- Mau tambah fitur? Buat folder di `src/features/<feature>`.
- Mau validasi body? Buat `feature.schema.ts` dengan Zod.
- Mau return response? Return data mentah dari service; interceptor membungkus envelope dan convert camelCase.
- Mau throw error bisnis? Pakai `AppError` + `ErrorCode`.
- Mau helper shared? Pastikan dipakai lintas domain dan tidak punya asumsi feature.
- Kode terasa AI? Ganti nama generic, hapus komentar yang menjelaskan kode, pecah function panjang, dan gunakan error message yang konkret.
