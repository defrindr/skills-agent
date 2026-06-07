---
name: database-designer
description: |
  Design database schema dengan best practices: normalization, indexing, relationships, constraints.
  Supports PostgreSQL, MySQL, MongoDB. Provides Prisma/Drizzle schema, migrations, optimization tips.
  Trigger: "design database", "create schema", "database model", "prisma schema",
  "optimize database", "add index", "normalize schema".
  Covers: Schema design, Normalization (1NF-3NF), Indexing strategies, Migration patterns, Data types.
---

# Database Designer

Spec-first approach: gather requirements before designing.

## Requirements Gathering

Ask: entities, relationships, access patterns, scale (MVP/startup/enterprise), database type.

---

## Schema Design — Relational (PostgreSQL/MySQL)

### MVP
```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
}
```

### Startup
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  emailVerified DateTime?
  password      String
  name          String?
  bio           String?   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
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

### Enterprise
```prisma
model User {
  id            String    @id @default(cuid())
  tenantId      String
  email         String
  emailVerified DateTime?
  password      String
  name          String?
  metadata      Json?
  status        UserStatus @default(ACTIVE)
  deletedAt     DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  tenant Tenant @relation(fields: [tenantId], references: [id])
  posts  Post[]
  sessions Session[]
  auditLogs AuditLog[]
  @@unique([tenantId, email])
  @@index([tenantId, status])
  @@index([email])
  @@index([deletedAt])
  @@index([createdAt])
}
```

### Relationships

**One-to-Many:**
```prisma
model User { id String @id; posts Post[] }
model Post { id String @id; userId String; user User @relation(fields: [userId], references: [id], onDelete: Cascade); @@index([userId]) }
```

**Many-to-Many:**
```prisma
model Post { id String @id; tags PostTag[] }
model Tag { id String @id; name String @unique; posts PostTag[] }
model PostTag { postId String; tagId String; post Post @relation(fields: [postId], references: [id], onDelete: Cascade); tag Tag @relation(fields: [tagId], references: [id], onDelete: Cascade); @@id([postId, tagId]); @@index([tagId]) }
```

**Self-Referencing (follow):**
```prisma
model Follow { followerId String; followingId String; createdAt DateTime @default(now()); follower User @relation("follower", fields: [followerId], references: [id], onDelete: Cascade); following User @relation("following", fields: [followingId], references: [id], onDelete: Cascade); @@id([followerId, followingId]); @@index([followingId]) }
```

### Indexes

- Single: `@@index([userId])`, `@@index([status])`, `@@index([createdAt])`
- Composite (order matters — put most selective first): `@@index([userId, status, createdAt(sort: Desc)])`
  - Supports `WHERE userId=?`, `WHERE userId=? AND status=?`, `+ORDER BY createdAt DESC`
  - Does NOT support `WHERE status=?`
- Unique: `@@unique([tenantId, username])`
- Full-text: `@@fulltext([title, content])`

---

## NoSQL (MongoDB)

```ts
interface User {
  _id: ObjectId; email: string; password: string;
  profile: { name: string; image?: string; bio?: string };
  createdAt: Date; updatedAt: Date;
}
db.users.createIndex({ email: 1 }, { unique: true })
```

**Embed** when: data accessed together, limited size, rare updates. **Reference** when: large datasets, frequent updates, shared across docs.

---

## Normalization

| Form | Rule |
|------|------|
| 1NF | Atomic values (no arrays in cells) |
| 2NF | 1NF + no partial dependencies |
| 3NF | 2NF + no transitive dependencies |

**Denormalize only when:** reads >> writes, JOINs are too expensive. Document tradeoff in code.

---

## Data Types

- Strings: `String` / `@db.VarChar(100)` / `@db.Text` / `Json`
- Numbers: `Int autoincrement()` / `Decimal @db.Decimal(10,2)` for money / `BigInt` for counters
- Dates: `DateTime @db.Date` / `DateTime @default(now())` / `DateTime @db.Time`
- Booleans: `Boolean @default(true)`
- Enums: `enum OrderStatus { PENDING PROCESSING SHIPPED DELIVERED CANCELLED }`

---

## Migrations

1. **Additive (safe):** add nullable or default column
2. **Destructive (careful):** remove column — data loss
3. **Rename (two-step):** add new column, copy data, remove old
4. **Change type (risky):** manual SQL with USING clause

---

## Key Rules

- Ask about access patterns first
- Match schema to scale — MVP ≠ enterprise
- Add indexes for common queries (but not every column)
- Use enums for fixed values
- Cascade deletes where appropriate
- Document reasoning for denormalization
- Foreign keys wajib. Timestamps wajib.

## Referensi

- Query optimization → `database-optimizer`
- Framework implementation → `*-readability` masing-masing
- Code audit → `code-health`
