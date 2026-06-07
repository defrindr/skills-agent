---
name: flutter-readability
description: >
  Panduan membangun dan mereview project Flutter + Dart dengan widget tree yang bersih,
  state management dengan Riverpod, immutable model dengan freezed, navigasi dengan go_router,
  dan kode Dart modern (null safety, sealed classes, pattern matching).
  Gunakan skill ini saat init project Flutter, membuat screen atau widget baru, code review,
  refactor widget yang terlalu besar, setup state management, atau saat project berantakan
  dengan setState di mana-mana dan BuildContext yang di-store ke variabel.
  Trigger: "setup flutter", "init flutter", "flutter widget", "flutter riverpod",
  "flutter go_router", "flutter freezed", "flutter state management", "flutter provider",
  "dart null safety", "flutter testing", "review flutter", "flutter best practice",
  "flutter structure", "flutter dart".
---

# Flutter Readability Skill

> **PENTING**: Untuk naming, komentar, test naming, Git, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Dart punya konvensi sendiri untuk file naming, class naming, dan folder structure — dicakup di bawah.
> **Jangan over-engineer**: Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project**.
>
> Skill ini hanya mencakup hal spesifik Flutter/Dart.

---

## 0. Karakter Flutter/Dart yang harus dijaga

### `const` = compile-time optimization
```dart
// ❌ Widget dibuat ulang setiap rebuild
Widget build(BuildContext context) {
  return Column(children: [Text("Hello"), SizedBox(height: 16)]);
}
// ✅ const widget di-reuse — Flutter skip rebuild
Widget build(BuildContext context) {
  return Column(children: [const Text("Hello"), const SizedBox(height: 16)]);
}
```

Gunakan `const` di mana pun memungkinkan — ini instruksi ke compiler.

### `StatelessWidget` sebelum `StatefulWidget`
```dart
// ❌ StatefulWidget tanpa state
class OrderCard extends StatefulWidget { ... }
class _OrderCardState extends State<OrderCard> {
  Widget build(BuildContext context) => Card(child: Text(widget.order.id));
}
// ✅
class OrderCard extends StatelessWidget {
  Widget build(BuildContext context) => Card(child: Text(order.id));
}
```

### `BuildContext` bisa stale setelah `await`
```dart
// ❌ Context mungkin sudah tidak valid setelah async gap
Future<void> handleSubmit() async {
  await service.submitOrder(order);
  Navigator.of(context).pop();  // widget mungkin sudah di-unmount
}
// ✅ Cek mounted
Future<void> handleSubmit() async {
  await service.submitOrder(order);
  if (!mounted) return;
  Navigator.of(context).pop();
}
```

### `late` adalah code smell
```dart
// ❌ late untuk menunda inisialisasi
class _ProfileState extends State<ProfileScreen> {
  late UserService _service;
  late String _displayName;
  @override void initState() {
    super.initState(); _service = UserService(); _displayName = "...";
  }
}
// ✅ Inisialisasi langsung atau getter
class _ProfileState extends State<ProfileScreen> {
  final _service = UserService();
  String get _displayName => "${widget.user.firstName} ${widget.user.lastName}";
}
```

### Dart 3 — sealed class + exhaustive pattern matching
```dart
// ❌ if-else yang compiler tidak bisa validasi
if (state is LoadingState) { ... }
else if (state is SuccessState) { ... }
else if (state is ErrorState) { ... }

// ✅ Sealed class + switch — compiler paksa handle semua case
sealed class OrderState {}
class OrderLoading extends OrderState {}
class OrderSuccess extends OrderState { final List<Order> orders; ... }
class OrderError extends OrderState { final String message; ... }

return switch (state) {
  OrderLoading() => const CircularProgressIndicator(),
  OrderSuccess(:final orders) => OrderList(orders: orders),
  OrderError(:final message) => ErrorWidget(message: message),
};
```

---

## 1. Struktur folder dan naming Dart

```
lib/
├── features/orders/
│   ├── presentation/ → order_list_screen.dart, widgets/order_card.dart
│   ├── providers/ → orders_provider.dart
│   └── data/ → orders_repository.dart, models/order.dart
├── shared/ ├── widgets/ └── theme/
├── router.dart └── main.dart
```

**Naming Dart:** File `snake_case.dart`, Class/enum `PascalCase`, function/variable `camelCase`.

---

## 2. Model dengan `freezed`

```dart
@freezed
class Order with _$Order {
  const factory Order({ required String id, required OrderStatus status,
    required double totalAmount, required DateTime createdAt, String? notes }) = _Order;
  factory Order.fromJson(Map<String, dynamic> json) => _$OrderFromJson(json);
}
enum OrderStatus { pending, confirmed, shipped, cancelled }
```

---

## 3. State management dengan Riverpod

```dart
@riverpod
class OrdersNotifier extends _$OrdersNotifier {
  @override Future<List<Order>> build() async => ref.read(ordersRepositoryProvider).getOrders();
  Future<void> cancelOrder(String orderId) async {
    await ref.read(ordersRepositoryProvider).cancelOrder(orderId); ref.invalidateSelf();
  }
}

// Di widget:
class OrderListScreen extends ConsumerWidget {
  const OrderListScreen({super.key});
  Widget build(BuildContext context, WidgetRef ref) {
    final ordersAsync = ref.watch(ordersNotifierProvider);
    return ordersAsync.when(
      loading: () => const CircularProgressIndicator(),
      error: (error, _) => Text(error.toString()),
      data: (orders) => OrderList(orders: orders),
    );
  }
}
```

---

## 4. Navigasi dengan `go_router`

```dart
@riverpod
GoRouter router(RouterRef ref) {
  final user = ref.watch(authStateProvider);
  return GoRouter(
    initialLocation: "/",
    redirect: (context, state) {
      if (user == null && state.matchedLocation != "/login") return "/login";
      if (user != null && state.matchedLocation == "/login") return "/";
      return null;
    },
    routes: [
      GoRoute(path: "/login", builder: (_, __) => const LoginScreen()),
      GoRoute(path: "/", builder: (_, __) => const OrderListScreen(), routes: [
        GoRoute(path: "orders/:orderId", builder: (_, state) => OrderDetailScreen(orderId: state.pathParameters["orderId"]!)),
      ]),
    ],
  );
}
```

---

## 5. Widget kecil — extract agresif

```dart
// ❌ build() panjang dan dalam
Widget build(BuildContext context) {
  return Scaffold(body: Column(children: [
    Container(padding: const EdgeInsets.all(16), child: Row(children: [
      CircleAvatar(backgroundImage: NetworkImage(user.avatarUrl), radius: 24),
      const SizedBox(width: 12),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(user.name), Text(user.email)]),
    ])),
    // 100 baris lagi...
  ]));
}
// ✅ Extract ke widget sendiri
Widget build(BuildContext context) {
  return Scaffold(body: Column(children: [UserHeader(user: user), ...]));
}
```

---

## 6. Tooling

```yaml
dependencies:
  flutter_riverpod: ^2.6.1 riverpod_annotation: ^2.6.1 go_router: ^14.0.0
  freezed_annotation: ^2.4.4 json_annotation: ^4.9.0 dio: ^5.7.0
dev_dependencies:
  build_runner: ^2.4.13 freezed: ^2.5.7 json_serializable: ^6.8.0
  riverpod_generator: ^2.6.1 flutter_lints: ^4.0.0
```

```bash
dart run build_runner build --delete-conflicting-outputs && flutter analyze && flutter test
```
