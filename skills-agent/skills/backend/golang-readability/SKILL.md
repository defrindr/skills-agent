---
name: golang-readability
description: >
  Panduan membangun dan mereview project Go (Golang) dengan readability tinggi,
  struktur domain-first, error handling idiomatis, naming Go yang bersih,
  dan kode yang tidak terasa seperti output AI mentah atau Java di-port ke Go.
  Gunakan skill ini saat init project Go, membuat handler/service/repository,
  code review, setup testing, Docker, atau saat project Go mulai punya package
  bernama "utils", "common", "helpers", error yang di-ignore dengan `_`,
  atau naming yang terlalu verbose ala Java.
  Cocok untuk project yang pakai Gin, Fiber, Echo, Chi, atau net/http murni.
  
  Trigger: "setup golang", "init go", "go api", "go gin", "go fiber", "go echo",
  "go error handling", "go testing", "review go", "go structure", "go best practice",
  "golang project structure", "go clean architecture".
  
  EXCLUDES: Database schema design, SQL migrations, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer skills.
---

# Go Readability Skill

Go sengaja didesain membosankan. Tidak ada exception, tidak ada inheritance, tidak ada magic. Satu cara melakukan sesuatu. `gofmt` mengakhiri semua debat style. Compiler menolak import yang tidak dipakai.

Ini bukan kelemahan — ini feature. Project Go yang bagus terasa seperti kode yang `gofmt` hasilkan tapi ditulis manusia, bukan seperti Java yang syntax-nya diganti.

Yang bikin project Go berantakan hampir selalu dari kebiasaan yang dibawa dari bahasa lain:

- Interface untuk semua struct, padahal Go interface itu implicit dan harusnya kecil
- `_ =` untuk ignore error karena "nanti aja"
- Package bernama `utils`, `common`, `helpers`, `manager`
- GORM yang sembunyikan N+1 query di balik method chain
- Struct embedding yang dalam sampai tidak jelas field dari mana

> **PENTING**: Untuk komentar, test naming, Git convention, API response shape, anti-AI language audit, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk Go.
>
> Di Go, readability dan idiomatis sudah sejalan — kalau kode terasa seperti Go yang benar, biasanya sudah readable.
> 
> **Jangan over-engineer**: Simple project ≠ butuh service layer, startup ≠ butuh repository pattern, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

---

## 0. Karakter Go yang harus dijaga

### Error adalah nilai, bukan exception

Ini bukan quirk — ini keputusan desain yang disengaja. Error di-return, bukan di-throw.

```go
// ❌ Pikiran exception-based: panic untuk kondisi "tidak mungkin"
func getUser(id string) *User {
    user, err := db.Find(id)
    if err != nil {
        panic(err) // "ini tidak mungkin gagal"
    }
    return user
}

// ✅ Error adalah kemungkinan nyata — caller yang memutuskan cara handle-nya
func getUser(id string) (*User, error) {
    user, err := db.Find(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}
```

`if err != nil` yang berulang itu bukan boilerplate — itu dokumentasi bahwa setiap operasi bisa gagal.

### Interface itu kecil dan implicit

Interface Go dipenuhi dengan cara berbeda dari Java/C#. Tidak perlu `implements`.

```go
// ❌ Interface besar ala Java Repository Pattern
type UserRepository interface {
    FindByID(ctx context.Context, id string) (*User, error)
    FindByEmail(ctx context.Context, email string) (*User, error)
    FindAll(ctx context.Context, filter UserFilter) ([]*User, error)
    Create(ctx context.Context, input CreateUserInput) (*User, error)
    Update(ctx context.Context, id string, input UpdateUserInput) (*User, error)
    Delete(ctx context.Context, id string) error
}

// ✅ Interface kecil untuk kebutuhan spesifik — terutama untuk testing
type UserFinder interface {
    FindByEmail(ctx context.Context, email string) (*User, error)
}

// Struct konkret tidak perlu declare "implements"
type UserRepository struct{ db *sql.DB }

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) { ... }
```

Buat interface di sisi konsumen, bukan sisi produsen. Interface yang tidak dipakai untuk testing atau polymorphism — hapus saja.

### `context.Context` selalu parameter pertama

```go
// ❌
func (s *Service) CreateOrder(input CreateOrderInput) (*Order, error)

// ✅
func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error)
```

Context membawa deadline, cancellation signal, dan request-scoped value. Kalau tidak pass context dari awal, kamu tidak bisa cancel database query yang sudah tidak dibutuhkan saat request di-cancel client.

### Nama pendek di scope pendek — nama jelas di scope panjang

```go
// ✅ `i`, `v`, `err`, `r`, `w` idiomatis di Go untuk scope pendek
for i, v := range orders {
    fmt.Println(i, v.ID)
}

http.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {
    // w dan r adalah konvensi universal di Go — jangan diganti responseWriter / request
})

// ✅ Nama panjang untuk exported symbol yang dibaca di tempat lain
func (s *Service) FindOrdersByUserID(ctx context.Context, userID string) ([]*Order, error) { ... }
func (r *Repository) UpdateOrderStatus(ctx context.Context, orderID string, status OrderStatus) error { ... }
```

---

## 1. Database Work — DATABASE-FIRST PROTOCOL

**CRITICAL**: Skill ini untuk **application code** (handlers, services, repositories), **bukan database design**.

### Protocol: JANGAN NGIDE, ALWAYS TANYA DULU

**MANDATORY UNTUK SEMUA DATABASE WORK:**

Ketika user minta feature/endpoint/code yang touch database:

1. **STOP** — jangan langsung generate code
2. **ASK** — tanya user tentang database setup
3. **WAIT** — tunggu user response sebelum proceed
4. **VERIFY** — pastikan schema ready sebelum coding

### Phase 1: Database Verification (WAJIB — JANGAN SKIP!)

**SEBELUM generate ANY code yang akses database, TANYA user:**

```
Sebelum bikin [feature-name], saya perlu cek database setup dulu:

Database Checklist:
1. Schema Design
   - Apakah schema [entity-name] sudah di-design? (ERD, relationships)
   - Apakah ada relasi ke entity lain (User, Product, dll)?
   
2. Migration Setup (golang-migrate / sqlc / GORM)
   - Apakah migration files sudah dibuat?
   - Apakah migration sudah di-run?
   
3. Indexes & Performance
   - Apakah sudah ada index untuk common queries?
   - (Contoh: user_id, created_at, status)

Please confirm status:
- [ ] Schema sudah di-design
- [ ] Migration sudah dibuat
- [ ] Migration sudah di-run

Silakan jawab dengan status setiap item. Jangan skip checklist ini.
```

**JANGAN PROCEED sampai user confirm!**

### Phase 2: Design Schema (jika belum ada)

**IF user jawab "belum" atau "tidak yakin":**

```
Schema belum ready. Saya HARUS invoke database-designer dulu sebelum generate code.

Saya akan design:
- Entity: [entity-name]
- Relationships: [list relasi yang dibutuhkan]
- Indexes: [common query patterns]

Boleh saya invoke database-designer sekarang? (y/n)
```

**WAIT for user approval** — jangan auto-invoke tanpa izin!

### Phase 3: Generate Application Code (hanya setelah confirmed)

**ONLY after user confirm "schema ready dan migration sudah run":**

```
Perfect! Schema sudah ready. Sekarang saya generate Go code:

Will create:
- internal/[name]/handler.go (HTTP handlers)
- internal/[name]/service.go (business logic)
- internal/[name]/repository.go (database queries)
- internal/[name]/model.go (Go structs)

Reminder: Pastikan index sudah ada di [list columns]. Check database-optimizer jika query lambat.

Proceeding...
```

**Kemudian** baru generate code.

### Go Database Library Preference

**Skill ini recommend:**
- ✅ **sqlc** (type-safe SQL, explicit queries, no hidden behavior)
- ✅ **pgx** (PostgreSQL driver, full control)
- ⚠️ **GORM** (convenient tapi menyembunyikan queries, N+1 risks)

**database-designer akan provide:**
- Raw SQL schemas (perfect untuk sqlc)
- Index strategies
- Migration patterns (golang-migrate compatible)

### Skill Boundary

✅ **Skill ini handle:**
- Domain-first folder structure (internal/)
- Repository patterns (sqlc/pgx/GORM)
- Context cancellation untuk DB queries
- Error handling (errors.Is, fmt.Errorf dengan %w)

❌ **Skill ini TIDAK handle:**
- Database schema design → `database-designer`
- SQL migrations → `database-designer`
- Query performance → `database-optimizer`

### Anti-Pattern: JANGAN LAKUKAN INI

**❌ WRONG — Langsung generate tanpa tanya:**
```go
// AI langsung generate tanpa cek schema:
func CreateOrder(c *gin.Context) {
    var input CreateOrderInput
    db.Create(&Order{UserID: input.UserID})
}
```

**Why wrong:**
- Assume schema exists
- Tidak tahu relasi apa yang ada
- Tidak tahu index apa yang perlu
- User belum confirm setup ready

**✅ CORRECT — Tanya dulu, generate kemudian:**
```
AI: "Apakah schema orders table sudah di-design? Please confirm checklist..."
User: "Belum"
AI: "OK, saya invoke database-designer dulu. Boleh?"
User: "Ya"
AI: [invoke database-designer]
User: [run migration]
User: "Done"
AI: "Great! Sekarang generate Go code..." [generate code]
```

### Migration & sqlc Tips (after schema designed)

**Run migration** dari database-designer output:
```bash
# golang-migrate
migrate -path db/migrations -database "postgres://..." up

# atau sqlc dengan schema.sql
psql -d mydb -f db/schema.sql
```

**Generate sqlc code:**
```bash
# database-designer akan provide SQL queries
sqlc generate
```

**Di application code:**
```go
// internal/orders/repository.go (after sqlc generate)
func (r *Repository) GetUserOrders(ctx context.Context, userID uuid.UUID) ([]*Order, error) {
    return r.queries.ListOrdersByUser(ctx, userID)
}

// internal/orders/service.go (business logic)
func (s *Service) CancelOrder(ctx context.Context, orderID string) (*Order, error) {
    order, err := s.repo.GetByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("find order %s: %w", orderID, err)
    }
    if order.Status == StatusShipped {
        return nil, apierr.New(apierr.Conflict, "Order already shipped.")
    }
    return s.repo.UpdateStatus(ctx, orderID, StatusCancelled)
}
```

---

## 2. Struktur — scale-aware dengan `internal/`

**Aturan**: Ikuti `common/project-readability` untuk scale-aware architecture. Contoh di bawah untuk referensi saja.

### Simple project (< 5 endpoints, 1-2 dev, CRUD API)

```txt
myapp/
├── main.go                  ← wiring + handlers langsung
├── model.go                 ← semua model
├── db.go                    ← DB connection
└── go.mod

// main.go — langsung handler + DB call, no service layer
func CreateOrder(c *gin.Context) {
    var input CreateOrderInput
    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(400, gin.H{"ok": false, "error": gin.H{"code": "VALIDATION_ERROR", "message": err.Error()}})
        return
    }
    
    order := Order{ID: uuid.New(), UserID: input.UserID, ProductID: input.ProductID}
    if err := db.Create(&order).Error; err != nil {
        c.JSON(500, gin.H{"ok": false, "error": gin.H{"code": "INTERNAL_ERROR", "message": "Failed to create order"}})
        return
    }
    c.JSON(201, gin.H{"ok": true, "data": order})
}
```

### Medium project (5-15 endpoints, 3-5 dev, business logic mulai kompleks)

```txt
myapp/
├── cmd/
│   └── api/
│       └── main.go          ← wiring saja
├── internal/
│   ├── orders/
│   │   ├── handler.go       ← HTTP handlers
│   │   ├── service.go       ← business logic
│   │   └── model.go
│   └── products/
│       ├── handler.go
│       ├── service.go
│       └── model.go
├── pkg/
│   ├── apierr/              ← error types
│   └── middleware/
└── go.mod

// service.go — business logic terpisah dari handler
func (s *Service) CancelOrder(ctx context.Context, orderID string) (*Order, error) {
    order, err := s.db.FindByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("find order %s: %w", orderID, err)
    }
    if order == nil {
        return nil, apierr.New(apierr.NotFound, "Order not found.")
    }
    if order.Status == StatusShipped {
        return nil, apierr.New(apierr.Conflict, "Order already shipped.")
    }
    return s.db.UpdateStatus(ctx, orderID, StatusCancelled)
}
```

### Complex project (> 15 endpoints, > 5 dev, multiple domains, high business complexity)

```txt
myapp/
├── cmd/
│   └── api/
│       └── main.go
├── internal/
│   ├── orders/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go    ← abstraksi DB queries
│   │   └── model.go
│   ├── inventory/
│   │   ├── service.go
│   │   └── repository.go
│   └── domain/               ← shared business rules
│       └── pricing/
│           └── discount.go
├── pkg/
│   ├── apierr/
│   └── middleware/
└── go.mod

// Gunakan repository pattern HANYA jika:
// - Perlu switch DB provider (sqlc → pgx → GORM)
// - Complex query reuse (10+ use cases pakai query yang sama)
// - Testing perlu banyak mock DB calls
```

**Anti-pattern**: Jangan paksa struktur complex untuk project simple. Kalau cuma 3 CRUD endpoints, handler + service sudah overkill — langsung handler + DB call cukup.

`internal/` bukan sekadar konvensi — Go compiler enforce bahwa package di `internal/` tidak bisa diimport dari luar module. Boundary gratis, tanpa linting rule tambahan.

---

## 2. Package naming — noun, bukan `manager` atau `helper`

```go
// ❌
package utils
package helpers
package common
package orderManager

// ✅
package orders       // berisi Order, Service, Repository
package apierr       // berisi tipe error dan helper respond
package middleware   // berisi HTTP middleware
```

Kalau nama package-nya `utils`, isinya tidak punya satu concern yang jelas. Pecah berdasarkan apa yang ada di dalamnya.

---

## 3. Error: wrap dengan konteks, unwrap dengan `errors.As`

```go
// ❌ Error tanpa konteks
return nil, err

// ❌ Format yang putuskan chain — pakai %v, bukan %w
return nil, fmt.Errorf("error: %v", err)

// ✅ Wrap dengan konteks, jaga chain dengan %w
return nil, fmt.Errorf("find order %s: %w", orderID, err)
```

```go
// Unwrap di handler
var appErr *apierr.AppError
if errors.As(err, &appErr) {
    c.JSON(appErr.StatusCode, gin.H{"ok": false, "error": gin.H{
        "code": appErr.Code, "message": appErr.Message,
    }})
    return
}
```

`errors.As` berjalan melalui chain wrap. `errors.Is` untuk sentinel error. Jangan type assertion `err.(*AppError)` langsung — itu putus chain kalau error di-wrap beberapa kali.

---

## 4. Database: `sqlc` atau `pgx` langsung, hindari GORM

GORM nyaman di awal. Tapi query yang berjalan tersembunyi, N+1 mudah muncul tanpa sadar, dan debugging-nya menyakitkan.

```go
// ❌ GORM — query apa yang jalan?
db.Preload("Items").Preload("User").Where("status = ?", "pending").Find(&orders)

// ✅ sqlc — tulis SQL eksplisit, code di-generate type-safe
// query.sql:
// -- name: ListPendingOrders :many
// SELECT id, user_id, status FROM orders WHERE status = 'pending'
orders, err := q.ListPendingOrders(ctx)

// ✅ pgx langsung untuk query sederhana
rows, err := db.Query(ctx,
    "SELECT id, user_id, status FROM orders WHERE status = $1",
    "pending",
)
```

---

## 5. `defer` untuk cleanup — bukan hanya `Close()`

```go
func (r *Repository) FindByID(ctx context.Context, id string) (*Order, error) {
    rows, err := r.db.Query(ctx, "SELECT ... FROM orders WHERE id = $1", id)
    if err != nil {
        return nil, fmt.Errorf("query order %s: %w", id, err)
    }
    defer rows.Close()  // dijamin jalan walau ada early return atau panic

    if rows.Next() {
        var o Order
        if err := rows.Scan(&o.ID, &o.UserID, &o.Status); err != nil {
            return nil, fmt.Errorf("scan order: %w", err)
        }
        return &o, nil
    }
    return nil, nil
}
```

---

## 6. Handler dan service (untuk medium+)

```go
// internal/orders/handler.go
package orders

type Handler struct{ service *Service }

func NewHandler(svc *Service) *Handler { return &Handler{service: svc} }

func RegisterRoutes(r *gin.Engine, db *sql.DB) {
    h := NewHandler(NewService(NewRepository(db)))
    g := r.Group("/orders")
    g.POST("/", h.CreateOrder)
    g.POST("/:orderID/cancel", h.CancelOrder)
}

func (h *Handler) CancelOrder(c *gin.Context) {
    order, err := h.service.CancelOrder(c.Request.Context(), c.Param("orderID"))
    if err != nil {
        apierr.Respond(c, err)
        return
    }
    apiresponse.OK(c, order)
}
```

```go
// internal/orders/service.go
package orders

func (s *Service) CancelOrder(ctx context.Context, orderID string) (*Order, error) {
    order, err := s.repo.FindByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("find order %s: %w", orderID, err)
    }
    if order == nil {
        return nil, apierr.New(apierr.NotFound, "Order not found.")
    }
    if order.Status == StatusShipped {
        return nil, apierr.New(apierr.Conflict,
            "Order cannot be cancelled because it has already been shipped.")
    }

    updated, err := s.repo.UpdateStatus(ctx, orderID, StatusCancelled)
    if err != nil {
        return nil, fmt.Errorf("cancel order %s: %w", orderID, err)
    }
    return updated, nil
}
```

---

## 7. Testing: table-driven

Go tidak punya `describe`/`it`. Table-driven test adalah cara idiomatis cover banyak case tanpa copy-paste.

```go
// internal/orders/service_test.go
package orders_test  // _test suffix = black-box test, hanya pakai exported API

func TestCancelOrder(t *testing.T) {
    tests := []struct {
        name          string
        existingOrder *Order
        wantErrCode   apierr.Code
    }{
        {
            name:          "returns NOT_FOUND when order does not exist",
            existingOrder: nil,
            wantErrCode:   apierr.NotFound,
        },
        {
            name:          "returns CONFLICT when order has already shipped",
            existingOrder: &Order{Status: StatusShipped},
            wantErrCode:   apierr.Conflict,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            svc := NewService(&mockRepo{order: tt.existingOrder})

            _, err := svc.CancelOrder(t.Context(), "order-id")

            var appErr *apierr.AppError
            require.ErrorAs(t, err, &appErr)
            assert.Equal(t, tt.wantErrCode, appErr.Code)
        })
    }
}
```

Selalu jalankan test dengan `-race`:

```bash
go test -race ./...
```

---

## 8. Tooling

```bash
# Format — tidak ada negosiasi
gofmt -w .

# Linting
golangci-lint run

# Race condition detector
go test -race ./...

# Vulnerability check
govulncheck ./...
```

`.golangci.yml` minimal:

```yaml
linters:
  enable:
    - errcheck      # tidak boleh ignore error
    - govet
    - staticcheck
    - exhaustive    # switch enum harus exhaustive
    - noctx         # http request harus pakai context
```

---

## 9. Docker

```dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /bin/api ./cmd/api

FROM scratch
COPY --from=builder /bin/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
```

`FROM scratch` — binary Go statically linked tidak butuh OS. Image ~10MB, tidak ada shell, tidak ada attack surface.
