---
name: nextjs-readability/server-actions
---

## Server Components vs Client Components

Default: Server Component. `'use client'` hanya untuk state interaktif, event handler, browser API.

```tsx
// Server Component
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
