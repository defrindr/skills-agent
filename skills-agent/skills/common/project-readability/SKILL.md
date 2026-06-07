---
name: project-readability
description: >
  Panduan init project dengan readability tinggi dan bebas dari AI awkward patterns.
  Gunakan skill ini setiap kali memulai project baru, code review, nulis dokumentasi,
  atau kapanpun ada pertanyaan soal naming, komentar, arsitektur folder, atau konvensi kode.
  Trigger: "setup project", "init project", "code review", "review kode ini",
  "standarisasi response", "error handling", "payload validation", "docker setup",
  atau bilang kodenya "aneh", "robotic", atau "keliatan AI banget".
---

# Project Readability Skill

Panduan ini dipakai di setiap fase project: init, review, docs, dan refactor.
Tujuannya satu: kode yang bisa dibaca manusia — bukan output AI yang di-paste mentah.

---

## Taste Rules

Prinsip ini ada di atas semua section lain. Kalau ada konflik, taste rules menang.

1. **Jangan bikin abstraction sebelum ada pola yang terbukti berulang minimal 3x.** Abstraksi prematur lebih mahal dari duplikasi.
2. **Prefer boring code over clever code.** One-liner yang butuh 10 detik dipahami lebih buruk dari 5 baris yang langsung jelas.
3. **Kalau nama function butuh komentar, namanya belum cukup jelas.**
4. **Error message harus bantu user/developer melakukan langkah berikutnya.** `"Order cannot be cancelled because it's already shipped."` bukan `"Something went wrong"`.
5. **Optimasi untuk pembaca berikutnya, bukan untuk baris count.** Kalau ragu, pilih yang lebih mudah di-delete.
6. **Jangan bikin `shared/utils/` jadi tempat sampah.** Helper yang relevan cuma satu fitur → taruh di fitur itu.

---

## Anti-AI Generated Patterns

- **No icons/emoji in code or comments.** Plain text, professional.
- **Match complexity to project scale.** MVP = minimal abstraction. Startup = feature-first + service layer. Enterprise = baru consider DDD.
- **Variable/function names harus spesifik, verb + noun.** `fetchUserOrderHistory()` bukan `getData()`.
- **No abstraction sebelum pola berulang 3x.** Direct implementation dulu, baru extract kalau terbukti perlu.
- **No verbose JSDoc untuk hal obvious.** JSDoc cuma untuk context penting (side effects, gotchas).
- **No placeholder comments.** TODO harus spesifik + assignee + deadline.
- **No AI-marketing words:** seamlessly, robust, leverage, utilize, facilitate, comprehensive, cutting-edge.

---

## Naming

**Fungsi:** verb + noun yang spesifik. `fetchUserOrderHistory(userId)`, `submitCheckoutForm(formData)`, `filterExpiredSubscriptions(subscriptions)`.

**Variabel:** konkret, no abbrev. `createdAt` bukan `d`, `activeOrders` bukan `temp`.

**Boolean:** is/has/can/should prefix. `isLoading`, `hasPermission`, `canDeletePost`, `shouldSendEmail`.

---

## Folder Structure — Feature-First

```
src/
├── features/
│   ├── auth/          ← satu domain, satu folder
│   │   ├── auth.service.ts
│   │   └── auth.schema.ts
│   └── orders/
│       └── ...
├── shared/            ← hanya untuk yang genuinely dipakai lintas domain
│   ├── utils/
│   ├── hooks/
│   └── types/
└── app/               ← entrypoint, routing, config
```

Scale-aware:
- **Simple (MVP):** tiap feature = 2 file (controller + service langsung panggil DB)
- **Medium (startup):** feature module + service + schema
- **Complex (enterprise):** feature module + controller + service + repository + schema + types

---

## Comments — jelasin KENAPA, bukan APA

Komentar yang cuma parafrase kode → hapus. Komentar untuk konteks/keputusan bisnis → tahan.

```
// Hanya proses user aktif karena user suspended masih perlu datanya
// untuk audit trail, tapi tidak boleh diikutkan di report ini
```

---

## API Response Standard

Semua endpoint wajib kembalikan shape konsisten:

```ts
type ApiSuccess<T> = { ok: true; data: T; meta?: { page?: number; total?: number; tookMs?: number } }

type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

**Error codes — pakai konstanta:**

```ts
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED', FORBIDDEN: 'FORBIDDEN', TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  VALIDATION_FAILED: 'VALIDATION_FAILED', INVALID_PAYLOAD_SIGNATURE: 'INVALID_PAYLOAD_SIGNATURE',
  NOT_FOUND: 'NOT_FOUND', CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR', SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const
```

**AppError — jangan throw Error polos:**

```ts
export class AppError extends Error {
  constructor(
    public readonly code: keyof typeof ErrorCode,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) { super(message); this.name = 'AppError' }
}

throw new AppError(ErrorCode.USER_NOT_FOUND, 'User with this ID does not exist', 404)
```

**Global error handler:**

```ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ok: false, error: { code: err.code, message: err.message, details: err.details } })
  }
  logger.error(err); captureException(err)
  return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong. Please try again later.' } })
}
```

Response publik **wajib camelCase** walaupun DB/external API pakai snake_case. Transform di boundary (interceptor/repository), jangan di controller.

---

## Request Validation — Zod

```ts
import { z } from 'zod'

const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})
type CreateOrderInput = z.infer<typeof CreateOrderSchema>

// Middleware
export const validateBody = <T>(schema: ZodSchema<T>) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) throw new AppError(ErrorCode.VALIDATION_FAILED, 'Request body is invalid', 422, result.error.flatten())
  req.body = result.data
  next()
}
```

---

## DRY — 3 Questions Before Shared

Sebelum taruh helper di `shared/utils/`, jawab 3 ini:

1. **Dipakai lebih dari satu feature domain?** Kalau tidak → taruh di feature-nya.
2. **Generic, bukan domain-specific?** Kalau ada asumsi bisnis → jangan angkat.
3. **Berguna setelah feature asalnya dihapus?** Kalau tidak → milik feature itu.

**Layak shared:** `formatCurrency`, `slugify`, `parseISODate`, `PaginationSchema`, `EmailSchema`
**Tidak layak:** `calculateOrderDiscount`, `buildShippingLabel`, `formatUserDisplayName`

---

## PR Checklist

```
[ ] Nama function jelas tanpa komentar penjelasan
[ ] Error message actionable, bukan "Something went wrong"
[ ] Tidak ada variabel bernama: data, res, temp, result, item
[ ] Tidak ada emoji/icons dalam kode
[ ] Response pakai ApiSuccess/ApiError envelope
[ ] Input external divalidasi dengan Zod
[ ] Error pakai AppError, bukan Error polos
[ ] No AI words: seamlessly, robust, leverage, utilize
[ ] Fungsi ≤ 30 baris, tidak ada nested if > 2 level
[ ] Test names bisa dibaca non-engineer
[ ] Helper baru di shared/ sudah lulus 3 questions DRY
[ ] Fungsi dengan > 3 parameter pakai object, bukan positional
[ ] .env.example updated kalau ada env var baru
[ ] Dockerfile multi-stage
[ ] Error tak terduga masuk logger/Sentry
[ ] Request ID wajib di tiap response
```

---

## Referensi Skill Lain

- **Database schema & migrations** → `database-designer`
- **Slow query / N+1 / indexes** → `database-optimizer`
- **Code audit (performance + security)** → `code-health`
- **Framework specifics** → `*-readability` (nestjs, expressjs, laravel, dll)
- **Docker & env validation** → detail di `*-readability` masing-masing framework
