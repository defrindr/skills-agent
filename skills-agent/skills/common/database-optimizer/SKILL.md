---
name: database-optimizer
description: |
  Optimize database performance: slow query analysis, index recommendations, query rewriting, N+1 detection.
  Covers PostgreSQL, MySQL, MongoDB. Actionable improvements without breaking logic.
  Trigger: "optimize database", "slow query", "improve query performance",
  "database bottleneck", "add missing indexes", "fix N+1 queries", "analyze query plan".
  Focuses on: Query analysis (EXPLAIN), Index optimization, Query rewriting, N+1 fixes,
  Caching strategies, Connection pooling.
---

# Database Optimizer

Analyze-first, optimize-second. Measure before and after.

---

## Identify Bottlenecks

### PostgreSQL
```sql
ALTER DATABASE mydb SET log_min_duration_statement = 1000;  -- log queries > 1s
EXPLAIN ANALYZE SELECT * FROM posts WHERE user_id = 123 ORDER BY created_at DESC LIMIT 20;
SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC;
SELECT schemaname, tablename, indexname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;
```

### MySQL
```sql
SET GLOBAL slow_query_log = 'ON', long_query_time = 1;
EXPLAIN SELECT * FROM posts WHERE user_id = 123;
SHOW INDEXES FROM posts;
```

### Prisma
```ts
const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });
```

---

## Common Issues & Fixes

### 1. Missing Indexes — Sequential Scans

**Fix:** Add index for filtered columns.
```prisma
model Post {
  userId    String
  createdAt DateTime
  @@index([userId, createdAt(sort: Desc)])
}
```
Before: Seq Scan, 1500ms. After: Index Scan, 5ms.

### 2. N+1 Query Problem

```ts
// ❌ 1 + N queries
const posts = await prisma.post.findMany();
for (const post of posts) { const user = await prisma.user.findUnique({ where: { id: post.userId } }); }

// ✅ 1 query with include
const posts = await prisma.post.findMany({
  include: { user: { select: { id: true, name: true, image: true } } }
});
```
Before: 101 queries, 2000ms. After: 1 query, 50ms.

### 3. Inefficient Pagination — OFFSET

```ts
// ❌ OFFSET skips all rows
const posts = await prisma.post.findMany({ skip: page * 20, take: 20, orderBy: { createdAt: 'desc' } });

// ✅ Cursor-based — index seek
const posts = await prisma.post.findMany({ take: 20, skip: 1, cursor: lastPostId ? { id: lastPostId } : undefined, orderBy: { createdAt: 'desc' } });
```
Before: OFFSET 20000, 1500ms. After: Cursor seek, 10ms.

### 4. SELECT * — Fetching Unnecessary Columns

```ts
// ❌ Fetches all columns including large blob/text
// ✅ Select only needed columns
await prisma.post.findMany({ where: { published: true }, select: { id: true, title: true, slug: true, createdAt: true } });
```

### 5. Missing Composite Indexes

```prisma
// ❌ Three separate indexes — can't serve multi-column filter efficiently
@@index([userId])
@@index([status])
@@index([createdAt])

// ✅ Single composite index
@@index([userId, status, createdAt(sort: Desc)])
// Supports: WHERE userId=?, WHERE userId=? AND status=?, +ORDER BY createdAt
// Does NOT support: WHERE status=?
```

### 6. Inefficient JOINs — Deep Nesting

```ts
// ❌ 4+ JOINs, cartesian explosion
// ✅ Shallow includes, separate queries for related data
const posts = await prisma.post.findMany({
  include: { user: { select: { id: true, name: true } } }
});
const postIds = posts.map(p => p.id);
const comments = await prisma.comment.findMany({ where: { postId: { in: postIds } } });
```

---

## Index Strategies

**Add for:** foreign keys, WHERE filters, ORDER BY columns, unique constraints, composite filters.
**Don't add for:** small tables (< 1000 rows), low cardinality columns (boolean), write-heavy tables, columns never queried.

### Composite Index Patterns
- Filter + Sort: `@@index([userId, published, createdAt(sort: Desc)])`
- Multiple Filters: `@@index([categoryId, tagId])`
- Covering Index (all queried columns in index — avoids table lookup): `@@index([userId, title, slug])`

### Partial Indexes (PostgreSQL)
```sql
CREATE INDEX idx_posts_published_created ON posts (created_at DESC) WHERE published = true;
```

---

## Query Rewriting

| Anti-pattern | Fix |
|---|---|
| `WHERE col = 1 OR col = 2 OR col = 3` | `WHERE col IN (1, 2, 3)` |
| `LIKE '%query%'` | Full-text search or prefix `LIKE 'prefix%'` |
| Multiple JOINs fetching everything | Separate queries with pagination |
| `fetchAll().length` for count | `count()` query |

---

## Caching Strategies

```ts
import Redis from 'ioredis';
const redis = new Redis();

async function getPost(id: string) {
  const cached = await redis.get(`post:${id}`);
  if (cached) return JSON.parse(cached);
  const post = await prisma.post.findUnique({ where: { id } });
  await redis.setex(`post:${id}`, 300, JSON.stringify(post));
  return post;
}
```

Materialized views for pre-computed aggregations:
```sql
CREATE MATERIALIZED VIEW popular_posts AS SELECT posts.*, COUNT(likes.id) as like_count FROM posts LEFT JOIN likes ... LIMIT 100;
REFRESH MATERIALIZED VIEW popular_posts;
```

### Connection Pooling
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=10"
```
Serverless: connection_limit=5. Long-running: connection_limit=20.

---

## Key Rules

- Profile first (EXPLAIN ANALYZE)
- Fix N+1, add indexes for common queries, use cursor pagination
- Cache hot data, select only needed columns
- Measure before/after — don't optimize guessing
- No SELECT *, no deep nesting, no OFFSET for large datasets

## Referensi

- Schema design → `database-designer`
- Framework implementation → `*-readability` masing-masing
