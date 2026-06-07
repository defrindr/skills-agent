---
name: expressjs-readability/validation
---

## Validasi Env di Startup

```typescript
import { z } from "zod"

const env = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
}).safeParse(process.env)

if (!env.success) {
  console.error(env.error.flatten().fieldErrors)
  process.exit(1)
}

export const config = env.data
```

## Validasi Request — Zod

```typescript
export const createOrderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  notes: z.string().max(500).optional(),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      return res.status(422).json({
        ok: false,
        error: { code: "VALIDATION_ERROR", message: "Request body is invalid.", details: result.error.flatten().fieldErrors },
      })
    }
    req.body = result.data
    next()
  }
}
```
