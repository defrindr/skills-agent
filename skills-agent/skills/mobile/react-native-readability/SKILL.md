---
name: react-native-readability
description: >
  Panduan membangun dan mereview project React Native (Expo atau bare) dengan TypeScript,
  memahami JS thread vs native thread, komponen yang efisien, navigasi bersih
  dengan React Navigation, dan kode yang tidak terasa seperti React Web yang dipaksa mobile.
  Gunakan skill ini saat init project React Native, membuat screen baru, code review,
  refactor komponen, setup navigasi, atau saat project berantakan dengan ScrollView + map
  yang berat, SafeAreaView yang hilang, dan layout berbeda antara iOS dan Android.
  Trigger: "setup react native", "init react native", "expo", "react native component",
  "react native navigation", "react native typescript", "react native flatlist",
  "react native performance", "react native ios android", "review react native",
  "react native best practice", "react native structure".
---

# React Native Readability Skill

React Native bukan React yang di-compile ke native. Ada dua runtime yang berbicara lewat bridge: **JS thread** tempat kode berjalan, dan **native thread** tempat UI dirender. Komunikasi antara keduanya mahal — operasi berat di JS thread akan terasa di UI.

> Untuk naming, folder structure, komentar, test naming, Git, dan API response shape — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk React Native dan mobile environment.

---

## 0. Karakter React Native yang harus dijaga

### `FlatList`, bukan `ScrollView + map`

```tsx
// ❌ ScrollView + map — semua item dirender sekaligus, crash di 1000+ item
<ScrollView>
  {orders.map(order => <OrderCard key={order.id} order={order} />)}
</ScrollView>

// ✅ FlatList — hanya render yang terlihat di viewport
<FlatList
  data={orders}
  keyExtractor={item => item.id}
  renderItem={({ item }) => <OrderCard order={item} />}
  removeClippedSubviews
  maxToRenderPerBatch={10}
/>
```

### `SafeAreaView` selalu ada — dari `react-native-safe-area-context`

```tsx
// ❌ Konten bisa tertutup notch atau home indicator
<View style={styles.container}>...</View>

// ✅ SafeAreaView dari library (bukan dari react-native — versi bawaan tidak reliable)
import { SafeAreaView } from "react-native-safe-area-context"
<SafeAreaView style={styles.container} edges={["top", "bottom"]}>...</SafeAreaView>
```

### `useWindowDimensions`, bukan `Dimensions.get`

```tsx
// ❌ Tidak update saat rotasi
const { width } = Dimensions.get("window")

// ✅ Reactive terhadap perubahan ukuran layar
const { width } = useWindowDimensions()
```

### `Pressable`, bukan `TouchableOpacity`

```tsx
// ❌ API lama
<TouchableOpacity onPress={handlePress}><Text>Press</Text></TouchableOpacity>

// ✅ API baru — visual feedback bisa dikustomisasi per state
<Pressable
  onPress={handlePress}
  style={({ pressed }) => [styles.button, pressed && styles.pressed]}
>
  <Text>Press</Text>
</Pressable>
```

### `StyleSheet.create`, bukan inline style

```tsx
// ❌ Inline style — object baru dibuat setiap render
<View style={{ padding: 16, backgroundColor: "#fff", borderRadius: 8 }}>

// ✅ StyleSheet.create — di-serialize sekali saat load, lebih cepat
const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff", borderRadius: 8 },
})
<View style={styles.container}>
```

### Platform-specific — pakai file extension, bukan if-else untuk hal besar

```tsx
// Untuk perbedaan kecil — Platform.select
shadow: Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 4 },
  android: { elevation: 4 },
})

// Untuk perbedaan besar — file terpisah
// DatePicker.ios.tsx
// DatePicker.android.tsx
// Metro bundler pilih file yang tepat otomatis
```

---

## 1. Struktur folder

Feature-first sesuai `common/project-readability`. Tambahan untuk React Native:

```
src/
├── features/
│   └── orders/
│       ├── screens/           ← screen = entry point navigasi
│       │   ├── OrderListScreen.tsx
│       │   └── OrderDetailScreen.tsx
│       ├── components/        ← widget yang dipakai di screen ini
│       │   └── OrderCard.tsx
│       └── hooks/
│           └── useOrders.ts
├── navigation/
│   ├── AppNavigator.tsx       ← root navigator
│   └── types.ts               ← RootStackParamList, OrderStackParamList
└── App.tsx
```

Screen = entry point yang terhubung ke navigator. Komponen = UI piece yang bisa dipakai di mana saja.

---

## 2. Navigasi dengan React Navigation — type-safe

```typescript
// src/navigation/types.ts
export type OrderStackParamList = {
  OrderList: undefined
  OrderDetail: { orderId: string }
}

// Screen — props typed, tidak ada as any
type Props = NativeStackScreenProps<OrderStackParamList, "OrderDetail">

function OrderDetailScreen({ route, navigation }: Props) {
  const { orderId } = route.params  // typed
}
```

---

## 3. Screen tipis — logic di hooks

```tsx
// ❌ Screen yang berisi semua logic
function OrderListScreen() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  // ... fetch, refresh, cancel logic ...
}

// ✅ Screen hanya menampilkan
function OrderListScreen() {
  const { orders, isLoading, refetch, isRefreshing } = useOrders()

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
        ListEmptyComponent={isLoading ? <LoadingSpinner /> : <EmptyOrderList />}
      />
    </SafeAreaView>
  )
}
```

---

## 4. Keyboard handling

iOS dan Android handle keyboard berbeda — wajib pakai `behavior` yang tepat per platform.

```tsx
<SafeAreaView style={{ flex: 1 }}>
  <KeyboardAvoidingView
    style={{ flex: 1 }}
    behavior={Platform.OS === "ios" ? "padding" : "height"}
  >
    <ScrollView keyboardShouldPersistTaps="handled">
      {/* Form content */}
    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

---

## 5. Tooling

```bash
# Expo (recommended untuk project baru)
npx create-expo-app@latest my-app

npx expo install \
  @react-navigation/native \
  @react-navigation/native-stack \
  react-native-screens \
  react-native-safe-area-context \
  @tanstack/react-query \
  zustand

npm install -D @testing-library/react-native
```

`app.json`:
```json
{
  "expo": {
    "name": "My App",
    "orientation": "portrait",
    "newArchEnabled": true
  }
}
```
