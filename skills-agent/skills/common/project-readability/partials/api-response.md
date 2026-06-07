---
name: project-readability/api-response
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

throw new AppError(ErrorCode.NOT_FOUND, 'User with this ID does not exist', 404)
```

**Global error handler:**

```ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ ok: false, error: { code: err.code, message: err.message, details: err.details } })
  }
  logger.error(err); captureException(err)
  return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } })
}
```

Response publik **wajib camelCase** walaupun DB/external API pakai snake_case. Transform di boundary, jangan di controller.

## Request Validation — Zod

```ts
import { z } from 'zod'

const CreateOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
})
type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export const validateBody = <T>(schema: ZodSchema<T>) => (req, res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) throw new AppError(ErrorCode.VALIDATION_FAILED, 'Request body is invalid', 422, result.error.flatten())
  req.body = result.data
  next()
}
```
