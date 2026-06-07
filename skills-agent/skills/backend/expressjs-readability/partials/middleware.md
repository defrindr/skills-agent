---
name: expressjs-readability/middleware
---

## Middleware IS the model

```typescript
type Handler = (req: Request, res: Response, next: NextFunction) => void

app.use((req, res, next) => { req.requestId = crypto.randomUUID(); next() })
app.use((req, res, next) => {
  if (!req.headers.authorization) return res.status(401).json({ ok: false })
  next()
})
app.use(async (req, res, next) => {
  try { res.json(await doSomething()) }
  catch (err) { next(err) }
})
```

## Error handler — 4 parameter

```typescript
app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false, error: { code: err.code, message: err.message },
    })
  }
  logger.error({ err, path: req.path }, "Unhandled error")
  res.status(500).json({ ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong." } })
})
```

## Urutan registrasi matters

```typescript
app.use("/auth", authRouter)
app.use("/orders", ordersRouter)
app.use(notFoundHandler)
app.use(errorHandler)     // selalu paling akhir
```

## TypeScript — extend Request type

```typescript
// src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: AuthUser
    requestId: string
  }
}
```

## catchAsync — hapus boilerplate try-catch

```typescript
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>

export function catchAsync(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => fn(req, res, next).catch(next)
}

ordersRouter.post(
  "/",
  authenticate,
  validate(createOrderSchema),
  catchAsync(async (req, res) => {
    const order = await service.createOrder(req.user!.id, req.body)
    res.status(201).json(ApiSuccess(order))
  }),
)
```
