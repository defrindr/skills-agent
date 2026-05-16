---
name: feature-architect
description: >
  Skill untuk design dan implement new features dengan architectural thinking.
  Plan feature structure, identify affected components, design API contracts,
  data models, state management, error handling, testing strategy, dan ensure
  implementation follows best practices. Pakai sebelum mulai coding feature baru.
  Trigger: "implement feature", "add functionality", "build", "create", "new feature",
  "develop", "feature design", "feature planning", "how to implement".

# Provider Configuration
default_provider: deepseek
complexity: medium
token_estimate: 5000-12000

providers:
  - name: deepseek
    tier: free
    reason: "Good at code generation, fast, cost-effective"
  - name: groq-mixtral
    tier: mid
    reason: "Fast inference untuk complex features"
  - name: claude-sonnet
    tier: premium
    reason: "Complex architectural decisions"

fallback: true
max_retries: 2
---

# Feature Architect

Skill untuk **implement features dengan thinking architectural** - bukan langsung coding, tapi plan dulu, design dulu, baru execute.

---

## Goal

1. **Understand requirements** - Apa yang user mau, edge cases, constraints
2. **Plan architecture** - Component mana yang affected, API contracts, data flow
3. **Design data models** - Schema, types, validation rules
4. **Implement cleanly** - Follow framework patterns, readable code, proper error handling
5. **Test strategy** - Unit tests, integration tests, edge cases
6. **Consider scalability** - Performance, future extensibility

---

## Implementation Workflow

### Phase 1: Requirements Analysis (2 menit)

**Extract dari user request:**
- **What** - Fitur apa yang mau di-build
- **Why** - Business goal / user need
- **Who** - User role / permissions involved
- **When** - Timing, scheduling, async jobs?
- **Where** - Frontend only, backend only, or both?

**Identify edge cases:**
- Error scenarios
- Empty states
- Permission boundaries
- Rate limits / quota
- Concurrent operations

**Example:**
```
User request: "Add dark mode toggle in settings"

Requirements:
- WHAT: Toggle untuk switch light/dark theme
- WHY: User preference, accessibility
- WHO: Any authenticated user
- WHERE: Frontend (UI + state management)

Edge cases:
- System preference sync?
- Per-device atau per-account?
- Default untuk new users?
- Animation transition?
```

---

### Phase 2: Architecture Planning (5 menit)

**Identify affected components:**
1. **New files to create**
2. **Existing files to modify**
3. **Dependencies to add**

**Design data flow:**
```
User action
  ↓
Event handler
  ↓
State update (local / global)
  ↓
Persist (localStorage / API)
  ↓
UI re-render
```

**API contracts (if backend involved):**
```ts
// Request
POST /api/users/preferences
{
  "theme": "dark" | "light" | "system"
}

// Response (success)
{
  "success": true,
  "data": {
    "theme": "dark",
    "updatedAt": "2026-05-16T10:00:00Z"
  }
}

// Response (error)
{
  "success": false,
  "error": {
    "code": "INVALID_THEME",
    "message": "Theme must be 'dark', 'light', or 'system'"
  }
}
```

**State management:**
- Local state (useState) untuk simple?
- Context untuk app-wide?
- External store (Zustand, Redux) kalau already used?
- Server state (React Query) kalau backend involved?

---

### Phase 3: Data Modeling (3 menit)

**Define types / schemas:**

```ts
// Type definition
type Theme = 'light' | 'dark' | 'system';

interface UserPreferences {
  theme: Theme;
  fontSize?: 'small' | 'medium' | 'large';
  reducedMotion?: boolean;
}

// Validation schema (Zod example)
const themeSchema = z.enum(['light', 'dark', 'system']);

const userPreferencesSchema = z.object({
  theme: themeSchema,
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
  reducedMotion: z.boolean().optional(),
});
```

**Database schema (if persisted):**
```prisma
model UserPreferences {
  id        String   @id @default(cuid())
  userId    String   @unique
  theme     String   @default("system")
  fontSize  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  user      User     @relation(fields: [userId], references: [id])
}
```

---

### Phase 4: Implementation (Main Work)

#### 4.1 Follow Framework Patterns

**Next.js App Router:**
```tsx
// app/settings/page.tsx (RSC - data fetching)
import { ThemeSettings } from '@/features/settings/components/theme-settings'
import { getCurrentUserPreferences } from '@/features/settings/actions'

export default async function SettingsPage() {
  const preferences = await getCurrentUserPreferences()
  
  return (
    <div>
      <h1>Settings</h1>
      <ThemeSettings initialTheme={preferences.theme} />
    </div>
  )
}

// features/settings/components/theme-settings.tsx (Client Component)
'use client'

import { useState, useTransition } from 'react'
import { updateTheme } from '../actions'

export function ThemeSettings({ initialTheme }: { initialTheme: Theme }) {
  const [theme, setTheme] = useState(initialTheme)
  const [isPending, startTransition] = useTransition()
  
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme)
    startTransition(async () => {
      const result = await updateTheme(newTheme)
      if (!result.success) {
        // Revert on error
        setTheme(theme)
        toast.error(result.error)
      }
    })
  }
  
  return (
    <div>
      <label>Theme</label>
      <select 
        value={theme} 
        onChange={(e) => handleThemeChange(e.target.value as Theme)}
        disabled={isPending}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  )
}

// features/settings/actions.ts (Server Actions)
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { themeSchema } from './schema'

export async function updateTheme(theme: Theme) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }
    
    const validated = themeSchema.parse(theme)
    
    await db.userPreferences.upsert({
      where: { userId: session.user.id },
      update: { theme: validated },
      create: { userId: session.user.id, theme: validated },
    })
    
    return { success: true, data: { theme: validated } }
  } catch (error) {
    return { 
      success: false, 
      error: 'Failed to update theme. Please try again.' 
    }
  }
}
```

**NestJS:**
```ts
// features/settings/settings.controller.ts
@Controller('settings')
@UseGuards(AuthGuard)
export class SettingsController {
  constructor(private settingsService: SettingsService) {}
  
  @Get('preferences')
  async getPreferences(@CurrentUser() user: User) {
    return this.settingsService.getPreferences(user.id)
  }
  
  @Patch('preferences')
  async updatePreferences(
    @CurrentUser() user: User,
    @Body() dto: UpdatePreferencesDto
  ) {
    return this.settingsService.updatePreferences(user.id, dto)
  }
}

// features/settings/settings.service.ts
@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}
  
  async getPreferences(userId: string) {
    const preferences = await this.prisma.userPreferences.findUnique({
      where: { userId },
    })
    
    return preferences || this.getDefaultPreferences()
  }
  
  async updatePreferences(userId: string, data: UpdatePreferencesDto) {
    return this.prisma.userPreferences.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    })
  }
  
  private getDefaultPreferences() {
    return { theme: 'system' as const }
  }
}

// features/settings/dto/update-preferences.dto.ts
export class UpdatePreferencesDto {
  @IsEnum(['light', 'dark', 'system'])
  @IsOptional()
  theme?: 'light' | 'dark' | 'system'
  
  @IsEnum(['small', 'medium', 'large'])
  @IsOptional()
  fontSize?: 'small' | 'medium' | 'large'
}
```

---

#### 4.2 Apply project-readability Rules

**Naming:**
```ts
// ❌ Generic
const handleClick = () => {}
const data = await fetch()

// ✅ Specific
const handleThemeToggle = () => {}
const userPreferences = await fetchUserPreferences()
```

**Error handling:**
```ts
// ❌ Vague
throw new Error('Something went wrong')

// ✅ Actionable
throw new Error(
  'Failed to save theme preference. ' +
  'Please check your internet connection and try again.'
)
```

**No premature abstraction:**
```ts
// ❌ Over-engineered untuk 1 use case
class ThemeManager {
  constructor(private store: Store) {}
  setTheme(theme: Theme) { /*...*/ }
  getTheme() { /*...*/ }
  syncTheme() { /*...*/ }
}

// ✅ Start simple
const [theme, setTheme] = useState<Theme>('system')

// Extract ke manager ONLY kalau pattern berulang 3x+
```

**Prefer boring code:**
```ts
// ❌ Clever one-liner
const theme = user?.preferences?.theme ?? 
  (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')

// ✅ Clear steps
function getUserTheme(user: User | null): Theme {
  if (user?.preferences?.theme) {
    return user.preferences.theme
  }
  
  const prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)')
  return prefersColorScheme.matches ? 'dark' : 'light'
}
```

---

#### 4.3 Error Handling Pattern

**Frontend (React/Next.js):**
```tsx
// Optimistic update + revert on error
const [theme, setTheme] = useState(initialTheme)
const [isPending, startTransition] = useTransition()

const handleUpdate = async (newTheme: Theme) => {
  const previousTheme = theme
  setTheme(newTheme) // Optimistic
  
  startTransition(async () => {
    const result = await updateTheme(newTheme)
    
    if (!result.success) {
      setTheme(previousTheme) // Revert
      toast.error(result.error)
    } else {
      toast.success('Theme updated')
    }
  })
}
```

**Backend (NestJS):**
```ts
// Use exception filters
@Patch('preferences')
async updatePreferences(@Body() dto: UpdatePreferencesDto) {
  try {
    return await this.settingsService.updatePreferences(dto)
  } catch (error) {
    if (error instanceof PrismaClientKnownRequestError) {
      throw new BadRequestException('Invalid preference data')
    }
    throw new InternalServerErrorException(
      'Failed to update preferences. Please try again later.'
    )
  }
}
```

---

### Phase 5: Testing Strategy

**What to test:**

**Unit tests:**
```ts
// Test business logic
describe('getUserTheme', () => {
  it('returns user preference if exists', () => {
    const user = { preferences: { theme: 'dark' } }
    expect(getUserTheme(user)).toBe('dark')
  })
  
  it('falls back to system preference if user has none', () => {
    // Mock window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => ({ matches: true }))
    })
    
    expect(getUserTheme(null)).toBe('dark')
  })
})
```

**Integration tests:**
```ts
// Test API endpoints
describe('PATCH /settings/preferences', () => {
  it('updates user theme preference', async () => {
    const response = await request(app)
      .patch('/settings/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ theme: 'dark' })
    
    expect(response.status).toBe(200)
    expect(response.body.theme).toBe('dark')
  })
  
  it('rejects invalid theme', async () => {
    const response = await request(app)
      .patch('/settings/preferences')
      .send({ theme: 'invalid' })
    
    expect(response.status).toBe(400)
  })
})
```

**E2E tests (kalau critical feature):**
```ts
// Test full user flow
test('user can change theme', async ({ page }) => {
  await page.goto('/settings')
  await page.selectOption('[name="theme"]', 'dark')
  await page.waitForSelector('[data-theme="dark"]')
  
  // Verify persistence
  await page.reload()
  expect(await page.getAttribute('html', 'data-theme')).toBe('dark')
})
```

---

### Phase 6: Performance Considerations

**Optimize renders:**
```tsx
// ❌ Re-renders unnecessarily
function Settings() {
  const [preferences, setPreferences] = useState(initialPrefs)
  
  return (
    <div>
      <ThemeToggle 
        onUpdate={(theme) => setPreferences({...preferences, theme})} 
      />
    </div>
  )
}

// ✅ Memoize callback
function Settings() {
  const [preferences, setPreferences] = useState(initialPrefs)
  
  const handleThemeUpdate = useCallback((theme: Theme) => {
    setPreferences(prev => ({ ...prev, theme }))
  }, [])
  
  return <ThemeToggle onUpdate={handleThemeUpdate} />
}
```

**Debounce user input (kalau needed):**
```tsx
// For text inputs that trigger API calls
import { useDebouncedCallback } from 'use-debounce'

const handleSearch = useDebouncedCallback(async (query: string) => {
  await searchAPI(query)
}, 300)
```

**Cache data (kalau expensive):**
```tsx
// React Query example
const { data: preferences } = useQuery({
  queryKey: ['user-preferences'],
  queryFn: fetchUserPreferences,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

---

## Feature Implementation Checklist

Sebelum mark feature as "done", pastikan:

### Code Quality
- [ ] Naming jelas dan spesifik (no generic `handleClick`, `data`, `temp`)
- [ ] No magic numbers/strings (use constants)
- [ ] Error messages actionable
- [ ] No deep nesting (max 3 levels)
- [ ] Functions < 50 lines (split kalau lebih)
- [ ] Files < 300 lines (extract modules kalau lebih)

### Functionality
- [ ] Happy path works
- [ ] Error cases handled gracefully
- [ ] Edge cases covered (empty state, null, undefined)
- [ ] Loading states implemented
- [ ] Success feedback (toast, message, redirect)

### Security
- [ ] Auth/authorization checks (frontend & backend)
- [ ] Input validation (Zod, class-validator, dll)
- [ ] No sensitive data di client side
- [ ] SQL injection safe (use parameterized queries / ORM)
- [ ] XSS safe (no dangerouslySetInnerHTML tanpa sanitize)

### Performance
- [ ] No unnecessary re-renders
- [ ] API calls optimized (no N+1)
- [ ] Proper caching where applicable
- [ ] Large lists paginated or virtualized

### Testing
- [ ] Unit tests untuk business logic
- [ ] Integration tests untuk API endpoints
- [ ] E2E tests untuk critical user flows (optional tapi recommended)

### Documentation
- [ ] JSDoc untuk complex functions
- [ ] README updated kalau ada setup baru
- [ ] API docs updated (Swagger, Postman, dll)

---

## Common Patterns by Feature Type

### CRUD Features
```
1. Define model/schema
2. Create API endpoints (or Server Actions)
   - GET /items (list)
   - GET /items/:id (detail)
   - POST /items (create)
   - PATCH /items/:id (update)
   - DELETE /items/:id (delete)
3. Implement frontend views
   - List view (table/grid)
   - Detail view
   - Create form
   - Edit form
4. Add validation (frontend + backend)
5. Handle errors and loading states
6. Add tests
```

### Authentication Features
```
1. Choose strategy (JWT, session, OAuth)
2. Setup auth library (NextAuth, Passport, dll)
3. Implement routes
   - /login
   - /register
   - /logout
   - /reset-password (optional)
4. Create middleware/guards untuk protected routes
5. Handle session storage
6. Add CSRF protection
7. Test auth flows
```

### Search/Filter Features
```
1. Define search params (query, filters, sort, pagination)
2. Backend: Build query with filters
3. Backend: Add indexes untuk performance
4. Frontend: Search input + filter UI
5. Frontend: Debounce search input
6. Frontend: URL state sync (search params)
7. Handle empty results
8. Add loading skeleton
```

### Real-time Features (WebSocket, SSE)
```
1. Choose technology (WebSocket, SSE, polling)
2. Setup connection management
3. Handle reconnection logic
4. Update UI on events
5. Show connection status
6. Handle offline scenarios
7. Rate limiting
```

---

## Integration dengan Skills Lain

**Always combine with:**
- **project-readability** - Naming, structure, error messages
- **token-efficient-coding** - Keep code concise without sacrificing clarity
- **Framework-specific skill** - Follow Next.js, NestJS, Laravel patterns

**Example workflow:**
```
1. User: "Implement user profile editing"
2. Load: feature-architect + nextjs-readability + token-efficient-coding
3. Plan architecture (this skill)
4. Follow Next.js patterns (nextjs-readability)
5. Write clean code (token-efficient-coding + project-readability)
6. Output implementation plan + code
```

---

## Output Format

### Planning Phase Output
```markdown
## Feature: [Name]

### Requirements
- [List key requirements]
- [Edge cases identified]

### Architecture
**Affected Files:**
- Create: [list new files]
- Modify: [list existing files]

**Data Flow:**
[Simple diagram or steps]

**API Contracts:**
[Request/response shapes if applicable]

### Data Model
[Types, schemas, DB schema if needed]

### Testing Plan
- Unit: [what to test]
- Integration: [what to test]
- E2E: [if needed]

### Implementation Steps
1. [Step 1]
2. [Step 2]
...
```

### Implementation Phase Output
Provide actual code dengan:
- File paths
- Clear comments untuk complex logic
- Error handling
- Type safety
- Framework best practices

---

## Summary

Feature Architect = **Think before code**.

Don't rush into implementation. 10 minutes planning bisa save hours of refactoring.

Follow formula:
1. **Understand** requirements + edge cases
2. **Plan** architecture + data flow
3. **Design** contracts + models
4. **Implement** dengan clean patterns
5. **Test** thoroughly
6. **Ship** confidently

Quality over speed. But both is possible dengan good planning upfront.
