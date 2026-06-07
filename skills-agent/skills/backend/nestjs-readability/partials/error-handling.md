---
name: nestjs-readability/error-handling
---

## Zod Validation Pipe

```ts
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value)
    if (!result.success) throw new BadRequestException({
      code: 'VALIDATION_FAILED', message: 'Request payload is invalid.',
      details: result.error.flatten(),
    })
    return result.data
  }
}
```

## Global Exception Filter

```ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse()

    if (error instanceof AppError)
      return res.status(error.statusCode).json({ ok: false, error: { code: error.code, message: error.message, details: toCamelCaseDeep(error.details) } })

    if (error instanceof HttpException) {
      const status = error.getStatus()
      return res.status(status).json({ ok: false, error: normalizeHttpException(error.getResponse()) })
    }

    captureException(error)
    return res.status(500).json({ ok: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong.' } })
  }
}
```

## API Response Envelope

```ts
type ApiSuccess<T> = { ok: true; data: T; meta?: { page?: number; total?: number; tookMs?: number } }
type ApiError = { ok: false; error: { code: string; message: string; details?: unknown } }
```

## camelCase Converter — Boundary Only

```ts
export function toCamelCaseDeep<T>(value: T): T {
  if (Array.isArray(value)) return value.map(toCamelCaseDeep) as T
  if (!isPlainObject(value)) return value
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k.replace(/_([a-z])/g, (_, l) => l.toUpperCase()), toCamelCaseDeep(v)])
  ) as T
}
```

## Guard, Interceptor, Pipe, Middleware — Responsibilities

| Tool | Gunakan | Jangan |
|---|---|---|
| Middleware | request ID, raw body, logging dasar | business validation |
| Guard | auth, permission, access control | transform response |
| Pipe | validation + transform input | query database |
| Interceptor | response envelope, timing, serialization | business rule |
| Filter | error normalization | menyembunyikan error domain |
