---
name: react-readability
description: >
  Panduan membangun dan mereview project React (Vite) dengan readability tinggi,
  struktur feature-first, boundary API yang bersih, state management yang tidak over-engineered,
  component design yang jelas, dan kode yang tidak terasa seperti template AI mentah.
  Gunakan skill ini saat init project React dengan Vite, code review, refactor component,
  setup API client, form handling, state management, testing, Docker,
  atau saat project React punya semua state di satu context global, komponen 300 baris,
  `useEffect` yang mengerjakan tiga hal sekaligus, atau `any` tersebar di mana-mana.
  Skill ini BUKAN untuk Next.js (gunakan nextjs-readability).
  Trigger: "setup react", "init react", "react vite", "react component", "react state management",
  "react api client", "react form", "react testing", "review react", "react typescript",
  "react context", "zustand", "react query", "tanstack query".
---

# React Readability Skill

Skill ini adalah versi React + Vite dari `project-readability`.

React tidak datang dengan opini soal struktur folder, state management, atau cara fetch data. Itu kebebasan yang cepat berubah jadi masalah. Project yang mulai bersih bisa berakhir dengan:

- `App.tsx` sebagai God Component
- `useEffect` yang fetch, transform, dan side-effect sekaligus
- State global untuk hal-hal yang seharusnya lokal
- Component yang tahu terlalu banyak soal API shape

Tujuan skill ini: **React project yang punya boundary, bukan React project yang hanya bisa dibaca oleh yang menulisnya.**

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Kalau ada pattern React populer yang membuat kode lebih sulit dibaca, skip pattern itu.

---

## 0. Taste rules

| Rule | Artinya di React |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Jangan bikin `useApiFactory`, `createFormHook`, atau generic `useCrud` sebelum ada 3 use-case berbeda yang benar-benar identik. |
| Prefer boring code. | `useState` + handler function yang eksplisit lebih baik dari state machine library yang overkill. |
| Nama harus menjelaskan intent. | `useOrderDetail` lebih baik dari `useData`. `SubmitButton` lebih baik dari `ActionButton`. |
| Error message harus actionable. | Jangan render `"Error"`. Render apa yang salah dan apa yang user bisa lakukan. |
| API boundary harus jelas. | `snake_case` dari backend harus selesai di `api/` layer sebelum masuk ke component. |

---

## 1. Struktur folder: feature-first

```txt
src/
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── ForgotPasswordLink.tsx
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   └── auth.mapper.ts
│   │   ├── hooks/
│   │   │   └── useLoginForm.ts
│   │   ├── schemas/
│   │   │   └── auth.schema.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   │
│   └── orders/
│       ├── components/
│       │   ├── OrderCard.tsx
│       │   ├── OrderStatusBadge.tsx
│       │   └── OrderCancelModal.tsx
│       ├── api/
│       │   ├── orders.api.ts
│       │   └── orders.mapper.ts
│       ├── hooks/
│       │   ├── useOrderList.ts
│       │   └── useOrderDetail.ts
│       ├── types/
│       │   └── orders.types.ts
│       └── index.ts
│
├── shared/
│   ├── api/
│   │   ├── client.ts
│   │   └── response.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── ErrorMessage.tsx
│   │   └── LoadingSpinner.tsx
│   ├── hooks/
│   │   └── useDisclosure.ts
│   └── types/
│       └── api.types.ts
│
└── app/
    ├── main.tsx
    ├── router.tsx
    └── providers.tsx
```

Shared hanya untuk yang **benar-benar** dipakai lintas feature. Kalau `OrderStatusBadge` hanya dipakai di feature orders, dia tetap di `features/orders/components/`.

---

## 2. API boundary — semua `snake_case` selesai di layer `api/`

Backend boleh return `snake_case`. Component tidak boleh tahu soal itu.

```ts
// features/orders/types/orders.types.ts

// Shape dari API — snake_case
export type OrderApiResponse = {
  id: string
  order_number: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
}

// Shape yang dipakai component — camelCase
export type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string
}
```

```ts
// features/orders/api/orders.mapper.ts
import type { Order, OrderApiResponse } from '../types/orders.types'

export function mapOrderFromApi(response: OrderApiResponse): Order {
  return {
    id: response.id,
    orderNumber: response.order_number,
    totalAmount: response.total_amount,
    paymentStatus: response.payment_status,
    createdAt: response.created_at,
  }
}
```

```ts
// features/orders/api/orders.api.ts
import { apiClient } from '../../shared/api/client'
import { mapOrderFromApi } from './orders.mapper'
import type { Order } from '../types/orders.types'

export async function fetchOrderById(orderId: string): Promise<Order> {
  const response = await apiClient.get<OrderApiResponse>(`/orders/${orderId}`)
  return mapOrderFromApi(response.data)
}

export async function cancelOrder(orderId: string): Promise<Order> {
  const response = await apiClient.post<OrderApiResponse>(`/orders/${orderId}/cancel`)
  return mapOrderFromApi(response.data)
}
```

Tidak ada `.order_number` di dalam component. Kalau terlihat, itu bug boundary.

---

## 3. Custom hooks — satu concern, satu hook

```ts
// features/orders/hooks/useOrderDetail.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchOrderById, cancelOrder } from '../api/orders.api'

export function useOrderDetail(orderId: string) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => fetchOrderById(orderId),
    enabled: Boolean(orderId),
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] })
    },
  })

  return {
    order: query.data,
    isLoading: query.isLoading,
    error: query.error,
    cancelOrder: cancelMutation.mutate,
    isCancelling: cancelMutation.isPending,
  }
}
```

Hook tidak render apa-apa. Hook tidak tahu soal routing. Hook satu concern.

---

## 4. Component — tipis, props eksplisit

```tsx
// features/orders/components/OrderCard.tsx
import { OrderStatusBadge } from './OrderStatusBadge'
import type { Order } from '../types/orders.types'

type Props = {
  order: Order
  onCancel: (orderId: string) => void
}

export function OrderCard({ order, onCancel }: Props) {
  return (
    <div className="order-card">
      <h3>Order #{order.orderNumber}</h3>
      <OrderStatusBadge status={order.paymentStatus} />
      <p>Total: {formatCurrency(order.totalAmount)}</p>

      {order.paymentStatus === 'pending' && (
        <button onClick={() => onCancel(order.id)}>
          Cancel Order
        </button>
      )}
    </div>
  )
}
```

Hal yang dihindari di component:

```tsx
// ❌ Component tahu tentang API
function OrderCard({ orderId }) {
  const [order, setOrder] = useState(null)
  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(r => r.json())
      .then(data => setOrder(data))
  }, [orderId])
  // ...
}

// ❌ Props any atau object kosong
function OrderCard({ data }: { data: any }) {}
function OrderCard(props) {}

// ❌ snake_case di JSX
<p>{order.total_amount}</p>
<p>{order.created_at}</p>
```

---

## 5. State management — mulai dari yang paling simpel

Jangan langsung Redux atau Zustand untuk semua hal.

```txt
State lokal UI (buka/tutup modal, nilai input) → useState
State lokal yang kompleks (multi-step form) → useReducer
Server state (data dari API) → TanStack Query
State global yang benar-benar global → Zustand
State global yang dipakai satu area → React Context (kecil, scoped)
```

Contoh Zustand hanya untuk yang genuinely global:

```ts
// shared/stores/auth.store.ts
import { create } from 'zustand'

type AuthState = {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}))
```

Jangan taruh order list, product list, atau cart state di store global kalau bisa pakai TanStack Query.

---

## 6. Form — Zod + React Hook Form

```ts
// features/auth/schemas/auth.schema.ts
import { z } from 'zod'

export const LoginSchema = z.object({
  email: z.string().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.'),
})

export type LoginInput = z.infer<typeof LoginSchema>
```

```tsx
// features/auth/components/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { LoginSchema, type LoginInput } from '../schemas/auth.schema'

type Props = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: Props) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  })

  async function submitLoginForm(input: LoginInput) {
    await login(input)
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit(submitLoginForm)}>
      <input {...register('email')} type="email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register('password')} type="password" />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  )
}
```

---

## 7. Naming

```tsx
// ❌ AI-style
const getData = () => {}
const handleClick = () => {}
const MyComponent = () => {}
const useData = () => {}

// ✅
const fetchUserOrderHistory = (userId: string) => {}
const cancelOrder = (orderId: string) => {}
function OrderDetailPage() {}
function useOrderDetail(orderId: string) {}
```

File name: PascalCase untuk component (`OrderCard.tsx`), camelCase untuk non-component (`orders.api.ts`, `useOrderDetail.ts`).

---

## 8. Testing

```tsx
// features/orders/hooks/useOrderDetail.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useOrderDetail } from './useOrderDetail'
import * as ordersApi from '../api/orders.api'

describe('useOrderDetail', () => {
  it('returns order data after successful fetch', async () => {
    const mockOrder = { id: '1', orderNumber: 'ORD-001', paymentStatus: 'paid' }
    vi.spyOn(ordersApi, 'fetchOrderById').mockResolvedValue(mockOrder as any)

    const { result } = renderHook(() => useOrderDetail('1'), { wrapper })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.order?.orderNumber).toBe('ORD-001')
  })
})
```

```tsx
// features/orders/components/OrderCard.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderCard } from './OrderCard'

it('shows cancel button only when order status is pending', () => {
  const order = { id: '1', orderNumber: 'ORD-001', paymentStatus: 'pending', totalAmount: 50000, createdAt: '' }
  render(<OrderCard order={order} onCancel={vi.fn()} />)

  expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
})

it('hides cancel button when order is already paid', () => {
  const order = { ...baseOrder, paymentStatus: 'paid' }
  render(<OrderCard order={order} onCancel={vi.fn()} />)

  expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
})
```

---

## 9. Docker

```dockerfile
# Dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```nginx
# nginx.conf
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
