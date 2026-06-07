---
name: token-efficient-coding
description: >
  Write code yang token-efficient tanpa sacrificing readability.
  Reduce verbosity, eliminate fluff, keep kode dense tapi tetap clear.
  Critical untuk AI agents constrained by token budgets.
  Trigger: "optimize tokens", "reduce verbosity", "make it concise",
  "token efficient", "compact code", "minimize tokens".
---

# Token-Efficient Coding

Goal: Save 40-60% tokens tanpa jadi unreadable.

---

## Core Patterns

### Implicit Returns & Early Returns
```ts
const getStatus = (user: User) => user.isActive ? 'active' : 'inactive'

function getStatus(user: User): string {
  if (user.isActive) return 'active'
  return 'inactive'
}
```

### Array Methods
```ts
const activeUsers = users.filter(u => u.isActive)           // instead of for loop
const subtotal = items.reduce((s, i) => s + i.price * i.q, 0) // instead of forEach
```

### Optional Chaining & Nullish Coalescing
```ts
const street = user?.address?.street                         // instead of manual null checks
const name = user.name ?? 'Guest'                            // instead of ternary
```

### Object Shorthand & Template Literals
```ts
const user = { name, email, age }                            // instead of name: name
const msg = `Hello ${user.name}!`                            // instead of concatenation
```

### Grouped Imports
```ts
import { useState, useEffect, useCallback, useMemo } from 'react'  // instead of one per line
```

### Compact Types with Utility Types
```ts
type UserCreateInput = Pick<User, 'email' | 'firstName'>
type UserUpdateInput = Partial<UserCreateInput>
```

---

## Anti-Patterns to Avoid

### Over-commenting
```ts
// ❌ 200 tokens
/** JSDoc for trivial function + comments for every line */
// ✅ 40 tokens
function calculateTotal(items: CartItem[], taxRate: number): number {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  return subtotal * (1 + taxRate)
}
```

### Extracting Everything
```ts
// ❌ 5 micro-functions for 1 use case (150 tokens)
const result = getFirstOrDefault(users, null)
// ✅ inline (20 tokens)
const result = users[0] ?? null
```

### Redundant Type Annotations
```ts
// ❌ TS can infer these
const count: number = 10
// ✅ Let TS infer
const count = 10
```

### Unnecessarily Defensive
```ts
// ❌ Over-defensive for impossible cases
// ✅ Let types + optional chaining handle it
function getUser(id?: string): User | null {
  return id ? findUserById(id) ?? null : null
}
```

---

## When Clarity > Tokens

Choose clarity for: complex business logic, non-obvious algorithms, critical security code, public APIs.

```ts
// Token-efficient but unclear
const x = (a, b) => a.reduce((s, v) => s + v.p * v.q, 0) * (1 + b)

// More tokens but clear
function calculateOrderTotal(items: CartItem[], taxRate: number): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + taxRate)
}
```

---

## Integration with project-readability

**When conflict, clarity wins.** project-readability's naming rules (specific over generic) take priority over token savings.

```ts
// project-readability wants: fetchUserOrderHistoryWithShippingDetails(userId)
// token-efficient wants: fetchUserOrders(userId)
// ✅ Choose readability: fetchUserOrderHistoryWithShippingDetails(userId)
```

---

## Target Savings

| Code Type | Verbose | Efficient | Savings |
|-----------|---------|-----------|---------|
| Simple function | 80 tokens | 30 tokens | 62% |
| React component | 200 tokens | 80 tokens | 60% |
| API endpoint | 150 tokens | 60 tokens | 60% |
| Type definitions | 100 tokens | 40 tokens | 60% |

---

## Summary

Eliminate: fluff comments, redundant code, unnecessary abstractions, verbose patterns.
Balance efficiency with readability. When in doubt, choose clarity.
