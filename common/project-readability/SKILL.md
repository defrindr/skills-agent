---
name: project-readability
description: >
  Panduan init project dengan readability tinggi dan bebas dari AI awkward patterns.
  Gunakan skill ini setiap kali memulai project baru, melakukan code review,
  menulis dokumentasi, atau kapanpun ada pertanyaan soal naming, komentar,
  arsitektur folder, atau konvensi kode. Juga mencakup standarisasi API response/error/request,
  validasi payload dengan HMAC, observability (Sentry/logging), dan Docker containerization.
  Trigger saat user minta "setup project", "init project", "code review", "review kode ini",
  "standarisasi response", "error handling", "payload validation", "docker setup",
  atau bilang kodenya "aneh", "robotic", atau "keliatan AI banget".
---

# Project Readability Skill

Panduan ini dipakai di setiap fase project: init, review, docs, dan refactor.
Tujuannya satu: kode dan tulisan yang bisa dibaca manusia — bukan output AI yang di-paste mentah.

---

## Taste Rules

Prinsip ini ada di atas semua section lain. Kalau ada konflik antara "best practice" dan taste rules ini, taste rules menang.

| # | Rule | Artinya dalam praktik |
|---|------|-----------------------|
| 1 | **Jangan bikin abstraction sebelum ada pola yang terbukti berulang.** | Lihat dulu duplikasi terjadi minimal 3x di konteks yang benar-benar sama, baru extract. Abstraksi prematur lebih mahal dari duplikasi. |
| 2 | **Prefer boring code over clever code.** | One-liner yang membutuhkan 10 detik untuk dipahami lebih buruk dari 5 baris yang langsung jelas. Cleverness bukan kualitas — itu ego. |
| 3 | **Kalau nama function butuh komentar, namanya belum cukup jelas.** | Rename dulu. Kalau masih perlu komentar setelah rename, itu tanda logikanya perlu dipecah lebih kecil. |
| 4 | **Error message harus bantu user/developer melakukan langkah berikutnya.** | `"Something went wrong"` tidak membantu siapa pun. `"Order cannot be cancelled because it's already shipped. Contact support at support@app.com"` membantu. |
| 5 | **Kode bagus bukan yang paling pendek, tapi yang paling gampang diubah besok.** | Optimasi untuk pembaca berikutnya, bukan untuk baris count. Kalau ragu antara dua approach, pilih yang lebih mudah di-delete. |
| 6 | **Jangan bikin `shared/utils/` jadi tempat sampah.** | Helper yang hanya relevan untuk satu fitur → taruh di fitur itu. `shared/utils/` hanya untuk yang genuinely dipakai lintas domain. |

---

## 1. Struktur folder

Pakai **feature-first**, bukan layer-first.

```
src/
├── features/
│   ├── auth/
│   │   ├── index.ts          ← barrel export
│   │   ├── auth.service.ts
│   │   ├── auth.schema.ts
│   │   └── auth.test.ts
│   └── orders/
│       ├── index.ts
│       └── ...
├── shared/
│   ├── utils/
│   ├── hooks/
│   └── types/
└── app/                      ← entrypoint, routing, config
```

**Kenapa bukan layer-first (controllers/, services/, models/)?**
Karena kalau mau hapus fitur `auth`, lo harus nyari file-nya di 4 folder berbeda.
Feature-first = satu fitur, satu tempat.

---

## 2. Naming

### Fungsi → verb + noun yang spesifik

```ts
// ❌ AI-style: terlalu generic
const getData = async () => {}
const handleSubmit = () => {}
const processItems = (items) => {}

// ✅ Human-style: jelasin apa yang terjadi
const fetchUserOrderHistory = async (userId: string) => {}
const submitCheckoutForm = (formData: CheckoutForm) => {}
const filterExpiredSubscriptions = (subscriptions: Subscription[]) => {}
```

### Variabel → konkret, no abbrev tanpa konteks

```ts
// ❌
const d = new Date()
const res = await fetch(url)
const temp = user.orders.filter(...)

// ✅
const createdAt = new Date()
const profileResponse = await fetch(url)
const activeOrders = user.orders.filter(...)
```

### Boolean → is/has/can/should prefix

```ts
const isLoading = true
const hasPermission = checkRole(user, 'admin')
const canDeletePost = isOwner || isAdmin
```

---

## 3. Komentar

**Aturan utama: komentar jelasin KENAPA, bukan APA.**

```ts
// ❌ AI awkward — hanya parafrase kode
// Loop through users and check status
for (const user of users) {
  if (user.status === 'active') { ... }
}

// ✅ Human — jelasin konteks/keputusan
// Hanya proses user aktif karena user suspended masih perlu datanya
// untuk audit trail, tapi tidak boleh diikutkan di report ini
for (const user of users) {
  if (user.status === 'active') { ... }
}
```

**Tanda komentar perlu dihapus:**
- Komentar yang cuma translasi kode ke bahasa manusia
- Komentar `// TODO` tanpa nama dan deadline
- Komentar yang sudah out-of-date dari kodenya

---

## 4. TypeScript setup

```json
// tsconfig.json — strict by default
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

Validasi runtime pakai **Zod** — jangan trust data eksternal tanpa schema:

```ts
import { z } from 'zod'

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer'])
})

type User = z.infer<typeof UserSchema>
```

---

## 5. ESLint config

Install:
```bash
npm i -D eslint @typescript-eslint/eslint-plugin eslint-plugin-unicorn eslint-plugin-sonarjs
```

Rules kunci di `eslint.config.js`:

```js
rules: {
  // Paksa fungsi pendek
  'max-lines-per-function': ['error', { max: 30 }],

  // Anti magic number
  'no-magic-numbers': ['error', { ignore: [0, 1, -1] }],

  // Anti nested ternary
  'no-nested-ternary': 'error',

  // Unicorn — naming & modern JS
  'unicorn/no-array-for-each': 'error',
  'unicorn/prefer-module': 'error',
  'unicorn/filename-case': ['error', { case: 'kebabCase' }],

  // SonarJS — cognitive complexity
  'sonarjs/cognitive-complexity': ['error', 10],
  'sonarjs/no-duplicate-string': 'error',
}
```

---

## 6. Git convention

Format commit: `type(scope): deskripsi singkat`

| Type | Kapan |
|------|-------|
| `feat` | fitur baru |
| `fix` | bugfix |
| `refactor` | ubah kode tanpa ubah behavior |
| `chore` | setup, deps, tooling |
| `docs` | dokumentasi saja |
| `test` | tambah/ubah test |

```bash
# ✅ Contoh commit yang baik
feat(auth): add email verification on signup
fix(orders): prevent duplicate submission on slow connection
refactor(users): extract role-checking logic to shared helper

# ❌ Commit yang tidak informatif
fix bug
update code
changes
```

Setup enforcement:
```bash
npm i -D @commitlint/cli @commitlint/config-conventional husky
npx husky init
```

---

## 7. Tests sebagai dokumentasi

Nama test = natural language, bukan technical description.

```ts
// ❌ AI-style naming
it('returns 401', () => {})
it('handles edge case', () => {})

// ✅ Readable — bisa dibaca non-engineer
it('rejects login when password is incorrect', () => {})
it('returns empty array when user has no completed orders', () => {})
it('sends welcome email only on first signup, not on re-registration', () => {})
```

---

## 8. README template

README yang baik ditulis dari sudut pandang developer yang **frustrasi** pakai produkmu — bukan marketing copy.

```md
# Nama Project

Satu kalimat: apa yang ini lakukan dan untuk siapa.

## Kenapa bukan [alternatif yang sudah ada]?

Jelaskan tradeoff jujur. Apa yang ini lakukan lebih baik, dan apa yang tidak.

## Quickstart

\`\`\`bash
npm install
cp .env.example .env
npm run dev
\`\`\`

## Hal yang perlu diketahui sebelum coding

- Kenapa struktur folder seperti ini
- Keputusan arsitektur yang tidak obvious
- Gotcha dan edge case yang sering bikin trip
```

---

## 9. Anti-AI language audit

Sebelum merge PR atau publish docs, scan kata-kata berikut:

**Kata yang harus dihapus / diganti:**
| Hindari | Ganti dengan |
|---------|-------------|
| seamlessly | [spesifikkan bagaimana] |
| robust | [spesifikkan apa yang tahan terhadap apa] |
| leverage | gunakan / pakai |
| utilize | gunakan |
| facilitate | bantu / memungkinkan |
| comprehensive | lengkap / [list apa saja] |
| cutting-edge | [versi spesifik / teknologi spesifik] |

**Read out loud test:**
Baca nama fungsi, variabel, dan komentar keras-keras.
Kalau kedengarannya robotic atau kaku — itu sinyal untuk ganti.

---

## 10. Standarisasi API response, error & request

Semua endpoint wajib kembalikan shape yang konsisten — frontend tidak boleh nebak-nebak format.

### Response envelope

```ts
// shared/types/api.ts

type ApiSuccess<T> = {
  ok: true
  data: T
  meta?: {
    page?: number
    total?: number
    took_ms?: number
  }
}

type ApiError = {
  ok: false
  error: {
    code: string       // machine-readable: 'USER_NOT_FOUND'
    message: string    // human-readable: 'User with this ID does not exist'
    details?: unknown  // field-level errors dari Zod, dsb
  }
}

type ApiResponse<T> = ApiSuccess<T> | ApiError
```

### Error codes — pakai konstanta, bukan string hardcode

```ts
// shared/errors/codes.ts
export const ErrorCode = {
  // Auth
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validasi
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_PAYLOAD_SIGNATURE: 'INVALID_PAYLOAD_SIGNATURE',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const
```

### AppError class — jangan throw Error polos

```ts
// shared/errors/app-error.ts
export class AppError extends Error {
  constructor(
    public readonly code: keyof typeof ErrorCode,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
  }
}

// Pakai di service layer:
throw new AppError('USER_NOT_FOUND', 'User with this ID does not exist', 404)
```

### Global error handler (Express contoh)

```ts
// app/middleware/error-handler.ts
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      ok: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    })
  }

  // Error tidak terduga — log ke Sentry, jangan expose detail ke client
  logger.error(err)
  captureException(err)

  return res.status(500).json({
    ok: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again later.',
    },
  })
}
```

### Request validation middleware

```ts
// shared/middleware/validate.ts
import { z, ZodSchema } from 'zod'
import { AppError } from '../errors/app-error'

export const validateBody = <T>(schema: ZodSchema<T>) =>
  (req, res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      throw new AppError(
        'VALIDATION_FAILED',
        'Request body is invalid',
        422,
        result.error.flatten()
      )
    }
    req.body = result.data
    next()
  }

// Pakai di router:
router.post('/orders', validateBody(CreateOrderSchema), createOrderHandler)
```

---

## 11. Validasi payload — HMAC signature

Untuk webhook atau internal service-to-service: selalu validasi bahwa payload tidak dimanipulasi di transit.

```ts
// shared/security/verify-hmac.ts
import { createHmac, timingSafeEqual } from 'crypto'

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET!

export function verifyHmacSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined
): boolean {
  if (!signatureHeader) return false

  // Format header: 'sha256=<hex_digest>'
  const [algorithm, receivedHash] = signatureHeader.split('=')
  if (algorithm !== 'sha256' || !receivedHash) return false

  const expectedHash = createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex')

  // timingSafeEqual mencegah timing attack
  return timingSafeEqual(
    Buffer.from(receivedHash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  )
}
```

Middleware untuk webhook endpoint:

```ts
// shared/middleware/verify-webhook.ts
export const verifyWebhook = (req, res, next) => {
  // Raw body diperlukan — pastikan express dikonfig dengan rawBody
  const isValid = verifyHmacSignature(
    req.rawBody,
    req.headers['x-signature-256'] as string
  )

  if (!isValid) {
    throw new AppError('INVALID_PAYLOAD_SIGNATURE', 'Webhook signature is invalid', 401)
  }

  next()
}

// Express setup — rawBody harus diparse sebelum json()
app.use(express.json({
  verify: (req, res, buf) => { req.rawBody = buf }
}))
```

---

## 12. Observability — logging & error tracking

### Pilihan gratis yang layak dipakai

| Tool | Free tier | Kapan pilih |
|------|-----------|-------------|
| **Sentry** | 5K errors/bulan | Error tracking + stack trace + release tracking |
| **Logtail / Better Stack** | 1GB/bulan | Structured log search yang enak |
| **Grafana Cloud** | 50GB logs/bulan | Kalau sudah pakai Prometheus/Loki |
| **OpenTelemetry + Jaeger** | Self-host gratis | Kalau mau full control, distributed tracing |

### Logger setup — pakai `pino`, bukan `console.log`

```bash
npm i pino pino-pretty
```

```ts
// shared/logger.ts
import pino from 'pino'

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty' }
    : undefined, // production → JSON ke stdout, dikonsumsi collector
})

// Pakai:
logger.info({ userId, orderId }, 'Order created successfully')
logger.error({ err, requestId }, 'Failed to process payment')
```

### Sentry setup minimal

```bash
npm i @sentry/node
```

```ts
// app/instrument.ts — import ini PERTAMA sebelum semua import lain
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
})

export const captureException = Sentry.captureException.bind(Sentry)
```

### Request ID — wajib untuk trace log antar service

```ts
// shared/middleware/request-id.ts
import { randomUUID } from 'crypto'

export const attachRequestId = (req, res, next) => {
  // Terima dari upstream proxy, atau buat baru
  req.requestId = req.headers['x-request-id'] as string ?? randomUUID()
  res.setHeader('x-request-id', req.requestId)
  next()
}
```

---

## 13. Docker containerization

### Dockerfile — multi-stage, production-ready

```dockerfile
# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --frozen-lockfile

COPY . .
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app

# Jangan jalankan sebagai root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Hanya copy artefak yang dibutuhkan
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/app/index.js"]
```

### .dockerignore

```
node_modules
dist
.env*
*.log
coverage
.git
```

### docker-compose.yml — untuk dev lokal

```yaml
services:
  app:
    build:
      context: .
      target: builder        # pakai builder stage di dev
    volumes:
      - .:/app
      - /app/node_modules    # isolasi node_modules container
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Makefile — shortcut perintah docker yang sering dipakai

```makefile
.PHONY: dev build up down logs shell

dev:
	docker compose up --watch

build:
	docker compose build --no-cache

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f app

shell:
	docker compose exec app sh
```

---

## 14. Environment & secrets

Jangan commit secrets. Selalu pakai `.env.example` sebagai dokumentasi.

```bash
# .env.example — commit ini, bukan .env
NODE_ENV=development
PORT=3000

DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Sentry
SENTRY_DSN=

# HMAC webhook
WEBHOOK_SECRET=

# Log level: trace | debug | info | warn | error
LOG_LEVEL=info
```

Validasi env vars saat startup — crash early daripada fail di runtime:

```ts
// app/config.ts
import { z } from 'zod'

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  WEBHOOK_SECRET: z.string().min(32),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),
})

export const config = EnvSchema.parse(process.env)
// Kalau ada yang missing → throws saat startup, bukan saat request masuk
```


---

## 16. SOLID principles — dalam konteks TypeScript

Sumber: refactoring.guru/solid. Ini bukan teori akademik — setiap prinsip punya smell yang bisa dideteksi saat code review.

### S — Single Responsibility

Satu class/modul/fungsi = satu alasan untuk berubah.

```ts
// ❌ UserService melakukan terlalu banyak hal
class UserService {
  async createUser(data: CreateUserDto) { ... }
  async sendWelcomeEmail(user: User) { ... }    // ini bukan tanggung jawab UserService
  async generatePdfReport(userId: string) { ... } // ini juga bukan
}

// ✅ Pisahkan per responsibility
class UserService {
  async createUser(data: CreateUserDto): Promise<User> { ... }
}

class EmailService {
  async sendWelcomeEmail(user: User): Promise<void> { ... }
}

class ReportService {
  async generateUserReport(userId: string): Promise<Buffer> { ... }
}
```

**Smell yang perlu dideteksi:** class/file > 200 baris, nama fungsi pakai "and" (`createAndNotifyUser`), satu file import dari 10+ modul berbeda.

---

### O — Open/Closed

Terbuka untuk ekstensi, tertutup untuk modifikasi. Tambah behavior baru tanpa ubah kode lama.

```ts
// ❌ Harus edit fungsi setiap kali ada payment method baru
function processPayment(method: string, amount: number) {
  if (method === 'credit_card') { ... }
  if (method === 'bank_transfer') { ... }
  // tambah gopay? edit sini lagi
}

// ✅ Ekstensi lewat interface
interface PaymentProvider {
  charge(amount: number): Promise<PaymentResult>
}

class CreditCardProvider implements PaymentProvider {
  async charge(amount: number) { ... }
}

class GopayProvider implements PaymentProvider {
  async charge(amount: number) { ... }
}

// processPayment tidak perlu diubah saat tambah provider baru
async function processPayment(provider: PaymentProvider, amount: number) {
  return provider.charge(amount)
}
```

---

### L — Liskov Substitution

Subtype harus bisa menggantikan parent-nya tanpa break behavior.

```ts
// ❌ Square extends Rectangle tapi break kontrak Rectangle
class Rectangle {
  setWidth(w: number) { this.width = w }
  setHeight(h: number) { this.height = h }
  area() { return this.width * this.height }
}

class Square extends Rectangle {
  setWidth(w: number) {
    this.width = w
    this.height = w  // ini melanggar ekspektasi Rectangle
  }
}

// ✅ Gunakan komposisi atau interface terpisah
interface Shape {
  area(): number
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area() { return this.width * this.height }
}

class Square implements Shape {
  constructor(private side: number) {}
  area() { return this.side * this.side }
}
```

**Smell:** method di subclass yang throw `NotImplementedError`, atau override yang mengabaikan parameter parent.

---

### I — Interface Segregation

Jangan paksa class implement interface yang tidak mereka butuhkan.

```ts
// ❌ Interface terlalu gemuk
interface UserRepository {
  findById(id: string): Promise<User>
  findAll(): Promise<User[]>
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
  generateReport(): Promise<Buffer>   // ini tidak relevan untuk semua implementor
  sendNotification(userId: string): Promise<void> // ini juga tidak
}

// ✅ Pecah jadi interface kecil sesuai kebutuhan
interface UserReader {
  findById(id: string): Promise<User>
  findAll(): Promise<User[]>
}

interface UserWriter {
  save(user: User): Promise<void>
  delete(id: string): Promise<void>
}

// Class implement hanya yang dibutuhkan
class ReadOnlyUserRepository implements UserReader { ... }
class FullUserRepository implements UserReader, UserWriter { ... }
```

---

### D — Dependency Inversion

Depend on abstraction, bukan implementasi konkret. Ini yang bikin kode mudah di-test.

```ts
// ❌ Service langsung depend ke implementasi konkret
class OrderService {
  private emailer = new SmtpEmailer()      // hard-coded
  private db = new PostgresOrderRepo()     // hard-coded
}

// ✅ Inject dependency lewat constructor
class OrderService {
  constructor(
    private readonly orderRepo: OrderRepository,  // interface
    private readonly emailer: Emailer,            // interface
    private readonly logger: Logger               // interface
  ) {}
}

// Test jadi mudah — tinggal inject mock
const service = new OrderService(
  new MockOrderRepository(),
  new MockEmailer(),
  new MockLogger()
)
```

---

## 17. Clean Code — teknik refactoring dari refactoring.guru

### Extract Function — jika perlu komentar untuk jelaskan blok kode, extract jadi fungsi

```ts
// ❌ Perlu komentar karena logiknya tidak self-explanatory
function checkout(cart: Cart, user: User) {
  // Calculate total with discounts
  let total = 0
  for (const item of cart.items) {
    const discounted = item.price * (1 - (item.discountRate ?? 0))
    total += discounted * item.quantity
  }

  // Check if user has enough balance
  if (user.balance < total) {
    throw new AppError('INSUFFICIENT_BALANCE', '...', 402)
  }
  // ... dst
}

// ✅ Nama fungsi menggantikan komentar
function checkout(cart: Cart, user: User) {
  const total = calculateCartTotal(cart)
  assertUserCanAfford(user, total)
  // ...
}

function calculateCartTotal(cart: Cart): number {
  return cart.items.reduce((sum, item) => {
    const priceAfterDiscount = item.price * (1 - (item.discountRate ?? 0))
    return sum + priceAfterDiscount * item.quantity
  }, 0)
}

function assertUserCanAfford(user: User, amount: number): void {
  if (user.balance < amount) {
    throw new AppError('INSUFFICIENT_BALANCE', 'Insufficient balance to complete purchase', 402)
  }
}
```

---

### Replace Conditional with Polymorphism — if/else panjang berdasarkan type

```ts
// ❌ Switch/if yang harus diedit setiap kali ada type baru
function getShippingCost(order: Order): number {
  if (order.type === 'standard') return 15_000
  if (order.type === 'express') return 35_000
  if (order.type === 'same_day') return 75_000
  throw new Error('Unknown order type')
}

// ✅ Map ke value (simple case) atau polymorphism (complex case)
const SHIPPING_COST: Record<Order['type'], number> = {
  standard: 15_000,
  express: 35_000,
  same_day: 75_000,
}

function getShippingCost(order: Order): number {
  const cost = SHIPPING_COST[order.type]
  if (cost === undefined) throw new AppError('INVALID_ORDER_TYPE', '...', 400)
  return cost
}
```

---

### Introduce Parameter Object — fungsi dengan terlalu banyak parameter

```ts
// ❌ Urutan parameter mudah ketuker, susah dibaca
function createReport(userId: string, startDate: Date, endDate: Date,
  format: string, includeArchived: boolean, groupBy: string) { ... }

// ✅ Group jadi object dengan nama yang jelas
interface ReportOptions {
  userId: string
  dateRange: { start: Date; end: Date }
  format: 'pdf' | 'csv' | 'xlsx'
  includeArchived: boolean
  groupBy: 'day' | 'week' | 'month'
}

function createReport(options: ReportOptions) { ... }
```

**Rule of thumb:** lebih dari 3 parameter → pertimbangkan object.

---

### Guard Clauses — hindari nested if dengan early return

```ts
// ❌ Arrow anti-pattern — logika utama tenggelam di nested if
function processOrder(order: Order | null, user: User | null) {
  if (order !== null) {
    if (user !== null) {
      if (order.status === 'pending') {
        if (user.isVerified) {
          // logika utama akhirnya ada di sini
        }
      }
    }
  }
}

// ✅ Guard clause — gagal cepat, logika utama tidak nested
function processOrder(order: Order | null, user: User | null) {
  if (!order) throw new AppError('NOT_FOUND', 'Order not found', 404)
  if (!user) throw new AppError('UNAUTHORIZED', 'User not found', 401)
  if (order.status !== 'pending') throw new AppError('CONFLICT', 'Order is not pending', 409)
  if (!user.isVerified) throw new AppError('FORBIDDEN', 'User is not verified', 403)

  // logika utama langsung di sini, tanpa nesting
}
```

---

## 18. DRY — centralize, jangan duplikasi

DRY (Don't Repeat Yourself) bukan soal "jangan tulis kode yang mirip" — tapi soal **jangan duplikasi knowledge**. Satu perubahan bisnis = satu tempat yang perlu diubah.

### Shared utils — masuk `shared/` hanya kalau lulus tiga pertanyaan ini

Sebelum menaruh helper di `shared/utils/`, jawab tiga pertanyaan ini:

1. **Apakah ini dipakai oleh lebih dari satu feature domain?** Kalau tidak → taruh di feature-nya.
2. **Apakah logikanya generic, atau kebetulan mirip tapi punya asumsi domain?** Kalau domain-specific → jangan angkat ke shared.
3. **Kalau feature ini dihapus, apakah helper ini masih berguna?** Kalau tidak → helper itu milik feature itu.

```ts
// ✅ Layak masuk shared/utils/
formatCurrency(amount, 'IDR')     // dipakai di orders, invoices, dashboard
slugify(title)                    // dipakai di posts, products, categories
parseISODate(dateString)          // dipakai di mana saja

// ❌ Jangan angkat ke shared/ — ini milik feature-nya
calculateOrderDiscount(order)     // asumsi bisnis order, bukan generic math
buildShippingLabel(shipment)      // hanya relevan di fitur shipping
formatUserDisplayName(user)       // pakai shape User, bukan generic string
```

```
shared/
├── utils/
│   ├── date.ts          ← manipulasi tanggal yang generic
│   ├── string.ts        ← format, slugify, truncate, mask
│   ├── number.ts        ← currency, percentage, rounding
│   ├── array.ts         ← groupBy, chunk, unique, sortBy
│   ├── object.ts        ← pick, omit, deepMerge
│   └── validation.ts    ← reusable Zod refinements
├── constants/
│   ├── http-status.ts   ← HTTP status codes sebagai named constants
│   ├── regex.ts         ← email, phone, slug patterns
│   └── limits.ts        ← pagination defaults, file size limits
└── theme/               ← kalau ada frontend
    ├── colors.ts
    ├── spacing.ts
    └── typography.ts
```

### Constants — jangan hardcode nilai yang punya makna bisnis

```ts
// ❌ Magic number tersebar di mana-mana
if (file.size > 5_242_880) { ... }
const page = Math.min(requestedPage, 100)

// ✅ Named constant di satu tempat
// shared/constants/limits.ts
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  // 5MB
export const MAX_PAGE_NUMBER = 100
export const DEFAULT_PAGE_SIZE = 20
export const PASSWORD_MIN_LENGTH = 8

// Pakai di mana saja — kalau bisnis rule berubah, ubah di satu tempat
if (file.size > MAX_FILE_SIZE_BYTES) { ... }
const page = Math.min(requestedPage, MAX_PAGE_NUMBER)
```

### Reusable Zod schemas — jangan tulis schema yang sama dua kali

```ts
// shared/utils/validation.ts
import { z } from 'zod'

// Primitif yang sering dipakai — reuse, jangan define ulang
export const UuidSchema = z.string().uuid()
export const EmailSchema = z.string().email().toLowerCase()
export const PhoneSchema = z.string().regex(/^\+62\d{9,12}$/, 'Invalid Indonesian phone number')
export const SlugSchema = z.string().regex(/^[a-z0-9-]+$/)

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(DEFAULT_PAGE_SIZE),
})

// Compose schema dari primitif yang sudah ada
export const CreateUserSchema = z.object({
  email: EmailSchema,
  phone: PhoneSchema,
  role: z.enum(['admin', 'member']),
})
```

### Theme — kalau ada frontend, centralize di satu file

```ts
// shared/theme/colors.ts
export const colors = {
  brand: {
    primary: '#1a1a2e',
    secondary: '#16213e',
    accent: '#0f3460',
  },
  semantic: {
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
  },
  neutral: {
    50: '#fafafa',
    // ...
    900: '#171717',
  },
} as const

// shared/theme/spacing.ts
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
} as const
```

**CSS/Tailwind:** definisikan di `tailwind.config.ts` atau CSS custom properties — jangan hardcode hex di tiap komponen.

### DRY yang tidak boleh dipaksakan

DRY bisa jadi anti-pattern kalau dipaksakan. Dua kode yang **kebetulan mirip tapi punya alasan berubah yang berbeda** sebaiknya tetap dipisah.

```ts
// Ini BUKAN duplikasi meskipun strukturnya mirip —
// UserAddress dan ShippingAddress punya lifecycle dan validasi yang berbeda
type UserAddress = {
  street: string
  city: string
  province: string
}

type ShippingAddress = {
  street: string
  city: string
  province: string
  recipientName: string   // khusus shipping
  phoneNumber: string     // khusus shipping
}

// Jangan merge jadi satu type hanya karena mirip.
// Kalau aturan bisnis UserAddress berubah, ShippingAddress tidak harus ikut.
```

**Panduan kapan DRY vs kapan tidak:**
- Duplikasi **logic** (kalkulasi, validasi, transformasi) → selalu DRY
- Duplikasi **struktur data** yang punya domain berbeda → boleh biarkan terpisah
- Duplikasi **string literal** yang punya makna berbeda → boleh biarkan terpisah

---

## 19. Checklist sebelum PR (lengkap)

```
Taste rules
[ ] Tidak ada abstraction baru yang belum terbukti berulang minimal 3x
[ ] Tidak ada clever one-liner yang butuh > 5 detik untuk dipahami
[ ] Nama function sudah cukup jelas tanpa komentar penjelasan
[ ] Error message kasih langkah berikutnya, bukan cuma "Something went wrong"
[ ] Helper baru di shared/utils/ sudah lulus 3 pertanyaan (§18), bukan cuma "kebetulan generic"

Kode & naming
[ ] Fungsi ≤ 30 baris
[ ] Tidak ada variabel bernama: data, res, temp, result, item
[ ] Setiap komentar jelasin KENAPA, bukan APA
[ ] Nama test bisa dibaca non-engineer
[ ] Tidak ada kata: seamlessly, robust, leverage, utilize
[ ] Commit message pakai conventional format
[ ] Tidak ada magic number tanpa named constant
[ ] Read out loud test — tidak ada yang kedengarannya robotic

SOLID & Clean Code
[ ] Setiap class/modul punya satu tanggung jawab (SRP)
[ ] Behavior baru ditambah lewat ekstensi, bukan edit kode lama (OCP)
[ ] Tidak ada method di subclass yang override dan langgar kontrak parent (LSP)
[ ] Interface tidak punya method yang tidak relevan untuk semua implementor (ISP)
[ ] Dependency di-inject lewat constructor, bukan di-instansiasi di dalam class (DIP)
[ ] Tidak ada nested if lebih dari 2 level — gunakan guard clause
[ ] Fungsi dengan > 3 parameter sudah diubah jadi object

DRY & centralization
[ ] Cek shared/utils/ sebelum buat helper baru
[ ] Cek shared/constants/ sebelum hardcode nilai bisnis
[ ] Cek shared/theme/ sebelum hardcode warna/spacing di komponen
[ ] Zod schema reuse dari shared/utils/validation.ts kalau ada yang cocok

API & keamanan
[ ] Response pakai ApiSuccess/ApiError envelope
[ ] Error throw AppError, bukan Error polos
[ ] Semua input request divalidasi dengan Zod schema
[ ] Webhook endpoint pakai verifyHmacSignature
[ ] Tidak ada secret yang di-hardcode

Observability
[ ] Error tak terduga masuk ke Sentry/logger
[ ] Setiap request punya request ID
[ ] Log pakai logger.info/error, bukan console.log

Deployment
[ ] .env.example updated kalau ada env var baru
[ ] Dockerfile multi-stage (bukan single stage)
[ ] docker compose up berjalan tanpa error
```

---

## Referensi cepat (updated)

- **Naming bingung?** → verb + noun, konkret, no abbrev (§2)
- **Mau tulis komentar?** → tanya dulu: apakah ini jelasin KENAPA? (§3)
- **Kode keliatan AI?** → jalankan anti-AI audit (§9)
- **Struktur folder berantakan?** → pindah ke feature-first (§1)
- **Response shape tidak konsisten?** → pakai ApiSuccess/ApiError envelope (§10)
- **Error handling berserak?** → centralize di AppError + global handler (§10)
- **Webhook tidak aman?** → tambah HMAC verification (§11)
- **Debug susah di production?** → cek Sentry + request ID (§12)
- **"Works on my machine"?** → containerize dengan docker compose (§13)
- **Class terlalu gemuk?** → cek SRP, pisah responsibility (§16)
- **Conditional panjang?** → guard clause atau Replace Conditional with Polymorphism (§17)
- **Fungsi sulit dibaca?** → Extract Function, Parameter Object (§17)
- **Mau buat helper/util baru?** → cek shared/utils/ dulu (§18)
- **Ada nilai hardcode?** → pindah ke shared/constants/ (§18)