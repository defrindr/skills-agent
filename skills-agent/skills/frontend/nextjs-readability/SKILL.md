---
name: nextjs-readability
description: >
  Panduan khusus Next.js untuk readability, struktur feature-first,
  API handling yang konsisten, boundary data rapi antara backend dan frontend.
  Saat init project Next.js, code review, refactor component, setup API client,
  server actions, route handlers, form validation, error handling, caching,
  authentication flow, observability, Docker, atau response backend masih
  snake_case tapi frontend harus camelCase.
  Trigger: "setup nextjs", "init nextjs", "review component", "review nextjs",
  "server action", "route handler", "api client", "standarisasi response",
  "camelcase response", "backend snake_case", "error handling nextjs".
---

# Next.js Readability Skill

**Defer to `common/project-readability`** untuk naming, folder structure, komentar, test naming, API response shape, scale-aware architecture. Skill ini hanya mencakup hal spesifik Next.js.

> Jangan over-engineer: Simple project ≠ butuh server actions per feature.

---

## Struktur Folder

```
src/
├── app/                          # routing, layouts, metadata, route handlers
│   ├── layout.tsx, page.tsx, error.tsx, loading.tsx
│   └── api/health/route.ts
├── features/
│   ├── auth/
│   │   ├── components/, actions/, api/, schemas/, types/
│   └── orders/
│       ├── components/, actions/, api/, schemas/, types/
├── shared/
│   ├── api/       (client.ts, response.ts, case-transform.ts)
│   ├── components/, constants/, errors/, hooks/, lib/, types/, utils/
└── middleware.ts
```

---

## API Boundary — camelCase, Auto-Convert

Frontend camelCase, backend boleh snake_case. Konversi di boundary API, bukan di component.

```ts
// shared/api/case-transform.ts
function snakeToCamel(k: string) { return k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()) }

export function camelizeResponse<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map(camelizeResponse) as T
  if (typeof value !== 'object' || value === null) return value as T
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [snakeToCamel(k), camelizeResponse(v)])) as T
}
```

### API Response Envelope
```ts
type ApiSuccess<T> = { ok: true; data: T; meta?: { page?: number; total?: number; tookMs?: number } }
type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }
type ApiResponse<T> = ApiSuccess<T> | ApiError
```

### API Client
```ts
// shared/api/client.ts
export async function apiClient<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const response = await fetch(`${process.env.API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const raw = await response.json().catch(() => null)
  const json = camelizeResponse<ApiResponse<T>>(raw)
  if (!response.ok) return { ok: false, error: json.ok === false ? json.error : { code: 'HTTP_ERROR', message: `Request failed with status ${response.status}` } }
  return json
}
```

Semua file feature API wajib pakai `apiClient`, bukan `fetch` langsung.

### Validasi Response Backend dengan Zod
```ts
const OrderSchema = z.object({ id: z.string().uuid(), invoiceNumber: z.string(), createdAt: z.string().datetime(), totalAmount: z.number() })
const response = await apiClient<unknown>(`/users/${userId}/orders`)
if (response.ok) response.data = OrderSchema.parse(response.data)
```

---

## Server Components vs Client Components

Default: Server Component. `'use client'` hanya untuk state interaktif, event handler, browser API.

```tsx
// Server Component — data fetching dekat route
export default async function OrdersPage() {
  const res = await fetchUserOrders('user-id')
  if (!res.ok) return <OrdersErrorMessage error={res.error} />
  return <OrderList orders={res.data} />
}

// Client Component — hanya untuk interaksi
'use client'
export function CancelOrderButton({ orderId }: { orderId: string }) {
  return <button onClick={() => confirmCancelOrder(orderId)}>Cancel</button>
}
```

Jangan jadikan satu halaman full client hanya karena satu tombol butuh interaksi.

---

## Server Actions

```ts
'use server'
export async function cancelOrderAction(input: unknown) {
  const parsed = z.object({ orderId: z.string().uuid() }).safeParse(input)
  if (!parsed.success) return { ok: false, error: { code: 'VALIDATION_FAILED', message: 'Invalid order ID.' } }
  const response = await apiClient(`/orders/${parsed.data.orderId}/cancel`, { method: 'POST' })
  if (response.ok) revalidateTag('orders')
  return response
}
```

---

## Error Handling

```ts
export class AppError extends Error {
  constructor(public readonly code: string, public readonly message: string, public readonly statusCode = 400, public readonly details?: unknown) {
    super(message); this.name = 'AppError'
  }
}
```

Setiap data UI wajib punya: loading, empty, error, success state.

```tsx
// app/orders/error.tsx
'use client'
export default function OrdersPageError({ reset }: { reset: () => void }) {
  return <div role="alert"><h2>Orders cannot be loaded</h2><p>Try again or contact support.</p><button onClick={reset}>Retry</button></div>
}
```

---

## Search Params

Validasi dengan Zod:
```ts
const OrderSearchParamsSchema = z.object({ page: z.coerce.number().int().min(1).default(1), status: z.enum(['pending', 'paid', 'cancelled']).optional() })
const parsed = OrderSearchParamsSchema.parse(await searchParams)
```

---

## Caching

```ts
// Static-ish data
await apiClient('/categories', { next: { revalidate: 3600, tags: ['categories'] } })
// User-specific data
await apiClient(`/users/${userId}/orders`, { cache: 'no-store' })
// After mutation
revalidateTag('orders')
```

---

## Tests

```ts
it('converts nested backend snake_case to camelCase', () => {
  expect(camelizeResponse({ user_id: '1', profile: { first_name: 'Yellow' } }))
    .toEqual({ userId: '1', profile: { firstName: 'Yellow' } })
})
```

Nama test natural language: `it('rejects login when password is incorrect', () => {})`.

---

## PR Checklist

`[ ] Server Component default | Client hanya interaksi | app/ hanya routing | domain di features/ | apiClient wajib | snake→camel auto | Zod validasi eksternal + form + search params | caching eksplisit | loading/empty/error state | error.tsx no stack trace | secret ≠ NEXT_PUBLIC_ | .env.example updated | Sentry/logger`

## Referensi

- Error codes & AppError → `common/project-readability`
- Database schema → `database-designer`
- Query optimization → `database-optimizer`
- Code audit → `code-health`
