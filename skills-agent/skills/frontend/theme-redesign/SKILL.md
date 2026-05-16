---
name: theme-redesign
description: |
  Redesign UI theme (colors, spacing, typography, components) without breaking application logic.
  Focuses on visual updates only - preserves all business logic, event handlers, data flow.
  
  Trigger phrases:
  - "change theme"
  - "redesign UI"
  - "update colors"
  - "rebrand app"
  - "new theme"
  - "change design system"
  - "update styling"
  
  Approach:
  - Analyze current theme (colors, spacing, typography)
  - Propose new theme (design tokens)
  - Update styles WITHOUT touching logic
  - Preserve accessibility (contrast, focus states)
  - Maintain responsive behavior
  - Test visual consistency

default_provider: deepseek
complexity: simple
---

# Theme Redesign

Goal: Update aplikasi UI theme (visual design) tanpa break business logic atau functionality.

> **PENTING**: Untuk design tokens, color system, spacing scale, typography rules, shadow/radius standards, dan **professional visual principles** — ikuti `frontend/general-styling`.
> Skill ini hanya mencakup **workflow untuk redesign theme** dan **preserve logic saat update styling**.
> 
> **General-styling adalah authority** untuk:
> - Design tokens structure (colors, spacing, typography, shadows, radius)
> - Color palette rules (semantic naming, gray scale, contrast minimum WCAG AA)
> - Spacing system (kelipatan 4px/8px, no random values)
> - Typography scale (ratio 1.125/1.25, line height, font weight)
> - Professional component patterns (no SMK 2016 vibes, no gradient norak, shadow max 2 layer)
> - Animation rules (150-300ms, purposeful, not decorative)
> 
> **CRITICAL**: Saat redesign theme, new theme HARUS follow `general-styling` rules. Jangan create theme baru yang melanggar professional standards (gradient berlebihan, spacing random, shadow 3+ layer, dll).

## Prinsip Utama

**VISUAL ONLY - LOGIC UNTOUCHED!**

**NEVER modify:**
- ❌ Event handlers (onClick, onChange, etc.)
- ❌ State management (useState, useEffect, etc.)
- ❌ Data fetching (API calls, queries)
- ❌ Business logic (calculations, validations)
- ❌ Component props (except style-related)
- ❌ File structure or imports

**ONLY modify:**
- ✅ Colors (background, text, borders)
- ✅ Spacing (padding, margins, gaps)
- ✅ Typography (font-size, font-weight, line-height)
- ✅ Border radius, shadows, transitions
- ✅ Component visual variants
- ✅ Dark mode styling

## Phase 1: Analyze Current Theme

### Extract Design Tokens

**Questions to ask:**

```
Before redesigning, let me analyze current theme:

1. **Framework:**
   - Using Tailwind? CSS-in-JS? CSS Modules?
   - Design system? (shadcn, MUI, custom?)

2. **Current theme:**
   - Primary color? (blue, green, etc.)
   - Color palette? (50-900 shades?)
   - Typography? (font families, sizes)
   - Spacing scale? (4px, 8px, 16px?)

3. **Components:**
   - Which components to restyle? (buttons, cards, inputs?)
   - Custom components or library components?

4. **Dark mode:**
   - Currently supported?
   - Keep dark mode or redesign it too?

5. **Brand guidelines:**
   - New brand colors? (#hexcode)
   - Specific design direction? (modern, minimal, playful)
```

### Identify Theme Locations

**Tailwind CSS:**
```javascript
// tailwind.config.js - Central theme definition
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {...},    // ← Theme colors here
        secondary: {...},
      },
      spacing: {...},      // ← Spacing scale
      fontSize: {...},     // ← Typography scale
    },
  },
}
```

**CSS Variables:**
```css
/* globals.css - Root variables */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #8b5cf6;
  --spacing-unit: 4px;
  --font-sans: 'Inter', sans-serif;
}
```

**Theme Provider (React):**
```tsx
// theme.ts - Theme object
export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
  },
  spacing: {
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
  },
};
```

## Phase 2: Design New Theme (FOLLOW general-styling)

### Create Design Tokens (Ikuti general-styling rules)

**CRITICAL**: New theme HARUS follow `general-styling` principles:
- Colors: semantic naming + numbered scale (50-900), WCAG AA contrast minimum
- Spacing: kelipatan 4px atau 8px, no arbitrary values
- Typography: type scale ratio 1.125 atau 1.25
- Shadow: max 2 layer (sm, md, lg only)
- Radius: reasonable (sm, md, lg, xl only — no 50px pill shape tanpa alasan)
- No gradient norak (solid color default, gradient hanya kalau ada design reason)

**Before (old theme):**
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',  // Main blue
    600: '#2563eb',
    900: '#1e3a8a',
  },
}
```

**After (new theme - example: purple, FOLLOW general-styling):**
```javascript
// tailwind.config.js
colors: {
  primary: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',  // Main purple
    600: '#9333ea',  // Hover state
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
  },
  // Semantic colors (dari general-styling)
  success: {
    DEFAULT: '#16a34a',  // green-600
    hover: '#15803d',     // green-700
  },
  danger: {
    DEFAULT: '#dc2626',   // red-600
    hover: '#b91c1c',     // red-700
  },
}
```

### Anti-Pattern: Jangan Bikin Theme SMK 2016

```javascript
// ❌ BAD: Theme yang melanggar general-styling
colors: {
  primary: {
    DEFAULT: '#3498db',  // random hex tanpa scale
  },
  'sky-gradient-start': '#667eea',  // gradient norak
  'sky-gradient-end': '#764ba2',
}

boxShadow: {
  'mega': '0 10px 30px rgba(0,0,0,0.3), 0 20px 60px rgba(0,0,0,0.2), 0 40px 120px rgba(0,0,0,0.1)',  // 3+ layer
}

borderRadius: {
  'pill': '50px',  // pill shape tanpa alasan
}

// ✅ GOOD: Theme yang follow general-styling
colors: {
  primary: {
    50: '#faf5ff',
    // ... full scale 50-900
    500: '#a855f7',
    600: '#9333ea',
    900: '#581c87',
  },
}

boxShadow: {
  'sm': '0 1px 2px 0 rgba(0,0,0,0.05)',
  'md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',  // max 2 layer
}

borderRadius: {
  'md': '0.375rem',  // 6px
  'lg': '0.5rem',    // 8px
  'xl': '0.75rem',   // 12px
}
```

### Color Palette Generator

**Use tools to generate consistent palette:**
- https://uicolors.app/create
- https://tailwindcss.com/docs/customizing-colors
- https://coolors.co

**Ensure accessibility:**
```javascript
// Check contrast ratios
// Text on background should be >= 4.5:1 (WCAG AA)
colors: {
  background: '#ffffff',
  text: '#111827',        // Contrast: 16:1 ✅
  textMuted: '#6b7280',   // Contrast: 4.6:1 ✅
  textLight: '#d1d5db',   // Contrast: 2.1:1 ❌ (too light!)
}
```

## Phase 3: Apply Theme Changes

### Strategy 1: Update Tailwind Config (Recommended)

**Step 1: Backup current config**
```bash
cp tailwind.config.js tailwind.config.backup.js
```

**Step 2: Update colors**
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Old: primary = blue
        // New: primary = purple
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',  // Main
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0764',
        },
        
        // Optional: Add accent color
        accent: {
          50: '#fff7ed',
          500: '#f97316',  // Orange
          900: '#7c2d12',
        },
      },
      
      // Update other design tokens
      spacing: {
        '18': '4.5rem',  // Custom spacing
      },
      
      borderRadius: {
        'xl': '1rem',    // Larger radius
        '2xl': '1.5rem',
      },
      
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
}
```

**Step 3: Verify components still work**

All components using `bg-primary-500`, `text-primary-600` automatically update to new purple theme. **No code changes needed!**

### Strategy 2: CSS Variables (Global)

**Step 1: Update root variables**
```css
/* app/globals.css */

/* OLD THEME */
:root {
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-secondary: #8b5cf6;
}

/* NEW THEME */
:root {
  --color-primary: #a855f7;       /* Purple */
  --color-primary-hover: #9333ea;
  --color-secondary: #f97316;     /* Orange accent */
}

/* Dark mode */
.dark {
  --color-primary: #c084fc;       /* Lighter purple for dark bg */
  --color-primary-hover: #d8b4fe;
  --color-secondary: #fb923c;
}
```

**Step 2: Components auto-update**
```tsx
// Button.tsx - No changes needed!
export function Button({ children }: ButtonProps) {
  return (
    <button
      style={{
        backgroundColor: 'var(--color-primary)',  // Automatically purple now
        color: 'white',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)';
      }}
    >
      {children}
    </button>
  );
}
```

### Strategy 3: Component Library (MUI, shadcn)

**Material-UI (MUI):**
```tsx
// theme.ts
import { createTheme } from '@mui/material/styles';

// OLD THEME
const oldTheme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6',  // Blue
    },
  },
});

// NEW THEME
const newTheme = createTheme({
  palette: {
    primary: {
      main: '#a855f7',  // Purple
    },
    secondary: {
      main: '#f97316',  // Orange
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 12,  // Larger radius
  },
});
```

```tsx
// app/layout.tsx - Apply theme
import { ThemeProvider } from '@mui/material/styles';
import { newTheme } from './theme';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider theme={newTheme}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**All MUI components automatically use new theme!**

## Phase 4: Update Custom Components

### Example: Button Component

**Before (old theme):**
```tsx
// components/button.tsx
export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  
  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",     // Old: blue
    secondary: "bg-purple-600 text-white hover:bg-purple-700",
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
}
```

**After (new theme):**
```tsx
// components/button.tsx
export function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  const baseClasses = "px-4 py-2 rounded-lg font-medium transition-colors";
  
  const variantClasses = {
    primary: "bg-primary-600 text-white hover:bg-primary-700",    // Now uses Tailwind config
    secondary: "bg-accent-600 text-white hover:bg-accent-700",
  };
  
  return (
    <button className={`${baseClasses} ${variantClasses[variant]}`} {...props}>
      {children}
    </button>
  );
}
```

**Changes:**
- ✅ `bg-blue-600` → `bg-primary-600` (uses theme)
- ✅ `bg-purple-600` → `bg-accent-600`
- ❌ **NO CHANGES** to `children`, `props`, logic

### Example: Card Component

**Before:**
```tsx
export function Card({ title, description, onClick }: CardProps) {
  return (
    <div 
      className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow"
      onClick={onClick}  // ← Logic preserved
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
```

**After (new theme):**
```tsx
export function Card({ title, description, onClick }: CardProps) {
  return (
    <div 
      className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all"
      onClick={onClick}  // ← Logic unchanged!
    >
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-base text-gray-700">{description}</p>
    </div>
  );
}
```

**Changes:**
- ✅ `rounded-lg` → `rounded-xl` (visual only)
- ✅ `hover:shadow-md` → `hover:shadow-lg` (visual only)
- ✅ `text-lg` → `text-xl` (visual only)
- ❌ **NO CHANGES** to `onClick`, `title`, `description` handling

## Phase 5: Dark Mode Consistency

### Update Dark Mode Colors

**Tailwind (class strategy):**
```tsx
// Before
<div className="bg-white text-gray-900 dark:bg-gray-800 dark:text-white">

// After (new theme with better contrast)
<div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-50">
```

**Ensure consistent dark theme:**
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode
        background: {
          DEFAULT: '#ffffff',
          secondary: '#f9fafb',
        },
        text: {
          DEFAULT: '#111827',
          secondary: '#6b7280',
        },
        
        // Dark mode (add dark: variants)
        'dark-background': {
          DEFAULT: '#111827',
          secondary: '#1f2937',
        },
        'dark-text': {
          DEFAULT: '#f9fafb',
          secondary: '#d1d5db',
        },
      },
    },
  },
}
```

**Usage:**
```tsx
<div className="
  bg-background dark:bg-dark-background
  text-text dark:text-dark-text
">
```

## Real-World Example: Dashboard Redesign (Follow general-styling)

### Before (Blue theme):

```tsx
// Dashboard.tsx
export function Dashboard() {
  const [data, setData] = useState([]);  // ← Logic: DON'T TOUCH
  
  useEffect(() => {
    fetchData().then(setData);  // ← Logic: DON'T TOUCH
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={handleNewItem}  // ← Logic: DON'T TOUCH
          >
            New Item
          </button>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {data.map(item => (  // ← Logic: DON'T TOUCH
            <Card key={item.id} {...item} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

### After (Purple theme - PROFESSIONAL, follow general-styling):

```tsx
// Dashboard.tsx
export function Dashboard() {
  const [data, setData] = useState([]);  // ← UNCHANGED
  
  useEffect(() => {
    fetchData().then(setData);  // ← UNCHANGED
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <button 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-150"
            onClick={handleNewItem}  // ← UNCHANGED
          >
            New Item
          </button>
        </div>
      </header>
      
      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-6">
          {data.map(item => (  // ← UNCHANGED
            <Card key={item.id} {...item} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

**Changes made (visual only, follow general-styling):**
- ✅ Button: `bg-blue-600` → `bg-primary-600` (semantic token)
- ✅ Button hover: `bg-blue-700` → `bg-primary-700`
- ✅ Transition: added `duration-150` (fast, from general-styling)
- ✅ All spacing unchanged (already proper 4px scale)
- ✅ Shadow unchanged (already subtle `shadow-sm`)

**Preserved (logic):**
- ✅ `useState`, `useEffect` unchanged
- ✅ `fetchData()` unchanged
- ✅ `handleNewItem` unchanged
- ✅ `data.map()` unchanged
- ✅ All props and event handlers unchanged

### ❌ ANTI-PATTERN: SMK 2016 Redesign (DON'T DO THIS)

```tsx
// ❌ BAD: Melanggar general-styling dengan gradient norak, shadow berlebihan
export function Dashboard() {
  // ... logic sama ...
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
      <header className="bg-white/50 backdrop-blur-xl border-b-4 border-purple-500 shadow-[0_10px_30px_rgba(0,0,0,0.3),0_20px_60px_rgba(0,0,0,0.2)]">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent drop-shadow-2xl">
            Dashboard
          </h1>
          <button 
            className="px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-[50px] hover:scale-110 hover:rotate-3 transition-all duration-700 shadow-[0_20px_60px_rgba(147,51,234,0.5)]"
            onClick={handleNewItem}
          >
            ✨ New Item ✨
          </button>
        </div>
      </header>
      {/* ... */}
    </div>
  );
}

// Masalah:
// ❌ Gradient background 3-color — norak, melanggar general-styling
// ❌ Shadow 2-layer heavy + blur-xl — berlebihan
// ❌ Border 4px — terlalu tebal
// ❌ Gradient text — tidak perlu, sulit dibaca
// ❌ Button rounded-[50px] — pill shape tanpa alasan
// ❌ hover:scale-110 hover:rotate-3 — transform berlebihan
// ❌ duration-700 — transition lambat (> 300ms)
// ❌ Shadow custom 3-layer — melanggar general-styling max 2 layer
// ❌ Emoji dalam button text — unprofessional
```

## Checklist: Theme Redesign (Follow general-styling)

### Before Starting:
- [ ] Backup current code (git commit)
- [ ] Document current theme (colors, spacing, fonts)
- [ ] Identify all theme locations (config, CSS, components)
- [ ] **Review `general-styling` rules** — new theme MUST follow professional standards

### During Redesign:
- [ ] **Follow general-styling**: design tokens, spacing 4px scale, shadow max 2 layer, no gradient norak
- [ ] Update theme config (Tailwind/CSS vars/MUI theme)
- [ ] Test each component visually
- [ ] Verify NO logic changes (event handlers work)
- [ ] Check accessibility (contrast ratios WCAG AA minimum 4.5:1)
- [ ] Test dark mode (if applicable)
- [ ] Test responsive breakpoints
- [ ] **Verify no SMK 2016 vibes**: no arbitrary spacing, no 3+ layer shadow, no transform berlebihan

### After Redesign:
- [ ] Run app, click through all pages
- [ ] Verify all interactions still work
- [ ] Check for visual inconsistencies
- [ ] Test on mobile devices
- [ ] **Audit against general-styling**: spacing scale OK? colors semantic? shadow ≤ 2 layer? transition < 300ms?
- [ ] Get design approval

## Common Pitfalls to Avoid

### ❌ 1. Accidentally Breaking Logic

**Bad:**
```tsx
// BEFORE
<button onClick={handleClick}>Submit</button>

// AFTER (accidentally removed onClick!)
<button className="bg-purple-600">Submit</button>  // ❌ onClick missing!
```

**Good:**
```tsx
// BEFORE
<button onClick={handleClick}>Submit</button>

// AFTER (preserved onClick)
<button onClick={handleClick} className="bg-purple-600">Submit</button>  // ✅
```

### ❌ 2. Hardcoding Colors

**Bad:**
```tsx
// Hardcoded colors (hard to maintain)
<div className="bg-[#a855f7] text-[#ffffff]">
```

**Good:**
```tsx
// Using theme tokens (maintainable)
<div className="bg-primary-500 text-white">
```

### ❌ 3. Inconsistent Spacing

**Bad:**
```tsx
// Random spacing values
<div className="p-[13px] mb-[27px] gap-[19px]">
```

**Good:**
```tsx
// Consistent spacing scale
<div className="p-4 mb-6 gap-5">
```

### ❌ 4. Breaking Accessibility

**Bad:**
```tsx
// Low contrast (WCAG fail)
<button className="bg-purple-200 text-purple-300">  // ❌ 1.5:1 contrast
```

**Good:**
```tsx
// High contrast (WCAG pass)
<button className="bg-purple-600 text-white">  // ✅ 7:1 contrast
```

## Key Rules

### DO:
- ✅ **Follow general-styling principles** — design tokens, spacing system, professional styling
- ✅ Update theme config first (central source of truth)
- ✅ Use design tokens (not hardcoded colors)
- ✅ Preserve all event handlers and logic
- ✅ Test accessibility (contrast WCAG AA minimum 4.5:1)
- ✅ Maintain responsive behavior
- ✅ Update dark mode consistently
- ✅ Document theme changes
- ✅ Shadow max 2 layer (sm, md, lg only)
- ✅ Spacing dari scale (no arbitrary `p-[17px]`)
- ✅ Transition fast (150-300ms)
- ✅ Gradient hanya kalau ada design reason (solid default)

### DON'T:
- ❌ **Melanggar general-styling** — no gradient norak, no shadow 3+ layer, no spacing random, no transform berlebihan
- ❌ Touch business logic or state management
- ❌ Modify event handlers (onClick, onChange, etc.)
- ❌ Change component props (except style-related)
- ❌ Hardcode colors inline
- ❌ Break accessibility (low contrast)
- ❌ Forget to test dark mode
- ❌ Make inconsistent changes
- ❌ Create SMK 2016 vibes (lihat general-styling untuk detail)
- ❌ Arbitrary values everywhere (`bg-[#3498db]`, `p-[23px]`)
- ❌ Animation lambat (> 300ms)

## Summary

Theme redesign = **visual updates only, logic preserved, follow general-styling**:

1. **Follow general-styling** — new theme MUST adhere to professional standards (no SMK 2016 vibes)
2. **Analyze current theme** (extract design tokens)
3. **Design new theme** (colors, spacing, typography — ikuti general-styling rules)
4. **Update theme config** (Tailwind/CSS vars/MUI)
5. **Update components** (visual classes only, preserve logic)
6. **Test thoroughly** (visuals + interactions + general-styling compliance)
7. **Verify logic intact** (all features still work)

**Critical rules from general-styling**:
- Design tokens: semantic colors + numbered scale, spacing kelipatan 4px
- Shadow: max 2 layer (sm, md, lg only)
- Gradient: solid default, gradient hanya kalau ada design reason
- Animation: 150-300ms, purposeful
- Contrast: WCAG AA minimum (4.5:1)
- No arbitrary values: `bg-[#3498db]`, `p-[17px]`, `shadow-[custom-3-layer]`

**Result**: Fresh new look yang **professional** (bukan SMK 2016) tanpa breaking the app!
