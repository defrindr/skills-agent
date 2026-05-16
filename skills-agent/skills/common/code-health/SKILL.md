---
name: code-health
description: |
  Daily code health check untuk performance & security optimization di application level.
  Scan memory leaks, inefficient algorithms, blocking operations, XSS, SQL injection,
  auth gaps, input validation, exposed secrets, dependency vulnerabilities, CORS, rate limiting.
  Generates prioritized reports (Critical → Low) dengan actionable remediations.
  
  Trigger phrases:
  - "check code health"
  - "audit code"
  - "security check"
  - "performance audit"
  - "find vulnerabilities"
  - "security scan"
  - "memory leak"
  - "optimize performance"
  - "code security"
  - "health check"
  
  Focuses on:
  - Performance: memory leaks, O(n²) loops, blocking ops, API optimization, bundle size
  - Security: XSS, SQL injection, auth/authz, input validation, CSRF, secrets exposure
  - Dependencies: npm audit, outdated packages, CVE vulnerabilities
  - Infrastructure: CORS, rate limiting, env vars, Docker secrets
  
  Output:
  - Prioritized report (Critical/High/Medium/Low)
  - Before/after code examples
  - Performance metrics estimates
  - Security risk scores
  - Actionable remediations

default_provider: deepseek
complexity: medium
token_estimate: 8000-15000
---

# Code Health Checker

Goal: Daily health check untuk identify & fix **performance bottlenecks** dan **security vulnerabilities** di application level dengan actionable remediation.

**IMPORTANT:** Skill ini focus pada **application-level issues**. Untuk DB optimization (slow queries, indexes, N+1), gunakan `database-optimizer` skill.

---

## Dependencies

**CRITICAL:** Skill ini depends on:

1. **project-readability** - Authority untuk:
   - Naming conventions
   - Code structure patterns
   - Anti-AI generated patterns (no emoji, boring code)
   - Scale-aware architecture
   - All remediation MUST follow project-readability rules

2. **project-initializer** (optional) - Untuk:
   - Framework detection (Express, Next.js, Laravel, etc.)
   - Project scale assessment (simple/medium/complex)
   - Tech stack identification

**Before auditing:**
```
1. Load project-readability context
2. Check framework via project-initializer (optional)
3. Run code-health scan
4. Apply remediations following project-readability standards
```

---

## Prinsip Utama

**SCAN-PRIORITIZE-REMEDIATE!**

1. **Scan comprehensive** - Check performance + security
2. **Prioritize by impact** - Critical → High → Medium → Low
3. **Actionable fixes** - Specific code examples dengan before/after
4. **Measure improvements** - Performance gains, security risk reduction
5. **Preserve functionality** - Fixes tidak boleh break existing logic
6. **Follow readability** - All remediations follow project-readability rules

---

## Phase 1: Performance Audit

### Application-Level Performance Issues

#### 1. Memory Leaks

**Common patterns:**

```typescript
// CRITICAL: Event listener leak
// Location: src/components/Dashboard.tsx:45
useEffect(() => {
  window.addEventListener('resize', handleResize)
  // Missing cleanup!
}, [])

// FIX: Add cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

```typescript
// CRITICAL: Interval leak
// Location: src/hooks/usePolling.ts:12
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  // Missing cleanup!
}, [])

// FIX: Clear interval
useEffect(() => {
  const interval = setInterval(fetchData, 5000)
  return () => clearInterval(interval)
}, [])
```

```typescript
// HIGH: Cache without eviction
// Location: src/services/cache.ts:8
const cache = new Map()

export function getCached(key: string) {
  if (cache.has(key)) return cache.get(key)
  const data = fetchExpensiveData(key)
  cache.set(key, data) // Infinite growth!
  return data
}

// FIX: Add LRU eviction
import LRU from 'lru-cache'
const cache = new LRU({ max: 500, ttl: 1000 * 60 * 5 })

export function getCached(key: string) {
  const cached = cache.get(key)
  if (cached) return cached
  const data = fetchExpensiveData(key)
  cache.set(key, data)
  return data
}
```

**Checklist:**
- [ ] All event listeners have cleanup
- [ ] All intervals/timeouts cleared
- [ ] Cache has eviction policy (LRU/TTL)
- [ ] No large objects trapped in closures
- [ ] No detached DOM nodes (frontend)

---

#### 2. Inefficient Algorithms

**Common patterns:**

```typescript
// CRITICAL: O(n²) nested loop
// Location: src/services/matching.ts:34
// Impact: 2.5s for 1000 items
function matchUsers(users: User[], orders: Order[]) {
  return users.map(user => ({
    ...user,
    orders: orders.filter(o => o.userId === user.id) // O(n²)!
  }))
}

// FIX: Use Map for O(n)
// Impact: 45ms for 1000 items (-98%)
function matchUsers(users: User[], orders: Order[]) {
  const ordersByUser = new Map<string, Order[]>()
  orders.forEach(order => {
    if (!ordersByUser.has(order.userId)) {
      ordersByUser.set(order.userId, [])
    }
    ordersByUser.get(order.userId)!.push(order)
  })
  
  return users.map(user => ({
    ...user,
    orders: ordersByUser.get(user.id) || []
  }))
}
```

```typescript
// HIGH: Repeated expensive computation
// Location: src/components/ProductList.tsx:67
function ProductList({ products }: Props) {
  return products.map(product => (
    <ProductCard 
      key={product.id}
      discount={calculateDiscount(product)} // Recalculated on every render!
    />
  ))
}

// FIX: Memoize computation
function ProductList({ products }: Props) {
  const productsWithDiscount = useMemo(() => 
    products.map(p => ({
      ...p,
      discount: calculateDiscount(p)
    })),
    [products]
  )
  
  return productsWithDiscount.map(product => (
    <ProductCard key={product.id} discount={product.discount} />
  ))
}
```

**Checklist:**
- [ ] No O(n²) loops (use Map/Set)
- [ ] Expensive computations memoized
- [ ] No synchronous blocking ops (file I/O, heavy CPU)
- [ ] Pagination for large lists (> 100 items)

---

#### 3. API/Network Optimization

**Common patterns:**

```typescript
// CRITICAL: N+1 API calls
// Location: src/pages/users.ts:89
// Impact: 1 + N requests, 3.2s for 50 users
async function loadUsersWithProfiles() {
  const users = await fetchUsers() // 1 request
  for (const user of users) {
    user.profile = await fetchProfile(user.id) // N requests!
  }
  return users
}

// FIX: Batch request
// Impact: 2 requests, 280ms (-91%)
async function loadUsersWithProfiles() {
  const users = await fetchUsers()
  const profileIds = users.map(u => u.id)
  const profiles = await fetchProfiles(profileIds) // 1 batch request
  
  return users.map(user => ({
    ...user,
    profile: profiles.find(p => p.userId === user.id)
  }))
}
```

```typescript
// HIGH: Sequential when parallel possible
// Location: src/pages/dashboard.ts:45
// Impact: 1.8s (600ms + 700ms + 500ms)
async function loadDashboard() {
  const stats = await fetchStats()      // 600ms
  const activities = await fetchActivities() // 700ms
  const notifications = await fetchNotifications() // 500ms
  return { stats, activities, notifications }
}

// FIX: Parallel requests
// Impact: 700ms (longest request) (-61%)
async function loadDashboard() {
  const [stats, activities, notifications] = await Promise.all([
    fetchStats(),
    fetchActivities(),
    fetchNotifications()
  ])
  return { stats, activities, notifications }
}
```

```typescript
// MEDIUM: Missing request caching
// Location: src/api/users.ts:23
export async function getUser(id: string) {
  return fetch(`/api/users/${id}`).then(r => r.json())
}

// FIX: Add SWR or React Query
import useSWR from 'swr'

export function useUser(id: string) {
  return useSWR(`/api/users/${id}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000 // 1 minute cache
  })
}
```

**Checklist:**
- [ ] No N+1 API calls (batch requests)
- [ ] Independent requests parallelized
- [ ] Caching layer implemented (SWR, React Query)
- [ ] Large payloads paginated
- [ ] Request deduplication enabled

---

#### 4. Bundle/Resource Issues (Frontend)

**Common patterns:**

```typescript
// HIGH: Large dependency
// Location: src/utils/date.ts:1
// Impact: +67KB bundle size
import moment from 'moment'

export function formatDate(date: Date) {
  return moment(date).format('YYYY-MM-DD')
}

// FIX: Use date-fns (lighter)
// Impact: +2KB bundle size (-96%)
import { format } from 'date-fns'

export function formatDate(date: Date) {
  return format(date, 'yyyy-MM-dd')
}
```

```javascript
// HIGH: No code splitting
// Location: src/App.tsx:5
// Impact: 1.2MB bundle upfront
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import Reports from './pages/Reports'

// FIX: Dynamic imports
// Impact: Initial bundle 300KB, lazy load others
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const Reports = lazy(() => import('./pages/Reports'))
```

```html
<!-- MEDIUM: Unoptimized images -->
<!-- Location: src/components/Hero.tsx:12 -->
<!-- Impact: 2.5MB image load -->
<img src="/hero.jpg" alt="Hero" />

<!-- FIX: Use next/image or WebP -->
<!-- Impact: 180KB WebP (-93%) -->
<Image 
  src="/hero.jpg" 
  alt="Hero"
  width={1200}
  height={600}
  loading="lazy"
  formats={['image/webp', 'image/jpeg']}
/>
```

**Checklist:**
- [ ] Bundle size < 300KB gzipped (initial)
- [ ] Large dependencies replaced (moment → date-fns)
- [ ] Code splitting on routes
- [ ] Images optimized (WebP, lazy loading)
- [ ] Tree-shaking enabled

---

## Phase 2: Security Audit

### 1. Input Validation & Sanitization

#### CRITICAL: SQL Injection

```typescript
// CRITICAL: SQL injection vulnerability
// Location: src/services/users.service.ts:45
// Risk: Complete database compromise
async function searchUsers(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`
  return db.raw(query)
}

// Attack: email = "' OR '1'='1"
// Result: Returns ALL users

// FIX: Parameterized queries
async function searchUsers(email: string) {
  return db('users').where({ email }).select('*')
  // OR with raw query
  return db.raw('SELECT * FROM users WHERE email = ?', [email])
}
```

#### CRITICAL: XSS Vulnerability

```typescript
// CRITICAL: XSS via dangerouslySetInnerHTML
// Location: src/components/Comment.tsx:34
// Risk: Execute arbitrary JavaScript
function Comment({ comment }: Props) {
  return <div dangerouslySetInnerHTML={{ __html: comment.text }} />
}

// Attack: comment.text = "<img src=x onerror='alert(document.cookie)'>"
// Result: Steals session cookie

// FIX: Sanitize with DOMPurify
import DOMPurify from 'dompurify'

function Comment({ comment }: Props) {
  const sanitized = DOMPurify.sanitize(comment.text)
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />
}

// BETTER: Avoid dangerouslySetInnerHTML
function Comment({ comment }: Props) {
  return <div>{comment.text}</div> // React escapes by default
}
```

#### HIGH: Missing Input Validation

```typescript
// HIGH: No validation on API endpoint
// Location: src/routes/orders.ts:67
app.post('/orders', async (req, res) => {
  const order = await createOrder(req.body) // Trust user input!
  res.json(order)
})

// Attack: Send { amount: -100, userId: 'admin' }
// Result: Negative amount, privilege escalation

// FIX: Use Zod validation
import { z } from 'zod'

const orderSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100),
  amount: z.number().positive()
})

app.post('/orders', async (req, res) => {
  const validated = orderSchema.parse(req.body)
  const order = await createOrder(validated)
  res.json(order)
})
```

**Checklist:**
- [ ] All user input validated (Zod, Joi, etc.)
- [ ] SQL queries parameterized
- [ ] HTML user input sanitized (DOMPurify)
- [ ] File paths validated (no ../ traversal)
- [ ] Command injection prevented (no eval, exec with user input)

---

### 2. Authentication & Authorization

#### CRITICAL: Missing Auth Guards

```typescript
// CRITICAL: No authentication check
// Location: src/routes/users.ts:89
// Risk: Anyone can delete any user
app.delete('/users/:id', async (req, res) => {
  await deleteUser(req.params.id)
  res.json({ ok: true })
})

// FIX: Add auth + authorization
import { authenticate } from '../middleware/auth'

app.delete('/users/:id', authenticate, async (req, res) => {
  const targetUser = await getUser(req.params.id)
  
  // Only admins or self can delete
  if (req.user.role !== 'admin' && req.user.id !== targetUser.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  await deleteUser(req.params.id)
  res.json({ ok: true })
})
```

#### CRITICAL: Weak Token Generation

```typescript
// CRITICAL: Predictable tokens
// Location: src/services/auth.service.ts:12
function generateToken(userId: string) {
  return Buffer.from(userId).toString('base64') // Predictable!
}

// Attack: Decode token, forge new ones
// Result: Impersonate any user

// FIX: Use crypto.randomBytes
import crypto from 'crypto'

function generateToken(userId: string) {
  const randomBytes = crypto.randomBytes(32).toString('hex')
  return jwt.sign({ userId, nonce: randomBytes }, SECRET, { 
    expiresIn: '1h' 
  })
}
```

#### HIGH: No Token Expiration

```typescript
// HIGH: Token never expires
// Location: src/services/auth.service.ts:23
function generateToken(userId: string) {
  return jwt.sign({ userId }, SECRET) // No expiration!
}

// Risk: Stolen token valid forever

// FIX: Add expiration + refresh token
function generateAccessToken(userId: string) {
  return jwt.sign({ userId }, SECRET, { expiresIn: '15m' })
}

function generateRefreshToken(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  // Store in DB with expiration (7 days)
  return token
}
```

**Checklist:**
- [ ] All protected routes have auth guards
- [ ] Tokens cryptographically secure (jwt, crypto.randomBytes)
- [ ] Tokens have expiration (15m access, 7d refresh)
- [ ] Role-based access control (RBAC)
- [ ] Session fixation prevented
- [ ] Passwords hashed with bcrypt/argon2

---

### 3. Data Exposure

#### CRITICAL: Exposed API Keys

```typescript
// CRITICAL: Secret in code
// Location: src/config/stripe.ts:3
const STRIPE_KEY = 'sk_live_abc123xyz789...'

// Risk: Committed to git, visible in source
// Impact: Unauthorized charges, data access

// FIX: Use environment variables
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY not configured')
}

// Add to .gitignore
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
```

#### HIGH: PII in Logs

```typescript
// HIGH: Logging sensitive data
// Location: src/middleware/logger.ts:12
app.use((req, res, next) => {
  console.log('Request:', req.body) // Logs passwords, credit cards!
  next()
})

// FIX: Sanitize logs
const SENSITIVE_FIELDS = ['password', 'creditCard', 'ssn', 'token']

function sanitize(obj: any) {
  const sanitized = { ...obj }
  SENSITIVE_FIELDS.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]'
    }
  })
  return sanitized
}

app.use((req, res, next) => {
  console.log('Request:', sanitize(req.body))
  next()
})
```

#### MEDIUM: Verbose Error Messages

```typescript
// MEDIUM: Stack traces in production
// Location: src/middleware/error.ts:8
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: err.message,
    stack: err.stack // Exposes internal paths!
  })
})

// FIX: Generic errors in production
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to Sentry but don't expose
    Sentry.captureException(err)
    res.status(500).json({ error: 'Internal server error' })
  } else {
    res.status(500).json({ error: err.message, stack: err.stack })
  }
})
```

**Checklist:**
- [ ] No secrets in code (use env vars)
- [ ] Secrets in .env added to .gitignore
- [ ] No PII in logs (sanitize sensitive fields)
- [ ] Generic error messages in production
- [ ] Stack traces only in development

---

### 4. Common Vulnerabilities

#### CRITICAL: CSRF Missing

```typescript
// CRITICAL: No CSRF protection
// Location: src/routes/payments.ts:45
// Risk: Attacker site can trigger payments
app.post('/payments', authenticate, async (req, res) => {
  await processPayment(req.body)
  res.json({ ok: true })
})

// FIX: Use csurf middleware
import csrf from 'csurf'

const csrfProtection = csrf({ cookie: true })

app.post('/payments', authenticate, csrfProtection, async (req, res) => {
  await processPayment(req.body)
  res.json({ ok: true })
})

// Frontend: Include CSRF token
fetch('/payments', {
  method: 'POST',
  headers: { 'X-CSRF-Token': getCsrfToken() }
})
```

#### CRITICAL: CORS Misconfiguration

```typescript
// CRITICAL: Allow all origins
// Location: src/server.ts:12
app.use(cors({ origin: '*' })) // Any site can call API!

// Risk: Attacker site can steal user data

// FIX: Whitelist origins
const ALLOWED_ORIGINS = [
  'https://myapp.com',
  'https://www.myapp.com',
  process.env.NODE_ENV === 'development' && 'http://localhost:3000'
].filter(Boolean)

app.use(cors({ 
  origin: ALLOWED_ORIGINS,
  credentials: true 
}))
```

#### HIGH: No Rate Limiting

```typescript
// HIGH: No rate limiting
// Location: src/routes/auth.ts:23
// Risk: Brute force attacks
app.post('/login', async (req, res) => {
  const user = await authenticate(req.body)
  res.json({ token: user.token })
})

// FIX: Add rate limiting
import rateLimit from 'express-rate-limit'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, try again later'
})

app.post('/login', loginLimiter, async (req, res) => {
  const user = await authenticate(req.body)
  res.json({ token: user.token })
})
```

**Checklist:**
- [ ] CSRF protection on state-changing endpoints
- [ ] CORS configured with whitelisted origins
- [ ] Rate limiting on auth/public endpoints
- [ ] Dependencies up-to-date (npm audit)
- [ ] No prototype pollution vulnerabilities

---

## Phase 3: Dependency Audit

### Automated Checks

```bash
# Node.js
npm audit --audit-level=moderate
npm outdated

# Python
pip-audit
safety check

# PHP
composer audit

# Tools
snyk test
```

### Common Issues

```bash
# CRITICAL: Known CVE vulnerability
# Package: lodash@4.17.15
# CVE: CVE-2020-8203 (Prototype Pollution)
# Fix: npm update lodash

# HIGH: Outdated critical package
# Package: express@4.16.0
# Latest: express@4.18.2
# Fix: npm install express@latest
```

**Checklist:**
- [ ] npm audit shows 0 high/critical
- [ ] Critical packages up-to-date
- [ ] Snyk/Dependabot configured
- [ ] Lock file committed (package-lock.json)

---

## Phase 4: Infrastructure Check

### Environment Variables

```typescript
// HIGH: Missing env validation
// Location: src/config/index.ts:1
export const config = {
  dbUrl: process.env.DATABASE_URL, // May be undefined!
  apiKey: process.env.API_KEY
}

// FIX: Validate on startup
import { z } from 'zod'

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(32),
  NODE_ENV: z.enum(['development', 'production', 'test'])
})

export const config = envSchema.parse(process.env)
```

### Docker Secrets

```dockerfile
# HIGH: Secrets in Dockerfile
# Location: Dockerfile:15
ENV DATABASE_PASSWORD=supersecret123

# FIX: Use Docker secrets
# docker-compose.yml
services:
  app:
    secrets:
      - db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

**Checklist:**
- [ ] Env vars validated on startup
- [ ] Docker secrets not in Dockerfile
- [ ] .env not committed to git
- [ ] Secrets rotated regularly

---

## Output Format

### Report Structure

```markdown
# Code Health Report - [Project Name]

Generated: 2026-05-16 21:30:00
Scanned: 234 files, 45,678 lines

## Summary

Total issues: 23
- CRITICAL: 3 (fix immediately!)
- HIGH: 7 (fix this sprint)
- MEDIUM: 9 (schedule next sprint)
- LOW: 4 (nice to have)

Estimated fix time: 8 hours
Risk score: 67/100 (High Risk)

---

## CRITICAL Issues (3)

### [CRITICAL-001] SQL Injection in user search
**Location:** `src/services/users.service.ts:45`
**Risk:** Complete database compromise, data exfiltration
**CVSS Score:** 9.8 (Critical)

**Current code:**
```typescript
async function searchUsers(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`
  return db.raw(query)
}
```

**Attack scenario:**
```typescript
searchUsers("' OR '1'='1")
// Returns: ALL users in database
```

**Remediation:**
```typescript
async function searchUsers(email: string) {
  return db('users').where({ email }).select('*')
}
```

**Impact:** Prevents complete database compromise
**Effort:** 5 minutes
**Priority:** Fix immediately

---

### [CRITICAL-002] Missing authentication on DELETE /users/:id
**Location:** `src/routes/users.ts:89`
**Risk:** Anyone can delete any user account
**CVSS Score:** 9.1 (Critical)

**Current code:**
```typescript
app.delete('/users/:id', async (req, res) => {
  await deleteUser(req.params.id)
  res.json({ ok: true })
})
```

**Remediation:**
```typescript
import { authenticate } from '../middleware/auth'

app.delete('/users/:id', authenticate, async (req, res) => {
  const targetUser = await getUser(req.params.id)
  
  if (req.user.role !== 'admin' && req.user.id !== targetUser.id) {
    return res.status(403).json({ error: 'Forbidden' })
  }
  
  await deleteUser(req.params.id)
  res.json({ ok: true })
})
```

**Impact:** Prevents unauthorized account deletion
**Effort:** 15 minutes
**Priority:** Fix immediately

---

### [CRITICAL-003] Exposed Stripe API key in code
**Location:** `src/config/stripe.ts:3`
**Risk:** Unauthorized charges, financial loss
**CVSS Score:** 8.9 (High)

**Current code:**
```typescript
const STRIPE_KEY = 'sk_live_abc123xyz789...'
```

**Remediation:**
```typescript
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
if (!STRIPE_KEY) {
  throw new Error('STRIPE_SECRET_KEY not configured')
}

// Add to .gitignore
echo ".env" >> .gitignore

// Rotate compromised key at dashboard.stripe.com
```

**Impact:** Prevents unauthorized API usage
**Effort:** 10 minutes + key rotation
**Priority:** Fix immediately + rotate key

---

## HIGH Issues (7)

### [HIGH-001] N+1 API calls loading user profiles
**Location:** `src/pages/users.ts:89`
**Performance Impact:** 3.2s → 280ms (91% improvement)

**Current code:**
```typescript
async function loadUsersWithProfiles() {
  const users = await fetchUsers() // 1 request
  for (const user of users) {
    user.profile = await fetchProfile(user.id) // N requests!
  }
  return users
}
```

**Metrics:**
- Current: 1 + 50 requests = 3.2s
- After fix: 2 requests = 280ms
- Improvement: 91% faster

**Remediation:**
```typescript
async function loadUsersWithProfiles() {
  const users = await fetchUsers()
  const profiles = await fetchProfiles(users.map(u => u.id))
  return users.map(user => ({
    ...user,
    profile: profiles.find(p => p.userId === user.id)
  }))
}
```

**Effort:** 20 minutes

---

(Continue for remaining HIGH/MEDIUM/LOW issues...)

---

## Performance Summary

### Before Optimization
- Page load time: 3.5s
- Memory usage: 250MB
- API response time (p95): 1.8s
- Bundle size: 1.2MB
- Time to Interactive: 4.2s

### After Optimization
- Page load time: 1.1s (-68%)
- Memory usage: 120MB (-52%)
- API response time (p95): 320ms (-82%)
- Bundle size: 420KB (-65%)
- Time to Interactive: 1.8s (-57%)

### Key Wins
1. Fixed N+1 API calls: 3.2s → 280ms
2. Replaced moment.js: -67KB bundle
3. Fixed memory leak: -130MB usage
4. Parallelized requests: 1.8s → 700ms

---

## Security Summary

### Risk Score: 67/100 → 22/100 (After fixes)

**Vulnerabilities by Severity:**
- Critical: 3 → 0 (after fixes)
- High: 7 → 1 (rate limiting pending)
- Medium: 9 → 4 (improvements ongoing)
- Low: 4 → 4 (no change)

**Compliance:**
- OWASP Top 10: 3 issues → 0 issues
- CWE Top 25: 2 issues → 0 issues
- PCI DSS: Not compliant → Compliant (after fixes)

---

## Actionable Next Steps

### Immediate (Today)
1. Fix CRITICAL-001: SQL injection (5 min)
2. Fix CRITICAL-002: Auth missing (15 min)
3. Fix CRITICAL-003: Exposed key + rotate (10 min + rotation)

Estimated time: 30 minutes + key rotation

### This Sprint (This Week)
1. Fix HIGH-001: N+1 API calls (20 min)
2. Fix HIGH-002: Memory leak (15 min)
3. Fix HIGH-003: XSS vulnerability (10 min)
4. Add rate limiting (30 min)
5. Update dependencies (npm audit fix)

Estimated time: 2 hours

### Next Sprint
1. Address MEDIUM priority issues
2. Optimize bundle size
3. Add monitoring (Sentry)
4. Set up dependency scanning (Snyk)

---

## Automated Checks to Add

```bash
# CI/CD pipeline additions
npm audit --audit-level=moderate || exit 1
npm run test:security
eslint --plugin security
bundlesize check
```

---

## Monitoring Recommendations

1. **Sentry** - Error tracking + performance
2. **Snyk** - Continuous dependency scanning
3. **Lighthouse CI** - Performance regression detection
4. **OWASP ZAP** - Automated security testing

---
```

---

## Framework-Specific Security Patterns

### Express.js

```typescript
// Security middleware stack
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

app.use(helmet()) // Security headers
app.use(cors({ origin: ALLOWED_ORIGINS }))
app.use(rateLimit({ 
  windowMs: 15 * 60 * 1000, 
  max: 100 
}))
app.use(express.json({ limit: '1mb' }))

// Input validation
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

app.post('/register', async (req, res) => {
  const validated = schema.parse(req.body)
  const user = await createUser(validated)
  res.json({ id: user.id })
})
```

### Next.js API Routes

```typescript
// pages/api/orders.ts
import { z } from 'zod'
import { getSession } from 'next-auth/react'
import rateLimit from '../../lib/rate-limit'

const limiter = rateLimit({
  interval: 60 * 1000,
  uniqueTokenPerInterval: 500
})

const schema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(100)
})

export default async function handler(req, res) {
  // Rate limit
  try {
    await limiter.check(res, 10, 'CACHE_TOKEN')
  } catch {
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }
  
  // Auth
  const session = await getSession({ req })
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  
  // Validation
  const result = schema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error })
  }
  
  // Business logic
  const order = await createOrder(session.user.id, result.data)
  res.json(order)
}
```

### React Performance Patterns

```typescript
import { memo, useMemo, useCallback, lazy } from 'react'

// Memoize expensive components
export const ProductCard = memo(({ product }: Props) => {
  // Memoize expensive computation
  const discount = useMemo(() => 
    calculateDiscount(product),
    [product.price, product.category]
  )
  
  // Memoize callbacks
  const handleClick = useCallback(() => {
    addToCart(product.id)
  }, [product.id])
  
  return <div onClick={handleClick}>{/* ... */}</div>
})

// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))

// Virtual scrolling for long lists
import { FixedSizeList } from 'react-window'

function ProductList({ products }: Props) {
  if (products.length > 100) {
    return (
      <FixedSizeList
        height={600}
        itemCount={products.length}
        itemSize={80}
      >
        {({ index, style }) => (
          <ProductCard 
            key={products[index].id}
            product={products[index]}
            style={style}
          />
        )}
      </FixedSizeList>
    )
  }
  
  return products.map(p => <ProductCard key={p.id} product={p} />)
}
```

### Laravel Security

```php
// Input validation
public function store(Request $request)
{
    $validated = $request->validate([
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8',
    ]);
    
    $user = User::create([
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
    ]);
    
    return response()->json($user, 201);
}

// Authorization
public function destroy(Order $order)
{
    if ($order->user_id !== auth()->id() && !auth()->user()->isAdmin()) {
        abort(403, 'Forbidden');
    }
    
    $order->delete();
    return response()->json(['ok' => true]);
}

// Rate limiting (routes/api.php)
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// CSRF (automatic for web routes, manual for API)
// Use Sanctum for API authentication
```

---

## Integration dengan Skills Lain

### Dependencies

**ALWAYS load these first:**

1. **project-readability (REQUIRED)**
   - Load before generating remediations
   - Follow naming conventions
   - Apply scale-aware architecture rules
   - No emoji/icons in fixes
   - Boring code > clever code

2. **project-initializer (OPTIONAL)**
   - Detect framework automatically
   - Identify project scale
   - Apply framework-specific patterns

3. **database-optimizer (COMPLEMENTARY)**
   - code-health handles application-level
   - database-optimizer handles DB queries
   - Defer to database-optimizer for:
     - Slow queries
     - Missing indexes
     - N+1 at DB level (ORM queries)

### Workflow Example

```
User: "check code health for src/api/"

Agent:
1. Load project-readability context
2. Detect framework (Express/Next.js/etc)
3. Scan src/api/ for:
   - Performance issues
   - Security vulnerabilities
   - Dependency issues
4. Generate report following project-readability rules:
   - No emoji in code
   - Scale-appropriate fixes
   - Boring, readable remediations
5. If DB issues found:
   - Note them
   - Recommend: "Use database-optimizer for query optimization"
```

---

## When to Use vs Other Skills

| Scenario | Use Skill |
|----------|-----------|
| Daily code audit | **code-health** |
| Before deployment | **code-health** |
| Security review | **code-health** |
| Find memory leaks | **code-health** |
| Optimize API calls | **code-health** |
| Slow DB queries | **database-optimizer** |
| Missing indexes | **database-optimizer** |
| Code readability | **project-readability** |
| New feature design | **feature-architect** |
| Init new project | **project-initializer** |

---

## Success Metrics

### Performance Targets
- Page load < 2s (mobile 3G)
- API response < 200ms (p95)
- Memory usage < 150MB
- Bundle size < 300KB gzipped
- Time to Interactive < 3s

### Security Targets
- 0 CRITICAL vulnerabilities
- 0 HIGH vulnerabilities (or documented exceptions)
- npm audit score: 0 high/critical
- All endpoints: auth + rate limiting
- OWASP Top 10: fully addressed

### Code Quality (via project-readability)
- Cognitive complexity < 10
- No functions > 50 lines
- Test coverage > 80%
- No emoji/icons in code
- Boring, readable patterns

---

## Tools Integration

### Automated Security Scanning

```bash
# npm scripts (package.json)
{
  "scripts": {
    "audit": "npm audit --audit-level=moderate",
    "audit:fix": "npm audit fix",
    "security": "eslint --plugin security",
    "snyk": "snyk test",
    "check:health": "npm run audit && npm run security && npm run test"
  }
}
```

### CI/CD Integration

```yaml
# .github/workflows/code-health.yml
name: Code Health Check

on: [pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm audit --audit-level=moderate
      - run: npm run security
      - run: npx snyk test
  
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm run build
      - run: npx bundlesize check
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: http://localhost:3000
```

### VSCode Integration

```json
// .vscode/settings.json
{
  "eslint.validate": ["javascript", "typescript"],
  "eslint.options": {
    "plugins": ["security"]
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  }
}
```

---

## Checklist Summary

### Pre-Deployment Checklist

**Performance:**
- [ ] No memory leaks (event listeners cleanup)
- [ ] No O(n²) algorithms
- [ ] API calls parallelized
- [ ] Bundle size < 300KB
- [ ] Images optimized (WebP, lazy loading)

**Security:**
- [ ] All inputs validated (Zod/Joi)
- [ ] SQL queries parameterized
- [ ] Auth guards on protected routes
- [ ] CSRF protection enabled
- [ ] CORS whitelisted origins only
- [ ] Rate limiting on public endpoints
- [ ] No secrets in code
- [ ] npm audit: 0 high/critical

**Infrastructure:**
- [ ] Env vars validated on startup
- [ ] Secrets not in Docker/git
- [ ] Error messages sanitized (production)
- [ ] Logging excludes PII
- [ ] Monitoring enabled (Sentry/etc)

**Dependencies:**
- [ ] npm audit clean
- [ ] Critical packages up-to-date
- [ ] Lock file committed
- [ ] Snyk/Dependabot configured

---

## Real-World Case Studies

### Case Study 1: E-Commerce Platform

**Before:**
- Page load: 5.2s
- Cart API: 2.1s
- Memory leaks: 450MB after 1 hour
- Security: 8 critical vulnerabilities

**Issues Found:**
1. N+1 loading product images (47 requests)
2. Moment.js in bundle (+67KB)
3. Event listeners leak in cart
4. Missing auth on admin endpoints
5. SQL injection in product search
6. No rate limiting

**After Fixes:**
- Page load: 1.8s (-65%)
- Cart API: 350ms (-83%)
- Memory stable: 130MB
- Security: 0 critical vulnerabilities

**Time Invested:** 6 hours
**Business Impact:** +23% conversion rate

---

### Case Study 2: SaaS Dashboard

**Before:**
- Dashboard load: 4.5s
- API calls: 15 sequential
- Bundle: 2.1MB
- Auth bypass vulnerability

**Issues Found:**
1. Sequential API calls (15 × 300ms = 4.5s)
2. No code splitting
3. Large dependencies (lodash, moment)
4. Missing role checks on delete

**After Fixes:**
- Dashboard load: 1.2s (-73%)
- API calls: 3 parallel (longest 600ms)
- Bundle: 380KB (-82%)
- Auth properly implemented

**Time Invested:** 4 hours
**Business Impact:** Passed security audit, SOC 2 compliant

---

## References

### Security Standards
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- SANS Top 25: https://www.sans.org/top25-software-errors/

### Tools
- npm audit: https://docs.npmjs.com/cli/audit
- Snyk: https://snyk.io/
- ESLint Security: https://github.com/nodesecurity/eslint-plugin-security
- Semgrep: https://semgrep.dev/
- OWASP ZAP: https://www.zaproxy.org/

### Performance
- Web.dev: https://web.dev/performance/
- Lighthouse: https://developers.google.com/web/tools/lighthouse
- Core Web Vitals: https://web.dev/vitals/
- React Performance: https://react.dev/learn/render-and-commit

### Dependencies
- Snyk Advisor: https://snyk.io/advisor/
- npm trends: https://npmtrends.com/
- Bundle Phobia: https://bundlephobia.com/

---

## FAQ

### Q: Bedanya code-health vs database-optimizer?

**A:** 
- **code-health** → Application-level (memory leaks, API optimization, security)
- **database-optimizer** → DB-level (slow queries, indexes, N+1 di ORM)

Contoh: N+1 API calls di frontend = code-health, N+1 DB queries di backend = database-optimizer

---

### Q: Kapan harus run code-health check?

**A:**
1. **Daily** - Routine health check
2. **Before PR merge** - Prevent introducing vulnerabilities
3. **Before deployment** - Final security check
4. **After major features** - Ensure no performance regression
5. **Security incidents** - Comprehensive audit

---

### Q: Apakah code-health auto-fix issues?

**A:** 
No. Code-health generates **actionable reports** dengan before/after code examples. 

Developer harus:
1. Review recommendations
2. Apply fixes manually (atau via implement_feature MCP tool)
3. Test changes
4. Verify improvements

Alasan: Auto-fix berisiko break functionality.

---

### Q: Bagaimana prioritize fixes?

**A:**
1. **CRITICAL** - Fix immediately (< 1 day)
2. **HIGH** - Fix this sprint (< 1 week)
3. **MEDIUM** - Schedule next sprint
4. **LOW** - Backlog / nice to have

Focus 80/20 rule: Fix high-impact issues first.

---

### Q: Apakah code-health replace manual security audit?

**A:**
No. Code-health adalah **automated first-pass** untuk catch common issues.

Manual security audit still needed untuk:
- Business logic vulnerabilities
- Complex attack vectors
- Compliance requirements (SOC 2, PCI DSS)

Code-health reduces manual audit time ~60%.

---

## Maintenance

**Update frequency:** Quarterly

**Update checklist:**
- [ ] Add new OWASP Top 10 entries
- [ ] Update framework security patterns (Next.js, Laravel, etc)
- [ ] Add new CVE examples
- [ ] Update tool integrations (Snyk, Semgrep)
- [ ] Add performance patterns (React 19, etc)

---

## Conclusion

Code-health skill adalah **daily hygiene check** untuk codebase.

**Key takeaways:**
1. Scan comprehensive (performance + security)
2. Prioritize by impact (Critical first)
3. Actionable remediations (before/after code)
4. Follow project-readability standards
5. Integrate with CI/CD pipeline

**Goal:** Zero critical vulnerabilities, optimal performance, production-ready code.

**Remember:** Defer to `database-optimizer` untuk DB-level issues, follow `project-readability` untuk code quality standards.
