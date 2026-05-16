---
name: nextjs-readability
description: >
  Panduan khusus Next.js untuk menjaga readability, struktur feature-first,
  API handling yang konsisten, dan boundary data yang rapi antara backend dan frontend.
  Gunakan skill ini saat init project Next.js, code review, refactor component,
  setup API client, bikin server actions, route handlers, form validation,
  error handling, caching, authentication flow, observability, Docker setup,
  atau saat response backend masih snake_case tapi frontend harus konsisten camelCase.
  Trigger saat user minta "setup nextjs", "init nextjs", "review component",
  "review nextjs", "server action", "route handler", "api client",
  "standarisasi response", "camelcase response", "backend snake_case",
  "error handling nextjs", atau bilang kodenya "aneh", "robotic", atau "keliatan AI banget".
---

# Next.js Readability Skill

Skill ini adalah versi khusus Next.js dari prinsip readability project.
Tujuannya satu: codebase Next.js yang gampang dibaca, gampang diubah, dan tidak bocor detail backend ke UI.

Prinsip utama: **frontend boleh hidup dengan `camelCase`, walaupun backend pakai `snake_case`.**
Konversi dilakukan di boundary API, bukan di component.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk Next.js.
> 
> **Jangan over-engineer**: Simple project ≠ butuh server actions per feature, startup ≠ butuh custom API client factory, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

---

## Taste Rules

Kalau ada konflik antara best practice dan taste rules ini, taste rules menang.

| # | Rule | Artinya dalam praktik Next.js |
|---|------|-------------------------------|
| 1 | **Jangan bikin abstraction sebelum ada pola yang terbukti berulang.** | Jangan bikin `useApiFactory`, `BaseRepository`, atau `createCrudHooks` sebelum pattern-nya kejadian minimal 3x di fitur berbeda. |
| 2 | **Prefer boring code over clever code.** | Server Component sederhana lebih baik daripada custom pattern yang butuh dokumentasi panjang. |
| 3 | **Kalau nama function butuh komentar, namanya belum cukup jelas.** | Rename dulu: `getData()` → `fetchUserOrders()`, `handleSubmit()` → `submitCheckoutForm()`. |
| 4 | **Error message harus kasih next step.** | Jangan tampilkan `Something went wrong` kecuali untuk fallback terakhir. Beri pesan yang bisa ditindaklanjuti. |
| 5 | **Kode bagus bukan yang paling pendek, tapi yang paling gampang diubah besok.** | Optimasi untuk developer berikutnya, bukan untuk jumlah file paling sedikit. |
| 6 | **Jangan bikin `shared/utils/` jadi tempat sampah.** | Helper yang cuma relevan untuk satu feature harus tinggal di feature itu. |
| 7 | **Boundary backend/frontend harus jelas.** | Backend boleh `snake_case`, UI wajib `camelCase`. Jangan campur dua style dalam component. |

---

## 1. Struktur folder Next.js

Pakai **feature-first**, dengan App Router tetap jadi entrypoint routing.

```txt
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   ├── api/
│   │   └── health/route.ts
│   └── dashboard/
│       └── page.tsx
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── actions/
│   │   ├── api/
│   │   ├── schemas/
│   │   ├── types/
│   │   └── index.ts
│   └── orders/
│       ├── components/
│       ├── actions/
│       ├── api/
│       ├── schemas/
│       ├── types/
│       └── index.ts
├── shared/
│   ├── api/
│   │   ├── client.ts
│   │   ├── response.ts
│   │   └── case-transform.ts
│   ├── components/
│   ├── constants/
│   ├── errors/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── utils/
└── middleware.ts
```

**Rule:**
- `app/` untuk routing, layouts, metadata, route handlers.
- `features/` untuk domain logic.
- `shared/` untuk hal yang benar-benar dipakai lintas domain.
- Component yang hanya dipakai fitur `orders` jangan masuk `shared/components/`.

---

## 2. Naming

### Function: verb + noun yang spesifik

```ts
// ❌ terlalu generic
async function getData() {}
function handleSubmit() {}
function processItems(items: unknown[]) {}

// ✅ jelas
async function fetchUserOrderHistory(userId: string) {}
function submitCheckoutForm(formData: CheckoutFormInput) {}
function filterExpiredSubscriptions(subscriptions: Subscription[]) {}
```

### Component: noun yang menjelaskan UI

```tsx
// ❌ generic
export function Card() {}
export function Modal() {}
export function List() {}

// ✅ jelas dalam domain
export function OrderSummaryCard() {}
export function CancelOrderDialog() {}
export function InvoiceList() {}
```

### Boolean: is/has/can/should

```ts
const isSubmitting = true
const hasActiveSubscription = true
const canCancelOrder = order.status === 'pending'
const shouldShowUpgradeBanner = !hasActiveSubscription
```

---

## 3. TypeScript setup

`tsconfig.json` wajib strict.

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Jangan trust data eksternal tanpa validasi runtime.
Pakai Zod untuk:
- response backend
- form input
- search params
- route handler body
- env vars

---

## 4. Standar data casing

### Rule utama

Frontend Next.js memakai **camelCase everywhere**.
Backend boleh mengirim **snake_case**.

Konversi wajib terjadi di boundary:
- API client
- route handler
- server action yang memanggil backend
- query/mutation wrapper

Konversi tidak boleh dilakukan di:
- React component
- JSX render
- form component
- utility random di fitur

```tsx
// ❌ buruk: component tahu backend snake_case
<p>{user.first_name}</p>
<p>{order.created_at}</p>

// ✅ benar: component hanya tahu camelCase
<p>{user.firstName}</p>
<p>{order.createdAt}</p>
```

---

## 5. Auto convert response ke camelCase

Buat satu helper global di `shared/api/case-transform.ts`.

```ts
// shared/api/case-transform.ts

type PlainObject = Record<string, unknown>

function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    Object.prototype.toString.call(value) === '[object Object]'
  )
}

function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
}

export function camelizeResponse<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => camelizeResponse(item)) as T
  }

  if (!isPlainObject(value)) {
    return value as T
  }

  const camelizedEntries = Object.entries(value).map(([key, entryValue]) => {
    return [snakeToCamel(key), camelizeResponse(entryValue)]
  })

  return Object.fromEntries(camelizedEntries) as T
}
```

**Rule:** jangan ubah `Date`, `File`, `Blob`, `FormData`, atau class instance. Kalau butuh support object khusus, tambahkan guard eksplisit.

---

## 6. API response envelope

Backend response distandarkan dalam envelope.
Kalau backend belum standar, normalisasi di API client.

```ts
// shared/api/response.ts

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

Catatan: `took_ms` dari backend harus berubah jadi `tookMs` sebelum dipakai frontend.

---

## 7. API client Next.js

Semua response backend lewat client ini agar otomatis camelCase.

```ts
// shared/api/client.ts

import { camelizeResponse } from './case-transform'
import type { ApiResponse } from './response'

const API_BASE_URL = process.env.API_BASE_URL

type RequestOptions = RequestInit & {
  next?: NextFetchRequestConfig
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const rawJson = await response.json().catch(() => null)
  const json = camelizeResponse<ApiResponse<T>>(rawJson)

  if (!response.ok) {
    return {
      ok: false,
      error: json.ok === false
        ? json.error
        : {
            code: 'HTTP_ERROR',
            message: `Request failed with status ${response.status}`,
          },
    }
  }

  return json
}
```

**Rule:** semua file feature API wajib pakai `apiClient`, bukan `fetch` langsung.

```ts
// features/orders/api/fetch-user-orders.ts

import { apiClient } from '@/shared/api/client'

export type Order = {
  id: string
  invoiceNumber: string
  createdAt: string
  totalAmount: number
}

export async function fetchUserOrders(userId: string) {
  return apiClient<Order[]>(`/users/${userId}/orders`, {
    next: { tags: ['orders', `user:${userId}:orders`] },
  })
}
```

---

## 8. Validasi response backend dengan Zod

CamelCase dulu, baru validate.

```ts
// features/orders/schemas/order.schema.ts

import { z } from 'zod'

export const OrderSchema = z.object({
  id: z.string().uuid(),
  invoiceNumber: z.string(),
  createdAt: z.string().datetime(),
  totalAmount: z.number(),
})

export const OrdersSchema = z.array(OrderSchema)

export type Order = z.infer<typeof OrderSchema>
```

```ts
// features/orders/api/fetch-user-orders.ts

import { apiClient } from '@/shared/api/client'
import { OrdersSchema } from '../schemas/order.schema'

export async function fetchUserOrders(userId: string) {
  const response = await apiClient<unknown>(`/users/${userId}/orders`)

  if (!response.ok) {
    return response
  }

  return {
    ok: true,
    data: OrdersSchema.parse(response.data),
  }
}
```

**Rule:** type frontend berasal dari Zod schema kalau data datang dari luar app.

---

## 9. Request body ke backend

Frontend internal tetap camelCase.
Kalau backend butuh snake_case untuk request, ubah di boundary juga.

```ts
// shared/api/case-transform.ts

function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
}

export function snakeifyRequest<T>(value: unknown): T {
  if (Array.isArray(value)) {
    return value.map((item) => snakeifyRequest(item)) as T
  }

  if (!isPlainObject(value)) {
    return value as T
  }

  const snakeEntries = Object.entries(value).map(([key, entryValue]) => {
    return [camelToSnake(key), snakeifyRequest(entryValue)]
  })

  return Object.fromEntries(snakeEntries) as T
}
```

```ts
// shared/api/client.ts

import { camelizeResponse, snakeifyRequest } from './case-transform'

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const body = options.body

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    body: body && typeof body === 'string'
      ? JSON.stringify(snakeifyRequest(JSON.parse(body)))
      : body,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const rawJson = await response.json().catch(() => null)
  return camelizeResponse<ApiResponse<T>>(rawJson)
}
```

Untuk `FormData`, jangan auto-snakeify. Tangani eksplisit di feature API.

---

## 10. Server Components vs Client Components

Default: pakai Server Component.
Tambahkan `'use client'` hanya kalau butuh:
- state interaktif
- event handler
- browser API
- animation client-side
- form library client-side

```tsx
// ✅ Server Component: data fetching dekat route
export default async function OrdersPage() {
  const ordersResponse = await fetchUserOrders('user-id')

  if (!ordersResponse.ok) {
    return <OrdersErrorMessage error={ordersResponse.error} />
  }

  return <OrderList orders={ordersResponse.data} />
}
```

```tsx
// ✅ Client Component hanya untuk interaksi
'use client'

export function CancelOrderButton({ orderId }: { orderId: string }) {
  return <button onClick={() => confirmCancelOrder(orderId)}>Cancel order</button>
}
```

**Rule:** jangan jadikan satu halaman full client hanya karena satu tombol butuh interaksi.

---

## 11. Server Actions

Pakai Server Actions untuk mutation yang dekat dengan form.
Tetap validasi input dengan Zod.

```ts
// features/orders/actions/cancel-order.action.ts

'use server'

import { revalidateTag } from 'next/cache'
import { z } from 'zod'
import { apiClient } from '@/shared/api/client'

const CancelOrderInputSchema = z.object({
  orderId: z.string().uuid(),
})

export async function cancelOrderAction(input: unknown) {
  const parsedInput = CancelOrderInputSchema.safeParse(input)

  if (!parsedInput.success) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Order ID is invalid.',
        details: parsedInput.error.flatten(),
      },
    }
  }

  const response = await apiClient(`/orders/${parsedInput.data.orderId}/cancel`, {
    method: 'POST',
  })

  if (response.ok) {
    revalidateTag('orders')
  }

  return response
}
```

---

## 12. Route Handlers

Route handler dipakai untuk:
- proxy ke backend kalau perlu hide credential
- webhook
- auth callback
- file upload endpoint
- integration endpoint

Jangan bikin route handler hanya untuk membungkus fetch biasa kalau Server Component bisa langsung panggil backend.

```ts
// app/api/health/route.ts

import { NextResponse } from 'next/server'

export function GET() {
  return NextResponse.json({
    ok: true,
    data: {
      status: 'healthy',
    },
  })
}
```

---

## 13. Error handling

### App error shape

```ts
// shared/errors/app-error.ts

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}
```

### UI error message

```tsx
// features/orders/components/orders-error-message.tsx

import type { ApiError } from '@/shared/api/response'

export function OrdersErrorMessage({ error }: { error: ApiError['error'] }) {
  return (
    <div role="alert">
      <h2>Orders cannot be loaded</h2>
      <p>{error.message}</p>
    </div>
  )
}
```

**Rule:** error UI harus menjawab: apa yang gagal, kenapa kalau diketahui, dan user bisa apa.

---

## 14. Loading, empty, error states

Setiap data UI wajib punya state ini:
- loading
- empty
- error
- success

```tsx
// app/orders/loading.tsx

export default function LoadingOrdersPage() {
  return <p>Loading orders...</p>
}
```

```tsx
// app/orders/error.tsx

'use client'

export default function OrdersPageError({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <h2>Orders cannot be loaded</h2>
      <p>Please try again. If this keeps happening, contact support.</p>
      <button onClick={reset}>Try again</button>
    </div>
  )
}
```

---

## 15. Search params

Validasi search params dengan Zod sebelum dipakai.

```ts
// features/orders/schemas/order-search-params.schema.ts

import { z } from 'zod'

export const OrderSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
})
```

```tsx
// app/orders/page.tsx

import { OrderSearchParamsSchema } from '@/features/orders/schemas/order-search-params.schema'

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const parsedSearchParams = OrderSearchParamsSchema.parse(await searchParams)

  return <OrdersView searchParams={parsedSearchParams} />
}
```

---

## 16. Forms

Form input schema harus satu sumber kebenaran.

```ts
// features/auth/schemas/login.schema.ts

import { z } from 'zod'

export const LoginFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type LoginFormInput = z.infer<typeof LoginFormSchema>
```

**Rule:** jangan bikin type manual yang menduplikasi Zod schema.

---

## 17. Caching & revalidation

Caching harus eksplisit.
Jangan pakai default fetch caching tanpa sadar.

```ts
// Static-ish data
await apiClient('/categories', {
  next: { revalidate: 3600, tags: ['categories'] },
})

// User-specific data
await apiClient(`/users/${userId}/orders`, {
  cache: 'no-store',
})

// Mutation success
revalidateTag('orders')
```

**Rule:**
- Public data boleh cache.
- User-specific/private data default `no-store`, kecuali sudah jelas aman.
- Setelah mutation, revalidate tag yang spesifik.

---

## 18. Metadata & SEO

Metadata jangan hardcode kalau tergantung data.

```ts
// app/products/[slug]/page.tsx

export async function generateMetadata({ params }: ProductPageProps) {
  const { slug } = await params
  const productResponse = await fetchProductBySlug(slug)

  if (!productResponse.ok) {
    return {
      title: 'Product not found',
    }
  }

  return {
    title: productResponse.data.name,
    description: productResponse.data.shortDescription,
  }
}
```

---

## 19. Middleware

Middleware hanya untuk logic ringan:
- auth redirect
- locale redirect
- request header enrichment

Jangan taruh business logic berat di middleware.

```ts
// middleware.ts

import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}
```

---

## 20. Observability

### Sentry minimal

```bash
npm i @sentry/nextjs
```

Gunakan wizard resmi Sentry atau setup manual.
Pastikan error unexpected tercapture dari:
- server components
- route handlers
- server actions
- client runtime

### Logger

Server-side pakai structured logger.
Jangan `console.log` untuk production behavior.

```ts
// shared/lib/logger.ts

import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
})
```

```ts
logger.info({ userId, orderId }, 'Order loaded')
logger.error({ err, requestId }, 'Failed to cancel order')
```

---

## 21. Environment variables

Validasi env saat startup.

```ts
// shared/lib/config.ts

import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  API_BASE_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

export const config = EnvSchema.parse(process.env)
```

**Rule:**
- Secret tidak boleh diawali `NEXT_PUBLIC_`.
- `.env.example` wajib di-update kalau ada env baru.
- Jangan akses `process.env.X` langsung di banyak file. Lewat `config`.

---

## 22. ESLint rules

Install minimal:

```bash
npm i -D eslint eslint-config-next @typescript-eslint/eslint-plugin eslint-plugin-unicorn eslint-plugin-sonarjs
```

Rules kunci:

```js
rules: {
  'max-lines-per-function': ['error', { max: 40 }],
  'no-nested-ternary': 'error',
  'sonarjs/cognitive-complexity': ['error', 10],
  'sonarjs/no-duplicate-string': 'error',
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],
}
```

Catatan: React component kadang butuh lebih dari 30 baris, jadi limit 40 masih masuk akal.
Kalau lebih dari itu, pecah component berdasarkan responsibility.

---

## 23. Testing

Nama test harus menjelaskan behavior.

```ts
// ❌ buruk
it('returns 401', () => {})
it('handles error', () => {})

// ✅ bagus
it('rejects login when password is incorrect', () => {})
it('shows empty state when user has no orders', () => {})
it('converts backend snake_case response into camelCase before rendering', () => {})
```

Test wajib untuk case transform:

```ts
import { camelizeResponse } from '@/shared/api/case-transform'

it('converts nested backend response keys into camelCase', () => {
  const response = {
    ok: true,
    data: {
      user_id: 'user-1',
      created_at: '2026-01-01T00:00:00.000Z',
      profile: {
        first_name: 'Yellow',
      },
    },
  }

  expect(camelizeResponse(response)).toEqual({
    ok: true,
    data: {
      userId: 'user-1',
      createdAt: '2026-01-01T00:00:00.000Z',
      profile: {
        firstName: 'Yellow',
      },
    },
  })
})
```

---

## 24. Docker untuk Next.js

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

ENV NODE_ENV=production

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

`.dockerignore`:

```txt
node_modules
.next
.env*
*.log
coverage
.git
```

---

## 25. Anti-AI language audit

Hapus kata-kata ini dari docs, comments, dan PR description kecuali memang perlu:

| Hindari | Ganti dengan |
|---------|--------------|
| seamlessly | jelaskan alurnya |
| robust | tahan terhadap apa? |
| leverage | gunakan / pakai |
| utilize | gunakan |
| facilitate | bantu / memungkinkan |
| comprehensive | lengkap / sebutkan isinya |
| cutting-edge | sebutkan versi/teknologi spesifik |

**Read out loud test:**
Baca nama function, component, dan komentar keras-keras.
Kalau kedengarannya robotic, ganti.

---

## 26. Checklist sebelum PR

```txt
Taste rules
[ ] Tidak ada abstraction baru sebelum pattern muncul minimal 3x
[ ] Tidak ada clever one-liner yang mengorbankan readability
[ ] Nama function/component jelas tanpa komentar penjelasan
[ ] Error message kasih next step
[ ] Helper baru di shared/ sudah lulus pertanyaan reuse lintas domain

Next.js architecture
[ ] Server Component jadi default
[ ] Client Component hanya untuk interaksi/browser API
[ ] app/ hanya untuk routing/layout/route handler
[ ] Domain logic tinggal di features/
[ ] Shared component benar-benar dipakai lintas fitur

API & casing
[ ] Semua response backend lewat apiClient
[ ] Response snake_case sudah otomatis jadi camelCase
[ ] Component tidak membaca field snake_case
[ ] Request ke backend di-snakeify hanya di boundary jika backend butuh snake_case
[ ] Response eksternal divalidasi dengan Zod
[ ] ApiSuccess/ApiError dipakai konsisten

Forms & validation
[ ] Form input divalidasi dengan Zod
[ ] Type berasal dari schema, bukan duplikasi manual
[ ] Search params divalidasi sebelum dipakai

Caching
[ ] Fetch caching eksplisit
[ ] Private/user-specific data tidak di-cache sembarangan
[ ] Mutation melakukan revalidateTag/revalidatePath yang tepat

Error/loading state
[ ] Loading state tersedia
[ ] Empty state tersedia
[ ] Error state tersedia dan actionable
[ ] error.tsx tidak expose stack trace ke user

Observability
[ ] Unexpected error masuk Sentry/logger
[ ] Log production pakai structured logger
[ ] Tidak ada console.log untuk behavior production

Deployment
[ ] Env vars divalidasi
[ ] Secret tidak pakai NEXT_PUBLIC_
[ ] .env.example updated
[ ] Dockerfile pakai output standalone
```

---

## Referensi cepat

- **Backend snake_case?** → `camelizeResponse()` di `apiClient`.
- **Request backend butuh snake_case?** → `snakeifyRequest()` di boundary.
- **Component baca `created_at`?** → salah tempat, harus `createdAt`.
- **Fetch langsung di feature?** → ganti pakai `apiClient`.
- **Data eksternal belum divalidasi?** → tambah Zod schema.
- **Satu page kebanyakan `'use client'`?** → pisah interactive part jadi client component kecil.
- **Helper mau masuk shared?** → pastikan dipakai lintas domain, bukan cuma kebetulan mirip.
