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

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk React Native dan mobile environment.
> 
> **Jangan over-engineer**: Simple project ≠ butuh Zustand, startup ≠ butuh Context API per feature, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

---

## 0. Karakter React Native yang harus dijaga

### `FlatList`, bukan `ScrollView + map`

```tsx
// ✅ FlatList — hanya render yang terlihat
<FlatList data={orders} keyExtractor={i => i.id} renderItem={({ item }) => <OrderCard order={item} />} removeClippedSubviews maxToRenderPerBatch={10} />
// ❌ ScrollView + map — render semua item, crash di 1000+
```

### `SafeAreaView` dari `react-native-safe-area-context`

```tsx
import { SafeAreaView } from "react-native-safe-area-context"
<SafeAreaView edges={["top", "bottom"]}>...</SafeAreaView>
// jangan pakai yg bawaan react-native — tidak reliable
```

### `useWindowDimensions`, bukan `Dimensions.get`

```tsx
const { width } = useWindowDimensions()  // ✅ reactive terhadap rotasi
// ❌ Dimensions.get("window") — tidak update saat rotasi
```

### `Pressable`, bukan `TouchableOpacity`

```tsx
<Pressable onPress={handlePress} style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}>
  <Text>Press</Text>
</Pressable>
```

### `StyleSheet.create`, bukan inline

```tsx
const styles = StyleSheet.create({ container: { padding: 16, backgroundColor: "#fff", borderRadius: 8 } })
// ❌ inline style = object baru tiap render
```

### Platform-specific — file extension untuk beda besar

```tsx
// kecil: Platform.select({ ios: { shadowOpacity: 0.1 }, android: { elevation: 4 } })
// besar: DatePicker.ios.tsx / DatePicker.android.tsx — Metro pilih otomatis
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
function OrderListScreen() {
  const { orders, isLoading, refetch, isRefreshing } = useOrders() // ✅ logic di hook
  return (
    <SafeAreaView style={styles.container}>
      <FlatList data={orders} keyExtractor={i => i.id} renderItem={({ item }) => <OrderCard order={item} />}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refetch} />}
        ListEmptyComponent={isLoading ? <LoadingSpinner /> : <EmptyOrderList />} />
    </SafeAreaView>
  )
}
// ❌ jangan: useState + fetch di screen langsung
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
