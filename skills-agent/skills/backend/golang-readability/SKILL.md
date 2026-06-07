---
name: golang-readability
description: >
  Panduan membangun dan mereview project Go dengan readability tinggi,
  struktur domain-first, error handling idiomatis, dan naming Go yang bersih.
  Gunakan saat init project Go, membuat handler/service/repository, code review,
  setup testing, Docker.
  Cocok untuk Gin, Fiber, Echo, Chi, atau net/http.
  Trigger: "setup golang", "init go", "go api", "go gin", "go fiber", "go echo",
  "go error handling", "go testing", "review go", "go structure", "go best practice".
  EXCLUDES: Database schema design, SQL migrations, query optimization.
  Defer ke database-designer dan database-optimizer.
---

# Go Readability Skill

Go sengaja didesain membosankan — tidak ada exception, inheritance, atau magic. `gofmt` mengakhiri semua debat style. Yang bikin project Go berantakan biasanya dari kebiasaan bahasa lain: interface untuk semua struct, `_ =` untuk ignore error, package bernama `utils`, GORM yang sembunyikan N+1.

> Untuk naming, folder structure, API response, error handling — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal spesifik untuk Go.
> **Jangan over-engineer**: struktur sesuaikan dengan skala project.

---

## 0. Karakter Go yang harus dijaga

### Error adalah nilai, bukan exception

```go
func getUser(id string) (*User, error) {
    user, err := db.Find(id)
    if err != nil {
        return nil, fmt.Errorf("get user %s: %w", id, err)
    }
    return user, nil
}
```

`if err != nil` yang berulang itu dokumentasi bahwa setiap operasi bisa gagal.

### Interface itu kecil dan implicit

```go
// Interface kecil untuk kebutuhan spesifik
type UserFinder interface {
    FindByEmail(ctx context.Context, email string) (*User, error)
}

type UserRepository struct{ db *sql.DB }

func (r *UserRepository) FindByEmail(ctx context.Context, email string) (*User, error) { ... }
```

Buat interface di sisi konsumen, bukan produsen. Interface yang tidak dipakai untuk testing — hapus saja.

### context.Context selalu parameter pertama

```go
func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error)
```

### Nama pendek di scope pendek, nama jelas di scope panjang

```go
for i, v := range orders {
    fmt.Println(i, v.ID)
}
http.HandleFunc("/orders", func(w http.ResponseWriter, r *http.Request) {})

func (s *Service) FindOrdersByUserID(ctx context.Context, userID string) ([]*Order, error)
```

---

## 1. Database Work

Ikuti protocol: **STOP → ASK → WAIT → VERIFY**. Jangan generate code yang akses database sebelum user konfirmasi schema siap. Schema design → `database-designer`. Query optimization → `database-optimizer`.

Preferensi: **sqlc** (type-safe SQL, explicit queries) atau **pgx** langsung. Hindari GORM — query tersembunyi, N+1 mudah muncul tanpa sadar.

```go
// sqlc — tulis SQL eksplisit, code di-generate
// query.sql:
// -- name: ListPendingOrders :many
// SELECT id, user_id, status FROM orders WHERE status = 'pending'
orders, err := q.ListPendingOrders(ctx)
```

---

## 2. Struktur — scale-aware dengan internal/

Go compiler enforce bahwa package di `internal/` tidak bisa diimport dari luar module. Boundary gratis tanpa linting.

### Simple (< 5 endpoints, 1-2 dev)

```
myapp/
├── main.go        ← wiring + handlers langsung
├── model.go       ← semua model
├── db.go          ← DB connection
└── go.mod
```

### Medium (5-15 endpoints, 3-5 dev)

```
myapp/
├── cmd/api/main.go
├── internal/
│   ├── orders/     ← handler.go, service.go, model.go
│   └── products/   ← handler.go, service.go, model.go
├── pkg/            ← apierr, middleware
└── go.mod
```

### Complex (> 15 endpoints, > 5 dev)

```
myapp/
├── cmd/api/main.go
├── internal/
│   ├── orders/     ← handler.go, service.go, repository.go, model.go
│   ├── inventory/
│   └── domain/     ← shared business rules
└── pkg/
```

Gunakan repository pattern hanya jika perlu switch DB provider, complex query reuse, atau testing perlu banyak mock.

---

## 3. Package naming — noun, bukan manager/helper

```
utils       → ❌
helpers     → ❌
orders      → ✅ berisi Order, Service, Repository
apierr      → ✅ berisi tipe error
middleware  → ✅ berisi HTTP middleware
```

---

## 4. Error: wrap dengan konteks, unwrap dengan errors.As

```go
return nil, fmt.Errorf("find order %s: %w", orderID, err)
```

Unwrap di handler:

```go
var appErr *apierr.AppError
if errors.As(err, &appErr) {
    c.JSON(appErr.StatusCode, gin.H{"ok": false, "error": gin.H{
        "code": appErr.Code, "message": appErr.Message,
    }})
    return
}
```

`errors.As` berjalan melalui chain wrap. Jangan type assertion langsung.

---

## 5. defer untuk cleanup

```go
rows, err := r.db.Query(ctx, "SELECT ... FROM orders WHERE id = $1", id)
if err != nil {
    return nil, fmt.Errorf("query order %s: %w", id, err)
}
defer rows.Close()

if rows.Next() {
    var o Order
    if err := rows.Scan(&o.ID, &o.UserID, &o.Status); err != nil {
        return nil, fmt.Errorf("scan order: %w", err)
    }
    return &o, nil
}
return nil, nil
```

---

## 6. Handler dan service

```go
// internal/orders/handler.go
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
func (s *Service) CancelOrder(ctx context.Context, orderID string) (*Order, error) {
    order, err := s.repo.FindByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("find order %s: %w", orderID, err)
    }
    if order == nil {
        return nil, apierr.New(apierr.NotFound, "Order not found.")
    }
    if order.Status == StatusShipped {
        return nil, apierr.New(apierr.Conflict, "Order already shipped.")
    }
    return s.repo.UpdateStatus(ctx, orderID, StatusCancelled)
}
```

---

## 7. Testing: table-driven

```go
package orders_test

func TestCancelOrder(t *testing.T) {
    tests := []struct {
        name          string
        existingOrder *Order
        wantErrCode   apierr.Code
    }{
        {name: "returns NOT_FOUND when order does not exist", existingOrder: nil, wantErrCode: apierr.NotFound},
        {name: "returns CONFLICT when order has already shipped", existingOrder: &Order{Status: StatusShipped}, wantErrCode: apierr.Conflict},
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

---

## 8. Tooling

```bash
gofmt -w .                     # format
golangci-lint run              # linting
go test -race ./...            # race detector
govulncheck ./...              # vulnerability check
```

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
