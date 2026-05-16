---
name: react-native-readability
description: >
  Panduan membangun dan mereview project React Native (dengan atau tanpa Expo) dengan readability tinggi,
  struktur feature-first, navigasi yang bersih, state management yang tidak over-engineered,
  boundary API yang jelas, dan kode yang tidak terasa seperti template AI mentah.
  Gunakan skill ini saat init project React Native atau Expo, code review, refactor screen/component,
  setup navigasi, API integration, form handling, state management, testing, atau saat project
  mulai punya screen 400 baris, inline style bertumpuk, `useEffect` yang mengerjakan banyak hal,
  atau komponen yang fetch data langsung dari dalam render.
  Trigger: "setup react native", "init expo", "react native structure", "expo router",
  "react native navigation", "react native component", "react native api", "react native state",
  "react native testing", "review react native", "react native typescript",
  "react native zustand", "react native tanstack query".
---

# React Native Readability Skill

Skill ini adalah versi React Native dari `project-readability`.

React Native punya tantangan unik dibanding React web: navigasi berbasis stack/tab, platform-specific behavior (iOS vs Android), StyleSheet yang verbose, dan akses ke native module. Tanpa struktur yang jelas, project cepat jadi kumpulan screen besar yang masing-masing mengerjakan terlalu banyak.

Tujuan skill ini: **React Native project yang punya boundary, mudah dinavigasi, dan tidak perlu dibaca dari awal untuk menambah satu fitur baru.**

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Platform-specific quirk itu nyata — tapi tidak jadi alasan untuk skip struktur yang readable.

---

## 0. Taste rules

| Rule | Artinya di React Native |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Jangan bikin `BaseScreen`, `useBaseNavigation`, atau `createFormScreen` sampai ada 3+ screen yang benar-benar identik polanya. |
| Prefer boring code. | StyleSheet eksplisit per komponen lebih baik dari styling library yang butuh dokumentasi tersendiri. |
| Nama harus menjelaskan intent. | `OrderDetailScreen`, `useOrderDetail`, `cancelOrder` lebih baik dari `DetailScreen`, `useData`, `handle`. |
| Error harus actionable. | `Alert.alert('Error', 'Something went wrong')` tidak membantu. Tampilkan apa yang salah. |
| API boundary harus jelas. | `snake_case` dari backend selesai di `api/` layer, tidak bocor ke screen atau component. |

---

## 1. Struktur folder: feature-first

```txt
src/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── ForgotPasswordScreen.tsx
│   │   ├── components/
│   │   │   └── LoginForm.tsx
│   │   ├── api/
│   │   │   ├── auth.api.ts
│   │   │   └── auth.mapper.ts
│   │   ├── hooks/
│   │   │   └── useLoginForm.ts
│   │   ├── schemas/
│   │   │   └── auth.schema.ts
│   │   ├── types/
│   │   │   └── auth.types.ts
│   │   └── index.ts
│   │
│   └── orders/
│       ├── screens/
│       │   ├── OrderListScreen.tsx
│       │   └── OrderDetailScreen.tsx
│       ├── components/
│       │   ├── OrderCard.tsx
│       │   └── OrderStatusBadge.tsx
│       ├── api/
│       │   ├── orders.api.ts
│       │   └── orders.mapper.ts
│       ├── hooks/
│       │   ├── useOrderList.ts
│       │   └── useOrderDetail.ts
│       ├── types/
│       │   └── orders.types.ts
│       └── index.ts
│
├── shared/
│   ├── api/
│   │   └── client.ts
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── ErrorView.tsx
│   │   └── LoadingView.tsx
│   ├── hooks/
│   │   └── useDisclosure.ts
│   └── types/
│       └── api.types.ts
│
└── app/
    ├── index.tsx        ← entrypoint
    ├── navigation/
    │   ├── RootNavigator.tsx
    │   ├── AuthNavigator.tsx
    │   └── MainNavigator.tsx
    └── providers.tsx
```

---

## 2. Navigasi — typed dan terstruktur

Gunakan React Navigation dengan tipe eksplisit. Jangan `navigation.navigate('Screen')` tanpa type safety.

```ts
// app/navigation/types.ts
export type RootStackParamList = {
  Auth: undefined
  Main: undefined
}

export type AuthStackParamList = {
  Login: undefined
  ForgotPassword: { email?: string }
}

export type MainTabParamList = {
  Orders: undefined
  Profile: undefined
}

export type OrdersStackParamList = {
  OrderList: undefined
  OrderDetail: { orderId: string }
}
```

```tsx
// app/navigation/MainNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { MainTabParamList } from './types'

const Tab = createBottomTabNavigator<MainTabParamList>()

export function MainNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Orders" component={OrdersNavigator} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  )
}
```

Navigasi di screen: pakai `useNavigation` dengan generic type.

```tsx
// ❌ Tanpa type
const navigation = useNavigation()
navigation.navigate('OrderDetail', { orderId: id })

// ✅ Dengan type
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { OrdersStackParamList } from '../../app/navigation/types'

type NavigationProp = NativeStackNavigationProp<OrdersStackParamList>

const navigation = useNavigation<NavigationProp>()
navigation.navigate('OrderDetail', { orderId: id })
```

---

## 3. Screen tipis — hook yang berisi logic

Screen bertugas: layout, navigasi, render state dari hook. Tidak lebih.

```tsx
// features/orders/screens/OrderDetailScreen.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRoute } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { LoadingView } from '../../../shared/components/LoadingView'
import { ErrorView } from '../../../shared/components/ErrorView'
import { useOrderDetail } from '../hooks/useOrderDetail'
import type { OrdersStackParamList } from '../../../app/navigation/types'

type Props = NativeStackScreenProps<OrdersStackParamList, 'OrderDetail'>

export function OrderDetailScreen({ route }: Props) {
  const { orderId } = route.params
  const { order, isLoading, error, cancelOrder, isCancelling } = useOrderDetail(orderId)

  if (isLoading) return <LoadingView />
  if (error) return <ErrorView message="Failed to load order. Pull down to retry." />

  return (
    <View style={styles.container}>
      <Text style={styles.orderNumber}>Order #{order.orderNumber}</Text>
      <Text>Total: {formatCurrency(order.totalAmount)}</Text>

      {order.paymentStatus === 'pending' && (
        <Pressable
          style={styles.cancelButton}
          onPress={() => cancelOrder()}
          disabled={isCancelling}
        >
          <Text>{isCancelling ? 'Cancelling...' : 'Cancel Order'}</Text>
        </Pressable>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  orderNumber: { fontSize: 18, fontWeight: '600' },
  cancelButton: { marginTop: 16, padding: 12, backgroundColor: '#ef4444', borderRadius: 8 },
})
```

---

## 4. API boundary — `snake_case` selesai di `api/`

Sama persis dengan React web. Backend boleh `snake_case`, screen tidak boleh tahu soal itu.

```ts
// features/orders/types/orders.types.ts
export type OrderApiResponse = {
  id: string
  order_number: string
  total_amount: number
  payment_status: 'pending' | 'paid' | 'failed'
  created_at: string
}

export type Order = {
  id: string
  orderNumber: string
  totalAmount: number
  paymentStatus: 'pending' | 'paid' | 'failed'
  createdAt: string
}
```

```ts
// features/orders/api/orders.mapper.ts
import type { Order, OrderApiResponse } from '../types/orders.types'

export function mapOrderFromApi(raw: OrderApiResponse): Order {
  return {
    id: raw.id,
    orderNumber: raw.order_number,
    totalAmount: raw.total_amount,
    paymentStatus: raw.payment_status,
    createdAt: raw.created_at,
  }
}
```

---

## 5. State management

```txt
State lokal UI (loading, modal, input) → useState
Server state (data dari API) → TanStack Query
Global state yang benar-benar global (auth session) → Zustand
```

Jangan taruh data dari API di Zustand kalau bisa pakai TanStack Query. TanStack Query handle caching, refetching, stale state. Zustand untuk session, preferences, UI state yang perlu persist.

```ts
// shared/stores/auth.store.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type AuthState = {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

---

## 6. Platform-specific — eksplisit, bukan magic

```tsx
// ❌ Style magic yang tidak jelas
const shadowStyle = Platform.OS === 'ios'
  ? { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }
  : { elevation: 4 }

// Tersebar di 12 komponen berbeda

// ✅ Ekstrak sekali di shared
// shared/styles/shadows.ts
import { Platform, StyleSheet } from 'react-native'

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  android: {
    elevation: 4,
  },
  default: {},
})
```

Platform-specific file: gunakan `.ios.tsx` / `.android.tsx` hanya kalau perbedaannya signifikan. Jangan bikin dua file untuk perbedaan satu warna.

---

## 7. Styling — StyleSheet, bukan inline

```tsx
// ❌
<View style={{ flex: 1, padding: 16, backgroundColor: '#fff' }}>
  <Text style={{ fontSize: 18, fontWeight: '600', color: '#111' }}>Title</Text>
</View>

// ✅
<View style={styles.container}>
  <Text style={styles.title}>Title</Text>
</View>

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', color: '#111' },
})
```

StyleSheet di bagian bawah file, setelah component. Beri nama yang menjelaskan elemen, bukan warna atau posisi.

---

## 8. Testing

```tsx
// features/orders/screens/OrderDetailScreen.test.tsx
import { render, screen } from '@testing-library/react-native'
import { describe, it, expect, vi } from 'vitest'

describe('OrderDetailScreen', () => {
  it('shows loading indicator while fetching order', () => {
    vi.mock('../hooks/useOrderDetail', () => ({
      useOrderDetail: () => ({ isLoading: true, order: null, error: null }),
    }))

    render(<OrderDetailScreen route={{ params: { orderId: '1' } } as any} navigation={null as any} />)

    expect(screen.getByTestId('loading-indicator')).toBeOnTheScreen()
  })

  it('shows cancel button only for pending orders', () => {
    vi.mock('../hooks/useOrderDetail', () => ({
      useOrderDetail: () => ({
        isLoading: false,
        order: { id: '1', orderNumber: 'ORD-001', paymentStatus: 'pending', totalAmount: 50000, createdAt: '' },
        error: null,
        cancelOrder: vi.fn(),
        isCancelling: false,
      }),
    }))

    render(<OrderDetailScreen route={{ params: { orderId: '1' } } as any} navigation={null as any} />)

    expect(screen.getByRole('button', { name: /cancel/i })).toBeOnTheScreen()
  })
})
```

Nama test = dokumentasi behavior, bukan teknikal description.
