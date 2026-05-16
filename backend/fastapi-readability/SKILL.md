---
name: fastapi-readability
description: >
  Panduan membangun dan mereview project FastAPI dengan readability tinggi,
  struktur domain-first, Pydantic v2 untuk validasi, dependency injection yang bersih,
  error handling konsisten, response model eksplisit, dan kode Python yang tidak terasa
  seperti output AI mentah. Gunakan skill ini saat init project FastAPI, membuat router baru,
  code review, refactor endpoint/service, validasi payload, setup testing, Docker,
  atau saat project FastAPI mulai berantakan dengan semua route di satu file,
  return dict mentah, atau tidak ada separation of concern yang jelas.
  Trigger: "setup fastapi", "init fastapi", "fastapi router", "fastapi dependency injection",
  "fastapi pydantic", "fastapi error handling", "fastapi testing", "review fastapi",
  "python api", "fastapi structure", "fastapi best practice".
---

# FastAPI Readability Skill

Skill ini adalah versi FastAPI dari `project-readability`.

FastAPI bagus di developer experience awal — auto docs, type hints, async support. Tapi tanpa struktur, proyek cepat jadi `main.py` 600 baris dengan semua endpoint digabung, response berupa `dict` mentah, dan error handling berupa `HTTPException(status_code=400, detail="Error")` di mana-mana.

Tujuan skill ini:

- FastAPI project yang punya boundary jelas per domain
- Response yang konsisten dan tidak bocor schema internal
- Error yang actionable, bukan kode HTTP doang
- Test yang dokumentasi behavior, bukan test yang cuma cek status code

Aturan tertinggi:

> **project-readability adalah segalanya.**
> Boring Python lebih baik dari clever Python. Eksplisit lebih baik dari implisit — itu prinsip Python sendiri.

---

## 0. Taste rules

| Rule | Artinya di FastAPI |
|---|---|
| Jangan bikin abstraction sebelum pola berulang. | Jangan buru-buru bikin `BaseService`, `CRUDRepository[T]`, atau generic router factory kalau belum ada kebutuhan nyata. |
| Prefer boring code. | `Annotated[str, Query()]` yang eksplisit lebih baik dari decorator magic yang butuh 3 file untuk dipahami. |
| Nama function harus menjelaskan intent. | `create_order`, `cancel_order`, `mark_invoice_as_paid` lebih baik dari `handle`, `process`, `execute`. |
| Error harus actionable. | Jangan `HTTPException(400, "Bad request")`. Tulis apa yang salah dan apa yang harus dilakukan. |

---

## 1. Struktur folder: domain-first

Jangan ini:

```txt
app/
├── routers/
├── schemas/
├── models/
├── services/
├── dependencies/
└── main.py
```

Pakai ini:

```txt
app/
├── features/
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── test_service.py
│   │
│   ├── orders/
│   │   ├── __init__.py
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py
│   │   ├── schemas.py
│   │   └── test_service.py
│   │
│   └── users/
│       ├── __init__.py
│       ├── router.py
│       ├── service.py
│       ├── repository.py
│       └── schemas.py
│
├── shared/
│   ├── api/
│   │   └── response.py
│   ├── errors/
│   │   ├── app_error.py
│   │   └── error_code.py
│   ├── db/
│   │   └── session.py
│   └── security/
│       └── verify_hmac.py
│
└── main.py        ← wiring saja
```

---

## 2. `main.py` hanya wiring

```python
# app/main.py
from fastapi import FastAPI
from app.features.auth.router import router as auth_router
from app.features.orders.router import router as orders_router
from app.features.users.router import router as users_router
from app.shared.errors.app_error import register_exception_handlers

app = FastAPI(title="My API")

app.include_router(auth_router, prefix="/auth", tags=["auth"])
app.include_router(orders_router, prefix="/orders", tags=["orders"])
app.include_router(users_router, prefix="/users", tags=["users"])

register_exception_handlers(app)
```

Tidak ada business logic di `main.py`.

---

## 3. Router tipis — service yang berisi use-case

```python
# app/features/orders/router.py
from fastapi import APIRouter, Depends
from app.features.orders.schemas import CreateOrderInput, OrderResponse
from app.features.orders.service import OrdersService
from app.shared.api.response import ApiResponse

router = APIRouter()


@router.post("/", response_model=ApiResponse[OrderResponse], status_code=201)
async def create_order(
    body: CreateOrderInput,
    service: OrdersService = Depends(),
):
    order = await service.create_order(body)
    return ApiResponse.success(order)


@router.post("/{order_id}/cancel", response_model=ApiResponse[OrderResponse])
async def cancel_order(
    order_id: str,
    service: OrdersService = Depends(),
):
    cancelled = await service.cancel_order(order_id)
    return ApiResponse.success(cancelled)
```

Service berisi logic nyata:

```python
# app/features/orders/service.py
from app.features.orders.repository import OrdersRepository
from app.features.orders.schemas import CreateOrderInput
from app.shared.errors.app_error import AppError
from app.shared.errors.error_code import ErrorCode


class OrdersService:
    def __init__(self, repo: OrdersRepository = Depends()):
        self.repo = repo

    async def create_order(self, input: CreateOrderInput):
        pending = await self.repo.find_pending_by_user_id(input.user_id)

        if pending:
            raise AppError(
                code=ErrorCode.CONFLICT,
                message="You already have a pending order. Complete or cancel it before creating a new one.",
                status_code=409,
            )

        return await self.repo.create(input)

    async def cancel_order(self, order_id: str):
        order = await self.repo.find_by_id(order_id)

        if not order:
            raise AppError(
                code=ErrorCode.NOT_FOUND,
                message="Order not found.",
                status_code=404,
            )

        if order.status == "shipped":
            raise AppError(
                code=ErrorCode.CONFLICT,
                message="Order cannot be cancelled because it has already been shipped.",
                status_code=409,
            )

        return await self.repo.update_status(order_id, "cancelled")
```

---

## 4. Schema Pydantic v2 — eksplisit, bukan magic

```python
# app/features/orders/schemas.py
from pydantic import BaseModel, UUID4, Field
from datetime import datetime
from typing import Literal


class CreateOrderInput(BaseModel):
    product_id: UUID4
    quantity: int = Field(ge=1, le=99)
    notes: str | None = Field(None, max_length=500)


class OrderResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    product_id: UUID4
    quantity: int
    status: Literal["pending", "confirmed", "shipped", "cancelled"]
    created_at: datetime

    model_config = {"from_attributes": True}
```

Response model wajib eksplisit. Jangan return dict mentah atau return ORM object langsung.

```python
# ❌ Bocorkan schema internal
@router.get("/{id}")
async def get_order(id: str):
    return await db.query(Order).filter(Order.id == id).first()

# ✅ Mapping eksplisit lewat response_model
@router.get("/{id}", response_model=ApiResponse[OrderResponse])
async def get_order(id: str, service: OrdersService = Depends()):
    order = await service.get_order_by_id(id)
    return ApiResponse.success(order)
```

---

## 5. API response envelope

```python
# app/shared/api/response.py
from typing import TypeVar, Generic
from pydantic import BaseModel

T = TypeVar("T")


class ApiSuccess(BaseModel, Generic[T]):
    ok: bool = True
    data: T
    meta: dict | None = None


class ApiErrorBody(BaseModel):
    code: str
    message: str
    details: dict | None = None


class ApiErrorResponse(BaseModel):
    ok: bool = False
    error: ApiErrorBody


# Alias untuk dipakai di router
ApiResponse = ApiSuccess
```

Response selalu `camelCase` ke client. Kalau schema internal pakai `snake_case`, gunakan `alias_generator`:

```python
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class OrderResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )

    id: str
    order_number: str
    created_at: str
    total_amount: float
```

---

## 6. Error handling

### AppError

```python
# app/shared/errors/app_error.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse


class AppError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 400, details: dict | None = None):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def register_exception_handlers(app: FastAPI):
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "ok": False,
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "details": exc.details,
                },
            },
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception):
        # Log ke Sentry / logger, jangan expose detail ke client
        return JSONResponse(
            status_code=500,
            content={
                "ok": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Something went wrong. Please try again later.",
                },
            },
        )
```

### ErrorCode

```python
# app/shared/errors/error_code.py
class ErrorCode:
    UNAUTHORIZED = "UNAUTHORIZED"
    FORBIDDEN = "FORBIDDEN"
    NOT_FOUND = "NOT_FOUND"
    CONFLICT = "CONFLICT"
    VALIDATION_FAILED = "VALIDATION_FAILED"
    INTERNAL_ERROR = "INTERNAL_ERROR"
```

Error business harus kasih next step:

```python
# ❌
raise AppError("ERROR", "Something failed", 400)

# ✅
raise AppError(
    code=ErrorCode.CONFLICT,
    message="Payment has already been processed for this order. Raise a refund request instead.",
    status_code=409,
)
```

---

## 7. Naming Python yang manusiawi

```python
# ❌ AI-style: generic, tidak menjelaskan intent
async def get_data(id: str): ...
async def handle_request(data: dict): ...
async def process_item(item): ...

# ✅ Jelasin apa yang terjadi
async def get_order_by_id(order_id: str): ...
async def create_password_reset_token(user_id: str): ...
async def mark_invoice_as_paid(invoice_id: str, paid_at: datetime): ...
```

```python
# ❌ Variable generic
data = await repo.find(id)
result = service.process(input)
temp = [x for x in orders if x.status == "active"]

# ✅
order = await repo.find_by_id(order_id)
created_order = await service.create_order(input)
active_orders = [o for o in orders if o.status == "active"]
```

---

## 8. Dependency injection — pakai `Depends`, bukan global state

```python
# ❌ Global state yang sulit di-test
db = Database(DATABASE_URL)

@router.get("/orders")
async def list_orders():
    return await db.query(...)

# ✅ DI yang bisa di-override saat testing
async def get_db_session():
    async with AsyncSession(engine) as session:
        yield session

@router.get("/orders")
async def list_orders(
    session: AsyncSession = Depends(get_db_session),
    service: OrdersService = Depends(),
):
    return await service.list_active_orders()
```

---

## 9. Testing dengan pytest + httpx

```python
# app/features/orders/test_service.py
import pytest
from unittest.mock import AsyncMock, patch
from app.features.orders.service import OrdersService
from app.shared.errors.app_error import AppError
from app.shared.errors.error_code import ErrorCode


@pytest.mark.asyncio
async def test_cancel_order_raises_not_found_when_order_does_not_exist():
    service = OrdersService.__new__(OrdersService)
    service.repo = AsyncMock()
    service.repo.find_by_id.return_value = None

    with pytest.raises(AppError) as exc_info:
        await service.cancel_order("nonexistent-id")

    assert exc_info.value.code == ErrorCode.NOT_FOUND


@pytest.mark.asyncio
async def test_cancel_order_raises_conflict_when_order_already_shipped():
    service = OrdersService.__new__(OrdersService)
    service.repo = AsyncMock()
    service.repo.find_by_id.return_value = type("Order", (), {"status": "shipped"})()

    with pytest.raises(AppError) as exc_info:
        await service.cancel_order("order-id")

    assert exc_info.value.code == ErrorCode.CONFLICT
```

Nama test = dokumentasi behavior:

```python
# ❌
def test_cancel_order_400(): ...
def test_error_case(): ...

# ✅
def test_cancel_order_rejects_when_order_already_shipped(): ...
def test_create_order_prevents_duplicate_pending_order(): ...
```

---

## 10. Docker

```dockerfile
# Dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base AS runner
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  api:
    build: .
    ports:
      - "8000:8000"
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
