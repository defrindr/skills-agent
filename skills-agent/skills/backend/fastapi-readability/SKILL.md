---
name: fastapi-readability
description: >
  Panduan membangun dan mereview project FastAPI dengan struktur domain-first,
  Pydantic v2 untuk validasi, dependency injection yang bersih, dan kode Python
  yang memanfaatkan fitur modern.
  Gunakan saat init project FastAPI, membuat router baru, code review,
  refactor endpoint/service, validasi payload, setup testing, Docker.
  Trigger: "setup fastapi", "init fastapi", "fastapi router", "fastapi pydantic",
  "fastapi dependency injection", "fastapi error handling", "fastapi testing",
  "review fastapi", "python api", "fastapi structure".
  EXCLUDES: Database schema design, SQLAlchemy models, Alembic migrations.
  Defer ke database-designer dan database-optimizer.
---

# FastAPI Readability Skill

Python Zen: *explicit is better than implicit, readability counts*. FastAPI mengikutinya — type hints sebagai dokumentasi sekaligus validasi, auto docs dari schema.

> Untuk naming, folder structure, API response, error handling — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal spesifik untuk FastAPI dan Python.
> **Jangan over-engineer**: struktur sesuaikan dengan skala project.

---

## 0. Karakter Python/FastAPI yang harus dijaga

### async def vs def — bukan soal style

FastAPI jalankan `def` endpoint di thread pool. `async def` dengan blocking query akan block event loop.

```python
# def untuk library synchronous
@router.get("/orders")
def list_orders(session: Session = Depends(get_db)):
    return session.exec(select(Order)).all()

# async def hanya kalau library-nya juga async
@router.get("/orders")
async def list_orders(session: AsyncSession = Depends(get_async_db)):
    result = await session.execute(select(Order))
    return result.scalars().all()
```

### Python modern

```python
# ✅ Python 3.10+
def find_user(id: str) -> User | None: ...
def parse_input(value: str | int) -> str: ...
```

### Pydantic = dokumentasi + validasi

```python
class CreateOrderInput(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1, le=99)
    notes: str | None = Field(None, max_length=500)

@router.post("/orders", status_code=201)
async def create_order(body: CreateOrderInput, service: OrdersService = Depends()):
    return await service.create_order(body)
```

---

## 1. Database Work

Ikuti protocol: **STOP → ASK → WAIT → VERIFY**. Jangan generate code yang akses database sebelum user konfirmasi schema siap. Schema design → `database-designer`. Query optimization → `database-optimizer`.

**Penting**: `schemas.py` = Pydantic validation, BUKAN database schema.

```python
# schemas.py — request/response validation
class CreateOrderInput(BaseModel):
    product_id: UUID4
    quantity: int = Field(gt=0, le=99)

class OrderResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    created_at: datetime
    model_config = {"from_attributes": True}
```

```python
# models.py — SQLAlchemy models (dari database-designer)
class Order(Base):
    __tablename__ = "orders"
    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
```

```bash
alembic revision --autogenerate -m "add orders table"
alembic upgrade head
```

---

## 2. Struktur folder — scale-aware

### Simple (< 5 endpoints, 1-2 dev)

```
app/
├── routers/orders.py    ← endpoint + logic langsung
├── db.py
├── schemas.py
├── config.py
└── main.py
```

### Medium (5-15 endpoints, 3-5 dev)

```
app/
├── features/
│   ├── orders/     ← router.py, service.py, schemas.py
│   └── products/   ← router.py, service.py
├── shared/         ← db/, errors/, security/
└── main.py
```

### Complex (> 15 endpoints, > 5 dev)

```
app/
├── features/
│   ├── orders/     ← router.py, service.py, repository.py, schemas.py
│   └── inventory/
├── shared/domain/  ← business rules
└── main.py
```

Gunakan repository pattern hanya jika perlu switch DB provider, complex query reuse, atau testing perlu banyak mock.

---

## 3. main.py — lifespan, bukan on_event

```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield
    await close_db()

app = FastAPI(lifespan=lifespan)
app.include_router(orders_router, prefix="/orders", tags=["orders"])
register_exception_handlers(app)
```

`@app.on_event("startup")` sudah deprecated.

---

## 4. Dependency injection — Depends

```python
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

## 5. Schema Pydantic v2 — camelCase ke client

```python
from pydantic.alias_generators import to_camel

class OrderResponse(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )
    id: UUID4
    status: Literal["pending", "confirmed", "shipped", "cancelled"]
    total_amount: float
    created_at: datetime
```

---

## 6. Error handling

```python
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

## 7. Testing

```python
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

---

## 8. Tooling

```bash
uv init && uv add fastapi uvicorn pydantic sqlalchemy
uv add --dev ruff mypy pytest pytest-asyncio httpx
```

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
