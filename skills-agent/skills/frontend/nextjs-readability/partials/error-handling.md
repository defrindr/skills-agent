---
name: nextjs-readability/error-handling
---

## Error Handling

Setiap data UI wajib punya: loading, empty, error, success state.

```tsx
// app/orders/error.tsx
'use client'
export default function OrdersPageError({ reset }: { reset: () => void }) {
  return <div role="alert"><h2>Orders cannot be loaded</h2><p>Try again or contact support.</p><button onClick={reset}>Retry</button></div>
}
```

## Search Params — Validasi dengan Zod

```ts
const OrderSearchParamsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  status: z.enum(['pending', 'paid', 'cancelled']).optional(),
})
const parsed = OrderSearchParamsSchema.parse(await searchParams)
```

## Caching

```ts
// Static-ish data
await apiClient('/categories', { next: { revalidate: 3600, tags: ['categories'] } })
// User-specific data
await apiClient(`/users/${userId}/orders`, { cache: 'no-store' })
// After mutation
revalidateTag('orders')
```
