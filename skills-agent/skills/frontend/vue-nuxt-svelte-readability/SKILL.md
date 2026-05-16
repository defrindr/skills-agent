---
name: vue-nuxt-svelte-readability
description: >
  Skill readability-first untuk project Nuxt, Vue, dan Svelte/SvelteKit. Dipakai saat init project,
  code review, refactor, setup testing, struktur folder, API integration, state management, component design,
  dan standarisasi response frontend. project-readability.md adalah sumber kebenaran utama: boring code,
  naming manusiawi, feature/domain-first, error yang actionable, tests sebagai dokumentasi, anti-AI awkward patterns,
  dan API response wajib camelCase walaupun backend/database memakai snake_case.
  - setup nuxt
  - setup vue
  - setup svelte
  - setup sveltekit
  - frontend structure
  - component structure
  - frontend code review
  - review vue
  - review nuxt
  - review svelte
  - api response camelcase
  - frontend tests
  - coverage tests
---

# Vue / Nuxt / Svelte Readability Skill

Skill ini dipakai untuk project **Vue**, **Nuxt**, **Svelte**, dan **SvelteKit**.

Aturan tertinggi: **project-readability.md adalah segalanya**.
Kalau ada konflik antara framework convention dan readability, pilih readability.
Kalau ada konflik antara "clean architecture" dan kode yang gampang diubah besok, pilih yang gampang diubah besok.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk Vue/Nuxt/Svelte.
> 
> **Jangan over-engineer**: Simple project ≠ butuh Pinia store per feature, startup ≠ butuh composables factory, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

Tujuan skill ini bukan bikin project kelihatan enterprise.
Tujuannya bikin project frontend yang:

- gampang dibaca,
- gampang dites,
- gampang dihapus,
- API contract-nya konsisten,
- tidak terasa seperti template AI,
- dan tidak bocor `snake_case` ke component layer.

---

## 0. Taste rules yang wajib ikut project-readability.md

Aturan ini menang atas semua section lain.

| Rule | Praktiknya di frontend |
|---|---|
| Jangan bikin abstraction sebelum ada pola berulang | Jangan bikin `useBaseApi`, `BaseForm`, `BaseTable`, `factory composable`, atau generic store sebelum ada kebutuhan nyata minimal 3x. |
| Prefer boring code over clever code | Lebih baik 8 baris computed yang jelas daripada one-liner chained yang butuh dibaca ulang. |
| Nama function harus menjelaskan niat | `submitCheckoutForm()` lebih baik dari `handleSubmit()`. |
| Error message harus actionable | Jangan cuma `Failed to fetch`. Tulis `Order gagal dimuat. Coba refresh halaman atau hubungi support jika masih gagal.` |
| Optimasi untuk perubahan besok | Pilih struktur yang mudah dipindah/dihapus, bukan yang kelihatan paling akademik. |
| `shared/utils` bukan tempat sampah | Helper yang cuma dipakai satu feature tetap tinggal di feature itu. |

---

## 1. Framework scope

Skill ini berlaku untuk:

```txt
Vue 3
Nuxt 3 / Nuxt 4
Svelte
SvelteKit
```

Perbedaan framework boleh ada, tapi prinsipnya sama:

```txt
Business domain > framework folder
API boundary > component convenience
Tests > asumsi manual
Readability > clever abstraction
```

---

## 2. Struktur folder: domain-first, bukan component dumping ground

Frontend sering rusak bukan karena framework-nya, tapi karena semua hal dimasukkan ke:

```txt
components/
composables/
stores/
utils/
```

Lama-lama semua jadi global, tidak jelas ownership-nya.

Gunakan **business-domain first**.

### Struktur umum

```txt
src/
├── app/
│   ├── config/
│   ├── providers/
│   ├── router/
│   └── styles/
│
├── domains/
│   ├── iam/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── roles/
│   │   └── permissions/
│   │
│   ├── transaction/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── refunds/
│   │   └── history/
│   │
│   ├── catalog/
│   │   ├── products/
│   │   ├── categories/
│   │   └── inventory/
│   │
│   └── billing/
│       ├── invoices/
│       ├── subscriptions/
│       └── payouts/
│
├── shared/
│   ├── api/
│   ├── components/
│   ├── constants/
│   ├── errors/
│   ├── stores/
│   ├── types/
│   └── utils/
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

### Kenapa `domains/transaction/history`, bukan `history/` global?

Karena `history` tanpa konteks itu meaningless.

```txt
✅ transaction/history
✅ iam/users/activity-history
✅ billing/invoices/history

❌ history
❌ order-history
❌ payment-history
```

Rule:

> Yang berubah bersama, taruh bersama.

Kalau `transaction/` dihapus, maka `orders`, `payments`, `refunds`, dan `history` yang terkait transaksi ikut hilang.

---

## 3. Mapping struktur per framework

### Vue 3 biasa

```txt
src/
├── app/
│   ├── main.ts
│   ├── router.ts
│   └── app.vue
├── domains/
├── shared/
└── tests/
```

### Nuxt

Nuxt punya folder convention sendiri. Jangan dilawan, tapi jangan semua business logic ditaruh di root folder Nuxt.

```txt
app/
├── app.vue
├── pages/
├── layouts/
├── middleware/
├── plugins/
├── assets/
├── domains/
├── shared/
└── server/
```

Untuk Nuxt, `pages/` sebaiknya tipis:

```vue
<script setup lang="ts">
import { OrderDetailPage } from '~/domains/transaction/orders/pages'
</script>

<template>
  <OrderDetailPage />
</template>
```

`pages/` hanya routing boundary. Logic tetap di domain.

### SvelteKit

SvelteKit juga punya routing convention. Pakai `routes/` sebagai entrypoint, bukan tempat semua logic.

```txt
src/
├── routes/
├── lib/
│   ├── app/
│   ├── domains/
│   └── shared/
└── tests/
```

Contoh route tipis:

```svelte
<script lang="ts">
  import OrderDetailPage from '$lib/domains/transaction/orders/pages/OrderDetailPage.svelte'
</script>

<OrderDetailPage />
```

---

## 4. Struktur dalam satu feature

Gunakan struktur yang cukup eksplisit, tapi jangan terlalu berlapis.

### Vue / Nuxt feature

```txt
domains/transaction/orders/
├── api/
│   ├── order.api.ts
│   └── order.mapper.ts
├── components/
│   ├── OrderStatusBadge.vue
│   └── OrderSummaryCard.vue
├── composables/
│   └── useOrderDetail.ts
├── pages/
│   └── OrderDetailPage.vue
├── stores/
│   └── order.store.ts
├── types/
│   └── order.types.ts
├── tests/
│   ├── order.mapper.test.ts
│   ├── useOrderDetail.test.ts
│   └── OrderDetailPage.test.ts
└── index.ts
```

### Svelte / SvelteKit feature

```txt
lib/domains/transaction/orders/
├── api/
│   ├── order.api.ts
│   └── order.mapper.ts
├── components/
│   ├── OrderStatusBadge.svelte
│   └── OrderSummaryCard.svelte
├── pages/
│   └── OrderDetailPage.svelte
├── stores/
│   └── order.store.ts
├── types/
│   └── order.types.ts
├── tests/
│   ├── order.mapper.test.ts
│   ├── order.store.test.ts
│   └── OrderDetailPage.test.ts
└── index.ts
```

### Rule utama

```txt
Feature-specific component → taruh di feature
Generic component beneran → shared/components
Feature-specific mapper → taruh di feature/api
Generic HTTP client → shared/api
```

Jangan pindahkan ke `shared/` hanya karena “mungkin nanti dipakai”.

---

## 5. API boundary: semua response masuk wajib camelCase

Backend boleh `snake_case`.
Database boleh `snake_case`.
API dari vendor boleh `snake_case`.

Tapi di frontend:

> Semua data yang sudah masuk component/composable/store wajib `camelCase`.

Tidak boleh ada ini di component:

```ts
order.created_at
user.full_name
payment.paid_at
```

Harus:

```ts
order.createdAt
user.fullName
payment.paidAt
```

### Contract type dipisah dari UI type

```ts
// domains/transaction/orders/types/order.types.ts
export type OrderApiResponse = {
  id: string
  order_number: string
  created_at: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
}

export type Order = {
  id: string
  orderNumber: string
  createdAt: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed'
}
```

### Mapper wajib eksplisit untuk domain penting

```ts
// domains/transaction/orders/api/order.mapper.ts
export function mapOrderFromApi(response: OrderApiResponse): Order {
  return {
    id: response.id,
    orderNumber: response.order_number,
    createdAt: response.created_at,
    totalAmount: response.total_amount,
    paymentStatus: response.payment_status,
  }
}
```

Untuk domain penting, **jangan pakai magic deep camelize tanpa test**.
Mapper eksplisit lebih boring, tapi lebih aman dan lebih mudah direview.

### Deep camelize boleh untuk boundary generic

Boleh pakai `camelcase-keys` atau helper sendiri untuk endpoint kecil/non-critical.
Tapi untuk data bisnis seperti order, payment, invoice, user permission, tetap tulis mapper eksplisit.

```ts
import camelcaseKeys from 'camelcase-keys'

export function normalizeApiResponse<T>(payload: unknown): T {
  return camelcaseKeys(payload as Record<string, unknown>, { deep: true }) as T
}
```

Rule:

```txt
Critical business data → explicit mapper + mapper tests
Low-risk generic data → deep camelize boleh
```

---

## 6. API response envelope

Frontend harus expect shape yang konsisten.

```ts
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

Kalau backend mengirim `took_ms`, ubah di boundary jadi `tookMs`.

```ts
export function mapApiMeta(meta?: { page?: number; total?: number; took_ms?: number }) {
  if (!meta) return undefined

  return {
    page: meta.page,
    total: meta.total,
    tookMs: meta.took_ms,
  }
}
```

---

## 7. HTTP client

Satu project harus punya satu HTTP boundary.
Jangan `fetch`/`$fetch`/`axios` tersebar di component.

### Nuxt

```ts
// shared/api/http-client.ts
export async function apiFetch<T>(path: string, options?: Parameters<typeof $fetch>[1]): Promise<T> {
  const response = await $fetch<T>(path, {
    baseURL: useRuntimeConfig().public.apiBaseUrl,
    credentials: 'include',
    ...options,
  })

  return response
}
```

### Vue biasa

```ts
// shared/api/http-client.ts
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
```

### SvelteKit

```ts
// lib/shared/api/http-client.ts
export async function apiFetch<T>(fetcher: typeof fetch, path: string, init?: RequestInit): Promise<T> {
  const response = await fetcher(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}
```

Rule:

```txt
Component tidak boleh call fetch langsung kecuali framework loader boundary yang memang tipis.
```

---

## 8. Error handling frontend

Jangan expose raw backend error langsung ke user.
Map error jadi message yang bisa ditindaklanjuti.

```ts
export class AppClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppClientError'
  }
}
```

```ts
export function getOrderErrorMessage(error: unknown): string {
  if (error instanceof AppClientError && error.code === 'ORDER_NOT_FOUND') {
    return 'Order tidak ditemukan. Cek kembali link atau hubungi support.'
  }

  return 'Order gagal dimuat. Coba refresh halaman.'
}
```

Hindari:

```ts
toast.error('Something went wrong')
toast.error(error.message)
```

Lebih baik:

```ts
toast.error('Pembayaran gagal diproses. Coba ulangi atau gunakan metode pembayaran lain.')
```

---

## 9. Component design

### Komponen harus punya satu alasan untuk berubah

```txt
OrderSummaryCard → render summary order
OrderStatusBadge → render status order
OrderPaymentAction → aksi bayar/cancel/refund
```

Jangan bikin:

```txt
OrderComponent
OrderContainer
MainCard
DataView
```

Nama generic biasanya tanda design belum jelas.

### Props harus eksplisit

```ts
// ✅
defineProps<{
  orderNumber: string
  totalAmount: number
  paymentStatus: PaymentStatus
}>()
```

Hindari pass object besar kalau component cuma butuh 3 field:

```ts
// ❌
defineProps<{ order: Order }>()
```

Boleh pass object kalau component memang representasi langsung object itu, misalnya `OrderSummaryCard`.

---

## 10. Composables / stores

### Composable untuk behavior, bukan dumping ground

```ts
// ✅ jelas
useOrderDetail(orderId)
useSubmitCheckoutForm()
usePaymentStatusPolling(orderId)

// ❌ generic
useData()
useApi()
useHelpers()
useCommon()
```

### Store hanya untuk state yang perlu hidup lintas screen/component

Jangan semua fetch result dimasukkan ke Pinia/Svelte store.

Rule:

```txt
State lokal page → page/composable
State lintas component dalam satu page → composable
State lintas route/session → store
```

Contoh layak store:

```txt
auth session
cart
current organization/workspace
feature flags
user preferences
```

Contoh tidak layak store:

```txt
order detail yang hanya dipakai satu page
modal open state lokal
form draft satu component
```

---

## 11. Nuxt best practices

### Pages tipis

```vue
<script setup lang="ts">
import { OrderDetailPage } from '~/domains/transaction/orders/pages'
</script>

<template>
  <OrderDetailPage />
</template>
```

### Server routes hanya untuk BFF atau secure proxy

Gunakan `server/api` kalau:

- perlu menyembunyikan secret,
- perlu proxy ke backend internal,
- perlu compose beberapa API untuk kebutuhan UI,
- perlu transform response sebelum sampai browser.

Jangan pakai `server/api` cuma karena Nuxt punya folder itu.

### Runtime config

```ts
const config = useRuntimeConfig()

config.apiSecret // server-only
config.public.apiBaseUrl // browser-safe
```

Jangan expose secret di `public`.

---

## 12. SvelteKit best practices

### Load functions tipis

`+page.ts` boleh fetch data awal, tapi mapping dan API logic tetap di domain.

```ts
// routes/orders/[id]/+page.ts
import { fetchOrderDetail } from '$lib/domains/transaction/orders/api/order.api'

export async function load({ params, fetch }) {
  return {
    order: await fetchOrderDetail(fetch, params.id),
  }
}
```

### Jangan semua logic masuk `.svelte`

Kalau script block mulai panjang, extract:

```txt
components/ untuk UI kecil
api/ untuk API call
stores/ untuk state lintas route
utils/ untuk helper feature-specific
```

---

## 13. Vue best practices

### Composition API default

Gunakan Composition API untuk project baru.
Options API boleh untuk legacy, tapi jangan campur tanpa alasan.

### `script setup` default

```vue
<script setup lang="ts">
const props = defineProps<{
  orderNumber: string
}>()
</script>
```

### Computed harus readable

```ts
const canCancelOrder = computed(() => {
  if (order.value.paymentStatus === 'paid') return false
  if (order.value.status === 'shipped') return false

  return true
})
```

Lebih baik daripada nested expression yang clever.

---

## 14. Validation

Gunakan Zod atau Valibot untuk validasi data eksternal.

```ts
import { z } from 'zod'

const OrderApiResponseSchema = z.object({
  id: z.string(),
  order_number: z.string(),
  created_at: z.string(),
  total_amount: z.number(),
  payment_status: z.enum(['pending', 'paid', 'failed']),
})

export function parseOrderApiResponse(payload: unknown): OrderApiResponse {
  return OrderApiResponseSchema.parse(payload)
}
```

Rule:

```txt
Data dari backend/vendor/localStorage/query params → validasi runtime kalau critical.
```

---

## 15. Tests & coverage: wajib, bukan bonus

Coverage tests adalah bagian dari desain.
Bukan ritual setelah project selesai.

### Minimum coverage

```txt
Overall project: 85%
Critical business flow: 95%
Mapper/API boundary: 100%
Error mapper: 100%
```

Critical flow termasuk:

```txt
login/logout
role/permission guard
checkout/payment
order creation
refund/cancel transaction
invoice/subscription status
API response mapper
```

### Test yang wajib ada

```txt
Mapper tests
Component rendering tests
Composable/store tests
Route/page integration tests
E2E happy path untuk critical flow
E2E failure path untuk payment/auth/order
```

### Mapper test wajib cegah snake_case bocor

```ts
it('maps order API response to camelCase order model', () => {
  const order = mapOrderFromApi({
    id: 'order-1',
    order_number: 'ORD-001',
    created_at: '2026-01-01T00:00:00Z',
    total_amount: 150000,
    payment_status: 'paid',
  })

  expect(order).toEqual({
    id: 'order-1',
    orderNumber: 'ORD-001',
    createdAt: '2026-01-01T00:00:00Z',
    totalAmount: 150000,
    paymentStatus: 'paid',
  })

  expect('created_at' in order).toBe(false)
})
```

### Nama test harus natural language

```ts
// ✅
it('shows payment retry button when payment failed', () => {})
it('hides cancel button after order has been shipped', () => {})
it('redirects guest users to login before checkout', () => {})

// ❌
it('renders correctly', () => {})
it('handles error', () => {})
it('works', () => {})
```

---

## 16. Recommended testing tools

### Vue / Nuxt

```txt
Vitest
Vue Test Utils
Testing Library Vue
Playwright
MSW
```

### Svelte / SvelteKit

```txt
Vitest
Testing Library Svelte
Playwright
MSW
```

### Coverage command

```bash
vitest run --coverage
```

CI harus gagal kalau coverage turun di bawah threshold.

---

## 17. Styling & design system

Jangan hardcode warna dan spacing berulang di component.

```txt
shared/theme/colors.ts
shared/theme/spacing.ts
shared/theme/typography.ts
```

Atau pakai Tailwind config / CSS variables.

```css
:root {
  --color-brand-primary: #1a1a2e;
  --color-danger: #ef4444;
  --space-md: 16px;
}
```

Rule:

```txt
Feature component boleh punya layout lokal.
Design token global masuk theme/config.
```

---

## 18. Naming rules

### Function

```ts
// ❌
handleSubmit()
getData()
processItem()

// ✅
submitCheckoutForm()
fetchOrderDetail()
filterExpiredSubscriptions()
```

### Boolean

```ts
const isLoading = true
const hasPermission = false
const canCancelOrder = true
const shouldShowRetryButton = true
```

### Component

```txt
OrderSummaryCard
PaymentStatusBadge
UserPermissionTable
CheckoutSubmitButton
```

Hindari:

```txt
MainCard
DataTable
CustomModal
InfoBox
CommonButton
```

Kecuali benar-benar generic dan dipakai lintas domain.

---

## 19. Anti-AI frontend smells

Hapus atau revisi kalau menemukan pola ini:

```txt
components/CommonSomething.vue
components/ReusableSomething.vue
utils/helpers.ts
useApiData()
useCommonState()
renderData()
processResponse()
handleClick()
```

Kata-kata dokumentasi yang sering terasa AI:

```txt
seamlessly
robust
leverage
utilize
comprehensive
cutting-edge
facilitate
```

Ganti dengan bahasa yang spesifik.

---

## 20. DRY yang sehat

DRY bukan berarti semua yang mirip harus digabung.
DRY berarti jangan duplikasi knowledge bisnis.

### Jangan digabung kalau lifecycle beda

```ts
// Boleh terpisah walaupun mirip
export type UserAddress = {
  street: string
  city: string
  province: string
}

export type ShippingAddress = {
  street: string
  city: string
  province: string
  recipientName: string
  phoneNumber: string
}
```

`UserAddress` dan `ShippingAddress` punya alasan berubah yang beda.
Jangan merge hanya karena bentuknya mirip.

### Wajib DRY kalau logic bisnis sama

```txt
formatCurrency
calculateOrderTotal
mapPaymentStatusLabel
parseApiError
```

---

## 21. Performance rules

Jangan optimasi sebelum ada masalah, tapi jangan bikin masalah yang jelas.

```txt
Gunakan lazy route/page loading
Virtualize list besar
Debounce search input
Hindari deep watcher tanpa alasan
Hindari global store untuk data besar transient
```

Vue/Nuxt:

```ts
const searchKeyword = ref('')
const debouncedKeyword = useDebounce(searchKeyword, 300)
```

Svelte:

```ts
// Jangan reactive statement yang memicu fetch berulang tanpa guard
$: if (searchKeyword.length >= 3) {
  searchProducts(searchKeyword)
}
```

Tambahkan debounce/guard.

---

## 22. Accessibility baseline

Setiap PR UI wajib cek:

```txt
Button punya label jelas
Icon-only button punya aria-label
Form input punya label
Error field terbaca screen reader
Focus state terlihat
Modal trap focus
Warna tidak jadi satu-satunya penanda status
```

Contoh:

```vue
<button aria-label="Cancel order">
  <XIcon />
</button>
```

---

## 23. Security baseline frontend

```txt
Jangan simpan token sensitif di localStorage kalau bisa pakai httpOnly cookie
Jangan expose secret di public runtime config
Sanitize HTML dari backend/vendor
Validate redirect URL agar tidak open redirect
Jangan log payload sensitif
```

Nuxt:

```txt
runtimeConfig.secretKey → server-only
runtimeConfig.public.apiBaseUrl → browser-safe
```

---

## 24. CI checklist

CI minimal harus menjalankan:

```bash
npm run lint
npm run typecheck
npm run test:coverage
npm run test:e2e
npm run build
```

Coverage threshold wajib:

```txt
branches: 85
functions: 85
lines: 85
statements: 85
```

Untuk mapper/API boundary critical, targetkan 100%.

---

## 25. PR checklist

```txt
Readability
[ ] Nama component/function/variable bisa dibaca keras-keras tanpa terdengar robotic
[ ] Tidak ada abstraction baru sebelum pola berulang minimal 3x
[ ] Tidak ada clever one-liner yang mengorbankan keterbacaan
[ ] Tidak ada komentar yang cuma menjelaskan apa yang sudah jelas dari kode

Structure
[ ] File baru ditempatkan di domain yang tepat, bukan root components/composables/utils
[ ] History/activity/log berada di domain yang punya konteks
[ ] shared/ hanya berisi hal yang benar-benar lintas domain
[ ] pages/routes tetap tipis

API contract
[ ] Tidak ada snake_case yang masuk component/composable/store
[ ] Mapper response sudah mengubah snake_case ke camelCase
[ ] Critical mapper punya test
[ ] API error dimap ke message yang actionable

Tests
[ ] Overall coverage minimal 85%
[ ] Critical business flow minimal 95%
[ ] Mapper/API boundary critical 100%
[ ] Nama test menjelaskan behavior, bukan implementation detail
[ ] Ada failure-path test untuk auth/payment/order critical flow

Frontend quality
[ ] Loading, empty, success, dan error state ditangani jelas
[ ] Accessibility baseline dicek
[ ] Tidak ada secret di public config
[ ] Tidak ada fetch langsung di component selain route/load boundary yang tipis
```

---

## 26. Keputusan default

Kalau ragu, pilih ini:

```txt
Folder structure → domain-first
API response → camelCase setelah boundary
Mapping critical data → explicit mapper
State → local dulu, store belakangan
Component props → eksplisit
Tests → tulis sebelum refactor besar
Shared util → jangan dulu sampai dipakai 3x
Pages/routes → tipis
Documentation → bahasa manusia, bukan marketing/AI copy
```

---

## 27. Referensi cepat

```txt
Mau bikin component? → taruh di domain dulu, shared belakangan.
Mau bikin composable/store? → pastikan bukan state lokal page.
Backend kirim snake_case? → map ke camelCase di API boundary.
Mau bikin helper? → cek apakah cuma milik satu feature.
Mau bikin abstraction? → tunggu pattern muncul minimal 3x.
Mau review PR? → coverage, mapper, API contract, dan readability dulu.
```
