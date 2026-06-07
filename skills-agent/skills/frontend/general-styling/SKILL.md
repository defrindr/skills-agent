---
name: general-styling
description: >
  Panduan styling proper untuk senior engineer — bukan style SMK 2016.
  Saat membuat UI baru, code review styling, refactor CSS/SCSS/Tailwind,
  atau hasil generate terlihat amatir: warna random, spacing ga konsisten,
  shadow berlebihan, gradient norak, font size sembarangan.
  Berlaku untuk semua metode styling: CSS, SCSS, Tailwind, CSS-in-JS.
  Trigger: "styling", "css", "design", "ui", "refactor ui", "review styling",
  "design system", "warna jelek", "spacing jelek", "kelihatan amatir".
---

# General Styling Skill

**Defer to `common/project-readability`** untuk naming, boring code, premature abstraction. Styling harus mendukung content, bukan jadi pusat perhatian.

---

## Design Tokens — Single Source of Truth

```css
:root {
  --color-primary: #2563eb; --color-primary-hover: #1d4ed8;
  --color-danger: #dc2626; --color-success: #16a34a;
  --color-gray-50: #f9fafb; --color-gray-100: #f3f4f6; --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db; --color-gray-500: #6b7280; --color-gray-700: #374151; --color-gray-900: #111827;
  --space-1: 0.25rem; --space-2: 0.5rem; --space-3: 0.75rem; --space-4: 1rem;
  --space-6: 1.5rem; --space-8: 2rem; --space-12: 3rem; --space-16: 4rem;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --text-xs: 0.75rem; --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem; --text-2xl: 1.5rem; --text-3xl: 1.875rem;
  --leading-tight: 1.25; --leading-normal: 1.5; --leading-relaxed: 1.75;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  --radius-sm: 0.25rem; --radius-md: 0.375rem; --radius-lg: 0.5rem; --radius-xl: 0.75rem;
}
```

Warna primary/danger/success — semantic. Gray 50-900 — numbered scale. Spacing — kelipatan 4px. Typography — type scale 1.125x-1.25x. Shadow — maks 3 level (sm, md, lg). Radius — maks 4 level (sm, md, lg, xl).

---

## Color System

- Primary: brand color, untuk CTA dan focus
- Gray scale: 50-900
- Semantic: success (green), danger (red), warning (yellow), info (blue)
- Contrast minimum WCAG AA 4.5:1

Dark mode: background `gray-900`, text `gray-50`, border `gray-700`. Bukan pure black/white.

---

## Spacing System — 4px Grid

```
space-1 (4px) → icon+text     space-2 (8px)  → form label+input
space-3 (12px) → button padding  space-4 (16px) → card padding
space-6 (24px) → antar card     space-8 (32px) → antar section
space-12 (48px) → hero          space-16 (64px) → page top/bottom
```

Jangan arbitrary value — `p-[17px]`, `mt-[23px]` adalah red flag.

---

## Typography

Body text minimum 16px. Line length maks 70 karakter. Line height body 1.5.

```
xs (12px) → caption    sm (14px) → secondary    base (16px) → body
lg (18px) → emphasized xl (20px) → small heading 2xl (24px) → h3
3xl (30px) → h2        4xl (36px) → h1
```

Font weight: 400 body, 500 emphasized, 600 heading/button, 700 strong heading. Jangan 900 kecuali hero.

---

## Component Patterns — Professional

### Button
Solid color, subtle hover, fast transition (150ms). `border-radius: var(--radius-md)`, `font-weight: 500`, `padding: var(--space-2) var(--space-4)`. No gradient, no shadow berlebihan, no `border-radius: 50px`.

### Card
`background: white; border: 1px solid var(--color-gray-200); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-sm); hover → shadow-md`.

### Input
`border: 1px solid var(--color-gray-300); border-radius: var(--radius-md); padding: var(--space-2) var(--space-3); focus → outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1)`.

---

## Animation — Subtle, Fast, Purposeful

Transition duration 150-300ms. Easing ease atau ease-out. Maks 2 property (jangan `transition: all`). Purposeful — bukan dekorasi.

Jangan: `transform: scale(1.2) rotate(5deg)`, `all 0.5s ease-in-out`, spinner rainbow 2s.

---

## Layout — Clear Hierarchy, Whitespace

Grid/flex modern. Cukup whitespace — jangan cramp. Container `max-width: 1280px; margin: 0 auto`.

```css
.card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: var(--space-6); }
.card-header { display: flex; justify-content: space-between; align-items: center; gap: var(--space-3); }
```

---

## Anti-Patterns (SMK 2016)

- Warna random tanpa system: `#3498db`, `#2ecc71` — dari mana?
- Spacing sembarangan: `17px`, `23px`, `31px`
- Shadow 3+ layer — bukan depth, tapi noise
- Gradient untuk gradient — `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` tanpa tujuan
- Font size chaos — tidak ada type scale
- Animasi lambat > 300ms atau berlebihan
- Transform rotate/scale berlebihan pada hover
- Text shadow tidak perlu
- Border-radius 50px untuk button

---

## Checklist Sebelum Commit

- [ ] Tidak ada hard-coded color — semua dari design tokens
- [ ] Spacing dari system — kelipatan 4px
- [ ] Font size dari type scale
- [ ] Shadow maksimal 2 layer
- [ ] Gradient hanya kalau perlu — solid color dulu
- [ ] Transition < 300ms
- [ ] Contrast text minimum 4.5:1
- [ ] Button/Input/Card terlihat modern — bukan SMK 2016
- [ ] Responsive di mobile
- [ ] Focus state visible

## Referensi

- Framework-specific patterns → `*-readability` masing-masing
- Tailwind implementation → `tailwind-readability`
- Theme redesign workflow → `theme-redesign`
