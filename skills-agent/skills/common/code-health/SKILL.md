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

Daily health check untuk identify & fix performance bottlenecks dan security vulnerabilities.

**Naming, folder structure, API response, error handling → ikuti `common/project-readability`.**
**DB-level issues (slow queries, indexes, N+1) → gunakan `database-optimizer`.**

---

## Prinsip

1. **Scan comprehensive** — performance + security
2. **Prioritize by impact** — Critical → High → Medium → Low
3. **Actionable fixes** — specific code examples
4. **Follow readability** — semua remediasi ikut project-readability rules

---

## Performance Audit

### Memory Leaks
```ts
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```
**Check:** All event listeners cleanup? Intervals/timers cleared? Cache has eviction policy?

### Inefficient Algorithms
```ts
const ordersByUser = new Map(orders.map(o => [o.userId, [...(ordersByUser.get(o.userId) || []), o]]))
return users.map(user => ({ ...user, orders: ordersByUser.get(user.id) || [] }))
```
**Check:** No O(n²) loops? Expensive computations memoized? No blocking ops?

### API/Network
```ts
const [stats, activities] = await Promise.all([fetchStats(), fetchActivities()])
```
**Check:** No N+1? Independent requests parallelized? Caching layer? Pagination?

### Bundle Size (Frontend)
```ts
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
```
**Target:** Initial bundle < 300KB gzipped. Images WebP + lazy loading.

---

## Security Audit

### Input Validation
```ts
// Parameterized queries prevent SQL injection
async function searchUsers(email: string) {
  return db('users').where({ email }).select('*')
}
// Validate all external input
import { z } from 'zod'
const validated = z.object({ productId: z.string().uuid() }).parse(req.body)
```
**Check:** All input validated? SQL parameterized? HTML sanitized? No path traversal?

### Auth & Authorization
```ts
app.delete('/users/:id', authenticate, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.id !== req.params.id)
    return res.status(403).json({ error: 'Forbidden' })
  await deleteUser(req.params.id)
})
function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
}
```
**Check:** All protected routes have guards? Tokens expire? Passwords hashed (bcrypt/argon2)?

### Data Exposure
```ts
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) throw new Error('STRIPE_SECRET_KEY not configured')
```
**Check:** No secrets in code? .env in .gitignore? PII sanitized from logs? Generic errors in production?

### Common Vulnerabilities
```ts
// Rate limiting
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 })
app.post('/login', loginLimiter, async (req, res) => { ... })
// CORS whitelist
app.use(cors({ origin: ['https://myapp.com'], credentials: true }))
```
**Check:** Rate limiting on auth/public? CORS whitelisted? CSRF on state-changing endpoints?

### Env Validation
```ts
const envSchema = z.object({
  DATABASE_URL: z.string().url(), API_KEY: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test']),
})
export const config = envSchema.parse(process.env)
```

---

## Dependency Audit

```bash
npm audit --audit-level=moderate && npm outdated
```
**Target:** 0 high/critical vulnerabilities. Lock file committed.

---

## Report Format

```
# Code Health Report
## CRITICAL (fix immediately)
- [CRITICAL-001] SQL injection in user search — src/services/users.service.ts:45
  Fix: Use parameterized queries (5 min)
## HIGH (fix this sprint)
- [HIGH-001] N+1 API calls — src/pages/users.ts:89
  Impact: 3.2s → 280ms (91% improvement)
```

---

## Quick Checklist

```
Performance:
[ ] No memory leaks (event listeners cleanup)
[ ] No O(n²) algorithms — use Map/Set
[ ] API calls parallelized where independent
[ ] Bundle < 300KB gzipped (frontend)

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

## Referensi

- Database schema → `database-designer`
- Slow queries / indexes → `database-optimizer`
- Code readability → `project-readability`
- Docker & env validation → masing-masing `*-readability`
