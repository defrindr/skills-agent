---
name: fastapi-readability
description: >
  Panduan membangun dan mereview project FastAPI dengan struktur domain-first,
  Pydantic v2 untuk validasi, dependency injection yang bersih, dan kode Python
  yang memanfaatkan fitur modern (async/await, union types, match statement).
  Gunakan skill ini saat init project FastAPI, membuat router baru, code review,
  refactor endpoint/service, validasi payload, setup testing, atau Docker.
  Trigger: "setup fastapi", "init fastapi", "fastapi router", "fastapi pydantic",
  "fastapi dependency injection", "fastapi error handling", "fastapi testing",
  "review fastapi", "python api", "fastapi structure", "fastapi best practice".
---

# FastAPI Readability Skill

Python punya Zen-nya sendiri: *explicit is better than implicit, readability counts, errors should never pass silently.* FastAPI mengikutinya — type hints sebagai dokumentasi sekaligus validasi, auto docs gratis dari schema, async support built-in.

> Untuk naming, folder structure, komentar, test naming, Git, dan API response shape — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk FastAPI dan Python.

---

## 0. Karakter Python/FastAPI yang harus dijaga

### `async def` vs `def` — bukan soal style

FastAPI jalankan `def` endpoint di thread pool terpisah. Kalau endpoint `async def` tapi isinya blocking (query synchronous, `time.sleep`, file I/O sync), itu block seluruh event loop.

```python
# ❌ async def yang di dalamnya blocking
@router.get("/orders")
async def list_orders():
    return db.execute("SELECT * FROM orders").fetchall()  # psycopg2 sync — block!

# ✅ def untuk library synchronous
@router.get("/orders")
def list_orders(session: Session = Depends(get_db)):
    return session.exec(select(Order)).all()

# ✅ async def hanya kalau library-nya juga async
@router.get("/orders")
async def list_orders(session: AsyncSession = Depends(get_async_db)):
    result = await session.execute(select(Order))
    return result.scalars().all()
```

### Python modern — pakai apa yang sudah ada

```python
# ❌ Union type lama
from typing import Optional, Union
def find_user(id: str) -> Optional[User]: ...

# ✅ Python 3.10+
def find_user(id: str) -> User | None: ...
def parse_input(value: str | int) -> str: ...
```

### Pydantic bukan hanya type checking — dia dokumentasi sekaligus

```python
# ❌ Validasi manual di endpoint
@router.post("/orders")
async def create_order(body: dict):
    if not body.get("product_id"):
        raise HTTPException(400, "product_id required")
    if body["quantity"] < 1:
        raise HTTPException(400, "quantity must be positive")

# ✅ Pydantic handle validasi, endpoint jadi satu baris
class CreateOrderInput(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=99)
    notes: str | None = Field(None, max_length=500)

@router.post("/orders", status_code=201)
async def create_order(body: CreateOrderInput, service: OrdersService = Depends()):
    return await service.create_order(body)
```

---

## 1. Struktur folder

Feature-first sesuai `common/project-readability`. Tambahan untuk FastAPI:

```
app/
├── features/
│   └── orders/
│       ├── router.py      ← hanya wiring endpoint
│       ├── service.py     ← use-case / business logic
│       ├── repository.py  ← query ke DB
│       └── schemas.py     ← Pydantic input/output
├── shared/
│   ├── db/session.py
│   ├── errors/app_error.py
│   └── security/
└── main.py                ← hanya lifespan + include_router
```

---

## 2. `main.py` — lifespan, bukan `on_event`

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)
app.include_router(orders_router, prefix="/orders", tags=["orders"])
register_exception_handlers(app)
```

`@app.on_event("startup")` sudah deprecated. Gunakan `lifespan`.

---

## 3. Dependency injection — `Depends` yang benar

```python
# ❌ Global session — tidak bisa di-test, tidak bisa di-override
db = AsyncSession(engine)

# ✅ DI lewat Depends — bisa di-override saat testing
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSession(engine) as session:
        yield session

class OrdersRepository:
    def __init__(self, session: AsyncSession = Depends(get_db)):
        self.session = session

class OrdersService:
    def __init__(self, repo: OrdersRepository = Depends()):
        self.repo = repo
```

---

## 4. Schema Pydantic v2

```python
from pydantic import BaseModel, UUID4, Field, ConfigDict
from pydantic.alias_generators import to_camel

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,   # snake_case internal → camelCase ke client
        populate_by_name=True,
        from_attributes=True,       # kompatibel dengan ORM object
    )

    id: UUID4
    status: Literal["pending", "confirmed", "shipped", "cancelled"]
    total_amount: float
    created_at: datetime
```

Response model wajib eksplisit — jangan return ORM object atau dict mentah.

---

## 5. Error handling — wiring ke AppError dari `common`

Pattern `AppError` dari `common/project-readability`. Cara register di FastAPI:

```python
# app/shared/errors/app_error.py
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={"ok": False, "error": {"code": exc.code, "message": exc.message}},
        )

    @app.exception_handler(Exception)
    async def handle_unexpected(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error on %s %s", request.method, request.url)
        return JSONResponse(
            status_code=500,
            content={"ok": False, "error": {"code": "INTERNAL_ERROR", "message": "Something went wrong."}},
        )
```

---

## 6. Testing

```python
# pytest dengan fixtures — composable, bukan monolithic
@pytest.fixture
def orders_service():
    service = OrdersService.__new__(OrdersService)
    service.repo = AsyncMock()
    return service

@pytest.mark.asyncio
async def test_cancel_order_raises_not_found_when_order_does_not_exist(orders_service):
    orders_service.repo.find_by_id.return_value = None

    with pytest.raises(AppError) as exc_info:
        await orders_service.cancel_order("nonexistent-id")

    assert exc_info.value.code == ErrorCode.NOT_FOUND
```

Nama test mengikuti `common/project-readability` — natural language, bukan technical description.

---

## 7. Tooling

```bash
# Package management — uv, jauh lebih cepat dari pip
uv init && uv add fastapi uvicorn pydantic sqlalchemy
uv add --dev ruff mypy pytest pytest-asyncio httpx
```

`ruff.toml`:
```toml
[lint]
select = ["E", "F", "I", "UP", "B", "SIM"]
# UP: pyupgrade — enforce Python modern syntax
# B: flake8-bugbear — common bugs
# SIM: simplify
```

---

## 8. Docker

```dockerfile
FROM python:3.12-slim AS base
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
COPY . .
EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```
