---
name: tailwind-readability
description: |
  Tailwind CSS best practices untuk readable, maintainable utility-first styling.
  Covers component patterns, responsive design, dark mode, custom config, dan避免 anti-patterns.
  
  Trigger phrases:
  - "tailwind best practices"
  - "style with tailwind"
  - "tailwind component"
  - "responsive tailwind"
  - "dark mode tailwind"
  - "tailwind config"
  - "refactor tailwind classes"
  
  Patterns:
  - Component extraction (reduce duplication)
  - Responsive patterns (@apply, breakpoints)
  - Dark mode (class strategy)
  - Custom utilities (tailwind.config)
  - Readability (class ordering, grouping)

default_provider: deepseek
complexity: simple
---

# Tailwind Readability

Goal: Write maintainable Tailwind CSS dengan clear patterns, minimal duplication, dan readable class names.

> **PENTING**: Untuk design tokens, spacing system, color system, typography scale, shadow/radius levels, dan **professional styling principles** — ikuti `frontend/general-styling`.
> Skill ini hanya mencakup hal yang spesifik untuk **Tailwind CSS utility patterns, component extraction, dan configuration**.
> 
> **Jangan asal comot Tailwind default**: Warna dari design tokens (bukan arbitrary `bg-[#3498db]`), spacing dari scale (bukan `p-[17px]`), shadow maksimal 2 layer.
> 
> **General-styling adalah authority** untuk:
> - Design tokens (colors, spacing, typography, shadows, radius)
> - Anti-pattern styling (gradient norak, shadow berlebihan, animation lambat)
> - Component visual standards (button, card, input harus professional)
> - Contrast, readability, accessibility rules

## Prinsip Utama

**UTILITY-FIRST, COMPONENT-EXTRACTED, DESIGN-SYSTEM-BASED!**

1. **Design tokens first** - Extend `tailwind.config.js` dengan tokens dari `general-styling`, bukan arbitrary value
2. **Start with utilities** - Build dengan Tailwind classes yang konsisten dengan design system
3. **Extract components** - When patterns repeat 3+ times
4. **Order matters** - Consistent class ordering
5. **Responsive mobile-first** - `sm:`, `md:`, `lg:` progression
6. **Dark mode** - Use `dark:` prefix
7. **Follow general-styling** - No SMK 2016 vibes: no gradient norak, no shadow berlebihan, no spacing random

## Class Ordering Convention

**Consistent order = readable code:**

```tsx
// Order: layout → spacing → sizing → typography → colors → effects → transforms
<div className="
  flex flex-col          // Layout
  gap-4 p-6             // Spacing
  w-full max-w-4xl      // Sizing
  text-base font-medium // Typography
  text-gray-900 bg-white // Colors
  rounded-lg shadow-sm  // Effects
  hover:scale-105       // Transforms
  dark:bg-gray-800      // Dark mode
">
```

**Full ordering:**
1. **Layout**: `flex`, `grid`, `block`, `inline`, `absolute`, `relative`
2. **Spacing**: `p-*`, `m-*`, `gap-*`, `space-*`
3. **Sizing**: `w-*`, `h-*`, `min-*`, `max-*`
4. **Typography**: `text-*`, `font-*`, `leading-*`, `tracking-*`
5. **Colors**: `text-*`, `bg-*`, `border-*`
6. **Borders**: `border`, `rounded-*`
7. **Effects**: `shadow-*`, `opacity-*`, `ring-*`
8. **Transforms**: `scale-*`, `rotate-*`, `translate-*`
9. **Transitions**: `transition-*`, `duration-*`
10. **Interactions**: `hover:*`, `focus:*`, `active:*`
11. **Responsive**: `sm:*`, `md:*`, `lg:*`
12. **Dark mode**: `dark:*`

## Component Patterns

### 1. Inline Utilities (Simple, One-off)

**Good for:**
- Unique layouts
- One-time usage
- Quick prototypes

```tsx
// ✅ Simple, doesn't repeat
<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
  Click me
</button>
```

### 2. Component Extraction (DRY)

**When to extract:**
- Pattern repeats 3+ times
- Complex utility combinations
- Project-wide consistency needed

❌ **Bad (duplication):**
```tsx
// Button used 10+ times in project
<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
  Primary
</button>

<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
  Submit
</button>

<button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
  Save
</button>
```

✅ **Good (extracted component):**
```tsx
// shared/components/button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md',
  children,
  ...props 
}: ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const baseClasses = "font-medium rounded-lg transition-colors";
  
  const variantClasses = {
    primary: "text-white bg-blue-600 hover:bg-blue-700",
    secondary: "text-blue-600 bg-blue-50 hover:bg-blue-100",
    ghost: "text-gray-700 hover:bg-gray-100"
  };
  
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      {...props}
    >
      {children}
    </button>
  );
}

// Usage
<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost" size="sm">Ghost</Button>
```

### 3. @apply for Repeated Patterns

**Use sparingly** - Only for truly repeated patterns.

❌ **Bad (@apply everything):**
```css
/* DON'T do this - defeats Tailwind's purpose */
.button {
  @apply px-4 py-2 text-sm font-medium rounded-lg;
}

.card {
  @apply p-6 bg-white rounded-lg shadow-sm;
}

.input {
  @apply px-3 py-2 border border-gray-300 rounded-md;
}
```

✅ **Good (component extraction preferred):**
```tsx
// React component (better for variants, props)
<Button />

// Or @apply ONLY for base styles used EVERYWHERE
/* globals.css */
.prose {
  @apply text-gray-900 leading-7;
  @apply prose-headings:font-bold;
  @apply prose-a:text-blue-600 hover:prose-a:text-blue-700;
}
```

## Responsive Design

### Mobile-First Approach

```tsx
// ✅ Good: Start mobile, add larger breakpoints
<div className="
  flex flex-col          // Mobile: column
  gap-4                  // Mobile: gap-4
  sm:flex-row            // Tablet+: row
  sm:gap-6               // Tablet+: gap-6
  lg:gap-8               // Desktop: gap-8
">
```

### Breakpoints

```tsx
// Default breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px

<div className="
  w-full             // Mobile: full width
  sm:w-1/2           // Tablet: half
  lg:w-1/3           // Desktop: third
  xl:w-1/4           // Large: quarter
">
```

### Container Pattern

```tsx
// ✅ Responsive container
<div className="
  w-full                    // Full width base
  max-w-7xl                 // Max width constraint
  mx-auto                   // Center
  px-4 sm:px-6 lg:px-8     // Responsive padding
">
  {/* Content */}
</div>
```

## Dark Mode

### Class Strategy (Recommended)

**tailwind.config.js:**
```js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

**Usage:**
```tsx
// ✅ Dark mode classes
<div className="
  bg-white text-gray-900          // Light mode
  dark:bg-gray-900 dark:text-white // Dark mode
">
```

**Toggle implementation:**
```tsx
// app/layout.tsx or _app.tsx
'use client';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Usage
<html className={theme}>
  <body>
    <ThemeProvider>{children}</ThemeProvider>
  </body>
</html>
```

### Common Dark Mode Patterns

```tsx
// Text
<p className="text-gray-900 dark:text-gray-100">

// Backgrounds
<div className="bg-white dark:bg-gray-900">

// Borders
<div className="border-gray-200 dark:border-gray-700">

// Shadows
<div className="shadow-sm dark:shadow-gray-800">

// Hover states
<button className="
  bg-blue-600 hover:bg-blue-700
  dark:bg-blue-500 dark:hover:bg-blue-600
">
```

## Custom Configuration

### Extend Theme dengan Design Tokens (WAJIB)

**Aturan**: Jangan pakai Tailwind default begitu saja — extend dengan design tokens dari `general-styling`.

**tailwind.config.js:**
```js
module.exports = {
  theme: {
    extend: {
      // Colors: Ikuti general-styling palette
      colors: {
        primary: {
          DEFAULT: '#2563eb',  // blue-600
          hover: '#1d4ed8',     // blue-700
        },
        danger: {
          DEFAULT: '#dc2626',   // red-600
          hover: '#b91c1c',     // red-700
        },
        // Gray scale dari general-styling
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          // ... sesuai general-styling tokens
        },
      },
      
      // Spacing: Tailwind default sudah 4px base — OK, tapi extend kalau perlu
      spacing: {
        // Default: 1 = 0.25rem (4px), 2 = 0.5rem (8px), dst.
        // Extend hanya kalau butuh custom
      },
      
      // Typography: Extend kalau butuh custom scale
      fontSize: {
        // Default Tailwind sudah bagus (sm, base, lg, xl, 2xl, dst)
        // Extend hanya kalau project butuh custom
      },
      
      // Shadow: Ikuti general-styling (max 2 layer)
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        // JANGAN tambah 'xl', '2xl' dengan 3-5 layer — ikuti general-styling max 2 layer
      },
      
      // Radius: Tailwind default OK
      borderRadius: {
        // sm: 0.25rem (4px), md: 0.375rem (6px), lg: 0.5rem (8px)
        // Extend hanya kalau butuh custom
      },
    },
  },
  
  // Dark mode
  darkMode: 'class', // or 'media'
}
```

**Anti-pattern**:
```js
// ❌ Jangan extend dengan warna SMK random
colors: {
  'sky-blue': '#3498db',      // random hex
  'emerald': '#2ecc71',       // tidak ada scale
  'alizarin': '#e74c3c',      // nama aneh
}

// ✅ Extend dengan semantic + scale
colors: {
  primary: {
    DEFAULT: '#2563eb',
    hover: '#1d4ed8',
  },
  success: {
    DEFAULT: '#16a34a',  // green-600
    hover: '#15803d',    // green-700
  },
}
```

### Custom Utilities

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {},
  },
  plugins: [
    function({ addUtilities }) {
      addUtilities({
        '.text-balance': {
          'text-wrap': 'balance',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
      })
    },
  ],
}
```

**Usage:**
```tsx
<h1 className="text-balance">
  Balanced text wrapping
</h1>

<div className="overflow-auto scrollbar-hide">
  Hidden scrollbar
</div>
```

## Common Patterns

### Card Component

```tsx
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      p-6                              // Padding
      bg-white dark:bg-gray-800       // Background
      border border-gray-200 dark:border-gray-700 // Border
      rounded-lg                       // Rounded corners
      shadow-sm                        // Shadow
      hover:shadow-md                  // Hover effect
      transition-shadow               // Smooth transition
    ">
      {children}
    </div>
  );
}
```

### Input Component

```tsx
export function Input({ error, ...props }: InputProps) {
  return (
    <input
      className={`
        w-full                                    // Full width
        px-3 py-2                                // Padding
        text-sm                                  // Text size
        bg-white dark:bg-gray-900               // Background
        border rounded-md                        // Border
        ${error 
          ? 'border-red-500 focus:ring-red-500' // Error state
          : 'border-gray-300 focus:ring-blue-500' // Normal state
        }
        focus:outline-none focus:ring-2         // Focus state
        transition-colors                        // Smooth transition
      `}
      {...props}
    />
  );
}
```

### Grid Layouts

```tsx
// ✅ Responsive grid
<div className="
  grid                       // Grid container
  grid-cols-1               // Mobile: 1 column
  sm:grid-cols-2            // Tablet: 2 columns
  lg:grid-cols-3            // Desktop: 3 columns
  gap-4 sm:gap-6 lg:gap-8   // Responsive gaps
">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### Flexbox Layouts

```tsx
// ✅ Flex with responsive direction
<div className="
  flex                       // Flex container
  flex-col sm:flex-row      // Column mobile, row tablet+
  items-center              // Align items center
  justify-between           // Space between
  gap-4                     // Gap between items
">
  <div>Left</div>
  <div>Right</div>
</div>
```

## Anti-Patterns to Avoid

### ❌ 1. Arbitrary Values Everywhere (MELANGGAR general-styling)

```tsx
// ❌ Bad: Spacing random — melanggar general-styling spacing system
<div className="mt-[13px] ml-[27px] p-[15px]">

// ✅ Good: Pakai design system scale (kelipatan 4px)
<div className="mt-3 ml-6 p-4">  // 12px, 24px, 16px

// ❌ Bad: Warna arbitrary tanpa system
<div className="bg-[#3498db] text-[#2ecc71]">

// ✅ Good: Semantic colors dari config
<div className="bg-primary text-success">

// ❌ Bad: Shadow custom berlebihan — melanggar general-styling (max 2 layer)
<div className="shadow-[0_10px_30px_rgba(0,0,0,0.3),0_20px_50px_rgba(0,0,0,0.2)]">

// ✅ Good: Shadow dari design system
<div className="shadow-md">  // 2 layer max dari general-styling
```

**Kapan arbitrary value OK?**
- Dynamic value yang benar-benar tidak bisa dari scale (e.g., width dari API response)
- One-off case yang sangat spesifik (tapi tetap harus justify)

**Kapan arbitrary value TIDAK OK?**
- Spacing, colors, shadows, font-size yang bisa dari design system
- Pattern yang repeat (harus extract ke config)

### ❌ 2. Inline Styles for Tailwind-Available Values

```tsx
// ❌ Bad: Mixing styles
<div style={{ padding: '16px' }} className="bg-white">

// ✅ Good: Pure Tailwind
<div className="p-4 bg-white">
```

### ❌ 3. Overly Long Class Strings

```tsx
// ❌ Bad: Unreadable
<div className="flex flex-col items-center justify-center gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700 sm:flex-row sm:justify-between lg:p-8">

// ✅ Good: Extract component
export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="
      flex flex-col items-center justify-center
      gap-4 p-6
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      rounded-lg shadow-sm hover:shadow-md
      transition-shadow
      sm:flex-row sm:justify-between
      lg:p-8
    ">
      {children}
    </div>
  );
}
```

### ❌ 4. @apply for Everything

```css
/* ❌ Bad: Defeats Tailwind purpose */
.my-button {
  @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
}
```

```tsx
// ✅ Good: React component
<Button variant="primary" />
```

### ❌ 5. Melanggar General-Styling Principles

```tsx
// ❌ Bad: Gradient norak tanpa tujuan (melanggar general-styling)
<button className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600">

// ✅ Good: Solid color dulu — gradient hanya kalau ada alasan design
<button className="bg-primary hover:bg-primary-hover">

// ❌ Bad: Shadow 3+ layer berlebihan (melanggar general-styling)
<div className="shadow-2xl hover:shadow-[0_30px_60px_rgba(0,0,0,0.5)]">

// ✅ Good: Shadow subtle max 2 layer
<div className="shadow-sm hover:shadow-md">

// ❌ Bad: Transform berlebihan (melanggar general-styling)
<button className="hover:scale-125 hover:rotate-6 transition-all duration-500">

// ✅ Good: Subtle transform, fast transition
<button className="hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150">

// ❌ Bad: Border radius terlalu besar tanpa alasan
<button className="rounded-[50px]">  // pill shape tanpa alasan

// ✅ Good: Radius dari design system
<button className="rounded-lg">  // 8px — professional

// ❌ Bad: Animation lambat (> 300ms)
<div className="transition-all duration-700">

// ✅ Good: Animation cepat (150-300ms)
<div className="transition-colors duration-150">
```

**Checklist sebelum commit (dari general-styling)**:
- [ ] Tidak ada arbitrary color value — semua dari config
- [ ] Spacing pakai scale — tidak ada `p-[17px]`, `mt-[23px]`
- [ ] Shadow maksimal 2 layer — `shadow-sm`, `shadow-md`, atau `shadow-lg`
- [ ] Gradient hanya kalau perlu — solid color default
- [ ] Transition < 300ms — `duration-150` atau `duration-200`
- [ ] Transform subtle — tidak ada `scale-125` atau `rotate-12`
- [ ] Border radius reasonable — tidak ada `rounded-[50px]` untuk button
- [ ] Text contrast pass WCAG AA — cek dengan DevTools

## Class Organization Tips

### Use Prettier Plugin

**Install:**
```bash
npm install -D prettier prettier-plugin-tailwindcss
```

**prettier.config.js:**
```js
module.exports = {
  plugins: ['prettier-plugin-tailwindcss'],
}
```

**Result:**
Automatically sorts classes in recommended order.

### Multi-line for Readability

```tsx
// ✅ Good: Multi-line for complex components
<div className="
  flex flex-col
  gap-4 p-6
  bg-white dark:bg-gray-800
  rounded-lg shadow-sm
  sm:flex-row
  lg:p-8
">
```

### Conditional Classes (clsx/classnames)

```tsx
import clsx from 'clsx';

function Button({ variant, size, disabled }: ButtonProps) {
  return (
    <button className={clsx(
      'font-medium rounded-lg transition-colors', // Base
      {
        'px-3 py-1.5 text-sm': size === 'sm',
        'px-4 py-2 text-base': size === 'md',
        'px-6 py-3 text-lg': size === 'lg',
      },
      {
        'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
        'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
      },
      {
        'opacity-50 cursor-not-allowed': disabled,
      }
    )}>
      {children}
    </button>
  );
}
```

## Performance Tips

### 1. Purge Unused Classes (Production)

**tailwind.config.js:**
```js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Tailwind will automatically purge unused classes
}
```

### 2. Avoid Dynamic Class Names

```tsx
// ❌ Bad: Dynamic classes won't be detected
const color = 'blue';
<div className={`bg-${color}-600`}> // Won't work!

// ✅ Good: Full class names
<div className={color === 'blue' ? 'bg-blue-600' : 'bg-red-600'}>

// ✅ Better: safelist in config
// tailwind.config.js
module.exports = {
  safelist: [
    'bg-blue-600',
    'bg-red-600',
    'bg-green-600',
  ],
}
```

### 3. Use JIT Mode (Default in v3+)

Just-in-Time mode generates styles on-demand:
- Faster builds
- Smaller CSS bundle
- Arbitrary values support

## Real-World Example

### Dashboard Layout

```tsx
// app/dashboard/layout.tsx
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="
        sticky top-0 z-50
        bg-white dark:bg-gray-800
        border-b border-gray-200 dark:border-gray-700
        shadow-sm
      ">
        <div className="
          max-w-7xl mx-auto
          px-4 sm:px-6 lg:px-8
          py-4
          flex items-center justify-between
        ">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <button className="
            px-4 py-2
            text-sm font-medium
            text-white bg-blue-600
            rounded-lg
            hover:bg-blue-700
            transition-colors
          ">
            New
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="
        max-w-7xl mx-auto
        px-4 sm:px-6 lg:px-8
        py-8
      ">
        {/* Grid Layout */}
        <div className="
          grid
          grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
          gap-6
        ">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### Card with Actions

```tsx
// components/card.tsx
export function Card({ title, description, actions }: CardProps) {
  return (
    <div className="
      flex flex-col
      h-full
      p-6
      bg-white dark:bg-gray-800
      border border-gray-200 dark:border-gray-700
      rounded-lg
      shadow-sm hover:shadow-md
      transition-shadow
    ">
      {/* Header */}
      <h3 className="
        text-lg font-semibold
        text-gray-900 dark:text-white
        mb-2
      ">
        {title}
      </h3>

      {/* Description */}
      <p className="
        flex-1
        text-sm text-gray-600 dark:text-gray-400
        mb-4
      ">
        {description}
      </p>

      {/* Actions */}
      <div className="
        flex items-center gap-2
        pt-4
        border-t border-gray-100 dark:border-gray-700
      ">
        {actions}
      </div>
    </div>
  );
}
```

## Key Rules

### DO:
- ✅ **Ikuti general-styling** — design tokens, spacing system, no SMK vibes
- ✅ Extend `tailwind.config.js` dengan semantic colors dari design system
- ✅ Order classes consistently (layout → spacing → colors → effects → responsive → dark)
- ✅ Extract repeated patterns into components (3+ kali → component)
- ✅ Use mobile-first responsive design (`sm:`, `md:`, `lg:`)
- ✅ Implement dark mode with `dark:` prefix
- ✅ Multi-line classes for readability (complex component)
- ✅ Use `clsx` for conditional classes
- ✅ Configure Prettier plugin (auto-sort classes)
- ✅ Shadow max 2 layer (`shadow-sm`, `shadow-md`)
- ✅ Transition fast (150-300ms: `duration-150`, `duration-200`)

### DON'T:
- ❌ **Melanggar general-styling** — no gradient norak, no shadow 3+ layer, no spacing random
- ❌ Arbitrary values everywhere (`bg-[#3498db]`, `p-[17px]`, `mt-[23px]`)
- ❌ Overuse `@apply` (component extraction lebih baik)
- ❌ Mix inline styles with Tailwind
- ❌ Create overly long class strings (extract ke component)
- ❌ Use dynamic class names (`bg-${color}-600` won't work)
- ❌ Duplicate complex patterns (extract!)
- ❌ Skip component extraction when pattern repeats
- ❌ Animation lambat (> 300ms)
- ❌ Transform berlebihan (`scale-125`, `rotate-12`)

## Summary

Tailwind readability = **utility-first with component extraction + design system adherence**:

1. **Follow general-styling** - Design tokens, spacing system, no SMK 2016 vibes
2. **Extend config first** - Semantic colors, not arbitrary values
3. **Start with utilities** - Build quickly with Tailwind classes
4. **Order consistently** - Layout → spacing → colors → effects → responsive → dark
5. **Extract components** - When patterns repeat 3+ times
6. **Responsive mobile-first** - `sm:`, `md:`, `lg:` breakpoints
7. **Dark mode** - Use `dark:` prefix consistently
8. **Professional styling** - Shadow max 2 layer, transition 150-300ms, no gradient norak

**Critical**: Tailwind adalah **tool untuk implement design system**, bukan excuse untuk arbitrary value sembarangan. Kalau `general-styling` bilang spacing kelipatan 4px, jangan pakai `p-[17px]`. Kalau `general-styling` bilang shadow max 2 layer, jangan pakai `shadow-2xl` dengan 5 layer.

**Result**: Maintainable, readable, dan **professional** Tailwind code yang konsisten dengan design system.
