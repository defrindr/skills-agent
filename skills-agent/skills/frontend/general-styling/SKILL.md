---
name: general-styling
description: >
  Panduan styling yang proper untuk senior engineer — bukan style SMK 2016.
  Gunakan skill ini saat membuat UI baru, code review styling, refactor CSS/SCSS/Tailwind,
  atau saat hasil generate terlihat amatir: warna random, spacing ga konsisten,
  shadow berlebihan, gradient norak, font size sembarangan, atau component yang terlihat
  seperti Bootstrap 3 tahun 2015.
  Berlaku untuk semua metode styling: CSS, SCSS, Tailwind, CSS-in-JS, Styled Components.
  Trigger: "styling", "css", "design", "ui", "refactor ui", "review styling",
  "design system", "warna jelek", "spacing jelek", "kelihatan amatir", "kaya smk",
  "tidak professional", "design norak", "gradient jelek", "shadow berlebihan".
---

# General Styling Skill

Styling yang bagus bukan soal teknologi — Tailwind, CSS, SCSS, CSS-in-JS sama saja kalau prinsipnya salah.

Styling yang bagus itu:
- **Konsisten**: spacing, warna, typography mengikuti system, bukan random
- **Subtle**: tidak norak, tidak ramai, tidak berusaha terlihat "modern" dengan gradient/shadow berlebihan
- **Readable**: contrast cukup, font size proper, line height enak dibaca
- **Scalable**: pakai design tokens, bukan hard-coded value di mana-mana
- **Professional**: terlihat seperti product perusahaan, bukan tugas akhir SMK

> **PENTING**: Skill ini adalah turunan dari `common/project-readability`.
> Semua prinsip readability tetap berlaku: boring code, jangan premature abstraction, nama jelas.
> 
> Styling harus **mendukung content**, bukan jadi pusat perhatian.

---

## 0. Red flags: styling ala SMK 2016

### Warna random tanpa system

```css
/* ❌ SMK vibes — warna dari mana? kenapa #3498db? kenapa #2ecc71? */
.button-primary { background: #3498db; }
.button-success { background: #2ecc71; }
.card-border { border: 1px solid #95a5a6; }
.text-muted { color: #7f8c8d; }
```

```css
/* ✅ Design tokens — semantic, konsisten, gampang diubah */
:root {
  --color-primary: #1e40af;      /* blue-800 */
  --color-success: #16a34a;      /* green-600 */
  --color-border: #e5e7eb;       /* gray-200 */
  --color-text-secondary: #6b7280; /* gray-500 */
}

.button-primary { background: var(--color-primary); }
.button-success { background: var(--color-success); }
.card-border { border: 1px solid var(--color-border); }
.text-muted { color: var(--color-text-secondary); }
```

### Spacing sembarangan

```css
/* ❌ Spacing random — kenapa 17px? kenapa 23px? */
.card { padding: 17px; margin-bottom: 23px; }
.section { padding: 31px 19px; }
.button { padding: 9px 21px; }
```

```css
/* ✅ Spacing system — kelipatan 4px atau 8px */
:root {
  --space-2: 0.5rem;  /* 8px */
  --space-4: 1rem;    /* 16px */
  --space-6: 1.5rem;  /* 24px */
  --space-8: 2rem;    /* 32px */
}

.card { padding: var(--space-4); margin-bottom: var(--space-6); }
.section { padding: var(--space-8) var(--space-4); }
.button { padding: var(--space-2) var(--space-4); }
```

### Shadow berlebihan — bukan depth, tapi noise

```css
/* ❌ Shadow norak — keliatan 3D murahan */
.card {
  box-shadow: 
    0 4px 8px rgba(0,0,0,0.3),
    0 8px 16px rgba(0,0,0,0.2),
    0 16px 32px rgba(0,0,0,0.1);
}
```

```css
/* ✅ Shadow subtle — cukup untuk depth, tidak mengganggu */
.card {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06);
}

.card-elevated {
  box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.05);
}
```

### Gradient yang tidak perlu

```css
/* ❌ Gradient untuk gradient — tidak ada tujuan, hanya "biar keren" */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.button {
  background: linear-gradient(to right, #f093fb 0%, #f5576c 100%);
}
```

```css
/* ✅ Solid color dulu — gradient hanya kalau ada alasan design */
.hero {
  background: #1e40af; /* blue-800 — clear, readable */
}
.button {
  background: #2563eb; /* blue-600 — accessible, consistent */
}

/* Gradient hanya untuk subtle depth atau brand-specific case */
.hero-with-depth {
  background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%);
  /* subtle — hanya untuk depth, bukan pusat perhatian */
}
```

### Font size chaos

```css
/* ❌ Font size sembarangan */
.title { font-size: 27px; }
.subtitle { font-size: 19px; }
.body { font-size: 15px; }
.caption { font-size: 13px; }
```

```css
/* ✅ Type scale — harmonis, predictable */
:root {
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.125rem;  /* 18px */
  --text-xl: 1.25rem;   /* 20px */
  --text-2xl: 1.5rem;   /* 24px */
  --text-3xl: 1.875rem; /* 30px */
  --text-4xl: 2.25rem;  /* 36px */
}

.title { font-size: var(--text-3xl); }
.subtitle { font-size: var(--text-xl); }
.body { font-size: var(--text-base); }
.caption { font-size: var(--text-sm); }
```

---

## 1. Design tokens — single source of truth

Design tokens adalah konstanta untuk warna, spacing, typography, shadow, radius.
Jangan hard-code value di component — semua harus dari tokens.

### CSS Variables (native, universal)

```css
/* styles/tokens.css */
:root {
  /* Colors: Semantic naming */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-danger: #dc2626;
  --color-danger-hover: #b91c1c;
  
  /* Grays: Numbered scale */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-500: #6b7280;
  --color-gray-700: #374151;
  --color-gray-900: #111827;
  
  /* Spacing: 4px or 8px base */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */
  --space-12: 3rem;    /* 48px */
  --space-16: 4rem;    /* 64px */
  
  /* Typography */
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-mono: "SF Mono", Menlo, Monaco, Consolas, monospace;
  
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
  
  /* Radius */
  --radius-sm: 0.25rem;  /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem;   /* 8px */
  --radius-xl: 0.75rem;  /* 12px */
}
```

### Tailwind (sudah punya system, tinggal extend)

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          hover: '#1d4ed8',
        },
        danger: {
          DEFAULT: '#dc2626',
          hover: '#b91c1c',
        },
      },
    },
  },
}
```

### SCSS Variables

```scss
// styles/_tokens.scss
$color-primary: #2563eb;
$color-primary-hover: #1d4ed8;

$space-4: 1rem;
$space-6: 1.5rem;

$text-base: 1rem;
$text-lg: 1.125rem;

$shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
```

**Aturan**:
- Warna primary/danger/success/warning — semantic
- Gray 50-900 — numbered scale untuk flexibility
- Spacing — kelipatan 4px (1, 2, 3, 4, 6, 8, 12, 16)
- Typography — type scale 1.125x atau 1.25x
- Shadow — maksimal 3 level (sm, md, lg)
- Radius — maksimal 4 level (sm, md, lg, xl)

---

## 2. Color system — accessible, consistent

### Palette rules

1. **Primary color**: brand color, dipakai untuk CTA dan focus state
2. **Gray scale**: 50, 100, 200, 300, 400, 500, 600, 700, 800, 900 — cukup
3. **Semantic colors**: success (green), danger (red), warning (yellow), info (blue)
4. **Contrast minimum**: WCAG AA — text harus 4.5:1, large text 3:1

```css
/* ❌ Contrast buruk */
.text-on-primary {
  background: #3b82f6; /* blue-500 */
  color: #93c5fd;      /* blue-300 — contrast 2.1:1, gagal WCAG */
}

/* ✅ Contrast baik */
.text-on-primary {
  background: #2563eb; /* blue-600 */
  color: #ffffff;      /* white — contrast 8.2:1, pass WCAG AAA */
}
```

### Dark mode (kalau ada)

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-border: #e5e7eb;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111827;
    --color-text: #f9fafb;
    --color-border: #374151;
  }
}
```

Jangan bikin dark mode dengan cara inverse warna — itu akan pecah.
Dark mode bukan `background: black; color: white;` — itu menyakiti mata.

Dark mode yang proper:
- Background: gray-900 (#111827), bukan pure black
- Text: gray-50 (#f9fafb), bukan pure white
- Contrast dikurangi sedikit — dark mode tidak boleh "menyala"

---

## 3. Spacing system — grid 4px atau 8px

Spacing chaos adalah penyebab #1 UI terlihat amatir.

### Aturan spacing

```
4px  → var(--space-1)  → micro spacing (icon + text)
8px  → var(--space-2)  → tight spacing (form label + input)
12px → var(--space-3)  → comfortable spacing (button padding)
16px → var(--space-4)  → default spacing (card padding)
24px → var(--space-6)  → section spacing (antar card)
32px → var(--space-8)  → large spacing (antar section)
48px → var(--space-12) → extra large (hero section)
64px → var(--space-16) → massive (page top/bottom)
```

```css
/* ❌ Spacing random */
.card { padding: 17px; gap: 11px; }
.section { margin-bottom: 37px; }

/* ✅ Spacing dari system */
.card { padding: var(--space-4); gap: var(--space-3); }
.section { margin-bottom: var(--space-8); }
```

### Tailwind spacing

Tailwind sudah pakai spacing system 4px base:

```html
<!-- p-4 = 16px, gap-3 = 12px, mb-8 = 32px -->
<div class="p-4 gap-3 mb-8">
```

Jangan override dengan arbitrary value tanpa alasan:

```html
<!-- ❌ Arbitrary tanpa alasan -->
<div class="p-[17px] gap-[11px] mb-[37px]">

<!-- ✅ Pakai scale yang ada -->
<div class="p-4 gap-3 mb-8">
```

---

## 4. Typography — hierarchy, readability

### Type scale

Pakai type scale dengan ratio 1.125 (major second) atau 1.25 (major third).

```
xs:   12px / 0.75rem  → caption, helper text
sm:   14px / 0.875rem → secondary text
base: 16px / 1rem     → body text (default)
lg:   18px / 1.125rem → emphasized body
xl:   20px / 1.25rem  → small heading
2xl:  24px / 1.5rem   → heading 3
3xl:  30px / 1.875rem → heading 2
4xl:  36px / 2.25rem  → heading 1
```

### Line height

```css
.text-tight { line-height: 1.25; }    /* heading */
.text-normal { line-height: 1.5; }    /* body (default) */
.text-relaxed { line-height: 1.75; }  /* long-form content */
```

### Font weight

```css
.font-normal { font-weight: 400; }    /* body text */
.font-medium { font-weight: 500; }    /* emphasized text */
.font-semibold { font-weight: 600; }  /* heading, button */
.font-bold { font-weight: 700; }      /* strong heading */
```

Jangan pakai font-weight: 900 kecuali untuk hero text — terlalu berat.

### Readability rules

1. **Body text minimum 16px** — 14px terlalu kecil untuk dibaca lama
2. **Line length maksimal 70 karakter** — lebih dari itu susah dibaca
3. **Line height body text 1.5** — jangan 1.2, terlalu rapat
4. **Contrast text-background minimum 4.5:1** — WCAG AA

```css
/* ❌ Readability buruk */
.article {
  font-size: 14px;
  line-height: 1.2;
  max-width: 100%; /* bisa 150+ karakter per baris */
}

/* ✅ Readability bagus */
.article {
  font-size: 16px;
  line-height: 1.5;
  max-width: 65ch; /* ~65 karakter per baris */
}
```

---

## 5. Component patterns — professional, not flashy

### Button

```css
/* ❌ Button norak — gradient, shadow berlebihan, transition 0.5s */
.button {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  transition: all 0.5s ease;
  border-radius: 50px;
}

/* ✅ Button professional — solid, subtle hover, fast transition */
.button {
  background: var(--color-primary);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background 0.15s ease;
}

.button:hover {
  background: var(--color-primary-hover);
}

.button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Card

```css
/* ❌ Card SMK — shadow berlebihan, border gradient */
.card {
  border: 2px solid;
  border-image: linear-gradient(135deg, #667eea 0%, #764ba2 100%) 1;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  border-radius: 20px;
}

/* ✅ Card professional — subtle border, soft shadow */
.card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.card:hover {
  box-shadow: var(--shadow-md);
}
```

### Input

```css
/* ❌ Input SMK — border berubah warna random, shadow dalam */
.input {
  border: 2px solid #3498db;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.3);
}

.input:focus {
  border-color: #2ecc71;
  box-shadow: 0 0 20px rgba(52, 152, 219, 0.8);
}

/* ✅ Input professional — subtle focus state */
.input {
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-base);
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}
```

---

## 6. Animation — subtle, fast, purposeful

### Aturan animasi

1. **Transition duration: 150ms-300ms** — cepat, tidak mengganggu
2. **Easing: ease atau ease-out** — natural, tidak robotic
3. **Animate maksimal 2 property** — jangan `transition: all`
4. **Purposeful**: animasi harus memberi feedback, bukan dekorasi

```css
/* ❌ Animasi berlebihan */
.button {
  transition: all 0.5s ease-in-out;
}

.button:hover {
  transform: scale(1.2) rotate(5deg);
  box-shadow: 0 20px 40px rgba(0,0,0,0.5);
}

/* ✅ Animasi subtle */
.button {
  transition: background 0.15s ease, transform 0.15s ease;
}

.button:hover {
  background: var(--color-primary-hover);
}

.button:active {
  transform: scale(0.98); /* subtle feedback saat click */
}
```

### Loading state

```css
/* ❌ Spinner rainbow berputar 2 detik per putaran */
@keyframes spin {
  from { transform: rotate(0deg); filter: hue-rotate(0deg); }
  to { transform: rotate(360deg); filter: hue-rotate(360deg); }
}

.spinner {
  animation: spin 2s linear infinite;
}

/* ✅ Spinner simple, cepat */
@keyframes spin {
  to { transform: rotate(360deg); }
}

.spinner {
  border: 2px solid var(--color-gray-200);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  width: 20px;
  height: 20px;
  animation: spin 0.6s linear infinite;
}
```

---

## 7. Layout — clear hierarchy, breathing room

### Whitespace bukan musuh

```css
/* ❌ Layout cramped — semua rapat, tidak ada ruang bernafas */
.container {
  padding: 8px;
}

.section {
  margin-bottom: 12px;
}

.card {
  padding: 10px;
  gap: 6px;
}

/* ✅ Layout proper — cukup whitespace untuk readability */
.container {
  padding: var(--space-4); /* 16px */
  max-width: 1280px;
  margin: 0 auto;
}

.section {
  margin-bottom: var(--space-12); /* 48px */
}

.card {
  padding: var(--space-6); /* 24px */
  gap: var(--space-4); /* 16px */
}
```

### Grid/Flexbox — predictable, maintainable

```css
/* ❌ Layout fragile — float, absolute positioning sembarangan */
.card {
  float: left;
  width: 30%;
  margin-right: 3%;
}

.badge {
  position: absolute;
  top: -5px;
  right: -8px;
}

/* ✅ Layout modern — grid/flex dengan gap */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-6);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
}
```

---

## 8. Checklist sebelum commit styling

Sebelum commit styling, pastikan:

- [ ] **Tidak ada hard-coded color value** di component — semua dari design tokens
- [ ] **Spacing pakai system** — kelipatan 4px atau dari tokens
- [ ] **Font size dari type scale** — bukan random 17px atau 23px
- [ ] **Shadow maksimal 2 layer** — tidak ada shadow 5 layer seperti Material Design 2014
- [ ] **Gradient hanya kalau perlu** — solid color dulu
- [ ] **Transition < 300ms** — tidak ada animasi 0.5s atau 1s
- [ ] **Contrast text minimum 4.5:1** — cek dengan WebAIM atau Chrome DevTools
- [ ] **Button/Input/Card terlihat modern** — bukan Bootstrap 3 atau SMK 2016
- [ ] **Responsive di mobile** — tidak ada text overflow atau horizontal scroll
- [ ] **Focus state visible** — keyboard navigation harus jelas

---

## 9. Tools untuk validate

### Color contrast
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- Chrome DevTools → Inspect element → "Show more" → Contrast ratio

### Spacing/Typography audit
- Browser DevTools → Computed styles → lihat semua padding/margin/font-size
- Kalau ada value random (17px, 23px, 31px) — red flag

### Design system check
- Semua warna di page harus dari palette yang defined
- Semua spacing harus dari scale yang defined
- Kalau ada outlier — hapus atau masukkan ke system

---

## 10. Framework-specific notes

### Tailwind
- Jangan override arbitrary value tanpa alasan: `p-[17px]` → gunakan `p-4`
- Extend theme di `tailwind.config.js` untuk custom tokens
- Pakai `@apply` untuk component dengan banyak utility (tapi jangan berlebihan)

### CSS Modules / SCSS
- Import `_tokens.scss` di setiap file yang butuh
- Gunakan variables, jangan hard-code
- Nested selector maksimal 3 level — lebih dari itu code smell

### CSS-in-JS (Styled Components, Emotion)
- Buat `theme` object untuk tokens
- Pakai `ThemeProvider` untuk akses global
- Hindari inline style object di JSX — extract ke styled component

### Inline style (last resort)
- Hanya untuk dynamic value yang tidak bisa di CSS (mis: width dari state)
- Jangan untuk static styling — pakai class/styled component

---

## Real-world example: Card component comparison

### ❌ SMK 2016 vibes

```css
.card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: 3px solid #fff;
  border-radius: 25px;
  padding: 15px 18px;
  box-shadow: 
    0 5px 15px rgba(0,0,0,0.3),
    0 10px 30px rgba(102, 126, 234, 0.4);
  transition: all 0.5s ease-in-out;
}

.card:hover {
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
}

.card-title {
  font-size: 22px;
  color: #fff;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  font-weight: 900;
}

.card-body {
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  line-height: 1.3;
}
```

### ✅ Professional, senior-level

```css
.card {
  background: white;
  border: 1px solid var(--color-gray-200);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.15s ease, border-color 0.15s ease;
}

.card:hover {
  border-color: var(--color-gray-300);
  box-shadow: var(--shadow-md);
}

.card-title {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-gray-900);
  line-height: var(--leading-tight);
  margin-bottom: var(--space-2);
}

.card-body {
  font-size: var(--text-base);
  color: var(--color-gray-700);
  line-height: var(--leading-normal);
}
```

**Perbedaan**:
- Gradient → Solid white
- Shadow 2-layer heavy → Shadow 1-layer subtle
- Transform rotate → Subtle shadow change
- Text shadow → No text shadow (unnecessary)
- Font weight 900 → Font weight 600 (readable)
- Random spacing → Token-based spacing
- Random colors → Semantic tokens

---

## Summary

**Styling yang proper untuk senior engineer**:

1. **Design tokens** — single source of truth untuk warna, spacing, typography
2. **Color system** — palette konsisten, contrast accessible (WCAG AA minimum)
3. **Spacing grid** — kelipatan 4px atau 8px, tidak ada random value
4. **Typography scale** — ratio 1.125 atau 1.25, line height proper
5. **Component patterns** — subtle, professional, tidak norak
6. **Animation** — 150-300ms, purposeful, tidak dekoratif
7. **Layout** — whitespace cukup, grid/flex modern
8. **Validation** — contrast checker, design system audit

**Anti-pattern yang harus dihindari**:
- Warna random tanpa system
- Spacing sembarangan (17px, 23px, 31px)
- Shadow berlebihan (3+ layer)
- Gradient untuk gradient (tanpa tujuan)
- Font size chaos (tidak ada type scale)
- Animasi lambat (> 300ms) atau berlebihan
- Transform rotate/scale berlebihan pada hover
- Text shadow yang tidak perlu
- Border/radius terlalu besar (50px radius untuk button)

**Prinsip utama**: Styling harus mendukung content dan UX, bukan jadi pusat perhatian. Kalau user notice styling-nya, kemungkinan styling-nya salah.
