---
name: token-efficient-coding
description: >
  Skill untuk write code yang token-efficient tanpa sacrificing readability.
  Reduce verbosity, eliminate fluff, keep kode dense tapi tetap clear. Critical untuk
  AI agents yang constrained by token budgets. Pakai setiap kali generate code,
  especially untuk large features atau batch operations.
  Trigger: "optimize tokens", "reduce verbosity", "make it concise", "token efficient",
  "compact code", "minimize tokens", atau automatically loaded di semua code generation tasks.

# Provider Configuration  
default_provider: free
complexity: simple
token_estimate: 2000-5000

providers:
  - name: deepseek
    tier: free
    reason: "Fast, good at code patterns"
  - name: groq-llama3
    tier: free
    reason: "Very fast inference"

fallback: true
max_retries: 1
---

# Token-Efficient Coding

Skill untuk **write clean, readable code dengan minimal token waste**.

Goal: Save 40-60% tokens tanpa jadi unreadable.

---

## Core Principles

### 1. Dense tapi Readable
```ts
// ❌ Verbose (150 tokens)
// This function takes a user object and returns the full name
// by concatenating the first name and last name with a space
// If either field is missing, it returns just the available one
function getUserFullName(user: User): string {
  if (user.firstName && user.lastName) {
    return user.firstName + ' ' + user.lastName
  } else if (user.firstName) {
    return user.firstName
  } else if (user.lastName) {
    return user.lastName
  } else {
    return 'Unknown'
  }
}

// ✅ Token-efficient (35 tokens)
function getUserFullName(user: User): string {
  return [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ') || 'Unknown'
}
```

### 2. Eliminate Redundant Comments
```ts
// ❌ Obvious comments (60 tokens)
// Increment the counter by 1
counter++

// Set the user's email
user.email = email

// Return true if valid
return isValid

// ✅ No comment (self-explanatory naming)
counter++
user.email = email
return isValid
```

**Only comment when:**
- Complex business logic yang tidak obvious
- Workaround untuk bug di third-party library
- Performance optimization yang looks weird

```ts
// ✅ Justified comment
// WORKAROUND: Stripe webhook signature verification fails with raw body
// See: https://github.com/stripe/stripe-node/issues/123
const rawBody = await buffer(req)
```

### 3. Compact Type Definitions
```ts
// ❌ Verbose (100 tokens)
interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
  updatedAt: Date
}

interface UserCreateInput {
  email: string
  firstName: string | null
  lastName: string | null
}

interface UserUpdateInput {
  email?: string
  firstName?: string | null
  lastName?: string | null
}

// ✅ Compact (45 tokens)
interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
  updatedAt: Date
}

type UserCreateInput = Pick<User, 'email' | 'firstName' | 'lastName'>
type UserUpdateInput = Partial<UserCreateInput>
```

### 4. Inline Simple Helpers
```ts
// ❌ Extract every tiny thing (80 tokens)
const isValidEmail = (email: string) => /\S+@\S+\.\S+/.test(email)
const isValidPhone = (phone: string) => /^\+?[\d\s-]+$/.test(phone)

function validateContact(email: string, phone: string) {
  return isValidEmail(email) && isValidPhone(phone)
}

// ✅ Inline simple logic (30 tokens)
function validateContact(email: string, phone: string) {
  return /\S+@\S+\.\S+/.test(email) && /^\+?[\d\s-]+$/.test(phone)
}

// Extract ONLY if used 3+ times
```

---

## Token-Saving Patterns

### Imports
```ts
// ❌ One per line (80 tokens)
import { useState } from 'react'
import { useEffect } from 'react'
import { useCallback } from 'react'
import { useMemo } from 'react'

// ✅ Grouped (20 tokens)
import { useState, useEffect, useCallback, useMemo } from 'react'
```

### Function Declarations
```ts
// ❌ Verbose arrow functions with explicit returns (60 tokens)
const add = (a: number, b: number): number => {
  return a + b
}

const multiply = (a: number, b: number): number => {
  return a * b
}

// ✅ Implicit returns (25 tokens)
const add = (a: number, b: number) => a + b
const multiply = (a: number, b: number) => a * b
```

### Conditional Returns
```ts
// ❌ Unnecessary else (40 tokens)
function getStatus(user: User): string {
  if (user.isActive) {
    return 'active'
  } else {
    return 'inactive'
  }
}

// ✅ Early return (20 tokens)
function getStatus(user: User): string {
  if (user.isActive) return 'active'
  return 'inactive'
}

// ✅✅ Ternary kalau simple (15 tokens)
const getStatus = (user: User) => user.isActive ? 'active' : 'inactive'
```

### Object Shorthand
```ts
// ❌ Redundant (30 tokens)
const user = {
  name: name,
  email: email,
  age: age,
}

// ✅ Shorthand (15 tokens)
const user = { name, email, age }
```

### Template Literals
```ts
// ❌ Concatenation (30 tokens)
const message = 'Hello, ' + user.name + '! You have ' + count + ' new messages.'

// ✅ Template literal (20 tokens)
const message = `Hello, ${user.name}! You have ${count} new messages.`
```

### Array Methods
```ts
// ❌ Verbose loops (80 tokens)
const activeUsers = []
for (let i = 0; i < users.length; i++) {
  if (users[i].isActive) {
    activeUsers.push(users[i])
  }
}

// ✅ Filter (20 tokens)
const activeUsers = users.filter(u => u.isActive)
```

### Optional Chaining
```ts
// ❌ Manual null checks (50 tokens)
let street
if (user && user.address && user.address.street) {
  street = user.address.street
}

// ✅ Optional chaining (15 tokens)
const street = user?.address?.street
```

### Nullish Coalescing
```ts
// ❌ Ternary for null check (30 tokens)
const name = user.name !== null && user.name !== undefined 
  ? user.name 
  : 'Guest'

// ✅ Nullish coalescing (10 tokens)
const name = user.name ?? 'Guest'
```

---

## Anti-Patterns (Things to AVOID)

### ❌ Over-commenting
```ts
// Bad: 200 tokens
/**
 * Calculates the total price of items in a cart
 * @param {CartItem[]} items - Array of cart items
 * @param {number} taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns {number} The total price including tax
 * @example
 * const total = calculateTotal(items, 0.1)
 */
function calculateTotal(items: CartItem[], taxRate: number): number {
  // Initialize subtotal to zero
  let subtotal = 0
  
  // Loop through each item
  for (const item of items) {
    // Add the item's price to subtotal
    subtotal += item.price * item.quantity
  }
  
  // Calculate tax amount
  const tax = subtotal * taxRate
  
  // Return total with tax
  return subtotal + tax
}

// Good: 40 tokens
function calculateTotal(items: CartItem[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return subtotal * (1 + taxRate)
}
```

### ❌ Extracting Everything
```ts
// Bad: Creates 5 micro-functions for 1 use case (150 tokens)
const isEmpty = (arr: any[]) => arr.length === 0
const first = (arr: any[]) => arr[0]
const hasItems = (arr: any[]) => !isEmpty(arr)
const getFirstOrDefault = (arr: any[], defaultValue: any) => 
  hasItems(arr) ? first(arr) : defaultValue

const result = getFirstOrDefault(users, null)

// Good: Inline (20 tokens)
const result = users[0] ?? null
```

### ❌ Redundant Type Annotations
```ts
// Bad: TS can infer these (60 tokens)
const count: number = 10
const name: string = 'John'
const isActive: boolean = true
const items: string[] = ['a', 'b', 'c']

// Good: Let TS infer (20 tokens)
const count = 10
const name = 'John'
const isActive = true
const items = ['a', 'b', 'c']
```

### ❌ Unnecessarily Defensive Code
```ts
// Bad: Over-defensive (100 tokens)
function getUser(id: string | undefined | null): User | null {
  if (id === null || id === undefined || id === '') {
    return null
  }
  
  const user = findUserById(id)
  
  if (user === null || user === undefined) {
    return null
  }
  
  return user
}

// Good: Let types + optional chaining handle it (20 tokens)
function getUser(id?: string): User | null {
  return id ? findUserById(id) ?? null : null
}
```

---

## Framework-Specific Patterns

### React/Next.js

**Component structure:**
```tsx
// ❌ Verbose (150 tokens)
interface UserCardProps {
  user: User
  onDelete: (id: string) => void
}

export function UserCard(props: UserCardProps) {
  const user = props.user
  const onDelete = props.onDelete
  
  const handleDelete = () => {
    onDelete(user.id)
  }
  
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={handleDelete}>Delete</button>
    </div>
  )
}

// ✅ Compact (60 tokens)
interface Props {
  user: User
  onDelete: (id: string) => void
}

export function UserCard({ user, onDelete }: Props) {
  return (
    <div>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => onDelete(user.id)}>Delete</button>
    </div>
  )
}
```

**Hooks:**
```tsx
// ❌ Verbose state declarations (80 tokens)
const [name, setName] = useState<string>('')
const [email, setEmail] = useState<string>('')
const [age, setAge] = useState<number>(0)

// ✅ Single state object (30 tokens)
const [form, setForm] = useState({ name: '', email: '', age: 0 })
```

### NestJS

**DTOs:**
```ts
// ❌ Verbose (120 tokens)
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  email: string
  
  @IsString()
  @IsNotEmpty()
  password: string
  
  @IsString()
  @IsOptional()
  firstName?: string
  
  @IsString()
  @IsOptional()
  lastName?: string
}

// ✅ Compact with decorators pada satu line kalau simple (60 tokens)
export class CreateUserDto {
  @IsString() @IsNotEmpty() email: string
  @IsString() @IsNotEmpty() password: string
  @IsString() @IsOptional() firstName?: string
  @IsString() @IsOptional() lastName?: string
}
```

---

## Output Guidelines

### DO:
✅ Use implicit returns
✅ Use optional chaining (`?.`)
✅ Use nullish coalescing (`??`)
✅ Use array methods (map, filter, reduce)
✅ Use object/array destructuring
✅ Use template literals
✅ Group imports
✅ Inline simple logic
✅ Let TypeScript infer types
✅ Use early returns

### DON'T:
❌ Add obvious comments
❌ Over-extract helpers
❌ Add redundant type annotations
❌ Use verbose variable names without reason
❌ Create unnecessary abstractions
❌ Write defensive code for impossible cases
❌ Add JSDoc unless public API
❌ Separate related code too much

---

## Measuring Token Efficiency

**Rough guidelines:**

| Code Type | Verbose (❌) | Token-Efficient (✅) | Savings |
|-----------|-------------|---------------------|---------|
| Simple function | 80 tokens | 30 tokens | 62% |
| React component | 200 tokens | 80 tokens | 60% |
| API endpoint | 150 tokens | 60 tokens | 60% |
| Type definitions | 100 tokens | 40 tokens | 60% |

**Target:** 40-60% token reduction tanpa sacrificing readability.

---

## Balance: Efficiency vs Clarity

**When to prioritize clarity over tokens:**
- Complex business logic
- Non-obvious algorithms
- Critical security code
- Public APIs

**Example:**
```ts
// Token-efficient but unclear (30 tokens)
const x = (a, b) => a.reduce((s, v) => s + v.p * v.q, 0) * (1 + b)

// More tokens but clear (50 tokens)
function calculateOrderTotal(items: CartItem[], taxRate: number): number {
  const subtotal = items.reduce((sum, item) => 
    sum + item.price * item.quantity, 0
  )
  return subtotal * (1 + taxRate)
}
```

**Choose clarity** - the extra 20 tokens worth it untuk readability.

---

## Integration dengan Skills Lain

**Always reference project-readability untuk:**
- Naming guidelines (specific over generic)
- When to extract vs inline
- Error message quality
- Structure decisions

**Balance:**
- **project-readability** → Quality, clarity, maintainability
- **token-efficient-coding** → Conciseness, reduce waste

**When conflict:** Clarity wins.

Example:
```ts
// project-readability wants:
function fetchUserOrderHistoryWithShippingDetails(userId: string) {}

// token-efficient-coding wants:
function fetchUserOrders(userId: string) {}

// ✅ Choose readability:
function fetchUserOrderHistoryWithShippingDetails(userId: string) {}
// Extra 15 tokens → worth it for clarity
```

---

## Real-World Example

**Feature: Update user profile**

### ❌ Verbose Version (500 tokens)
```ts
// This file contains the user profile update functionality
// It handles updating user information like name and email

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Props for the UserProfileForm component
 */
interface UserProfileFormProps {
  /**
   * The current user object
   */
  user: User
  /**
   * Callback function called when update is successful
   */
  onSuccess: () => void
}

/**
 * UserProfileForm component
 * Allows users to update their profile information
 */
export function UserProfileForm(props: UserProfileFormProps) {
  // Extract props
  const user = props.user
  const onSuccess = props.onSuccess
  
  // State for form fields
  const [name, setName] = useState<string>(user.name)
  const [email, setEmail] = useState<string>(user.email)
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  
  // Router hook
  const router = useRouter()
  
  // Handle form submission
  const handleSubmit = async (event: React.FormEvent) => {
    // Prevent default form submission
    event.preventDefault()
    
    // Set loading to true
    setIsLoading(true)
    // Clear any previous errors
    setError(null)
    
    try {
      // Call API to update user
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      })
      
      // Check if response is OK
      if (!response.ok) {
        throw new Error('Failed to update profile')
      }
      
      // Call success callback
      onSuccess()
      
      // Refresh the router
      router.refresh()
    } catch (err) {
      // Set error message
      setError('Failed to update profile. Please try again.')
    } finally {
      // Set loading to false
      setIsLoading(false)
    }
  }
  
  // Render form
  return (
    <form onSubmit={handleSubmit}>
      {/* Show error if exists */}
      {error && <div>{error}</div>}
      
      {/* Name input */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />
      
      {/* Email input */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      
      {/* Submit button */}
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

### ✅ Token-Efficient Version (180 tokens)
```ts
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  user: User
  onSuccess: () => void
}

export function UserProfileForm({ user, onSuccess }: Props) {
  const [form, setForm] = useState({ name: user.name, email: user.email })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      
      if (!res.ok) throw new Error('Update failed')
      
      onSuccess()
      router.refresh()
    } catch {
      setError('Failed to update profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      {error && <div>{error}</div>}
      
      <input
        type="text"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
        placeholder="Name"
      />
      
      <input
        type="email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
        placeholder="Email"
      />
      
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

**Savings: 320 tokens (64%) tanpa sacrificing functionality atau readability!**

---

## Summary

Token-efficient coding = **Say more with less**.

Not about making code unreadable - about eliminating waste:
- Fluff comments
- Redundant code
- Unnecessary abstractions
- Verbose patterns

Target: **40-60% token savings** while maintaining clarity.

Always balance efficiency with readability. When in doubt, choose clarity.
