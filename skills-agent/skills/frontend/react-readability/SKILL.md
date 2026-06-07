---
name: react-readability
description: >
  Panduan membangun dan mereview project React + TypeScript + Vite dengan komponen
  yang bersih, state management yang tidak berlebihan, dan pemahaman yang benar tentang
  kapan pakai useEffect, useMemo, dan useCallback.
  Gunakan skill ini saat init project React, membuat komponen baru, code review,
  refactor komponen yang terlalu besar, setup testing, atau saat project berantakan
  dengan useEffect di mana-mana dan prop drilling 5 level.
  Trigger: "setup react", "init react", "react component", "react hooks", "react state",
  "react context", "react typescript", "react vite", "react testing", "review react",
  "react best practice", "react structure", "react zustand", "react query".
---

# React Readability Skill

React adalah fungsi dari state ke UI.

```
UI = f(state)
```

Beri React state, dia render UI. State berubah, UI ikut berubah. Model mental ini sangat simpel — tapi banyak yang merusaknya dengan `useEffect` yang salah tempat, state yang bisa dihitung tapi malah di-`useState`, dan `useCallback` yang ditambahkan "untuk optimasi" padahal bukan di situ bottleneck-nya.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk React dan mental model-nya.
> 
> **Jangan over-engineer**: Simple project ≠ butuh Zustand, startup ≠ butuh Context API per feature, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

---

## 0. Karakter React yang harus dijaga

### Data flows down, events bubble up

```tsx
// ❌ Child akses/modifikasi state parent langsung
function OrderItem({ order, orders, setOrders }) {
  const cancel = () => setOrders(orders.filter(o => o.id !== order.id))
  // ...
}

// ✅ Parent yang tahu apa harus dilakukan, child hanya report event
function OrderItem({ order, onCancel }: { order: Order; onCancel: (id: string) => void }) {
  return <button onClick={() => onCancel(order.id)}>Cancel</button>
}

function OrderList() {
  const [orders, setOrders] = useState<Order[]>([])
  const handleCancel = (id: string) => setOrders(prev => prev.filter(o => o.id !== id))
  return orders.map(o => <OrderItem key={o.id} order={o} onCancel={handleCancel} />)
}
```

### `useEffect` — hanya untuk efek samping ke sistem di luar React

`useEffect` ada untuk sync React dengan dunia luar: browser API, subscription, network. Bukan untuk bereaksi terhadap state change, bukan untuk derived state.

```tsx
// ❌ useEffect untuk derived state — anti-pattern
function OrderSummary({ items }: { items: OrderItem[] }) {
  const [total, setTotal] = useState(0)
  useEffect(() => {
    setTotal(items.reduce((sum, item) => sum + item.price, 0))
  }, [items])
  return <p>Total: {total}</p>
}

// ✅ Hitung langsung — tidak perlu state, tidak perlu effect
function OrderSummary({ items }: { items: OrderItem[] }) {
  const total = items.reduce((sum, item) => sum + item.price, 0)
  return <p>Total: {total}</p>
}
```

```tsx
// ❌ useEffect untuk merespons aksi user
function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState([])
  useEffect(() => {
    if (query) fetchResults(query).then(setResults)
  }, [query])
}

// ✅ TanStack Query — caching, error state, loading state gratis
function SearchBar() {
  const [query, setQuery] = useState("")
  const { data: results } = useQuery({
    queryKey: ["search", query],
    queryFn: () => fetchResults(query),
    enabled: query.length > 0,
  })
}
```

### `useMemo` dan `useCallback` bukan gratis

Keduanya menambahkan overhead (memory + comparison). Pakai hanya kalau ada masalah performa nyata, bukan preventif.

```tsx
// ❌ useMemo untuk operasi string — overhead > manfaat
const displayPrice = useMemo(() => `Rp ${product.price.toLocaleString()}`, [product.price])

// ✅
const displayPrice = `Rp ${product.price.toLocaleString()}`

// ✅ useMemo yang masuk akal — operasi berat atau referential equality
const sortedOrders = useMemo(
  () => [...orders].sort((a, b) => b.createdAt - a.createdAt),
  [orders]
)
```

---

## 1. Komponen kecil dan fokus

```tsx
// ❌ Komponen yang melakukan terlalu banyak
function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  // ... fetch logic, cancel logic, modal logic ...
  // ... 80 baris render
}

// ✅ Setiap lapisan satu tanggung jawab
function OrdersPage() {
  const { orders, isLoading, error } = useOrders()  // data di hook

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />

  return <OrderList orders={orders} />
}
```

---

## 2. State management — pilih yang tepat

- **Local UI** → `useState` | **Derived** → hitung langsung | **Server** → TanStack Query
- **Global UI** (auth, theme) → Zustand | **URL** (filter, page) → search params | **Form** → React Hook Form

```tsx
// ✅ Zustand — granular subscription, no Context re-render
export const useAuthStore = create<{ user: User | null; setUser: (u: User | null) => void }>(set => ({
  user: null, setUser: user => set({ user }),
}))
```

---

## 3. TypeScript — props eksplisit

```tsx
// ❌
function Button({ onClick, children, variant, disabled }) { ... }

// ✅
interface ButtonProps {
  onClick: () => void
  children: React.ReactNode
  variant?: "primary" | "secondary" | "destructive"
  disabled?: boolean
}

function Button({ onClick, children, variant = "primary", disabled = false }: ButtonProps) { ... }
```

---

## 4. Error Boundary

```tsx
export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() { return this.state.hasError ? (this.props.fallback ?? <p>Something went wrong.</p>) : this.props.children }
}
```

---

## 5. Tooling

```bash
npm create vite@latest my-app -- --template react-ts
npm install @tanstack/react-query zustand react-hook-form zod react-router-dom
npm install -D @testing-library/react @testing-library/jest-dom vitest jsdom
```
