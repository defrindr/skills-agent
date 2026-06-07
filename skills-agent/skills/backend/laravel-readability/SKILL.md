---
name: laravel-readability
description: >
  Panduan init, review, refactor, dan maintenance project Laravel dengan readability tinggi,
  test coverage yang serius, dan struktur business-domain first. Gunakan skill ini setiap kali
  memulai project Laravel baru, code review, nulis dokumentasi, nyusun folder/module,
  memperbaiki service/controller/model yang mulai gemuk, standarisasi API response/error/request,
  validation/FormRequest, testing, coverage, queue/job, atau saat kodenya keliatan AI.

  EXCLUDES: Database schema design, migrations, Eloquent relationships, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer.
  project-readability.md adalah sumber utama: kalau ada konflik, readability dan coverage tests menang.
---

# Laravel Readability Skill

**CRITICAL: Defer to `common/project-readability`** untuk naming, folder structure, API response envelope, error handling, DRY, taste rules. Skill ini hanya mencakup hal spesifik Laravel.

Tujuan: gampang dibaca, gampang dites, gampang diubah besok.

---

## Struktur Folder — Scale-Aware

### Simple (MVP, < 10 models)
```
app/ ├── Http/Controllers/{Resource}Controller.php ├── Http/Requests/Store{Resource}Request.php
├── Models/{Resource}.php └── Services/{Resource}Service.php (optional)
```

### Medium (startup, 10-30 models, multiple features)
```
app/
├── Domain/{Domain}/ → {Entity}Controller.php, {Entity}.php, {Entity}Service.php, {Entity}Policy.php
│   ├── Requests/ ├── Actions/ ├── Data/ └── Tests/
├── Support/ → Api/, Errors/, Logging/
└── Integrations/{Provider}/
```

Pindah ke `app/Domain/*` saat satu fitur punya 5+ file terpisah, nama service mulai generic.

**Jangan DDD cosplay dari hari pertama.** `Application/Domain/Infrastructure/Presentation` hanya kalau domain logic sudah berat.

---

## Naming

Controller tipis — terima request, panggil action/service, return response:
```php
final class OrderController {
  public function store(CreateOrderRequest $request, CreateOrder $createOrder): JsonResponse {
    $order = $createOrder->handle($request->toData());
    return ApiResponse::success(OrderResource::make($order), 201);
  }
}
```

Nama action sesuai behavior: `CreateOrder`, `CancelOrder`, `RefundPayment`.
Model boleh punya method business (`$order->isPaid()`) tapi jadi God Object — jangan `$order->chargeCustomer()`.

---

## API Response Standard

Response wajib envelope konsisten — lihat `common/project-readability`. Response keluar **wajib camelCase**.

```php
final class OrderResource extends JsonResource {
  public function toArray(Request $request): array {
    return ['id' => $this->id, 'userId' => $this->user_id, 'totalAmount' => $this->total_amount];
  }
}
```

Jangan expose model mentah — `return response()->json($order)` bikin API contract bocor.

### ApiResponse helper
```php
final class ApiResponse {
  public static function success(mixed $data, int $status = 200, array $meta = []): JsonResponse {
    return response()->json(['ok' => true, 'data' => $data, 'meta' => $meta ?: null], $status);
  }
  public static function error(string $code, string $message, int $status, mixed $details = null): JsonResponse {
    return response()->json(['ok' => false, 'error' => compact('code', 'message', 'details')], $status);
  }
}
```

---

## Error Handling

Jangan throw `Exception` polos. Pakai `AppException`:
```php
final class AppException extends RuntimeException {
  public function __construct(
    public readonly string $code, public readonly string $userMessage,
    public readonly int $statusCode = 400, public readonly mixed $details = null,
  ) { parent::__construct($userMessage); }
}
```

Render di `bootstrap/app.php`:
```php
->withExceptions(function (Exceptions $exceptions) {
  $exceptions->render(fn (AppException $e) => ApiResponse::error($e->code, $e->userMessage, $e->statusCode, $e->details));
  $exceptions->render(fn (ValidationException $e) => ApiResponse::error('VALIDATION_FAILED', 'Request payload is invalid.', 422, $e->errors()));
});
```

Error message harus kasih next step — `'Order cannot be cancelled because it has already been paid. Create a refund instead.'`.

---

## Request Validation

Pakai `FormRequest` untuk HTTP boundary. Service/action terima Data Object:
```php
final class CreateOrderRequest extends FormRequest {
  public function rules(): array { return [
    'product_id' => ['required', 'uuid', 'exists:products,id'],
    'quantity' => ['required', 'integer', 'min:1', 'max:100'],
  ]; }
  public function toData(): CreateOrderData {
    $v = $this->validated();
    return new CreateOrderData(productId: $v['product_id'], quantity: $v['quantity']);
  }
}
final readonly class CreateOrderData {
  public function __construct(public string $productId, public int $quantity) {}
}
```

---

## Service, Action, Repository

Action untuk use-case spesifik. Service untuk beberapa use-case berbagi capability.
```php
final class CancelOrder {
  public function handle(Order $order, User $cancelledBy): Order {
    if (!$order->canBeCancelled())
      throw new AppException('ORDER_ALREADY_PAID', 'Order sudah dibayar. Buat refund.', 409);
    $order->status = OrderStatus::Cancelled; $order->cancelled_by = $cancelledBy->id;
    $order->cancelled_at = now(); $order->save(); return $order;
  }
}
```

**Repository:** jangan wajib bikin untuk semua model. Eloquent sudah repository-ish.

---

## Eloquent Rules

```php
final class Order extends Model {
  protected $fillable = ['user_id', 'status', 'total_amount', 'paid_at'];
  protected function casts(): array { return [
    'status' => OrderStatus::class, 'total_amount' => 'integer', 'paid_at' => 'datetime',
  ]; }
  public function canBeCancelled(): bool { return $this->status === OrderStatus::Pending; }
}
```

Scope hanya untuk reusable query jelas. Policy jawab "siapa boleh apa". Service jawab "apa yang terjadi".

---

## Tests

Coverage: domain actions 90%, critical flow 95%, controllers 80%, overall 85%.
```php
it('creates an order when the product is available', function () {});
it('rejects order creation when quantity exceeds stock', function () {});
```

Factory state harus ceritakan business state: `Order::factory()->paid()->create()`.
Wajib ada test untuk: happy path, validation failure, authorization failure, camelCase response.

```bash
php artisan test --coverage --min=85
```

---

## Anti-AI Laravel Smells

- Nama class generic: `BaseService`, `HelperService`, `DataProcessor`
- Service 10+ method unrelated, Repository semua model tanpa alasan
- Response shape beda antar endpoint, model expose langsung ke JSON
- Test cuma assert status code, Factory tanpa business state
- Folder `Helpers`, `Traits`, `Utils` membesar terus

---

## PR Checklist

```
[ ] Controller tipis: request → action/service → response
[ ] Nama class/method menjelaskan behavior
[ ] API response keluar camelCase, tidak ada model diexpose
[ ] Request divalidasi via FormRequest, service terima Data Object
[ ] Authorization explicit via policy/gate
[ ] Error message memberi next step
[ ] Happy path, validation failure, authorization failure dites
[ ] Critical flow coverage >= 95%
[ ] Tidak ada dd/dump tertinggal
[ ] Docker build berhasil
```

## Referensi

- Error codes & AppError → `common/project-readability`
- Database schema → `database-designer`
- Query optimization → `database-optimizer`
- Code audit → `code-health`
