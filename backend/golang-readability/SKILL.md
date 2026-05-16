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
---

# Go Readability Skill

Skill ini adalah versi Go dari `project-readability`.

Go punya filosofi yang sudah sejajar dengan taste rules readability: satu cara melakukan sesuatu, naming pendek tapi jelas, error eksplisit, tidak ada magic. Yang bikin project Go berantakan bukan framework-nya, tapi kebiasaan import pola dari bahasa lain:

- Struktur `controllers/`, `services/`, `repositories/` ala MVC
- Interface untuk setiap struct walau hanya satu implementasi
- Error wrapping yang asal, atau yang lebih buruk: `_ =`
- Package bernama `utils`, `common`, `helpers`, `manager`

Tujuan skill ini: **Go project yang terasa seperti Go, bukan Java atau PHP yang ditulis dengan syntax Go.**

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Kalau ada pattern "Go idiomatic" yang membuat kode lebih sulit dibaca, skip pattern itu.

---

## 0. Taste rules

| Rule | Artinya di Go |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Interface bukan default. Buat interface hanya saat ada dua implementasi berbeda atau saat testing butuh mock. |
| Prefer boring code. | `if err != nil { return err }` yang berulang lebih baik dari error handling library yang butuh dokumentasi. |
| Nama harus menjelaskan intent. | Nama pendek oke di scope sempit (`i`, `v`, `err`). Nama panjang untuk exported symbol yang hidup lama. |
| Error harus actionable. | Wrap error dengan konteks: `fmt.Errorf("cancel order %s: %w", orderID, err)`. |

---

## 1. Struktur: domain dalam `internal/`

Go punya convention `internal/` yang enforce visibility. Gunakan itu.

```txt
myapp/
├── cmd/
│   └── api/
│       └── main.go          ← entrypoint, wiring saja
│
├── internal/
│   ├── auth/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   ├── model.go
│   │   └── service_test.go
│   │
│   ├── orders/
│   │   ├── handler.go
│   │   ├── service.go
│   │   ├── repository.go
│   │   ├── model.go
│   │   └── service_test.go
│   │
│   └── users/
│       ├── handler.go
│       ├── service.go
│       ├── repository.go
│       └── model.go
│
├── pkg/
│   ├── apierr/
│   │   ├── apierr.go
│   │   └── codes.go
│   ├── apiresponse/
│   │   └── apiresponse.go
│   ├── middleware/
│   │   ├── auth.go
│   │   └── hmac.go
│   └── logger/
│       └── logger.go
│
├── go.mod
└── docker-compose.yml
```

Kenapa `internal/` bukan `src/`? Karena Go compiler enforce bahwa code di `internal/` tidak bisa diimport dari luar module. Itu boundary gratis.

Kenapa domain-first di dalam `internal/`? Supaya saat mau hapus fitur `orders`, cukup hapus `internal/orders/`.

---

## 2. `main.go` hanya wiring

```go
// cmd/api/main.go
package main

import (
    "log"
    "net/http"

    "github.com/gin-gonic/gin"
    "myapp/internal/auth"
    "myapp/internal/orders"
    "myapp/internal/users"
    "myapp/pkg/middleware"
)

func main() {
    r := gin.New()
    r.Use(gin.Recovery())
    r.Use(middleware.RequestLogger())

    db := mustConnectDB()

    auth.RegisterRoutes(r, db)
    orders.RegisterRoutes(r, db)
    users.RegisterRoutes(r, db)

    if err := r.Run(":8080"); err != nil {
        log.Fatalf("server failed to start: %v", err)
    }
}
```

Tidak ada business logic di `main.go`. Tidak ada conditional routing berdasarkan feature flag.

---

## 3. Handler tipis, service yang berisi use-case

```go
// internal/orders/handler.go
package orders

import (
    "net/http"

    "github.com/gin-gonic/gin"
    "myapp/pkg/apierr"
    "myapp/pkg/apiresponse"
)

type Handler struct {
    service *Service
}

func NewHandler(service *Service) *Handler {
    return &Handler{service: service}
}

func RegisterRoutes(r *gin.Engine, db *sql.DB) {
    repo := NewRepository(db)
    svc := NewService(repo)
    h := NewHandler(svc)

    g := r.Group("/orders")
    g.POST("/", h.CreateOrder)
    g.POST("/:orderID/cancel", h.CancelOrder)
}

func (h *Handler) CreateOrder(c *gin.Context) {
    var input CreateOrderInput
    if err := c.ShouldBindJSON(&input); err != nil {
        apierr.RespondValidation(c, err)
        return
    }

    order, err := h.service.CreateOrder(c.Request.Context(), input)
    if err != nil {
        apierr.Respond(c, err)
        return
    }

    apiresponse.Created(c, order)
}

func (h *Handler) CancelOrder(c *gin.Context) {
    orderID := c.Param("orderID")

    order, err := h.service.CancelOrder(c.Request.Context(), orderID)
    if err != nil {
        apierr.Respond(c, err)
        return
    }

    apiresponse.OK(c, order)
}
```

Service berisi use-case nyata:

```go
// internal/orders/service.go
package orders

import (
    "context"
    "fmt"

    "myapp/pkg/apierr"
)

type Service struct {
    repo *Repository
}

func NewService(repo *Repository) *Service {
    return &Service{repo: repo}
}

func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error) {
    pending, err := s.repo.FindPendingByUserID(ctx, input.UserID)
    if err != nil {
        return nil, fmt.Errorf("check pending order: %w", err)
    }

    if pending != nil {
        return nil, apierr.New(
            apierr.Conflict,
            "You already have a pending order. Complete or cancel it before creating a new one.",
        )
    }

    order, err := s.repo.Create(ctx, input)
    if err != nil {
        return nil, fmt.Errorf("create order: %w", err)
    }

    return order, nil
}

func (s *Service) CancelOrder(ctx context.Context, orderID string) (*Order, error) {
    order, err := s.repo.FindByID(ctx, orderID)
    if err != nil {
        return nil, fmt.Errorf("find order %s: %w", orderID, err)
    }

    if order == nil {
        return nil, apierr.New(apierr.NotFound, "Order not found.")
    }

    if order.Status == "shipped" {
        return nil, apierr.New(
            apierr.Conflict,
            "Order cannot be cancelled because it has already been shipped.",
        )
    }

    updated, err := s.repo.UpdateStatus(ctx, orderID, "cancelled")
    if err != nil {
        return nil, fmt.Errorf("cancel order %s: %w", orderID, err)
    }

    return updated, nil
}
```

---

## 4. Error handling — eksplisit, wrap dengan konteks

```go
// pkg/apierr/apierr.go
package apierr

import (
    "errors"
    "net/http"

    "github.com/gin-gonic/gin"
)

type Code string

const (
    Unauthorized Code = "UNAUTHORIZED"
    Forbidden    Code = "FORBIDDEN"
    NotFound     Code = "NOT_FOUND"
    Conflict     Code = "CONFLICT"
    Validation   Code = "VALIDATION_FAILED"
    Internal     Code = "INTERNAL_ERROR"
)

type AppError struct {
    Code       Code
    Message    string
    StatusCode int
}

func (e *AppError) Error() string {
    return e.Message
}

func New(code Code, message string) *AppError {
    statusMap := map[Code]int{
        Unauthorized: http.StatusUnauthorized,
        Forbidden:    http.StatusForbidden,
        NotFound:     http.StatusNotFound,
        Conflict:     http.StatusConflict,
        Validation:   http.StatusUnprocessableEntity,
        Internal:     http.StatusInternalServerError,
    }

    status, ok := statusMap[code]
    if !ok {
        status = http.StatusBadRequest
    }

    return &AppError{Code: code, Message: message, StatusCode: status}
}

func Respond(c *gin.Context, err error) {
    var appErr *AppError
    if errors.As(err, &appErr) {
        c.JSON(appErr.StatusCode, gin.H{
            "ok": false,
            "error": gin.H{
                "code":    appErr.Code,
                "message": appErr.Message,
            },
        })
        return
    }

    // Unexpected error — log, jangan expose ke client
    c.JSON(http.StatusInternalServerError, gin.H{
        "ok": false,
        "error": gin.H{
            "code":    Internal,
            "message": "Something went wrong. Please try again later.",
        },
    })
}
```

Jangan ini:

```go
// ❌ Error di-swallow
result, _ := repo.FindByID(ctx, id)

// ❌ Error tanpa konteks
return fmt.Errorf("error: %v", err)

// ❌ Panic untuk flow biasa
if order == nil {
    panic("order not found")
}
```

Lakukan ini:

```go
// ✅ Error selalu ditangani
result, err := repo.FindByID(ctx, id)
if err != nil {
    return nil, fmt.Errorf("find order by id %s: %w", id, err)
}

// ✅ Business error = AppError, bukan panic
if order == nil {
    return nil, apierr.New(apierr.NotFound, "Order not found.")
}
```

---

## 5. Interface — hanya saat perlu

```go
// ❌ Interface untuk semua struct, bahkan yang cuma satu implementasi
type OrderRepository interface {
    FindByID(ctx context.Context, id string) (*Order, error)
    Create(ctx context.Context, input CreateOrderInput) (*Order, error)
}

type orderRepositoryImpl struct {
    db *sql.DB
}

// ✅ Struct langsung. Tambah interface saat butuh mock atau implementasi kedua.
type Repository struct {
    db *sql.DB
}

func (r *Repository) FindByID(ctx context.Context, id string) (*Order, error) { ... }
```

Interface bisa ditambah kapan saja saat benar-benar dibutuhkan. Bukan harus ada dari awal.

---

## 6. Naming Go yang idiomatis

Nama package: noun pendek, lowercase, tanpa underscore.

```go
// ❌
package orderManagement
package order_service
package orderUtils
package helpers

// ✅
package orders
package auth
package apierr
package apiresponse
```

Nama struct dan function: PascalCase untuk exported, camelCase untuk unexported.

```go
// ❌ Terlalu verbose ala Java
type OrderManagementService struct{}
func (s *OrderManagementService) ProcessOrderCreation(ctx context.Context, data OrderCreationDTO) {}

// ✅ Go style
type Service struct{}
func (s *Service) CreateOrder(ctx context.Context, input CreateOrderInput) (*Order, error) {}
```

Nama receiver: satu atau dua huruf berdasarkan tipe, konsisten.

```go
// ❌
func (service *Service) CreateOrder(...) {}
func (this *Repository) FindByID(...) {}

// ✅
func (s *Service) CreateOrder(...) {}
func (r *Repository) FindByID(...) {}
```

---

## 7. Testing — table-driven, nama jelasin behavior

```go
// internal/orders/service_test.go
package orders_test

import (
    "context"
    "testing"

    "github.com/stretchr/testify/assert"
    "myapp/pkg/apierr"
)

func TestCancelOrder(t *testing.T) {
    tests := []struct {
        name       string
        order      *Order
        wantErrCode apierr.Code
    }{
        {
            name:        "returns NOT_FOUND when order does not exist",
            order:       nil,
            wantErrCode: apierr.NotFound,
        },
        {
            name:        "returns CONFLICT when order has already been shipped",
            order:       &Order{Status: "shipped"},
            wantErrCode: apierr.Conflict,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            repo := &mockRepository{order: tt.order}
            svc := NewService(repo)

            _, err := svc.CancelOrder(context.Background(), "order-id")

            var appErr *apierr.AppError
            assert.ErrorAs(t, err, &appErr)
            assert.Equal(t, tt.wantErrCode, appErr.Code)
        })
    }
}
```

---

## 8. Docker

```dockerfile
# Dockerfile
FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /bin/api ./cmd/api

FROM scratch
COPY --from=builder /bin/api /api
EXPOSE 8080
ENTRYPOINT ["/api"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8080:8080"
    env_file: .env
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 5s
      retries: 5
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```
