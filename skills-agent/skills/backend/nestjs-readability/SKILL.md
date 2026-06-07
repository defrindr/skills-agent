---
name: nestjs-readability
description: >
  Panduan membangun dan mereview project NestJS dengan readability tinggi,
  feature-first architecture, API contract yang konsisten, error handling yang jelas,
  validation yang aman, observability, Docker, dan style kode yang tidak terlihat seperti output AI mentah.
  Gunakan skill ini saat init project NestJS, membuat module baru, code review,
  refactor service/controller, standarisasi response/error/request, validasi payload,
  setup logging/Sentry, Docker containerization, atau saat kode keliatan AI banget.

  EXCLUDES: Database schema design, entities, migrations, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer.
---

# NestJS Readability Skill

Turunan khusus NestJS dari `common/project-readability`.

> **Naming, folder structure, API response envelope, error handling, DRY, taste rules → ikuti `common/project-readability`.** Skill ini hanya mencakup hal spesifik NestJS.

---

## Prinsip

| Rule | Praktik di NestJS |
|---|---|
| Jangan bikin abstraction sebelum pola terbukti | Jangan langsung bikin `BaseService`, `BaseRepository`, `AbstractCrudController` kalau baru dipakai sekali |
| Prefer boring code | Service eksplisit lebih baik dari decorator magic yang butuh lompat file |
| Feature-first | Satu domain = satu folder. Jangan pisah controller/service/dto ke folder global |
| Error harus actionable | Jangan return `Bad Request`. Jelaskan field, aturan, dan langkah berikutnya |
| Shared hanya untuk genuinely shared | Helper domain-specific tetap tinggal di feature-nya |

---

## Database — STOP/ASK/WAIT/VERIFY Protocol

### Jangan generate kode yang akses DB sebelum konfirmasi

**Protocol:** 1. STOP — jangan langsung generate entity/migration. 2. ASK — tanya user entity sudah di-design? 3. WAIT — tunggu jawaban. 4. VERIFY — pastikan entity ready.

```
Sebelum bikin [module-name], saya perlu cek database:
1. Apakah entity [EntityName] sudah di-design? (ERD, relationships)
2. Apakah entity file (orders.entity.ts) sudah ada?
3. Apakah migration sudah di-run?

Please confirm:
[ ] Entity sudah di-design [ ] Entity file sudah ada [ ] Migration sudah di-run
```

### Penting: `.schema.ts` ≠ entity

- `orders.schema.ts` = **Zod validation** (request/response validation)
- `orders.entity.ts` = **Database model** (TypeORM/Prisma entity)

Validation schema ≠ database schema. Jangan bingung.

**Kalau entity belum di-design → invoke `database-designer` dulu** (setelah minta izin user).

---

## Struktur Folder — Scale-Aware

### Simple (< 5 endpoints, CRUD API)
```txt
src/
├── app.module.ts ├── main.ts └── orders/
│   ├── orders.controller.ts ├── orders.service.ts ← langsung panggil DB
│   └── orders.schema.ts
└── shared/ └── api-response.ts + app-error.ts
```

### Medium (5-15 endpoints, business logic mulai kompleks)
```txt
src/
├── app.module.ts ├── main.ts └── features/
│   ├── auth/ → module + controller + service + schema
│   └── orders/ → ...
└── shared/ ├── api/, errors/, middleware/ └── validation/
```

### Complex (> 15 endpoints, multiple domains)
```txt
src/
├── app.module.ts + main.ts + config/
├── features/ ├── auth/ → module + controller + service + repository + schema
│   └── orders/ → ...
└── shared/ └── api/, errors/, middleware/, logger/, validation/
```

**Gunakan repository pattern HANYA jika:** perlu switch ORM, complex query reuse (10+ use cases), testing perlu mock banyak DB calls.

---

## App Module — Wiring, Bukan Logic

```ts
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, UsersModule, OrdersModule] })
export class AppModule {}
```

Kalau `app.module.ts` mulai terasa penuh → masalahnya module boundary, bukan butuh abstraction.

---

## Module Per Feature

Satu feature punya module sendiri. Export hanya provider yang benar-benar dibutuhkan feature lain.

```ts
@Module({ controllers: [UsersController], providers: [UsersService, UsersRepository], exports: [UsersService] })
export class UsersModule {}
```

Jangan export semua provider biar gampang — itu bikin coupling liar.

---

## Controller Tipis, Service yang Punya Use-Case

Controller: terima request, validasi input, panggil service, return hasil. **Tidak boleh berisi business rule.**

```ts
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}
  @Post() @UsePipes(new ZodValidationPipe(CreateOrderSchema))
  async createOrder(@Body() input: CreateOrderInput) { return this.ordersService.createOrder(input) }
}
```

Service: use-case eksplisit, validasi bisnis, orchestrasi.

```ts
@Injectable()
export class OrdersService {
  constructor(private readonly ordersRepository: OrdersRepository) {}
  async createOrder(input: CreateOrderInput) {
    const pending = await this.ordersRepository.findPendingByUserId(input.userId)
    if (pending) throw new AppError(ErrorCode.CONFLICT, 'User already has a pending order.', 409)
    return this.ordersRepository.createOrder(input)
  }
  async cancelOrder(orderId: string) {
    const order = await this.ordersRepository.findById(orderId)
    if (!order) throw new AppError(ErrorCode.NOT_FOUND, 'Order does not exist.', 404)
    if (order.status === 'shipped') throw new AppError(ErrorCode.CONFLICT, 'Order already shipped.', 409)
    return this.ordersRepository.cancelOrder(orderId)
  }
}
```

---

## File Naming

```txt
orders.controller.ts | orders.service.ts | orders.repository.ts | orders.schema.ts
```

Hindari: `orderHandler.ts`, `orderManager.ts`, `orderLogic.ts`.

---

## Zod Validation Pipe

```ts
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}
  transform(value: unknown): T {
    const result = this.schema.safeParse(value)
    if (!result.success) throw new BadRequestException({
      code: 'VALIDATION_FAILED', message: 'Request payload is invalid.', details: result.error.flatten(),
    })
    return result.data
  }
}
```

Pakai: `@Post() @UsePipes(new ZodValidationPipe(CreateOrderSchema))`.

Common schema untuk primitif yang benar-benar reused:
```ts
export const UuidSchema = z.string().uuid()
export const EmailSchema = z.string().email().toLowerCase()
export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})
```

---

## API Response Envelope

Lihat definisi `ApiSuccess`/`ApiError` di `common/project-readability`. Response publik **wajib camelCase**.

Response interceptor (daftarkan global):
```ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>> {
    return next.handle().pipe(map((data) => ({ ok: true, data: toCamelCaseDeep(data) as T })))
  }
}
app.useGlobalInterceptors(new ResponseInterceptor())
app.useGlobalFilters(new GlobalExceptionFilter())
```

### camelCase Converter
```ts
export function toCamelCaseDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(toCamelCaseDeep) as T
  if (!isPlainObject(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()), toCamelCaseDeep(v)])
  ) as T
}
```

Convert response di interceptor boundary, jangan di tiap controller. Jangan convert class instance/Date/Buffer.

---

## Global Exception Filter

```ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()
    if (error instanceof AppError)
      return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message, details: toCamelCaseDeep(error.details) } })
    if (error instanceof HttpException) {
      const status = error.getStatus()
      return res.status(status).json({ ok: false, error: normalizeHttpException(error.getResponse()) })
    }
    captureException(error)
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } })
  }
}
```

---

## Guard, Interceptor, Pipe, Middleware — Responsibilities

| Tool | Gunakan | Jangan gunakan |
|---|---|---|
| Middleware | request ID, raw body, logging dasar | business validation |
| Guard | auth, permission, access control | transform response |
| Pipe | validation + transform input | query database |
| Interceptor | response envelope, timing, serialization | business rule |
| Filter | error normalization | menyembunyikan error domain |

---

## NestJS-Specific PR Checklist

```
[ ] Feature ada di src/features/<name>/ bukan src/controllers/
[ ] Controller tipis — tidak berisi business logic
[ ] Service berisi use-case eksplisit dengan guard clauses
[ ] Module hanya export provider yang benar-benar dibutuhkan
[ ] Input divalidasi dengan Zod, bukan class-validator campur aduk
[ ] Tidak ada any untuk payload external tanpa validasi
[ ] Env divalidasi saat startup (EnvSchema)
[ ] Request ID aktif di semua response
[ ] Log pakai logger, bukan console.log
```

---

## Referensi

- Error codes & AppError → `common/project-readability`
- Database schema design → `database-designer`
- Query optimization → `database-optimizer`
- Code audit → `code-health`
