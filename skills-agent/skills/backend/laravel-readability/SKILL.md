---
name: laravel-readability
description: >
  Panduan init, review, refactor, dan maintenance project Laravel dengan readability tinggi,
  test coverage yang serius, dan struktur business-domain first. Gunakan skill ini setiap kali
  memulai project Laravel baru, melakukan code review, menulis dokumentasi, menyusun folder/module,
  memperbaiki service/controller/model yang mulai gemuk, menstandarkan API response/error/request,
  membuat validation/FormRequest, menulis feature/unit test, menaikkan coverage, mengatur queue/job,
  integrasi provider eksternal, observability, HMAC webhook, Docker, atau saat user bilang kodenya
  keliatan AI, terlalu generic, terlalu magic, atau susah diubah. project-readability.md adalah sumber
  utama: kalau ada konflik, readability dan coverage tests menang.
---

# Laravel Readability Skill

Skill ini adalah versi Laravel dari `project-readability.md`.

**CRITICAL: This skill DEFERS to project-readability.md for all decisions.**

Tujuan:
- Gampang dibaca
- Gampang dites  
- Gampang diubah besok
- TIDAK over-engineer simple projects
- TIDAK terasa seperti output AI mentah

Aturan tertinggi:

> **project-readability.md adalah segalanya.**
> Kalau ada konflik antara style Laravel, kebiasaan package, opini framework, atau pattern populer dengan readability, maka readability menang.

Aturan kedua:

> **Match architecture to project scale.**
> Simple perpus app TIDAK butuh domain-driven architecture. Jangan over-engineer.

Aturan ketiga:

> **Coverage tests bukan bonus. Coverage adalah bukti bahwa boundary dan behavior bisa dipercaya.**

---

## 0. Taste Rules

Taste rules dari `project-readability.md` tetap berlaku penuh.

| # | Rule | Laravel meaning |
|---|------|-----------------|
| 1 | Jangan bikin abstraction sebelum pola terbukti berulang. | Jangan buru-buru bikin Repository, Action, DTO, Domain Event, atau Service Provider custom kalau belum ada complexity nyata. |
| 2 | Prefer boring code over clever code. | Laravel magic boleh dipakai, tapi jangan sampai behavior penting tersembunyi. |
| 3 | Kalau nama function butuh komentar, namanya belum cukup jelas. | Rename method, FormRequest, policy ability, job, atau service method sebelum tambah komentar. |
| 4 | Error message harus bantu langkah berikutnya. | Jangan balikin `Something went wrong` kecuali untuk unexpected server error. |
| 5 | Kode bagus bukan yang paling pendek, tapi yang paling gampang diubah besok. | Jangan bikin helper global atau macro yang bikin flow susah dilacak. |
| 6 | Jangan bikin `Support/helpers.php` jadi tempat sampah. | Helper yang hanya relevan untuk satu domain harus tinggal di domain itu. |

---

## 1. Struktur folder: SCALE-AWARE

**IMPORTANT:** Struktur harus match dengan project complexity!

### Simple Project (MVP, CRUD, < 10 models)

**Example: Perpustakaan sederhana (books, members, loans)**

```txt
app/
├── Http/
│   ├── Controllers/
│   │   ├── BookController.php
│   │   ├── MemberController.php
│   │   └── LoanController.php
│   └── Requests/
│       ├── StoreBookRequest.php
│       └── StoreLoanRequest.php
├── Models/
│   ├── Book.php
│   ├── Member.php
│   └── Loan.php
└── Services/  (optional, only if logic complex)
    └── LoanService.php
```

**WHY:** 
- Cuma 3 entity
- CRUD sederhana
- NO need for domain-driven, repositories, actions, DTOs
- Laravel conventions sudah cukup

### Medium Project (Startup, 10-30 models, multiple features)

**Example: E-commerce dengan products, orders, payments**

```txt
app/
├── Domain/
│   ├── IAM/
│   │   ├── Users/
│   │   ├── Auth/
│   │   ├── Roles/
│   │   └── Permissions/
│   │
│   ├── Transaction/
│   │   ├── Orders/
│   │   ├── Payments/
│   │   ├── Refunds/
│   │   └── History/
│   │
│   ├── Catalog/
│   │   ├── Products/
│   │   ├── Categories/
│   │   └── Inventory/
│   │
│   └── Billing/
│       ├── Invoices/
│       ├── Subscriptions/
│       └── Payouts/
│
├── Support/
│   ├── Api/
│   ├── Errors/
│   ├── Logging/
│   ├── Security/
│   └── ValueObjects/
│
├── Integrations/
│   ├── Midtrans/
│   ├── Xendit/
│   ├── Resend/
│   └── Redis/
│
├── Jobs/
├── Console/
├── Providers/
└── Http/
    ├── Middleware/
    └── Kernel.php
```

Business domain lebih penting daripada entity.

Jangan mulai dengan:

```txt
app/
├── Models/User.php
├── Models/Order.php
├── Models/Payment.php
├── Services/UserService.php
├── Services/OrderService.php
├── Services/PaymentService.php
```

Kalau domain-nya sudah jelas, lebih readable:

```txt
app/Domain/Transaction/Orders/
├── Order.php
├── OrderController.php
├── OrderService.php
├── OrderPolicy.php
├── Requests/
│   ├── CreateOrderRequest.php
│   └── CancelOrderRequest.php
├── Data/
│   └── CreateOrderData.php
├── Actions/
│   ├── CreateOrder.php
│   └── CancelOrder.php
├── Events/
│   └── OrderCreated.php
├── Listeners/
│   └── ReserveInventory.php
└── Tests/
    ├── CreateOrderTest.php
    └── CancelOrderTest.php
```

### Rule boundary domain

| Domain | Isi |
|---|---|
| `IAM` | auth, users, roles, permissions, sessions, tokens |
| `Transaction` | order lifecycle, payment, refund, transaction history |
| `Catalog` | product, category, inventory, pricing display |
| `Billing` | invoice, subscription, payout, tax-related billing flow |
| `Integrations` | provider eksternal: payment gateway, email provider, storage, analytics |
| `Support` | generic reusable code yang benar-benar lintas domain |

`History` jangan jadi folder global kecuali memang produkmu adalah audit platform.

Lebih baik:

```txt
app/Domain/Transaction/History/
```

daripada:

```txt
app/Domain/History/
```

Karena “history” tanpa context tidak menjelaskan ownership.

---

## 1.1 Kapan tetap pakai folder Laravel default?

Untuk project kecil, boleh pakai struktur default, tapi tetap jaga naming dan test.

```txt
app/
├── Http/Controllers/OrderController.php
├── Http/Requests/CreateOrderRequest.php
├── Models/Order.php
├── Services/OrderService.php
└── Policies/OrderPolicy.php
```

Pindah ke `app/Domain/*` saat salah satu terjadi:

- satu fitur punya controller, request, policy, job, event, listener, service, dan test sendiri
- file terkait fitur yang sama tersebar di 5+ folder
- ingin menghapus satu domain tapi harus hunting file di seluruh `app/`
- nama service mulai generic: `UserService`, `OrderService`, `PaymentService` berisi banyak responsibility

---

## 1.2 Jangan DDD cosplay dari hari pertama

Jangan mulai dengan ini kalau complexity belum nyata:

```txt
Orders/
├── Application/
├── Domain/
├── Infrastructure/
├── Presentation/
└── Contracts/
```

Untuk mayoritas Laravel app, ini cukup:

```txt
Orders/
├── OrderController.php
├── Order.php
├── OrderService.php
├── Requests/
├── Actions/
├── Data/
└── Tests/
```

Naik ke style `Application/Domain/Infrastructure` hanya kalau:

- domain logic sudah berat
- ada banyak external adapters
- business rules perlu dites tanpa Laravel container/database
- domain object punya lifecycle sendiri
- service mulai sulit dibaca walau sudah dipecah action

---

## 2. Naming Laravel yang manusiawi

### Controller

Controller harus tipis. Controller hanya:

1. terima request tervalidasi
2. panggil action/service
3. balikin response standar

```php
final class OrderController
{
    public function store(CreateOrderRequest $request, CreateOrder $createOrder): JsonResponse
    {
        $order = $createOrder->handle($request->toData());

        return ApiResponse::success(OrderResource::make($order), 201);
    }
}
```

Hindari:

```php
public function handle(Request $request) {}
public function process(Request $request) {}
public function submit(Request $request) {}
```

Pilih nama sesuai behavior:

```php
CreateOrder
CancelOrder
RefundPayment
SendPasswordResetLink
MarkInvoiceAsPaid
```

### Model

Model boleh punya method, tapi jangan jadi God Object.

Boleh:

```php
$order->isPaid();
$order->canBeCancelled();
$order->markAsPaid($paidAt);
```

Jangan:

```php
$order->chargeCustomer();
$order->sendInvoiceEmail();
$order->syncToAccountingProvider();
```

Itu bukan responsibility model.

### Boolean

Pakai prefix jelas:

```php
$isPaid
$hasActiveSubscription
$canCancelOrder
$shouldSendReceipt
```

### Variable

Hindari variable generic:

```php
$data
$result
$temp
$res
$item
```

Lebih baik:

```php
$validatedInput
$createdOrder
$paymentResponse
$activeSubscription
$cancelledOrder
```

---

## 3. API response standar

Semua JSON response wajib pakai envelope yang konsisten.

### Success

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "page": 1,
    "total": 100,
    "tookMs": 12
  }
}
```

### Error

```json
{
  "ok": false,
  "error": {
    "code": "ORDER_ALREADY_PAID",
    "message": "Order cannot be cancelled because it has already been paid.",
    "details": {}
  }
}
```

Response keluar harus `camelCase`.

Database, Eloquent column, dan backend dependency boleh `snake_case`, tapi API boundary harus convert ke `camelCase`.

Rule:

- DB column: `created_at`, `paid_at`, `user_id`
- PHP property internal: boleh mengikuti Eloquent
- API response: `createdAt`, `paidAt`, `userId`
- frontend tidak boleh menerima `snake_case`

### ApiResponse helper

```php
namespace App\Support\Api;

use Illuminate\Http\JsonResponse;

final class ApiResponse
{
    public static function success(mixed $data, int $status = 200, array $meta = []): JsonResponse
    {
        return response()->json([
            'ok' => true,
            'data' => $data,
            'meta' => empty($meta) ? null : self::camelize($meta),
        ], $status);
    }

    public static function error(string $code, string $message, int $status, mixed $details = null): JsonResponse
    {
        return response()->json([
            'ok' => false,
            'error' => [
                'code' => $code,
                'message' => $message,
                'details' => $details,
            ],
        ], $status);
    }

    private static function camelize(mixed $value): mixed
    {
        if (! is_array($value)) {
            return $value;
        }

        return collect($value)
            ->mapWithKeys(fn ($nestedValue, $key) => [str($key)->camel()->toString() => self::camelize($nestedValue)])
            ->all();
    }
}
```

Untuk response model, prefer `JsonResource` supaya mapping eksplisit.

```php
final class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'userId' => $this->user_id,
            'status' => $this->status,
            'totalAmount' => $this->total_amount,
            'paidAt' => $this->paid_at?->toISOString(),
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
```

Jangan expose model mentah:

```php
return response()->json($order);
```

Itu bikin API contract bocor dari database.

---

## 4. Error handling

Jangan throw `Exception` polos untuk expected business error.

### ErrorCode

```php
namespace App\Support\Errors;

final class ErrorCode
{
    public const UNAUTHORIZED = 'UNAUTHORIZED';
    public const FORBIDDEN = 'FORBIDDEN';
    public const VALIDATION_FAILED = 'VALIDATION_FAILED';
    public const NOT_FOUND = 'NOT_FOUND';
    public const CONFLICT = 'CONFLICT';
    public const INTERNAL_ERROR = 'INTERNAL_ERROR';

    public const ORDER_ALREADY_PAID = 'ORDER_ALREADY_PAID';
    public const INVALID_PAYLOAD_SIGNATURE = 'INVALID_PAYLOAD_SIGNATURE';
}
```

### AppException

```php
namespace App\Support\Errors;

use RuntimeException;

final class AppException extends RuntimeException
{
    public function __construct(
        public readonly string $code,
        public readonly string $userMessage,
        public readonly int $statusCode = 400,
        public readonly mixed $details = null,
    ) {
        parent::__construct($userMessage);
    }
}
```

### Render di exception handler

Laravel 11 `bootstrap/app.php`:

```php
use App\Support\Api\ApiResponse;
use App\Support\Errors\AppException;
use App\Support\Errors\ErrorCode;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Validation\ValidationException;

->withExceptions(function (Exceptions $exceptions) {
    $exceptions->render(function (AppException $exception) {
        return ApiResponse::error(
            code: $exception->code,
            message: $exception->userMessage,
            status: $exception->statusCode,
            details: $exception->details,
        );
    });

    $exceptions->render(function (ValidationException $exception) {
        return ApiResponse::error(
            code: ErrorCode::VALIDATION_FAILED,
            message: 'Request payload is invalid.',
            status: 422,
            details: $exception->errors(),
        );
    });
});
```

Business error harus kasih next step.

Buruk:

```php
throw new AppException('ORDER_ERROR', 'Something went wrong', 400);
```

Baik:

```php
throw new AppException(
    ErrorCode::ORDER_ALREADY_PAID,
    'Order cannot be cancelled because it has already been paid. Create a refund instead.',
    409,
);
```

---

## 5. Request validation

Pakai `FormRequest` untuk HTTP boundary.

```php
final class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Order::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function toData(): CreateOrderData
    {
        $validatedInput = $this->validated();

        return new CreateOrderData(
            productId: $validatedInput['product_id'],
            quantity: $validatedInput['quantity'],
            notes: $validatedInput['notes'] ?? null,
        );
    }
}
```

Jangan pass raw request ke service/action.

Buruk:

```php
$createOrder->handle($request);
```

Baik:

```php
$createOrder->handle($request->toData());
```

---

## 6. Data object

Gunakan data object sederhana untuk boundary antar layer.

```php
final readonly class CreateOrderData
{
    public function __construct(
        public string $productId,
        public int $quantity,
        public ?string $notes,
    ) {}
}
```

Jangan over-engineer dengan mapper/factory kalau belum perlu.

Gunakan package DTO hanya kalau project sudah punya kebutuhan nyata seperti transform nested object, validation reuse, atau serialization yang kompleks.

---

## 7. Service, Action, Repository

### Action

Pakai Action untuk use-case spesifik.

```php
final class CancelOrder
{
    public function handle(Order $order, User $cancelledBy): Order
    {
        if (! $order->canBeCancelled()) {
            throw new AppException(
                ErrorCode::ORDER_ALREADY_PAID,
                'Order cannot be cancelled because it has already been paid. Create a refund instead.',
                409,
            );
        }

        $order->cancelled_by = $cancelledBy->id;
        $order->cancelled_at = now();
        $order->status = OrderStatus::Cancelled;
        $order->save();

        return $order;
    }
}
```

### Service

Pakai Service kalau ada beberapa use-case yang berbagi business capability.

Jangan bikin `OrderService` jadi tempat semua logic order.

Buruk:

```php
class OrderService
{
    public function create() {}
    public function cancel() {}
    public function pay() {}
    public function refund() {}
    public function export() {}
    public function sendEmail() {}
}
```

Lebih baik:

```txt
Orders/
├── Actions/CreateOrder.php
├── Actions/CancelOrder.php
Payments/
├── Actions/ChargePayment.php
Refunds/
├── Actions/CreateRefund.php
```

### Repository

Jangan wajib bikin repository untuk semua model.

Eloquent sudah repository-ish. Tambah repository hanya kalau:

- query dipakai lintas use-case dan mulai kompleks
- butuh swap data source
- butuh isolate query untuk test/domain
- model mulai penuh query scope yang tidak cohesive

Kalau cuma ini, tidak perlu repository:

```php
Order::query()->whereKey($id)->firstOrFail();
```

---

## 8. Eloquent rules

Model harus readable dan tidak magic berlebihan.

```php
final class Order extends Model
{
    protected $fillable = [
        'user_id',
        'status',
        'total_amount',
        'paid_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'total_amount' => 'integer',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function canBeCancelled(): bool
    {
        return $this->status === OrderStatus::Pending;
    }
}
```

### Query scope

Scope hanya untuk query yang reusable dan jelas.

```php
public function scopePaid(Builder $query): Builder
{
    return $query->where('status', OrderStatus::Paid);
}
```

Jangan bikin scope yang menyembunyikan business action.

Buruk:

```php
Order::paidAndSyncedButNotExpiredAndVisibleToUser($user)->get();
```

Lebih baik pecah ke query object/action kalau logic sudah panjang.

---

## 9. Policy & authorization

Authorization harus explicit.

```php
final class OrderPolicy
{
    public function cancel(User $user, Order $order): bool
    {
        return $order->user_id === $user->id && $order->canBeCancelled();
    }
}
```

Controller:

```php
$this->authorize('cancel', $order);
```

Jangan authorization nyempil di service tanpa alasan.

Policy menjawab:

> siapa boleh melakukan apa?

Service/action menjawab:

> apa yang terjadi kalau behavior itu dijalankan?

---

## 10. Tests adalah kontrak behavior

Coverage tests wajib dianggap bagian dari desain.

Target minimum:

| Area | Minimum |
|---|---:|
| Domain actions/services | 90% line coverage |
| Critical payment/auth/order flow | 95% line coverage |
| Controllers/API feature tests | 80% line coverage |
| Helpers/support utilities | 95% line coverage |
| Overall project | 85% line coverage |

Coverage bukan angka vanity. Coverage harus membuktikan behavior penting.

Wajib ada test untuk:

- happy path
- validation failure
- authorization failure
- business rule conflict
- unexpected external provider response
- idempotency untuk webhook/payment callback
- serialization response `camelCase`
- error envelope `ok: false`
- success envelope `ok: true`

### Struktur test

Kalau pakai domain-first:

```txt
tests/
├── Feature/
│   ├── IAM/
│   │   └── LoginTest.php
│   └── Transaction/
│       ├── Orders/
│       │   ├── CreateOrderTest.php
│       │   └── CancelOrderTest.php
│       └── Payments/
│           └── HandlePaymentWebhookTest.php
│
└── Unit/
    ├── Transaction/
    │   └── Orders/
    │       └── OrderStatusTest.php
    └── Support/
        └── ApiResponseTest.php
```

### Test naming

Nama test harus bisa dibaca non-engineer.

```php
it('creates an order when the product is available', function () {});
it('rejects order creation when quantity exceeds the stock', function () {});
it('returns camelCase response fields even when database columns are snake_case', function () {});
it('returns a helpful error when paid order is cancelled', function () {});
```

Hindari:

```php
it('works', function () {});
it('returns 200', function () {});
it('handles edge case', function () {});
```

### Pest atau PHPUnit?

Pest boleh dipakai kalau team nyaman. PHPUnit juga oke.

Rule-nya bukan framework test apa, tapi:

- test readable
- assertion jelas
- setup tidak terlalu magic
- factory states jelas
- test gagal memberi sinyal yang mudah dipahami

### Coverage command

```bash
php artisan test --coverage --min=85
```

Untuk CI:

```bash
php artisan test --coverage-clover coverage.xml --min=85
```

Kalau pakai Pest:

```bash
./vendor/bin/pest --coverage --min=85
```

### Coverage anti-cheat

Jangan menaikkan coverage dengan test kosong.

Buruk:

```php
it('creates model', function () {
    expect(Order::factory()->create())->toBeInstanceOf(Order::class);
});
```

Baik:

```php
it('returns camelCase fields in order detail response', function () {
    $order = Order::factory()->paid()->create([
        'total_amount' => 150_000,
    ]);

    actingAs($order->user)
        ->getJson(route('orders.show', $order))
        ->assertOk()
        ->assertJsonPath('ok', true)
        ->assertJsonPath('data.totalAmount', 150_000)
        ->assertJsonMissingPath('data.total_amount');
});
```

### Factories

Factory state harus menceritakan business state.

```php
Order::factory()->pending()->create();
Order::factory()->paid()->create();
Order::factory()->cancelled()->create();
```

Jangan setup state random di tiap test kalau bisa diberi nama.

---

## 11. Response camelCase wajib dites

Setiap resource penting harus punya test response serialization.

```php
it('serializes order response using camelCase fields', function () {
    $order = Order::factory()->create([
        'total_amount' => 200_000,
        'paid_at' => now(),
    ]);

    $resource = OrderResource::make($order)->resolve();

    expect($resource)
        ->toHaveKey('totalAmount')
        ->toHaveKey('paidAt')
        ->not->toHaveKey('total_amount')
        ->not->toHaveKey('paid_at');
});
```

Ini wajib karena frontend contract tidak boleh rusak diam-diam.

---

## 12. HMAC webhook

Webhook wajib validasi signature dan raw body.

```php
namespace App\Support\Security;

use App\Support\Errors\AppException;
use App\Support\Errors\ErrorCode;

final class VerifyHmacSignature
{
    public function verify(string $rawBody, ?string $signatureHeader, string $secret): void
    {
        if ($signatureHeader === null) {
            throw new AppException(
                ErrorCode::INVALID_PAYLOAD_SIGNATURE,
                'Webhook signature is missing.',
                401,
            );
        }

        $expectedSignature = hash_hmac('sha256', $rawBody, $secret);

        if (! hash_equals($expectedSignature, $signatureHeader)) {
            throw new AppException(
                ErrorCode::INVALID_PAYLOAD_SIGNATURE,
                'Webhook signature is invalid.',
                401,
            );
        }
    }
}
```

Webhook test wajib cover:

- signature valid
- signature missing
- signature invalid
- duplicate webhook idempotent
- provider payload malformed

---

## 13. Queue, jobs, events, listeners

Job tidak boleh berisi business logic berat.

Job hanya orchestration async:

```php
final class SendOrderReceiptJob implements ShouldQueue
{
    public function __construct(public readonly string $orderId) {}

    public function handle(SendOrderReceipt $sendOrderReceipt): void
    {
        $sendOrderReceipt->handle($this->orderId);
    }
}
```

Business logic tetap di action/service domain.

Event harus pakai nama kejadian masa lampau:

```php
OrderCreated
PaymentSucceeded
InvoicePaid
RefundRequested
```

Jangan:

```php
CreateOrderEvent
HandlePaymentEvent
ProcessInvoiceEvent
```

---

## 14. Integrations bukan shared

Provider eksternal masuk `app/Integrations`.

```txt
app/Integrations/Midtrans/
├── MidtransClient.php
├── MidtransPaymentResponse.php
├── MidtransWebhookVerifier.php
└── Exceptions/
```

Domain tidak boleh tahu detail HTTP provider.

Buruk:

```php
Http::post('https://api.midtrans.com/...', $payload);
```

di dalam `CreateOrder`.

Baik:

```php
$paymentGateway->charge($paymentRequest);
```

Interface boleh tinggal di domain kalau domain yang menentukan kontrak:

```txt
app/Domain/Transaction/Payments/Contracts/PaymentGateway.php
app/Integrations/Midtrans/MidtransPaymentGateway.php
```

---

## 15. Observability

Jangan pakai `dump`, `dd`, atau `Log::info` tanpa konteks.

Log harus structured.

```php
Log::info('Order created', [
    'order_id' => $order->id,
    'user_id' => $order->user_id,
    'request_id' => request()->header('x-request-id'),
]);
```

Unexpected exception harus masuk Sentry atau error tracker lain.

Request ID wajib ada di response header dan log context.

Middleware:

```php
final class AttachRequestId
{
    public function handle(Request $request, Closure $next): Response
    {
        $requestId = $request->header('x-request-id') ?? (string) Str::uuid();

        Log::withContext(['request_id' => $requestId]);

        $response = $next($request);
        $response->headers->set('x-request-id', $requestId);

        return $response;
    }
}
```

---

## 16. Config & env validation

Jangan baca `env()` langsung di business code.

Buruk:

```php
$secret = env('WEBHOOK_SECRET');
```

Baik:

```php
$secret = config('services.midtrans.webhook_secret');
```

`config/services.php`:

```php
'midtrans' => [
    'server_key' => env('MIDTRANS_SERVER_KEY'),
    'webhook_secret' => env('MIDTRANS_WEBHOOK_SECRET'),
],
```

Tambahkan `.env.example` setiap ada env baru.

---

## 17. Docker

Dockerfile minimal production:

```dockerfile
FROM php:8.3-fpm-alpine AS app

WORKDIR /var/www/html

RUN apk add --no-cache \
    bash \
    git \
    icu-dev \
    libzip-dev \
    oniguruma-dev \
    postgresql-dev \
    && docker-php-ext-install intl mbstring pdo pdo_pgsql zip opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

COPY . .

RUN php artisan config:cache \
    && php artisan route:cache \
    && php artisan view:cache

USER www-data

CMD ["php-fpm"]
```

`.dockerignore`:

```txt
.git
.env
vendor
node_modules
storage/logs/*.log
coverage
```

---

## 18. Static analysis & formatting

Wajib minimal:

```bash
composer require --dev laravel/pint nunomaduro/larastan pestphp/pest pestphp/pest-plugin-laravel
```

Commands:

```bash
./vendor/bin/pint
./vendor/bin/phpstan analyse
php artisan test --coverage --min=85
```

`phpstan.neon`:

```neon
includes:
    - vendor/larastan/larastan/extension.neon

parameters:
    level: 6
    paths:
        - app
        - tests
```

Naikkan level bertahap. Jangan jadikan PHPStan excuse untuk type acrobatics yang membuat kode susah dibaca.

---

## 19. Anti-AI Laravel smells

Waspadai tanda ini saat review:

- nama class terlalu generic: `BaseService`, `HelperService`, `DataProcessor`
- semua logic ditaruh di `handle()` tanpa nama use-case jelas
- repository dibuat untuk semua model tanpa alasan
- service berisi 10+ method unrelated
- komentar menjelaskan kode, bukan alasan
- `try/catch` di semua controller tapi tidak memberi value
- response shape beda-beda antar endpoint
- model expose langsung ke JSON
- test cuma assert status code
- factory tidak punya state business
- folder `Helpers`, `Traits`, `Utils` membesar terus

---

## 20. PR checklist

```txt
Readability
[ ] Tidak ada abstraction baru tanpa pola berulang minimal 3x
[ ] Nama class/method menjelaskan behavior tanpa komentar
[ ] Controller tipis: request -> action/service -> response
[ ] Tidak ada helper global yang domain-specific
[ ] Tidak ada komentar yang hanya menerjemahkan kode
[ ] Error message memberi next step

Structure
[ ] File fitur tinggal dekat dengan domain owner-nya
[ ] IAM/Auth/User/Role/Permission tidak tercecer random
[ ] Transaction/Order/Payment/History berada dalam boundary Transaction
[ ] Integration eksternal berada di app/Integrations, bukan Support/shared
[ ] Job hanya orchestration async, business logic tetap di domain action/service

API contract
[ ] Response success pakai envelope ok/data/meta
[ ] Response error pakai envelope ok/error
[ ] API response keluar camelCase
[ ] Tidak ada model Eloquent diexpose mentah ke response
[ ] Resource penting punya serialization test

Validation & security
[ ] Request divalidasi via FormRequest
[ ] Service/action menerima data object, bukan raw Request
[ ] Authorization explicit via policy/gate
[ ] Webhook pakai HMAC verification
[ ] Duplicate webhook/idempotency sudah dites

Tests & coverage
[ ] Happy path dites
[ ] Validation failure dites
[ ] Authorization failure dites
[ ] Business conflict dites
[ ] Error envelope dites
[ ] Success envelope dites
[ ] camelCase response dites
[ ] Critical flow auth/payment/order coverage >= 95%
[ ] Overall coverage >= 85%
[ ] Tidak ada test kosong cuma untuk menaikkan coverage

Observability
[ ] Log structured dan punya context id penting
[ ] Request ID tersedia di log dan response header
[ ] Unexpected exception masuk error tracker
[ ] Tidak ada dd/dump tertinggal

Tooling
[ ] Pint pass
[ ] PHPStan/Larastan pass
[ ] Test coverage pass di CI
[ ] .env.example updated
[ ] Docker build berhasil
```

---

## 21. Referensi cepat

- Bingung folder? Mulai dari business domain, bukan entity.
- Bingung `History` taruh mana? Taruh di domain owner-nya.
- Bingung perlu Repository? Default tidak perlu sampai ada alasan nyata.
- Bingung Action vs Service? Action untuk use-case spesifik, Service untuk capability yang benar-benar dipakai beberapa use-case.
- Bingung response? Selalu envelope dan camelCase.
- Bingung test? Test behavior yang user/developer peduli, bukan implementation detail.
- Bingung coverage? Minimum 85% overall, 95% untuk auth/payment/order critical flow.
- Bingung komentar? Kalau cuma jelasin apa yang kode lakukan, hapus atau rename kode.

