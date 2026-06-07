---
name: vue-nuxt-svelte-readability
description: >
  Skill readability-first untuk project Nuxt, Vue, dan Svelte/SvelteKit. Dipakai saat init project,
  code review, refactor, setup testing, struktur folder, API integration, state management,
  component design, dan standarisasi response frontend. project-readability.md adalah sumber
  kebenaran utama: boring code, naming manusiawi, feature/domain-first, error actionable,
  tests sebagai dokumentasi, anti-AI awkward patterns, API response wajib camelCase.
  - setup nuxt, setup vue, setup svelte, setup sveltekit, frontend structure, component structure,
  frontend code review, review vue, review nuxt, review svelte, api response camelcase,
  frontend tests, coverage tests
---

# Vue / Nuxt / Svelte Readability Skill

**Defer to `common/project-readability`** untuk naming, folder structure, komentar, test naming, API response shape, scale-aware architecture. Skill ini hanya mencakup hal spesifik Vue/Nuxt/Svelte.

> Jangan over-engineer: Simple project ≠ butuh Pinia store per feature, startup ≠ butuh composables factory.

---

## Struktur Folder — Domain-First

```
src/
├── app/                    # config, router, styles, providers
├── domains/{domain}/
│   ├── {feature}/
│   │   ├── api/            # API calls + mapper
│   │   ├── components/     # feature-specific components
│   │   ├── composables/    # feature-specific composables
│   │   ├── pages/          # page-level components
│   │   ├── stores/         # feature-specific state
│   │   ├── types/
│   │   └── tests/
├── shared/                 # genuinely cross-domain
│   ├── api/, components/, errors/, types/, utils/
└── tests/
```

Yang berubah bersama, taruh bersama. `domains/transaction/history` bukan `history/` global.
Feature component → feature folder. Generic component → shared. Feature mapper → feature/api.

### Nuxt
```
app/
├── app.vue, pages/, layouts/, middleware/
├── domains/, shared/
└── server/
```
Pages tipis — hanya routing boundary: `<OrderDetailPage />`. Logic tetap di domain.

### SvelteKit
```
src/
├── routes/                 # tipis, hanya routing
├── lib/
│   ├── app/, domains/, shared/
└── tests/
```

---

## API Boundary — camelCase Wajib

Backend boleh snake_case. Di frontend **wajib camelCase**. Tidak boleh ada `order.created_at` di component.

```ts
// types — contract type dipisah dari UI type
export type OrderApiResponse = { id: string; order_number: string; created_at: string; total_amount: number }
export type Order = { id: string; orderNumber: string; createdAt: string; totalAmount: number }

// mapper — explicit untuk domain penting
export function mapOrderFromApi(r: OrderApiResponse): Order {
  return { id: r.id, orderNumber: r.order_number, createdAt: r.created_at, totalAmount: r.total_amount }
}
```

Critical business data → explicit mapper + tests. Low-risk → deep camelize boleh (`camelcase-keys`).

### API Response Envelope
```ts
type ApiSuccess<T> = { ok: true; data: T; meta?: { page?: number; total?: number; tookMs?: number } }
type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }
type ApiResponse<T> = ApiSuccess<T> | ApiError
```

### HTTP Client — satu project, satu boundary
```ts
// Nuxt
export async function apiFetch<T>(path: string, options?: Parameters<typeof $fetch>[1]): Promise<T> {
  return $fetch<T>(path, { baseURL: useRuntimeConfig().public.apiBaseUrl, credentials: 'include', ...options })
}
```

Component tidak boleh call fetch langsung.

---

## Error Handling

Jangan expose raw backend error. Map ke message actionable.

```ts
export class AppClientError extends Error {
  constructor(public readonly code: string, message: string, public readonly details?: unknown) {
    super(message); this.name = 'AppClientError'
  }
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppClientError && error.code === 'ORDER_NOT_FOUND')
    return 'Order tidak ditemukan. Cek link atau hubungi support.'
  return 'Gagal memuat data. Coba refresh.'
}
```

---

## Component Design

Satu component = satu alasan berubah.
`OrderSummaryCard` → render summary. `PaymentStatusBadge` → render status. Bukan `OrderComponent`.

Props eksplisit:
```ts
defineProps<{ orderNumber: string; totalAmount: number; paymentStatus: PaymentStatus }>()
```

---

## Composables / Stores

Composable untuk behavior: `useOrderDetail(orderId)`, `useSubmitCheckoutForm()`.

Store hanya untuk state lintas screen: auth, cart, workspace, preferences.
Jangan semua fetch masuk store. State lokal page → composable. State lintas page → store.

---

## Tests

| Area | Target |
|---|---|
| Overall | 85% |
| Critical flow | 95% |
| Mapper/API boundary | 100% |

```ts
it('maps order API response to camelCase', () => {
  const order = mapOrderFromApi({ id: '1', order_number: 'ORD-001', created_at: '2026-01-01T00:00:00Z', total_amount: 150000, payment_status: 'paid' })
  expect(order).toEqual({ id: '1', orderNumber: 'ORD-001', createdAt: '2026-01-01T00:00:00Z', totalAmount: 150000, paymentStatus: 'paid' })
  expect('created_at' in order).toBe(false)
})
```

Nama test natural language: `it('shows retry button when payment failed', () => {})`.

---

## Validation

```ts
import { z } from 'zod'
const OrderApiResponseSchema = z.object({
  id: z.string(), order_number: z.string(), created_at: z.string(), total_amount: z.number(), payment_status: z.enum(['pending', 'paid', 'failed']),
})
```

Data dari backend/vendor/localStorage/query params → validasi runtime kalau critical.

---

## Anti-AI Frontend Smells

- `components/CommonSomething.vue`, `utils/helpers.ts`
- `useApiData()`, `useCommonState()`, `handleSubmit()`, `getData()`
- Kata: seamlessly, robust, leverage, utilize, comprehensive, cutting-edge, facilitate

---

## PR Checklist

```
[ ] File di domain yang tepat, bukan root components/composables
[ ] Tidak ada snake_case di component/composable/store
[ ] Critical mapper punya test
[ ] API error dimap ke message actionable
[ ] Loading, empty, error, success state ditangani
[ ] Overall coverage >= 85%
[ ] Critical flow >= 95%
[ ] Tidak ada fetch langsung di component
[ ] Component props eksplisit
[ ] Shared/ hanya berisi yang benar-benar lintas domain
```

## Referensi

- Naming, folder, API response → `common/project-readability`
- Code audit → `code-health`
