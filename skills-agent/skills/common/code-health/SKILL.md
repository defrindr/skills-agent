---
name: code-health
description: >
  Daily code health check untuk performance & security optimization di application level.
  Scan memory leaks, inefficient algorithms, blocking operations, XSS, SQL injection,
  auth gaps, input validation, exposed secrets, dependency vulnerabilities, CORS, rate limiting.
  Generates prioritized reports (Critical → Low) dengan actionable remediations.

  Trigger: "check code health", "audit code", "security check", "performance audit",
  "find vulnerabilities", "security scan", "memory leak", "optimize performance",
  "code security", "health check".
---

# Code Health Checker

Daily health check untuk identify & fix performance bottlenecks dan security vulnerabilities di application level.

**Naming, folder structure, API response, error handling → ikuti `common/project-readability`.**

**Untuk DB-level issues (slow queries, indexes, N+1 di ORM) → gunakan `database-optimizer`.**

---

## Prinsip

1. **Scan comprehensive** — performance + security
2. **Prioritize by impact** — Critical → High → Medium → Low
3. **Actionable fixes** — specific code examples
4. **Preserve functionality** — fixes tidak boleh break existing logic
5. **Follow readability** — semua remediasi ikut project-readability rules

---

## Performance Audit

### Memory Leaks

```ts
// Event listener with cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])

// Interval with cleanup
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  return () => clearInterval(interval)
}, [])

// Cache with eviction
import { LRUCache } from 'lru-cache'
const cache = new LRUCache({ max: 500, ttl: 1000 * 60 * 5 })
```

**Check:** All event listeners cleanup? Intervals/timers cleared? Cache has eviction policy? No large objects trapped in closures?

### Inefficient Algorithms

```ts
// Use Map for O(n) instead of nested filter for O(n²)
const ordersByUser = new Map(orders.map(o => [o.userId, [...(ordersByUser.get(o.userId) || []), o]]))
return users.map(user => ({ ...user, orders: ordersByUser.get(user.id) || [] }))

// Memoize expensive computations
const productsWithDiscount = useMemo(() =>
  products.map(p => ({ ...p, discount: calculateDiscount(p) })),
  [products]
)
```

**Check:** No O(n²) loops? Expensive computations memoized? No blocking ops? Pagination for large lists?

### API/Network Optimization

```ts
// Batch instead of N+1
async function loadUsersWithProfiles() {
  const users = await fetchUsers()
  const profiles = await fetchProfiles(users.map(u => u.id))
  return users.map(user => ({ ...user, profile: profiles.find(p => p.userId === user.id) }))
}

// Parallel instead of sequential
const [stats, activities, notifications] = await Promise.all([
  fetchStats(), fetchActivities(), fetchNotifications()
])

// Cache with SWR/React Query
import useSWR from 'swr'
export function useUser(id: string) {
  return useSWR(`/api/users/${id}`, fetcher, { dedupingInterval: 60000 })
}
```

**Check:** No N+1 API calls? Independent requests parallelized? Caching layer? Large payloads paginated?

### Bundle Size (Frontend)

```ts
// Dynamic imports instead of eager
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
```

**Target:** Initial bundle < 300KB gzipped. Images optimized (WebP, lazy loading). Large deps replaced (moment → date-fns).

---

## Security Audit

### Input Validation

```ts
// Parameterized queries prevent SQL injection
async function searchUsers(email: string) {
  return db('users').where({ email }).select('*')
  // NOT: `SELECT * FROM users WHERE email = '${email}'`
}

// Avoid dangerouslySetInnerHTML — React escapes by default
function Comment({ comment }: Props) {
  return <div>{comment.text}</div>
}

// Validate all external input
import { z } from 'zod'
const orderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  amount: z.number().positive(),
})
const validated = orderSchema.parse(req.body)
```

**Check:** All input validated? SQL parameterized? HTML sanitized? No eval with user input? No path traversal?

### Authentication & Authorization

```ts
// Auth guard on all protected routes
app.delete('/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  await deleteUser(req.params.id)
})

// Secure tokens with expiration
function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
}

function generateRefreshToken(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  // Store in DB with 7 day expiration
}
```

**Check:** All protected routes have guards? Tokens cryptographically secure? Tokens expire? RBAC implemented? Passwords hashed with bcrypt/argon2?

### Data Exposure

```ts
// Secrets in env vars, not in code
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not configured')

// Sanitize PII from logs
const SENSITIVE_FIELDS = ['password', 'creditCard', 'ssn', 'token']
console.log('Request:', sanitize(req.body))

// Generic errors in production, stack only in dev
if (process.env.NODE_ENV === 'production') {
  Sentry.captureException(err)
  res.status(500).json({ error: 'Internal server error' })
}
```

**Check:** No secrets in code? .env in .gitignore? PII sanitized from logs? Generic errors in production?

### Common Vulnerabilities

```ts
// Rate limiting on auth endpoints
import rateLimit from 'express-rate-limit'
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })
app.post('/login', loginLimiter, async (req, res) => { ... })

// CORS with whitelist
const ALLOWED_ORIGINS = ['https://myapp.com', process.env.NODE_ENV === 'development' && 'http://localhost:3000'].filter(Boolean)
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }))

// CSRF protection
import csrf from 'csurf'
app.use(csrf({ cookie: true }))
```

**Check:** Rate limiting on auth/public? CORS whitelisted? CSRF on state-changing endpoints? Dependencies up-to-date?

### Env Validation

```ts
import { z } from 'zod'
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})
export const config = envSchema.parse(process.env)
```

---

## Dependency Audit

```bash
npm audit --audit-level=moderate
npm outdated
```

**Target:** 0 high/critical vulnerabilities. Critical packages up-to-date. Lock file committed.

---

## Report Format

Prioritized by severity:

```
# Code Health Report

## CRITICAL (fix immediately)
- [CRITICAL-001] SQL injection in user search — src/services/users.service.ts:45
  Fix: Use parameterized queries (5 min)

## HIGH (fix this sprint)
- [HIGH-001] N+1 API calls loading profiles — src/pages/users.ts:89
  Impact: 3.2s → 280ms (91% improvement)
  Fix: Batch request

## MEDIUM (schedule next sprint)

## LOW (nice to have)
```

---

## Quick Checklist

```
Performance:
[ ] No memory leaks (event listeners cleanup)
[ ] No O(n²) algorithms — use Map/Set
[ ] API calls parallelized where independent
[ ] Bundle < 300KB gzipped (frontend)
[ ] Images optimized (WebP, lazy loading)

Security:
[ ] All inputs validated (Zod/Joi)
[ ] SQL queries parameterized
[ ] Auth guards on protected routes
[ ] Rate limiting on public endpoints
[ ] CORS whitelisted origins
[ ] No secrets in code
[ ] Env vars validated on startup
[ ] npm audit: 0 high/critical
```

---

## Referensi Skill Lain

- Database schema → `database-designer`
- Slow queries / indexes → `database-optimizer`
- Code readability → `project-readability`
- Docker & env validation → masing-masing `*-readability`
