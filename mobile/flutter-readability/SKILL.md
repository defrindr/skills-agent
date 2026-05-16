---
name: flutter-readability
description: >
  Panduan membangun dan mereview project Flutter dengan readability tinggi,
  struktur feature-first, state management dengan Riverpod, repository pattern yang bersih,
  widget decomposition yang tepat, dan kode Dart yang tidak terasa seperti output AI mentah.
  Gunakan skill ini saat init project Flutter, code review, refactor widget/provider/repository,
  setup API client, form handling, navigasi, testing, atau saat project Flutter mulai punya
  widget 500 baris, business logic di dalam `build()`, state management yang tersebar,
  atau `setState` yang dipakai untuk hal-hal yang seharusnya global.
  Trigger: "setup flutter", "init flutter", "flutter structure", "flutter riverpod",
  "flutter provider", "flutter bloc", "flutter widget", "flutter api", "flutter testing",
  "review flutter", "flutter dart", "flutter clean architecture", "flutter go_router".
---

# Flutter Readability Skill

Skill ini adalah versi Flutter dari `project-readability`.

Flutter memudahkan banyak hal — hot reload, widget system, native performance. Tapi karena semuanya berbasis widget, project yang tidak terstuktur cepat berakhir dengan `build()` method yang mengerjakan data fetching, logic, dan rendering sekaligus. Belum lagi pilihan state management yang terlalu banyak sehingga orang sering ganti-ganti di satu project.

Tujuan skill ini:

- Flutter project yang punya boundary jelas antara data, logic, dan UI
- State management dengan Riverpod (default recommendation, bukan BLoC)
- Widget yang bisa dibaca tanpa harus tahu konteks penuh project
- Testing yang dokumentasi behavior

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Boring Dart lebih baik dari clever Dart. Widget tipis lebih baik dari widget yang melakukan segalanya.

---

## 0. Taste rules

| Rule | Artinya di Flutter |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Jangan bikin `BaseRepository<T>`, `GenericNotifier<T>`, atau abstract widget factory sampai ada 3+ case identik. |
| Prefer boring code. | `Consumer` dengan `AsyncValue.when()` yang eksplisit lebih baik dari reactive chain yang susah di-debug. |
| Nama harus menjelaskan intent. | `OrderDetailScreen`, `orderDetailProvider`, `cancelOrder` lebih baik dari `DetailPage`, `dataProvider`, `handlePress`. |
| Error harus actionable. | Jangan tampilkan `Error`. Tampilkan apa yang salah dan apa yang user bisa lakukan. |
| API boundary harus jelas. | `snake_case` dari backend selesai di repository/mapper, tidak bocor ke UI layer. |

---

## 1. Struktur folder: feature-first

```txt
lib/
├── features/
│   ├── auth/
│   │   ├── screens/
│   │   │   ├── login_screen.dart
│   │   │   └── forgot_password_screen.dart
│   │   ├── widgets/
│   │   │   └── login_form.dart
│   │   ├── providers/
│   │   │   └── auth_provider.dart
│   │   ├── repositories/
│   │   │   └── auth_repository.dart
│   │   ├── models/
│   │   │   └── auth_models.dart
│   │   └── auth.dart             ← barrel export
│   │
│   └── orders/
│       ├── screens/
│       │   ├── order_list_screen.dart
│       │   └── order_detail_screen.dart
│       ├── widgets/
│       │   ├── order_card.dart
│       │   └── order_status_badge.dart
│       ├── providers/
│       │   ├── order_list_provider.dart
│       │   └── order_detail_provider.dart
│       ├── repositories/
│       │   └── orders_repository.dart
│       ├── models/
│       │   └── order_models.dart
│       └── orders.dart
│
├── shared/
│   ├── api/
│   │   ├── api_client.dart
│   │   └── api_response.dart
│   ├── errors/
│   │   ├── app_error.dart
│   │   └── error_code.dart
│   ├── widgets/
│   │   ├── loading_view.dart
│   │   ├── error_view.dart
│   │   └── primary_button.dart
│   └── utils/
│       └── currency_formatter.dart
│
└── app/
    ├── main.dart
    ├── router.dart
    └── providers.dart
```

---

## 2. Model — `fromJson` eksplisit, bukan magic

```dart
// features/orders/models/order_models.dart

// Shape dari API — field name mengikuti JSON key
class OrderApiResponse {
  final String id;
  final String orderNumber;   // sudah di-rename dari order_number di factory
  final double totalAmount;
  final String paymentStatus;
  final String createdAt;

  const OrderApiResponse({
    required this.id,
    required this.orderNumber,
    required this.totalAmount,
    required this.paymentStatus,
    required this.createdAt,
  });

  factory OrderApiResponse.fromJson(Map<String, dynamic> json) {
    return OrderApiResponse(
      id: json['id'] as String,
      orderNumber: json['order_number'] as String,
      totalAmount: (json['total_amount'] as num).toDouble(),
      paymentStatus: json['payment_status'] as String,
      createdAt: json['created_at'] as String,
    );
  }
}
```

Jangan:

```dart
// ❌ Return Map<String, dynamic> dari repository
Future<Map<String, dynamic>> getOrder(String id) async { ... }

// ❌ json_serializable magic tanpa pengertian shape-nya
@JsonSerializable()
class Order { ... }
// lalu tidak ada test mapper-nya
```

---

## 3. Repository — boundary antara API dan app

Repository bertugas: call API, parse response, handle error, return typed model.

```dart
// features/orders/repositories/orders_repository.dart
import 'package:myapp/shared/api/api_client.dart';
import 'package:myapp/shared/errors/app_error.dart';
import '../models/order_models.dart';

class OrdersRepository {
  final ApiClient _client;

  const OrdersRepository({required ApiClient client}) : _client = client;

  Future<OrderApiResponse> getOrderById(String orderId) async {
    final response = await _client.get('/orders/$orderId');

    if (!response.ok) {
      throw AppError.fromApiResponse(response.error);
    }

    return OrderApiResponse.fromJson(response.data as Map<String, dynamic>);
  }

  Future<OrderApiResponse> cancelOrder(String orderId) async {
    final response = await _client.post('/orders/$orderId/cancel');

    if (!response.ok) {
      throw AppError.fromApiResponse(response.error);
    }

    return OrderApiResponse.fromJson(response.data as Map<String, dynamic>);
  }
}
```

---

## 4. Provider dengan Riverpod

Gunakan Riverpod. Tidak perlu BLoC untuk kebanyakan use-case.

```dart
// features/orders/providers/order_detail_provider.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../repositories/orders_repository.dart';
import '../models/order_models.dart';

// Inject repository via provider
final ordersRepositoryProvider = Provider<OrdersRepository>((ref) {
  return OrdersRepository(client: ref.read(apiClientProvider));
});

// Provider per order ID — auto-dispose saat tidak dipakai
final orderDetailProvider = FutureProvider.autoDispose.family<OrderApiResponse, String>(
  (ref, orderId) async {
    final repo = ref.read(ordersRepositoryProvider);
    return repo.getOrderById(orderId);
  },
);

// Provider untuk action (cancel order)
final cancelOrderProvider = Provider.autoDispose.family<Future<void> Function(), String>(
  (ref, orderId) {
    return () async {
      final repo = ref.read(ordersRepositoryProvider);
      await repo.cancelOrder(orderId);
      ref.invalidate(orderDetailProvider(orderId));
    };
  },
);
```

---

## 5. Screen tipis — widget yang berisi render

Screen tidak berisi business logic. Screen hanya layout + navigasi + render state dari provider.

```dart
// features/orders/screens/order_detail_screen.dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/order_detail_provider.dart';
import '../widgets/order_status_badge.dart';
import 'package:myapp/shared/widgets/loading_view.dart';
import 'package:myapp/shared/widgets/error_view.dart';

class OrderDetailScreen extends ConsumerWidget {
  final String orderId;

  const OrderDetailScreen({required this.orderId, super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final orderAsync = ref.watch(orderDetailProvider(orderId));

    return Scaffold(
      appBar: AppBar(title: const Text('Order Detail')),
      body: orderAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => ErrorView(
          message: 'Failed to load order. Tap to retry.',
          onRetry: () => ref.invalidate(orderDetailProvider(orderId)),
        ),
        data: (order) => _OrderDetailBody(order: order, orderId: orderId),
      ),
    );
  }
}

class _OrderDetailBody extends ConsumerWidget {
  final OrderApiResponse order;
  final String orderId;

  const _OrderDetailBody({required this.order, required this.orderId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cancelOrder = ref.read(cancelOrderProvider(orderId));

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Order #${order.orderNumber}', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          OrderStatusBadge(status: order.paymentStatus),
          const SizedBox(height: 16),
          if (order.paymentStatus == 'pending')
            ElevatedButton(
              onPressed: cancelOrder,
              child: const Text('Cancel Order'),
            ),
        ],
      ),
    );
  }
}
```

Pisah widget besar jadi widget kecil. `_OrderDetailBody` bukan `_Widget1`. Nama harus jelasin apa yang dirender.

---

## 6. Error handling

```dart
// shared/errors/app_error.dart
class AppError implements Exception {
  final String code;
  final String message;
  final int statusCode;

  const AppError({
    required this.code,
    required this.message,
    required this.statusCode,
  });

  factory AppError.fromApiResponse(Map<String, dynamic> errorBody) {
    return AppError(
      code: errorBody['code'] as String? ?? 'UNKNOWN_ERROR',
      message: errorBody['message'] as String? ?? 'An unknown error occurred.',
      statusCode: errorBody['statusCode'] as int? ?? 500,
    );
  }

  @override
  String toString() => 'AppError($code): $message';
}
```

```dart
// shared/errors/error_code.dart
abstract class ErrorCode {
  static const unauthorized = 'UNAUTHORIZED';
  static const forbidden = 'FORBIDDEN';
  static const notFound = 'NOT_FOUND';
  static const conflict = 'CONFLICT';
  static const validationFailed = 'VALIDATION_FAILED';
  static const internalError = 'INTERNAL_ERROR';
}
```

---

## 7. Naming Dart yang manusiawi

File: `snake_case.dart` (wajib, sesuai Dart convention).

Class: `PascalCase`.

```dart
// ❌
class orderDetail extends StatelessWidget {}
class OrderMgr {}
class OrderHelpers {}

// ✅
class OrderDetailScreen extends ConsumerWidget {}
class OrdersRepository {}
class OrderStatusBadge extends StatelessWidget {}
```

Method dan variable: `camelCase`, verb + noun.

```dart
// ❌
void getData() {}
void handleTap() {}
Future<void> process() {}

// ✅
Future<OrderApiResponse> fetchOrderById(String orderId) {}
void cancelOrder() {}
Future<void> markInvoiceAsPaid(String invoiceId) {}
```

Provider naming: nama resource + `Provider`.

```dart
// ❌
final provider1 = ...
final dataProvider = ...

// ✅
final orderDetailProvider = ...
final ordersRepositoryProvider = ...
final authSessionProvider = ...
```

---

## 8. Widget decomposition

Aturan sederhana: kalau `build()` lebih dari 50 baris, pecah jadi widget terpisah.

```dart
// ❌ Satu widget untuk segalanya
class OrderDetailScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // ... 200 baris untuk header, body, actions, modal, list, dll
    );
  }
}

// ✅ Pecah berdasarkan concern
class OrderDetailScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Order Detail')),
      body: _OrderDetailBody(orderId: orderId),
    );
  }
}

class _OrderDetailBody extends ConsumerWidget { ... }
class _OrderActions extends ConsumerWidget { ... }
class _OrderItemList extends StatelessWidget { ... }
```

---

## 9. Testing

```dart
// features/orders/repositories/orders_repository_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';

class MockApiClient extends Mock implements ApiClient {}

void main() {
  group('OrdersRepository.cancelOrder', () {
    test('throws AppError with NOT_FOUND when order does not exist', () async {
      final client = MockApiClient();
      final repo = OrdersRepository(client: client);

      when(() => client.post('/orders/999/cancel')).thenAnswer(
        (_) async => ApiResponse(ok: false, error: {'code': 'NOT_FOUND', 'message': 'Order not found.'}),
      );

      expect(
        () => repo.cancelOrder('999'),
        throwsA(isA<AppError>().having((e) => e.code, 'code', 'NOT_FOUND')),
      );
    });

    test('returns updated order on successful cancellation', () async {
      final client = MockApiClient();
      final repo = OrdersRepository(client: client);

      when(() => client.post('/orders/1/cancel')).thenAnswer(
        (_) async => ApiResponse(ok: true, data: validOrderJson),
      );

      final order = await repo.cancelOrder('1');
      expect(order.paymentStatus, 'cancelled');
    });
  });
}
```

Nama test = dokumentasi behavior. Group berdasarkan method/use-case yang dites.

---

## 10. Navigasi dengan go_router

```dart
// app/router.dart
import 'package:go_router/go_router.dart';

final router = GoRouter(
  routes: [
    GoRoute(
      path: '/',
      redirect: (_, __) => '/orders',
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/orders',
      builder: (context, state) => const OrderListScreen(),
      routes: [
        GoRoute(
          path: ':orderId',
          builder: (context, state) {
            final orderId = state.pathParameters['orderId']!;
            return OrderDetailScreen(orderId: orderId);
          },
        ),
      ],
    ),
  ],
);
```

Navigasi dari widget:

```dart
// ✅
context.go('/orders/$orderId')
context.push('/orders/$orderId')

// ❌ Navigator langsung tanpa go_router
Navigator.of(context).push(MaterialPageRoute(builder: (_) => OrderDetailScreen(orderId: id)))
```
