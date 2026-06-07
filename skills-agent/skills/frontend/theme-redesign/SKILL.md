---
name: theme-redesign
description: |
  Redesign UI theme (colors, spacing, typography, components) without breaking application logic.
  Focuses on visual updates only — preserves all business logic, event handlers, data flow.
  Trigger: "change theme", "redesign UI", "update colors", "rebrand app",
  "new theme", "change design system", "update styling".
---

# Theme Redesign

**Defer to `frontend/general-styling`** untuk design tokens, color system, spacing scale, typography rules, shadow/radius standards. Skill ini hanya mencakup workflow untuk redesign theme dan preserve logic.

---

## Prinsip — Visual Only, Logic Untouched

**NEVER modify:** event handlers, state management, data fetching, business logic, component props (except style-related), file structure.

**ONLY modify:** colors, spacing, typography, border radius, shadows, transitions, dark mode styling.

---

## Phase 1: Analyze Current Theme

Ask: framework (Tailwind/CSS-in-JS/MUI), current palette, typography, spacing scale, dark mode support, brand guidelines.

Identify theme locations:
- Tailwind: `tailwind.config.js` — colors, spacing, fontSize
- CSS: `:root` variables — `--color-primary`, `--spacing-unit`
- Theme provider: React context / MUI `createTheme`

---

## Phase 2: Design New Theme — Follow `general-styling`

New theme HARUS follow `general-styling`:
- Colors: semantic naming + numbered scale (50-900), WCAG AA contrast minimum 4.5:1
- Spacing: kelipatan 4px
- Typography: type scale ratio 1.125-1.25
- Shadow: max 2 layer (sm, md, lg only)
- Radius: reasonable (sm, md, lg, xl — no 50px pill)
- No gradient norak (solid default, gradient only if design reason)

```js
// Before: old theme
colors: { primary: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb' } }

// After: new theme (example: purple)
colors: {
  primary: { 50: '#faf5ff', 100: '#f3e8ff', 500: '#a855f7', 600: '#9333ea', 700: '#7e22ce', 900: '#581c87' },
  success: { DEFAULT: '#16a34a', hover: '#15803d' },
  danger: { DEFAULT: '#dc2626', hover: '#b91c1c' },
}
```

---

## Phase 3: Apply Theme Changes

### Strategy 1: Update Tailwind Config (Recommended)
Update `tailwind.config.js` colors/spacing/fontSize. All components using `bg-primary-500`, `text-primary-600` auto-update.

### Strategy 2: CSS Variables (Global)
```css
:root { --color-primary: #a855f7; --color-primary-hover: #9333ea; }
.dark { --color-primary: #c084fc; --color-primary-hover: #d8b4fe; }
```

### Strategy 3: Component Library
MUI: `createTheme({ palette: { primary: { main: '#a855f7' } } })`
shadcn: update `tailwind.config.js` tokens

---

## Phase 4: Update Custom Components — Visual Only

```tsx
// Before
<button className="bg-blue-600 text-white rounded-lg">Submit</button>
// After — only visual classes changed, onClick/logic preserved
<button className="bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-150">Submit</button>
```

**Changes:** `bg-blue-600` → `bg-primary-600`. **Preserved:** `children`, `onClick`, props.

Dark mode consistency:
```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50" />
```

---

## Checklist

- [ ] Backup current code (git commit)
- [ ] Follow `general-styling` for all design tokens
- [ ] Update theme config first
- [ ] Test each component visually
- [ ] Verify NO logic changes (event handlers work)
- [ ] Check contrast WCAG AA (minimum 4.5:1)
- [ ] Test dark mode consistently
- [ ] Test responsive breakpoints
- [ ] No SMK 2016 vibes: arbitrary spacing, 3+ layer shadow, transform berlebihan, gradient norak

## Key Rules

- Follow `general-styling` — no gradient norak, shadow max 2 layer, spacing dari scale
- Update theme config first (central source of truth)
- Use design tokens, not hardcoded colors
- Preserve all event handlers, state, logic
- Animation 150-300ms
- Gradient only with design reason (solid default)

## Referensi

- Design tokens & professional styling → `frontend/general-styling`
- Tailwind implementation → `tailwind-readability`
