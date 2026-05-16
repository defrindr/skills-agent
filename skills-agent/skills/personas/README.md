# Personas

**Personas** are lenses through which skills are applied. They define the tone, focus, and communication style without modifying the underlying technical patterns in skills.

## What are Personas?

Think of personas as **filters** or **perspectives**:
- **Skills** = Technical patterns (objective, fact-based)
- **Personas** = How to apply and communicate those patterns (subjective, context-dependent)

Skills remain unchanged. Personas wrap around them to change the lens.

## Built-in Personas

### 1. `senior-engineer` (Default)
**When to use:** General development, code reviews, feature implementation

**Characteristics:**
- Professional and pragmatic
- Values maintainability over cleverness
- "Boring code is good code"
- Explains "why", not just "what"

**Example output:**
```
This auth check can be bypassed because JWT validation is missing.
Consider adding verification before accessing user data.
```

---

### 2. `red-team`
**When to use:** Security audits, vulnerability assessment, threat modeling

**Characteristics:**
- Adversarial mindset
- Assumes breach mentality
- Documents exploit paths
- Rates severity (Critical/High/Medium/Low)

**Example output:**
```
🚨 CRITICAL: SQL Injection in User Search

File: src/routes/users.js:42
Exploit: GET /api/users?name=admin'--
Blast Radius: Full database read/write access
Remediation: Use parameterized queries
```

---

### 3. `minimalist`
**When to use:** Quick answers, code-first approach, experienced developers

**Characteristics:**
- Terse and direct
- Code over prose
- Minimal explanations
- Skip obvious rationale

**Example output:**
```
Auth middleware. Checks JWT.

// middleware/auth.js
export const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  req.user = jwt.verify(token, JWT_SECRET);
  next();
};
```

---

## Using Personas

Personas are specified when calling MCP tools:

```typescript
// Default behavior (senior-engineer)
explore_codebase({ path: '/app', depth: 'normal' })

// Security audit
explore_codebase({ path: '/app', depth: 'deep', persona: 'red-team' })

// Quick code-only review
implement_feature({ 
  description: 'Add auth', 
  path: '/app',
  persona: 'minimalist'
})
```

## Creating Custom Personas

You can add custom personas to `personas/user/` directory.

### Persona File Structure

```yaml
---
name: my-persona
display_name: "My Custom Persona"
category: custom
description: |
  Brief description of what this persona does
  and when to use it.
mindset:
  - Key principle 1
  - Key principle 2
  - Key principle 3
communication_style: |
  How this persona communicates.
  Tone, format, level of detail.
priorities:
  - Priority 1
  - Priority 2
  - Priority 3
output_format: |
  Expected output structure.
  Template or example format.
---

# My Persona Name

Full description and guidelines for this persona.

## Guiding Principles

Detailed explanation...

## Example Output

Show concrete examples...
```

### Example Custom Personas

**Startup CTO:**
- Focus: Pragmatic decisions, tech debt management, MVP vs. scale
- Output: Risk assessment, quick wins, scaling roadmap

**Accessibility Auditor:**
- Focus: WCAG compliance, screen reader support, keyboard navigation
- Output: A11y violations, remediation steps, testing instructions

**Performance Engineer:**
- Focus: Bottlenecks, optimization opportunities, profiling
- Output: Metrics, benchmarks, optimization suggestions

**Beginner Mentor:**
- Focus: Educational, step-by-step, explain fundamentals
- Output: Detailed explanations, learning resources, common pitfalls

## Persona Naming Conventions

- Use kebab-case: `startup-cto`, `accessibility-auditor`
- Be descriptive: Name should indicate the lens/focus
- Keep it short: 1-3 words max

## Best Practices

1. **Personas don't replace skills** - They complement them
2. **Keep personas focused** - Each persona should have a clear, specific purpose
3. **Provide examples** - Show concrete output format
4. **Document when to use** - Help users choose the right persona
5. **Maintain consistency** - Follow the YAML schema structure

## Persona vs. Skill

**Wrong:** Create a persona that teaches new patterns  
**Right:** Create a persona that changes HOW existing patterns are communicated

**Wrong:** Duplicate skill content in persona  
**Right:** Reference skills and apply a lens to them

**Example:**

```yaml
# ❌ Wrong - Teaching new patterns (this belongs in a skill)
mindset:
  - Use Prisma for database queries
  - Implement pagination with limit/offset

# ✅ Right - Changing communication lens
mindset:
  - Explain database patterns in terms of performance impact
  - Highlight N+1 query risks immediately
```

---

## Need Help?

- Check existing core personas for reference
- Start with a simple persona (minimal YAML, clear examples)
- Test with real tasks to validate usefulness
- Iterate based on actual output quality

**Questions?** Open an issue or discussion on the repo.
