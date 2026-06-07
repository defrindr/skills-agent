---
name: nextjs-readability/api-boundary
---

## API Boundary — camelCase, Auto-Convert

Frontend camelCase, backend boleh snake_case. Konversi di boundary API, bukan di component.

```ts
// shared/api/case-transform.ts
function snakeToCamel(key: string): string {
  return key.replace(/_([a-z])/g, (_, l) => l.toUpperCase())
}

export function camelizeResponse<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map(camelizeResponse) as T
  if (typeof value !== 'object' || value === null) return value as T
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([k, v]) => [snakeToCamel(k), camelizeResponse(v)])
  ) as T
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

### Validasi Response Backend dengan Zod
```ts
const OrderSchema = z.object({ id: z.string().uuid(), invoiceNumber: z.string(), createdAt: z.string().datetime(), totalAmount: z.number() })
const response = await apiClient<unknown>(`/users/${userId}/orders`)
if (response.ok) response.data = OrderSchema.parse(response.data)
```
