---
name: database-designer
description: |
  Design database schema dengan best practices: normalization, indexing, relationships, constraints.
  Supports PostgreSQL, MySQL, MongoDB. Provides Prisma/Drizzle schema, migrations, and optimization tips.
  
  Trigger phrases:
  - "design database"
  - "create schema"
  - "database model"
  - "prisma schema"
  - "optimize database"
  - "add index"
  - "normalize schema"
  
  Covers:
  - Schema design (entities, relationships, constraints)
  - Normalization (1NF, 2NF, 3NF, BCNF)
  - Indexing strategies
  - Query optimization
  - Migration patterns
  - Data types selection

default_provider: deepseek
complexity: medium
---

# Database Designer

Goal: Design scalable, maintainable database schemas dengan best practices untuk relational dan NoSQL databases.

## Prinsip Utama

**SPEC-FIRST APPROACH!**

Gather requirements FIRST:
1. **Data entities**: What data are we storing?
2. **Relationships**: How are entities connected?
3. **Access patterns**: How will data be queried?
4. **Scale**: MVP (simple), startup (indexes), enterprise (partitioning)?
5. **Database type**: PostgreSQL, MySQL, MongoDB?

**Then design**:
1. Entity-Relationship Diagram (ERD)
2. Schema definition (Prisma/Drizzle/SQL)
3. Indexes and constraints
4. Migration strategy
5. Optimization recommendations

## Phase 1: Requirements Gathering

### Questions to Ask

**ALWAYS ask if not clear:**

```
Before designing the schema, let me understand:

1. **What entities/data types?**
   - Users? Posts? Products? Orders?
   - List all main data types

2. **Relationships:**
   - One-to-many? Many-to-many?
   - Example: User has many Posts, Post belongs to User

3. **Key queries/access patterns:**
   - "Get all posts by user"
   - "Find orders by date range"
   - What are the most common queries?

4. **Scale:**
   - MVP (thousands of records)?
   - Startup (millions)?
   - Enterprise (billions, sharding needed)?

5. **Database preference:**
   - PostgreSQL (default for relational)
   - MySQL (if existing infra)
   - MongoDB (if document-based)
```

### Why This Matters

❌ **Bad (no context):**
```
User: "design user table"
AI: *Creates basic user table with 20 fields*
```
(Maybe user only needs email + name for auth)

✅ **Good (context-driven):**
```
User: "design user table"
AI: "What fields do you need? Auth only (email, password)? Or profile data too (bio, avatar)?"

User: "auth + basic profile"
AI: *Creates minimal schema with only needed fields*
```

## Phase 2: Schema Design

### Relational (PostgreSQL/MySQL)

#### Entity Design

**Minimal (MVP):**
```prisma
// User entity - auth focused
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String   // hashed
  name      String?
  createdAt DateTime @default(now())
}
```

**Scalable (Startup):**
```prisma
// User entity - with profile + audit
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String    // hashed
  name          String?
  image         String?
  bio           String?   @db.Text
  
  // Timestamps
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  posts    Post[]
  sessions Session[]
  
  @@index([email])
  @@index([createdAt])
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
  @@index([token])
  @@index([expiresAt])
}
```

**Enterprise (Complex):**
```prisma
// User entity - multi-tenant, soft delete, audit
model User {
  id            String    @id @default(cuid())
  tenantId      String    // multi-tenant
  email         String
  emailVerified DateTime?
  password      String    // hashed
  
  // Profile
  name      String?
  image     String?
  bio       String?   @db.Text
  metadata  Json?     // flexible data
  
  // Status
  status    UserStatus @default(ACTIVE)
  deletedAt DateTime?  // soft delete
  
  // Audit
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  
  // Relations
  tenant       Tenant       @relation(fields: [tenantId], references: [id])
  posts        Post[]
  sessions     Session[]
  auditLogs    AuditLog[]
  
  @@unique([tenantId, email]) // unique per tenant
  @@index([tenantId, status])
  @@index([email])
  @@index([deletedAt])
  @@index([createdAt])
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DELETED
}
```

#### Relationships

**One-to-Many:**
```prisma
model User {
  id    String @id
  posts Post[]
}

model Post {
  id       String @id
  userId   String
  title    String
  content  String @db.Text
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId])
}
```

**Many-to-Many:**
```prisma
model Post {
  id   String @id
  tags PostTag[]
}

model Tag {
  id    String    @id
  name  String    @unique
  posts PostTag[]
}

// Join table (explicit)
model PostTag {
  postId String
  tagId  String
  
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@index([tagId])
}
```

**Self-Referencing:**
```prisma
model User {
  id        String @id
  
  // Following relationship
  following Follow[] @relation("follower")
  followers Follow[] @relation("following")
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  follower  User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@id([followerId, followingId])
  @@index([followingId])
  @@index([createdAt])
}
```

#### Indexes Strategy

**Single-column indexes:**
```prisma
model Post {
  id        String   @id
  userId    String
  status    String
  createdAt DateTime
  
  @@index([userId])       // Filter by user
  @@index([status])       // Filter by status
  @@index([createdAt])    // Sort by date
}
```

**Composite indexes (order matters!):**
```prisma
model Post {
  id        String   @id
  userId    String
  status    String
  createdAt DateTime
  
  // Good: supports queries filtering userId, or userId + status
  @@index([userId, status, createdAt(sort: Desc)])
  
  // Query patterns supported:
  // ✅ WHERE userId = ?
  // ✅ WHERE userId = ? AND status = ?
  // ✅ WHERE userId = ? AND status = ? ORDER BY createdAt DESC
  // ❌ WHERE status = ? (won't use this index efficiently)
}
```

**Unique constraints:**
```prisma
model User {
  email    String @unique              // Single unique
  username String
  tenantId String
  
  @@unique([tenantId, username])      // Composite unique
}
```

**Full-text search:**
```prisma
model Post {
  id      String @id
  title   String
  content String @db.Text
  
  @@fulltext([title, content])  // PostgreSQL or MySQL 5.7+
}
```

### NoSQL (MongoDB)

**Document design:**
```typescript
// User document - embedded profile
interface User {
  _id: ObjectId;
  email: string;
  password: string;
  
  // Embedded profile (frequently accessed together)
  profile: {
    name: string;
    image?: string;
    bio?: string;
  };
  
  // Embedded arrays (limited size)
  recentPosts: Array<{
    id: string;
    title: string;
    createdAt: Date;
  }>; // Max 10-20 items
  
  createdAt: Date;
  updatedAt: Date;
}

// Indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "profile.name": 1 })
db.users.createIndex({ createdAt: -1 })
```

**Reference vs Embed:**

**Embed (denormalized):**
- ✅ Data accessed together
- ✅ Limited size (< 16MB document)
- ✅ Rare updates
- ❌ Large arrays (use references)

```typescript
// Good: Embed comments (limited, accessed with post)
interface Post {
  _id: ObjectId;
  title: string;
  comments: Array<{
    userId: string;
    text: string;
    createdAt: Date;
  }>; // Max 100 comments, then move to separate collection
}
```

**Reference (normalized):**
- ✅ Large datasets
- ✅ Frequent updates
- ✅ Shared across documents

```typescript
// Good: Reference posts (many, grow over time)
interface User {
  _id: ObjectId;
  email: string;
  // NO posts array here
}

interface Post {
  _id: ObjectId;
  userId: ObjectId; // Reference
  title: string;
}
```

## Phase 3: Normalization

### Normal Forms

**1NF (First Normal Form):**
- ✅ Atomic values (no arrays in cells)
- ✅ Each column single value

❌ **Bad:**
```sql
CREATE TABLE users (
  id INT,
  name VARCHAR(100),
  emails VARCHAR(255) -- 'email1@x.com,email2@x.com'
);
```

✅ **Good:**
```prisma
model User {
  id     Int    @id
  name   String
  emails Email[]
}

model Email {
  id     Int    @id
  userId Int
  email  String @unique
  
  user User @relation(fields: [userId], references: [id])
}
```

**2NF (Second Normal Form):**
- ✅ 1NF + no partial dependencies

❌ **Bad:**
```prisma
model OrderItem {
  orderId     Int
  productId   Int
  productName String  // Depends only on productId, not (orderId, productId)
  quantity    Int
  
  @@id([orderId, productId])
}
```

✅ **Good:**
```prisma
model OrderItem {
  orderId   Int
  productId Int
  quantity  Int
  
  product Product @relation(fields: [productId], references: [id])
  
  @@id([orderId, productId])
}

model Product {
  id   Int    @id
  name String
}
```

**3NF (Third Normal Form):**
- ✅ 2NF + no transitive dependencies

❌ **Bad:**
```prisma
model User {
  id          Int    @id
  cityId      Int
  cityName    String // Depends on cityId, not directly on user
  countryName String // Depends on cityId -> countryId
}
```

✅ **Good:**
```prisma
model User {
  id     Int  @id
  cityId Int
  city   City @relation(fields: [cityId], references: [id])
}

model City {
  id        Int    @id
  name      String
  countryId Int
  country   Country @relation(fields: [countryId], references: [id])
}

model Country {
  id   Int    @id
  name String
}
```

### When to Denormalize

**Acceptable denormalization (performance):**

```prisma
model Post {
  id            String @id
  userId        String
  title         String
  
  // Denormalized for performance
  userName      String  // Cache user name (updated on user name change)
  commentCount  Int     @default(0) // Updated via trigger/app logic
  
  user User @relation(fields: [userId], references: [id])
}
```

**Why?**
- Avoid JOIN on every query
- Trade: write complexity for read speed
- Use when: reads >> writes

## Phase 4: Data Types

### Choose Wisely

**Strings:**
```prisma
model Post {
  title   String           // VARCHAR(191) default
  slug    String  @db.VarChar(100) // Explicit length
  content String  @db.Text         // Long text
  json    Json                     // JSON data
}
```

**Numbers:**
```prisma
model Product {
  id       Int     @id @default(autoincrement())
  price    Decimal @db.Decimal(10, 2) // Money (10 digits, 2 decimal)
  stock    Int     @db.SmallInt        // Small numbers
  views    BigInt  @default(0)        // Large counters
}
```

**Dates:**
```prisma
model Event {
  id        Int      @id
  date      DateTime @db.Date      // Date only (no time)
  timestamp DateTime @default(now()) // Full timestamp
  time      DateTime @db.Time      // Time only
}
```

**Booleans:**
```prisma
model User {
  id            Int     @id
  isActive      Boolean @default(true)
  emailVerified Boolean @default(false)
}
```

**Enums (type-safe):**
```prisma
model Order {
  id     Int         @id
  status OrderStatus @default(PENDING)
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

## Phase 5: Migrations

### Strategy

**1. Additive (safe):**
```prisma
// Add new column (nullable or default)
model User {
  id    Int     @id
  email String
  phone String? // New optional field
}
```

**2. Destructive (careful):**
```prisma
// Remove column (data loss!)
model User {
  id    Int    @id
  email String
  // Removed: phone String
}
```

**3. Rename (two-step):**
```prisma
// Step 1: Add new column, copy data
model User {
  id        Int    @id
  email     String
  firstName String // New
  // Keep: name String (deprecated)
}

// Step 2 (later): Remove old column
model User {
  id        Int    @id
  email     String
  firstName String
  // Removed: name
}
```

**4. Change type (risky):**
```typescript
// Manual migration needed
await prisma.$executeRaw`
  ALTER TABLE users 
  ALTER COLUMN age TYPE INTEGER 
  USING age::integer;
`
```

## Real-World Examples

### Example 1: Blog Schema

**Requirements:**
- Users, Posts, Comments, Tags
- Users can follow other users
- Posts have tags (many-to-many)
- MVP scale

**Schema:**
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  image     String?
  createdAt DateTime @default(now())
  
  posts     Post[]
  comments  Comment[]
  following Follow[] @relation("follower")
  followers Follow[] @relation("following")
  
  @@index([email])
}

model Post {
  id        String   @id @default(cuid())
  userId    String
  title     String
  slug      String   @unique
  content   String   @db.Text
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments Comment[]
  tags     PostTag[]
  
  @@index([userId])
  @@index([slug])
  @@index([published, createdAt])
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  userId    String
  content   String   @db.Text
  createdAt DateTime @default(now())
  
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([postId])
  @@index([userId])
}

model Tag {
  id    String    @id @default(cuid())
  name  String    @unique
  slug  String    @unique
  posts PostTag[]
  
  @@index([slug])
}

model PostTag {
  postId String
  tagId  String
  
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag  Tag  @relation(fields: [tagId], references: [id], onDelete: Cascade)
  
  @@id([postId, tagId])
  @@index([tagId])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())
  
  follower  User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade)
  
  @@id([followerId, followingId])
  @@index([followingId])
}
```

**Indexes rationale:**
- `User.email`: Login queries
- `Post.slug`: URL lookups
- `Post.[published, createdAt]`: List published posts by date
- `Comment.postId`: Get comments for post
- `Follow.followingId`: Get followers of user

### Example 2: E-commerce Schema

**Requirements:**
- Products, Categories, Orders, Payments
- Inventory tracking
- Order history
- Startup scale

**Schema:**
```prisma
model Product {
  id          String   @id @default(cuid())
  sku         String   @unique
  name        String
  description String?  @db.Text
  price       Decimal  @db.Decimal(10, 2)
  stock       Int      @default(0)
  categoryId  String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  category   Category     @relation(fields: [categoryId], references: [id])
  orderItems OrderItem[]
  
  @@index([categoryId, isActive])
  @@index([sku])
}

model Category {
  id       String    @id @default(cuid())
  name     String    @unique
  slug     String    @unique
  products Product[]
  
  @@index([slug])
}

model Order {
  id         String      @id @default(cuid())
  userId     String
  status     OrderStatus @default(PENDING)
  total      Decimal     @db.Decimal(10, 2)
  createdAt  DateTime    @default(now())
  updatedAt  DateTime    @updatedAt
  
  user     User        @relation(fields: [userId], references: [id])
  items    OrderItem[]
  payments Payment[]
  
  @@index([userId, createdAt])
  @@index([status])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  productId String
  quantity  Int
  price     Decimal @db.Decimal(10, 2) // Price at time of order
  
  order   Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])
  
  @@index([orderId])
  @@index([productId])
}

model Payment {
  id         String        @id @default(cuid())
  orderId    String
  amount     Decimal       @db.Decimal(10, 2)
  status     PaymentStatus @default(PENDING)
  provider   String        // stripe, paypal, etc
  externalId String?       @unique // Provider's payment ID
  createdAt  DateTime      @default(now())
  
  order Order @relation(fields: [orderId], references: [id])
  
  @@index([orderId])
  @@index([externalId])
}

enum OrderStatus {
  PENDING
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
  REFUNDED
}
```

## Optimization Tips

### Query Patterns

**1. Use indexes for common queries:**
```prisma
// Query: Get user's published posts ordered by date
model Post {
  userId    String
  published Boolean
  createdAt DateTime
  
  @@index([userId, published, createdAt(sort: Desc)])
}
```

**2. Limit JOIN depth:**
```typescript
// ❌ Bad: Deep nesting
const posts = await prisma.post.findMany({
  include: {
    user: {
      include: {
        profile: {
          include: {
            settings: true // Too deep!
          }
        }
      }
    }
  }
})

// ✅ Good: Shallow includes
const posts = await prisma.post.findMany({
  include: {
    user: {
      select: { id: true, name: true, image: true }
    }
  }
})
```

**3. Use pagination:**
```typescript
// Cursor-based (better for large datasets)
const posts = await prisma.post.findMany({
  take: 20,
  skip: 1,
  cursor: { id: lastPostId },
  orderBy: { createdAt: 'desc' }
})
```

**4. Batch queries:**
```typescript
// ❌ Bad: N+1 problem
for (const post of posts) {
  const user = await prisma.user.findUnique({ where: { id: post.userId } })
}

// ✅ Good: Single query with include
const posts = await prisma.post.findMany({
  include: { user: true }
})
```

## Key Rules

### DO:
- ✅ Ask about access patterns first
- ✅ Match schema to scale (MVP vs enterprise)
- ✅ Use proper data types (Decimal for money!)
- ✅ Add indexes for common queries
- ✅ Use enums for fixed values
- ✅ Cascade deletes where appropriate
- ✅ Document reasoning for denormalization

### DON'T:
- ❌ Over-normalize for simple projects
- ❌ Add indexes on every column
- ❌ Use VARCHAR(255) for everything
- ❌ Store JSON when relational works
- ❌ Skip foreign keys
- ❌ Forget timestamps (createdAt, updatedAt)

## Summary

Database designer follows **requirements-driven approach**:

1. **Gather requirements** (entities, relationships, access patterns, scale)
2. **Design schema** (normalized, proper data types, constraints)
3. **Add indexes** (based on query patterns)
4. **Plan migrations** (safe, reversible)
5. **Optimize** (denormalize strategically)

**Result**: Scalable, maintainable database schema that fits the project's needs.

---

## After Schema Design — Use Backend Skills

Once schema is designed and migrations are ready, use framework-specific skills to implement application code:

### Backend Frameworks
- **Express.js** → `expressjs-readability` (middleware, routes, services)
- **NestJS** → `nestjs-readability` (modules, controllers, repositories)
- **Laravel** → `laravel-readability` (Eloquent models, controllers, services)
- **FastAPI** → `fastapi-readability` (routers, Pydantic schemas, dependencies)
- **Golang** → `golang-readability` (handlers, services with sqlc/pgx)

### Next Steps After Design
1. ✅ Run migrations (framework-specific commands)
2. ✅ Implement application layer (use backend skill)
3. ✅ Write tests (factories, seeds, integration tests)
4. ✅ Monitor query performance (use `database-optimizer` if slow)

**Remember**: Backend skills handle application code. Database skills handle data layer.
