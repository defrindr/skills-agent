---
name: tailwind-readability
description: |
  Tailwind CSS best practices untuk readable, maintainable utility-first styling.
  Covers component patterns, responsive design, dark mode, custom config.
  Trigger: "tailwind best practices", "style with tailwind", "tailwind component",
  "responsive tailwind", "dark mode tailwind", "tailwind config", "refactor tailwind classes".
---

# Tailwind Readability

**Defer to `frontend/general-styling`** untuk design tokens, spacing system, color system, typography scale, shadow/radius levels, dan professional styling principles. Skill ini hanya mencakup Tailwind utility patterns, component extraction, dan configuration.

---

## Class Ordering Convention

1. Layout: `flex`, `grid`, `block`, `relative`
2. Spacing: `p-*`, `m-*`, `gap-*`
3. Sizing: `w-*`, `h-*`, `max-*`
4. Typography: `text-*`, `font-*`, `leading-*`
5. Colors: `text-*`, `bg-*`, `border-*`
6. Borders: `rounded-*`
7. Effects: `shadow-*`, `ring-*`
8. Transforms: `scale-*`, `rotate-*`
9. Transitions: `transition-*`, `duration-*`
10. Interactions: `hover:*`, `focus:*`
11. Responsive: `sm:*`, `md:*`, `lg:*`
12. Dark mode: `dark:*`

```tsx
<div className="flex flex-col gap-4 p-6 w-full max-w-4xl text-base font-medium text-gray-900 bg-white rounded-lg shadow-sm hover:scale-105 dark:bg-gray-800" />
```

---

## Component Extraction

Pattern repeats 3+ times → extract component.

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, ...props }: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "font-medium rounded-lg transition-colors"
  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700",
    secondary: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    ghost: "text-gray-700 hover:bg-gray-100"
  }
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm", md: "px-4 py-2 text-sm", lg: "px-6 py-3 text-base"
  }
  return <button className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`} {...props}>{children}</button>
}
```

`@apply` use sparingly — component extraction is preferred. OK for truly global base styles like prose/content.

---

## Responsive Design — Mobile-First

```tsx
<div className="flex flex-col gap-4 sm:flex-row sm:gap-6 lg:gap-8 w-full sm:w-1/2 lg:w-1/3" />
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" />
```

---

## Dark Mode — Class Strategy

```js
// tailwind.config.js
module.exports = { darkMode: 'class' }
```

```tsx
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 shadow-sm dark:shadow-gray-800" />
```

---

## Custom Configuration — Extend with Design Tokens

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2563eb', hover: '#1d4ed8' },
        danger: { DEFAULT: '#dc2626', hover: '#b91c1c' },
      },
      boxShadow: { sm: '0 1px 2px 0 rgba(0,0,0,0.05)', md: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    },
  },
  darkMode: 'class',
}
```

Semantic colors + numbered scale, bukan arbitrary hex. Shadow max 2 layer.

### Custom Utilities
```js
plugins: [function({ addUtilities }) {
  addUtilities({ '.text-balance': { 'text-wrap': 'balance' } })
}]
```

---

## Common Patterns

### Card
```tsx
<div className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-shadow" />
```

### Input
```tsx
<input className={`w-full px-3 py-2 text-sm bg-white dark:bg-gray-900 border rounded-md ${error ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 transition-colors`} />
```

### Responsive Grid
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8" />
```

---

## Anti-Patterns

- Arbitrary values for spacing/colors/shadow (`p-[17px]`, `bg-[#3498db]`) — pakai design system
- Inline styles when Tailwind class exists (`style={{ padding: '16px' }}`)
- Overly long class strings — extract to component
- `@apply` for everything — defeats Tailwind's purpose
- Dynamic class names (`bg-${color}-600`) — use full names or safelist
- Shadow 3+ layers, gradient norak, animation > 300ms — ikuti `general-styling`

---

## Performance

```js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
}
```

Use `clsx` for conditional classes. Prettier plugin: `prettier-plugin-tailwindcss`.

---

## Key Rules

- Follow `general-styling` for all design decisions
- Extend config first, extract components when pattern repeats 3x
- Order classes consistently
- Mobile-first responsive, `dark:` for dark mode
- Shadow max 2 layer, transition 150-300ms
- No arbitrary values, no gradient norak, no transform berlebihan

## Referensi

- Design tokens, professional styling → `frontend/general-styling`
- UI redesign workflow → `theme-redesign`
