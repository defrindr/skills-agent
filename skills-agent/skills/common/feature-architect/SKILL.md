---
name: feature-architect
description: >
  Design dan implement new features dengan architectural thinking.
  Plan feature structure, identify affected components, design API contracts,
  data models, state management, error handling, testing strategy.
  Pakai sebelum mulai coding feature baru.
  Trigger: "implement feature", "add functionality", "build", "create",
  "new feature", "develop", "feature design", "feature planning".
---

# Feature Architect

Think before code. Plan first, design first, then execute.

---

## Implementation Workflow

### Phase 1: Requirements Analysis

Extract: What (fitur), Why (business goal), Who (role/permissions), When (timing), Where (FE/BE/both).

Identify edge cases: error scenarios, empty states, permission boundaries, concurrent operations.

### Phase 2: Architecture Planning

Identify: new files to create, existing files to modify, dependencies to add.

Design data flow: user action → handler → state update → persist → UI re-render.

API contracts — request/response shapes.

State management choice: local state (useState) → context (app-wide) → external store (Zustand/Redux) → server state (React Query).

### Phase 3: Data Modeling

```ts
type Theme = 'light' | 'dark' | 'system'
const themeSchema = z.enum(['light', 'dark', 'system'])
```

### Phase 4: Implementation

Follow framework patterns. Apply `project-readability` rules:
- Naming specific: `handleThemeToggle()` bukan `handleClick()`
- Error actionable: `'Failed to save theme.'` bukan `'Something went wrong'`
- No premature abstraction: `useState` dulu, extract ke manager hanya jika pattern 3x+

#### Frontend Pattern (optimistic update + revert)
```tsx
const handleUpdate = async (newTheme: Theme) => {
  const prev = theme; setTheme(newTheme)
  startTransition(async () => {
    const result = await updateTheme(newTheme)
    if (!result.success) { setTheme(prev); toast.error(result.error) }
  })
}
```

#### Backend Pattern (NestJS example)
```ts
@Patch('preferences')
async updatePreferences(@Body() dto: UpdatePreferencesDto) {
  try { return await this.settingsService.updatePreferences(dto) }
  catch (e) {
    if (e instanceof PrismaClientKnownRequestError)
      throw new BadRequestException('Invalid preference data')
    throw new InternalServerErrorException('Failed to update preferences.')
  }
}
```

### Phase 5: Testing

- Unit: business logic, edge cases
- Integration: API endpoints
- E2E: critical user flows (optional but recommended)

### Phase 6: Performance

- Memoize callbacks, debounce input, cache data with staleTime
- No unnecessary re-renders, no N+1 API calls

---

## Feature Implementation Checklist

### Code Quality
- [ ] Naming jelas dan spesifik — no `handleClick`, `data`, `temp`
- [ ] No magic numbers/strings — use constants
- [ ] Error messages actionable
- [ ] No deep nesting (max 3 levels)
- [ ] Functions < 50 lines

### Functionality
- [ ] Happy path works
- [ ] Error cases handled gracefully
- [ ] Edge cases covered (empty, null, loading)
- [ ] Success feedback (toast, message, redirect)

### Security
- [ ] Auth/authorization on FE & BE
- [ ] Input validation (Zod/class-validator)
- [ ] No sensitive data client-side
- [ ] SQL injection safe (parameterized queries/ORM)

### Performance
- [ ] No unnecessary re-renders
- [ ] API calls optimized (no N+1)
- [ ] Proper caching where applicable

### Testing
- [ ] Unit tests for business logic
- [ ] Integration tests for API endpoints

---

## Common Patterns by Feature Type

| Type | Steps |
|------|-------|
| CRUD | Model → API (GET/POST/PATCH/DELETE) → Views (list/detail/create/edit) → Validation → Tests |
| Auth | Choose strategy → Setup library → Routes (login/register/logout) → Middleware → CSRF |
| Search | Search params → Backend query + indexes → Debounce search → URL sync → Empty state |
| Real-time | Choose tech → Connection management → Reconnection → UI updates → Rate limiting |

---

## Integration with Other Skills

Always combine with: `project-readability` (naming, structure), `token-efficient-coding` (concise code), framework-specific `*-readability`.

Workflow: Plan → Follow framework patterns → Write clean code → Output plan + code.

## Referensi

- Naming & structure → `project-readability`
- Framework specifics → `*-readability` masing-masing
- Code audit → `code-health`
