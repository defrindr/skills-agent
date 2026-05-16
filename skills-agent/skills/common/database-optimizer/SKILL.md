---
name: database-optimizer
description: |
  Optimize database performance: slow query analysis, index recommendations, query rewriting, N+1 detection.
  Covers PostgreSQL, MySQL, MongoDB. Provides actionable improvements without breaking existing logic.
  
  Trigger phrases:
  - "optimize database"
  - "slow query"
  - "improve query performance"
  - "database bottleneck"
  - "add missing indexes"
  - "fix N+1 queries"
  - "analyze query plan"
  
  Focuses on:
  - Query analysis (EXPLAIN, execution plans)
  - Index optimization (missing, unused, redundant)
  - Query rewriting (optimization techniques)
  - N+1 problem detection and fixes
  - Caching strategies
  - Connection pooling

default_provider: deepseek
complexity: medium
---

# Database Optimizer

Goal: Identify dan fix database performance issues dengan actionable recommendations tanpa break existing logic.

## Prinsip Utama

**ANALYZE-FIRST, OPTIMIZE-SECOND!**

Don't guess. Measure:
1. **Profile first** - Identify actual bottlenecks (EXPLAIN, slow query logs)
2. **Prioritize impact** - Fix high-impact issues first (80/20 rule)
3. **Measure results** - Verify improvements with metrics
4. **Preserve logic** - Optimizations must not change behavior
5. **Document changes** - Explain why each optimization helps

## Phase 1: Identify Bottlenecks

### Questions to Ask

**ALWAYS gather context:**

```
Before optimizing, I need to understand:

1. **What's slow?**
   - Specific queries? Page loads? Background jobs?
   - How slow? (response time: 100ms vs 5s)

2. **Query patterns:**
   - List queries (SELECT, INSERT, UPDATE)?
   - JOIN heavy? Aggregations?
   - Pagination? Sorting?

3. **Data scale:**
   - How many records per table?
   - Growth rate?

4. **Current indexes:**
   - Any indexes already? Which columns?
   - Using ORM (Prisma, TypeORM)?

5. **Database:**
   - PostgreSQL? MySQL? MongoDB?
   - Version?
```

### Tools to Use

**PostgreSQL:**
```sql
-- Enable slow query logging
ALTER DATABASE mydb SET log_min_duration_statement = 1000; -- Log queries > 1s

-- Analyze query
EXPLAIN ANALYZE
SELECT * FROM posts WHERE user_id = 123 ORDER BY created_at DESC LIMIT 20;

-- Check table stats
SELECT schemaname, tablename, n_live_tup, n_dead_tup
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Find missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100
  AND correlation < 0.1;

-- Unused indexes
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexrelname NOT LIKE 'pg_toast%';
```

**MySQL:**
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;

-- Analyze query
EXPLAIN
SELECT * FROM posts WHERE user_id = 123 ORDER BY created_at DESC LIMIT 20;

-- Show indexes
SHOW INDEXES FROM posts;

-- Table stats
SHOW TABLE STATUS LIKE 'posts';
```

**Prisma (ORM):**
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// See generated SQL
const posts = await prisma.post.findMany({
  where: { userId: '123' },
  orderBy: { createdAt: 'desc' },
  take: 20,
});
// Check console for SQL output
```

## Phase 2: Common Issues & Fixes

### Issue 1: Missing Indexes

**Symptom:** Sequential scans on large tables

**Diagnosis:**
```sql
-- PostgreSQL
EXPLAIN ANALYZE
SELECT * FROM posts WHERE user_id = 123;

-- Output shows: Seq Scan on posts (cost=0.00..1500.00)
-- Bad! Should be Index Scan
```

**Fix:**
```prisma
// Add index
model Post {
  id        String   @id
  userId    String
  title     String
  createdAt DateTime
  
  @@index([userId])           // ← Add this
  @@index([userId, createdAt]) // ← Composite for sorted queries
}
```

**Migration:**
```sql
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);
```

**Impact:**
- Before: Seq Scan, 1500ms
- After: Index Scan, 5ms
- **300x faster!**

### Issue 2: N+1 Query Problem

**Symptom:** One query to get list, then N queries for related data

**Bad Code:**
```typescript
// ❌ N+1 problem: 1 + N queries
const posts = await prisma.post.findMany(); // 1 query

for (const post of posts) {
  const user = await prisma.user.findUnique({  // N queries!
    where: { id: post.userId }
  });
  console.log(user.name);
}
// Total: 1 + 100 = 101 queries for 100 posts
```

**Fixed Code:**
```typescript
// ✅ Fixed: 1 query with JOIN
const posts = await prisma.post.findMany({
  include: {
    user: {
      select: { id: true, name: true, image: true }
    }
  }
});

for (const post of posts) {
  console.log(post.user.name); // Already loaded!
}
// Total: 1 query
```

**Alternative (DataLoader pattern):**
```typescript
// For complex cases, use DataLoader
import DataLoader from 'dataloader';

const userLoader = new DataLoader(async (userIds) => {
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } }
  });
  return userIds.map(id => users.find(u => u.id === id));
});

// Batches requests automatically
const posts = await prisma.post.findMany();
const postsWithUsers = await Promise.all(
  posts.map(async post => ({
    ...post,
    user: await userLoader.load(post.userId)
  }))
);
```

**Impact:**
- Before: 101 queries, 2000ms
- After: 1-2 queries, 50ms
- **40x faster!**

### Issue 3: Inefficient Pagination

**Bad (OFFSET/LIMIT):**
```typescript
// ❌ Slow for large offsets
const page = 1000;
const posts = await prisma.post.findMany({
  skip: page * 20,    // Skips 20,000 rows!
  take: 20,
  orderBy: { createdAt: 'desc' }
});
// Database still scans 20,000 rows
```

**Fixed (Cursor-based):**
```typescript
// ✅ Fast: Uses index seek
const posts = await prisma.post.findMany({
  take: 20,
  skip: 1,
  cursor: lastPostId ? { id: lastPostId } : undefined,
  orderBy: { createdAt: 'desc' }
});

// Return cursor for next page
return {
  posts,
  nextCursor: posts[posts.length - 1]?.id
};
```

**Impact:**
- Before: OFFSET 20000, 1500ms
- After: Cursor seek, 10ms
- **150x faster!**

### Issue 4: Unoptimized Queries

**Bad (SELECT *):**
```typescript
// ❌ Fetches all columns (wasteful)
const posts = await prisma.post.findMany({
  where: { published: true }
});
// Fetches: id, userId, title, content (large text!), slug, createdAt, updatedAt, etc.
```

**Fixed (SELECT specific):**
```typescript
// ✅ Only fetch needed columns
const posts = await prisma.post.findMany({
  where: { published: true },
  select: {
    id: true,
    title: true,
    slug: true,
    createdAt: true,
    user: {
      select: { name: true, image: true }
    }
  }
});
// Skips large 'content' column
```

**Impact:**
- Before: 5MB transferred, 500ms
- After: 100KB transferred, 50ms
- **10x faster!**

### Issue 5: Missing Composite Indexes

**Bad (Single-column indexes):**
```prisma
model Post {
  userId    String
  status    String
  createdAt DateTime
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// Query can't use indexes efficiently
// WHERE userId = ? AND status = 'published' ORDER BY createdAt DESC
```

**Fixed (Composite index):**
```prisma
model Post {
  userId    String
  status    String
  createdAt DateTime
  
  @@index([userId, status, createdAt(sort: Desc)])
  // ↑ Supports: userId filter + status filter + date sorting
}

// Query uses single index efficiently
```

**Index Usage Rules:**
- Leftmost prefix: Index `[A, B, C]` supports queries on:
  - ✅ `WHERE A`
  - ✅ `WHERE A AND B`
  - ✅ `WHERE A AND B AND C`
  - ❌ `WHERE B` (doesn't use index)
  - ❌ `WHERE C` (doesn't use index)

**Impact:**
- Before: Multiple index scans + sort, 200ms
- After: Single index scan, 10ms
- **20x faster!**

### Issue 6: Inefficient JOINs

**Bad (Multiple JOINs):**
```typescript
// ❌ Deep nesting, many JOINs
const posts = await prisma.post.findMany({
  include: {
    user: {
      include: {
        profile: {
          include: {
            settings: true
          }
        }
      }
    },
    comments: {
      include: {
        user: true
      }
    },
    tags: {
      include: {
        tag: true
      }
    }
  }
});
// 4+ JOINs, cartesian product explosion
```

**Fixed (Selective includes):**
```typescript
// ✅ Shallow includes, separate queries if needed
const posts = await prisma.post.findMany({
  include: {
    user: {
      select: { id: true, name: true, image: true }
    }
  }
});

// Fetch comments separately if needed
const postIds = posts.map(p => p.id);
const comments = await prisma.comment.findMany({
  where: { postId: { in: postIds } },
  include: {
    user: {
      select: { name: true, image: true }
    }
  }
});

// Group comments by postId in application code
```

**Impact:**
- Before: 4+ JOINs, 5000ms
- After: 2 queries, 100ms
- **50x faster!**

## Phase 3: Index Strategies

### When to Add Indexes

✅ **Add indexes for:**
- Foreign keys (JOIN columns)
- WHERE clause filters (frequently queried)
- ORDER BY columns (sorting)
- UNIQUE constraints (uniqueness check)
- Composite filters (multiple WHERE conditions)

❌ **Don't add indexes for:**
- Small tables (< 1000 rows)
- Columns with low cardinality (e.g., boolean)
- Write-heavy tables (indexes slow INSERT/UPDATE)
- Columns never queried

### Composite Index Patterns

**Pattern 1: Filter + Sort**
```prisma
// Query: Get user's published posts, newest first
model Post {
  userId    String
  published Boolean
  createdAt DateTime
  
  @@index([userId, published, createdAt(sort: Desc)])
  // Order matters! userId first (most selective)
}
```

**Pattern 2: Multiple Filters**
```prisma
// Query: Get posts by category and tag
model Post {
  categoryId String
  tagId      String
  
  @@index([categoryId, tagId])
  // Supports: WHERE categoryId = ? AND tagId = ?
}
```

**Pattern 3: Covering Index**
```prisma
// Query: Get post titles for user
model Post {
  userId String
  title  String
  slug   String
  
  // Include all queried columns in index
  @@index([userId, title, slug])
  // Database can return data from index alone (no table lookup!)
}
```

### Partial Indexes (PostgreSQL)

```sql
-- Index only published posts (smaller, faster)
CREATE INDEX idx_posts_published_created
ON posts (created_at DESC)
WHERE published = true;
```

```prisma
// Prisma doesn't support partial indexes directly
// Use raw SQL or pgAdmin
```

## Phase 4: Query Rewriting

### Technique 1: Avoid OR (Use IN)

**Bad:**
```sql
-- OR prevents index usage
SELECT * FROM posts
WHERE user_id = 1 OR user_id = 2 OR user_id = 3;
```

**Good:**
```sql
-- IN can use index
SELECT * FROM posts
WHERE user_id IN (1, 2, 3);
```

### Technique 2: Avoid LIKE with Leading Wildcard

**Bad:**
```sql
-- %query% prevents index usage
SELECT * FROM posts WHERE title LIKE '%nodejs%';
```

**Good:**
```sql
-- Full-text search index
SELECT * FROM posts
WHERE to_tsvector('english', title) @@ to_tsquery('nodejs');

-- Or: Prefix search (can use index)
SELECT * FROM posts WHERE title LIKE 'nodejs%';
```

### Technique 3: Limit JOIN Complexity

**Bad:**
```sql
-- Multiple JOINs, large result set
SELECT posts.*, users.*, comments.*, tags.*
FROM posts
JOIN users ON users.id = posts.user_id
JOIN comments ON comments.post_id = posts.id
JOIN post_tags ON post_tags.post_id = posts.id
JOIN tags ON tags.id = post_tags.tag_id
WHERE posts.published = true;
```

**Good:**
```typescript
// Separate queries, paginate
const posts = await prisma.post.findMany({
  where: { published: true },
  include: { user: { select: { name: true } } },
  take: 20
});

// Fetch related data separately if needed
```

### Technique 4: Use COUNT Efficiently

**Bad:**
```typescript
// ❌ Fetches all records just to count
const posts = await prisma.post.findMany({ where: { published: true } });
const count = posts.length; // Wasteful!
```

**Good:**
```typescript
// ✅ COUNT query (no data fetched)
const count = await prisma.post.count({ where: { published: true } });
```

**Better (for pagination):**
```typescript
// Skip COUNT if not needed
const posts = await prisma.post.findMany({
  where: { published: true },
  take: 21, // Fetch 1 extra to check if more exists
});

const hasMore = posts.length > 20;
const results = posts.slice(0, 20);
```

## Phase 5: Caching Strategies

### Application-Level Caching

**Redis cache:**
```typescript
import Redis from 'ioredis';
const redis = new Redis();

async function getPost(id: string) {
  // Check cache first
  const cached = await redis.get(`post:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from DB
  const post = await prisma.post.findUnique({
    where: { id },
    include: { user: { select: { name: true } } }
  });
  
  // Cache for 5 minutes
  await redis.setex(`post:${id}`, 300, JSON.stringify(post));
  
  return post;
}

// Invalidate on update
async function updatePost(id: string, data: any) {
  const post = await prisma.post.update({ where: { id }, data });
  await redis.del(`post:${id}`); // Clear cache
  return post;
}
```

### Query Result Caching

**Prisma (via extension):**
```typescript
import { PrismaClient } from '@prisma/client';
import { createCache } from 'prisma-redis-middleware';

const prisma = new PrismaClient().$extends(
  createCache({
    storage: { type: 'redis', options: { client: redis } },
    cacheTime: 300, // 5 minutes
  })
);

// Queries automatically cached
const posts = await prisma.post.findMany({ where: { published: true } });
```

### Database Query Caching

**PostgreSQL:**
```sql
-- Materialized views (pre-computed results)
CREATE MATERIALIZED VIEW popular_posts AS
SELECT posts.*, COUNT(likes.id) as like_count
FROM posts
LEFT JOIN likes ON likes.post_id = posts.id
WHERE posts.published = true
GROUP BY posts.id
ORDER BY like_count DESC
LIMIT 100;

-- Refresh periodically
REFRESH MATERIALIZED VIEW popular_posts;
```

```typescript
// Query materialized view (fast!)
const popularPosts = await prisma.$queryRaw`
  SELECT * FROM popular_posts;
`;
```

## Phase 6: Connection Pooling

### Prisma Connection Pool

**Configure in DATABASE_URL:**
```env
# PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=20&pool_timeout=10"

# Params:
# connection_limit: Max connections (default: unlimited, bad!)
# pool_timeout: Wait time for connection (seconds)
```

**Recommended settings:**
```typescript
// For serverless (Vercel, Netlify)
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10"

// For long-running server (Node.js)
DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=20"
```

### PgBouncer (Connection Pooler)

**For serverless with many concurrent requests:**

```yaml
# docker-compose.yml
services:
  pgbouncer:
    image: pgbouncer/pgbouncer
    environment:
      DATABASES_HOST: postgres
      DATABASES_PORT: 5432
      DATABASES_USER: myuser
      DATABASES_PASSWORD: mypass
      DATABASES_DBNAME: mydb
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:6432"
```

```env
# Connect via PgBouncer
DATABASE_URL="postgresql://user:pass@localhost:6432/db"
```

## Real-World Example

### Slow Dashboard Query

**Problem:**
```typescript
// Dashboard loads in 8 seconds!
async function getDashboardData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        include: {
          comments: true,
          likes: true,
          tags: true
        }
      },
      followers: true,
      following: true
    }
  });
  
  return {
    user,
    stats: {
      postsCount: user.posts.length,
      commentsCount: user.posts.reduce((acc, p) => acc + p.comments.length, 0),
      likesCount: user.posts.reduce((acc, p) => acc + p.likes.length, 0)
    }
  };
}
```

**Issues:**
1. ❌ Deep nesting (4+ JOINs)
2. ❌ Fetching all posts/comments/likes (no limit)
3. ❌ Computing counts in application (should be DB aggregation)

**Optimized:**
```typescript
async function getDashboardData(userId: string) {
  // Parallel queries (faster than nested includes)
  const [user, stats, recentPosts] = await Promise.all([
    // User basic info
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true
          }
        }
      }
    }),
    
    // Aggregated stats (DB-side calculation)
    prisma.$queryRaw`
      SELECT
        COUNT(DISTINCT posts.id) as posts_count,
        COUNT(DISTINCT comments.id) as comments_count,
        COUNT(DISTINCT likes.id) as likes_count
      FROM users
      LEFT JOIN posts ON posts.user_id = users.id
      LEFT JOIN comments ON comments.post_id = posts.id
      LEFT JOIN likes ON likes.post_id = posts.id
      WHERE users.id = ${userId}
    `,
    
    // Recent posts (limited, selective columns)
    prisma.post.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        createdAt: true,
        _count: {
          select: { comments: true, likes: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10 // Only recent 10
    })
  ]);
  
  return {
    user,
    stats: stats[0],
    recentPosts
  };
}
```

**Improvements:**
- ✅ Parallel queries (no blocking)
- ✅ Aggregations in DB (not app)
- ✅ Limited data (take 10)
- ✅ Selective columns (no content field)

**Results:**
- Before: 8000ms (8s)
- After: 150ms
- **53x faster!**

### Indexes Added:
```prisma
model Post {
  userId    String
  createdAt DateTime
  
  @@index([userId, createdAt(sort: Desc)])
}

model Comment {
  postId String
  
  @@index([postId])
}

model Like {
  postId String
  
  @@index([postId])
}
```

## Monitoring & Metrics

### Key Metrics to Track

1. **Query Response Time**
   - P50, P95, P99 percentiles
   - Target: < 100ms for critical queries

2. **Database CPU/Memory**
   - High CPU = missing indexes or inefficient queries
   - High memory = result set too large

3. **Connection Pool Usage**
   - Max connections reached = need pooling or scale

4. **Slow Query Log**
   - Queries > 1s should be investigated

5. **Index Hit Rate**
   - Should be > 95% (cache hit ratio)

### Tools

**PostgreSQL:**
- `pg_stat_statements` - Query performance stats
- `EXPLAIN ANALYZE` - Query plans
- PgHero - Web UI for monitoring

**Prisma:**
- Prisma Studio - GUI for data
- Query logs - `log: ['query']`
- OpenTelemetry - Distributed tracing

## Key Rules

### DO:
- ✅ Profile first (EXPLAIN ANALYZE)
- ✅ Add indexes for common queries
- ✅ Fix N+1 problems
- ✅ Use cursor pagination for large datasets
- ✅ Cache frequently accessed data
- ✅ Select only needed columns
- ✅ Measure before/after performance
- ✅ Use connection pooling

### DON'T:
- ❌ Add indexes blindly (impacts writes)
- ❌ Use OFFSET for large offsets
- ❌ SELECT * everything
- ❌ Deep nesting with includes
- ❌ Compute aggregations in app code
- ❌ Ignore slow query logs
- ❌ Optimize without measuring

## Summary

Database optimization follows **measure-optimize-verify cycle**:

1. **Identify bottlenecks** (EXPLAIN, slow query logs)
2. **Prioritize fixes** (high-impact first)
3. **Apply optimizations** (indexes, query rewriting, caching)
4. **Verify improvements** (measure response times)
5. **Monitor continuously** (metrics, alerts)

**Result**: Fast database queries without breaking existing logic.

---

## After Optimization — Update Application Code

Once queries are optimized, apply changes in framework-specific code:

### Backend Frameworks
- **Express.js** → `expressjs-readability` (update Prisma queries in services/repositories)
- **NestJS** → `nestjs-readability` (apply eager loading in repositories, add indexes to entities)
- **Laravel** → `laravel-readability` (optimize Eloquent queries with `with()`, add indexes to migrations)
- **FastAPI** → `fastapi-readability` (use selectinload/joinedload in SQLAlchemy queries)
- **Golang** → `golang-readability` (rewrite queries in sqlc/pgx, add composite indexes)

### Common Optimizations to Apply
1. **N+1 fixes** → Update ORM queries to eager load relationships
2. **Index additions** → Add migration files for new indexes
3. **Query rewrites** → Simplify complex queries, remove unnecessary JOINs
4. **Pagination** → Replace OFFSET with cursor-based pagination
5. **Caching** → Add Redis/in-memory cache for hot data

**Remember**: Query optimization insights must be implemented in application code. Use backend skills for framework-specific syntax.
