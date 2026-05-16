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
  
  EXCLUDES: Database schema design, SQLAlchemy models, Alembic migrations, query optimization.
  Untuk database work, defer ke database-designer dan database-optimizer skills.
---

# FastAPI Readability Skill

Python punya Zen-nya sendiri: *explicit is better than implicit, readability counts, errors should never pass silently.* FastAPI mengikutinya — type hints sebagai dokumentasi sekaligus validasi, auto docs gratis dari schema, async support built-in.

> **PENTING**: Untuk naming, folder structure, komentar, test naming, Git, API response shape, dan **scale-aware architecture** — ikuti `common/project-readability`.
> Skill ini hanya mencakup hal yang spesifik untuk FastAPI dan Python.
> 
> **Jangan over-engineer**: Simple project ≠ butuh service layer, startup ≠ butuh repository pattern, complex domain ≠ harus domain-driven design.
> Struktur folder di bawah adalah contoh — **sesuaikan dengan skala project** sesuai `project-readability`.

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

## 1. Database Work — Defer to Database Skills

**PENTING**: Skill ini untuk **application code** (routers, services, dependencies), **bukan database design**.

### Klarifikasi: `schemas.py` vs Database Schema

**CRITICAL**: Di FastAPI, `schemas.py` = **Pydantic validation models**, BUKAN database schema!

```python
# schemas.py = REQUEST/RESPONSE VALIDATION (Pydantic)
from pydantic import BaseModel, Field, UUID4

class CreateOrderInput(BaseModel):
    product_id: UUID4
    quantity: int = Field(gt=0, le=99)
    notes: str | None = Field(None, max_length=500)

class OrderResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    product_id: UUID4
    quantity: int
    created_at: datetime
```

```python
# models.py = DATABASE MODELS (SQLAlchemy)
from sqlalchemy import Column, Integer, ForeignKey, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[UUID] = mapped_column(primary_key=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id"))
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id"))
    quantity: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    
    # Relationships from database-designer
    user: Mapped["User"] = relationship(back_populates="orders")
    product: Mapped["Product"] = relationship()
```

**Jangan sampai bingung**: Pydantic validation ≠ database schema design!

### Kapan Invoke Database Skills

**Sebelum membuat ANY SQLAlchemy model atau Alembic migration:**

1. **Schema design** → Invoke `database-designer` skill
   - Trigger: "design Order model", "create users table", "design relasi order-items"
   - Output: ERD, SQLAlchemy models (with Mapped types), Alembic migration, indexes, constraints
   
2. **Query optimization** → Invoke `database-optimizer` skill
   - Trigger: "slow query di get_orders", "N+1 problem with relationships", "need eager loading"
   - Output: EXPLAIN analysis, selectinload vs joinedload recommendations, index suggestions

### Skill Boundary

✅ **Skill ini (fastapi-readability) handle:**
- Feature-first folder structure
- Pydantic validation schemas (request/response)
- Dependency injection (`Depends(get_db)`, `Depends(get_current_user)`)
- Service/repository patterns (application layer)
- Error handling (HTTPException, AppError)

❌ **Skill ini TIDAK handle:**
- SQLAlchemy model design → `database-designer`
- Alembic migrations → `database-designer`
- Query optimization (EXPLAIN, indexes) → `database-optimizer`
- Relationship strategies (lazy vs eager) → `database-optimizer`

### Workflow yang Benar

**User tanya:** "Bikin orders endpoint di FastAPI"

**✅ Correct flow:**
1. Tanya: "Apakah model Order sudah di-design? Ada relasi ke User/Product?"
2. Kalau belum → Sarankan invoke `database-designer` dulu:
   - "Sebelum bikin endpoint, design model Order dulu. Invoke: 'Design orders model dengan ForeignKey ke users dan products, include status enum, timestamps, dan soft delete. Need indexes on user_id, status, created_at'"
3. Setelah design ready → User jalankan migration:
   ```bash
   # database-designer akan output Alembic migration
   alembic upgrade head
   ```
4. Kemudian generate FastAPI code:
   - `features/orders/schemas.py` (Pydantic validation)
   - `features/orders/models.py` (from database-designer output)
   - `features/orders/service.py` (business logic)
   - `features/orders/router.py` (HTTP layer)
5. Reminder: "Pastikan migration sudah include index di `orders.user_id` dan `orders.created_at`. Check dengan `database-optimizer` jika query lambat."

**❌ Wrong flow:**
```python
# Jangan langsung generate SQLAlchemy model tanpa design:
class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True)  # ← tipe data? UUID? relasi?
    user_id = Column(Integer)               # ← foreign key? index?
    total = Column(Float)                   # ← precision? decimal?
```

### SQLAlchemy/Alembic Tips (after schema designed)

**Generate migration** dari database-designer output:
```bash
# database-designer akan berikan Alembic migration file
alembic revision --autogenerate -m "add orders table"
alembic upgrade head
```

**Di application code** (setelah migration run):
```python
# features/orders/models.py (from database-designer)
from sqlalchemy import Enum, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal

class Order(Base):
    __tablename__ = "orders"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[str] = mapped_column(Enum("pending", "paid", "shipped", name="order_status"))
    total: Mapped[Decimal] = mapped_column(precision=10, scale=2)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    
    # Relationships from database-designer
    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    
    # Indexes from database-designer
    __table_args__ = (
        Index("ix_orders_user_status", "user_id", "status"),
        Index("ix_orders_created_at", "created_at"),
    )
```

```python
# features/orders/service.py (application layer)
from sqlalchemy import select
from sqlalchemy.orm import selectinload

class OrdersService:
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_user_orders(self, user_id: UUID) -> list[Order]:
        # selectinload from database-optimizer recommendation (avoid N+1)
        stmt = (
            select(Order)
            .options(selectinload(Order.items))
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()
```

```python
# features/orders/schemas.py (Pydantic validation)
from pydantic import BaseModel, UUID4, Field
from decimal import Decimal

class CreateOrderInput(BaseModel):
    product_id: UUID4
    quantity: int = Field(gt=0, le=99)

class OrderResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    status: str
    total: Decimal
    created_at: datetime
    
    model_config = {"from_attributes": True}  # untuk .model_validate(order)
```

---

## 2. Struktur folder — scale-aware

**Aturan**: Ikuti `common/project-readability` untuk scale-aware architecture. Contoh di bawah untuk referensi saja.

### Simple project (< 5 endpoints, 1-2 dev, CRUD API)

```
app/
├── routers/
│   ├── orders.py          ← endpoint + logic langsung
│   └── products.py
├── db.py                   ← SQLAlchemy session
├── schemas.py              ← Pydantic models (semua)
├── config.py               ← env validation
└── main.py

# orders.py — no service layer, langsung panggil DB
@router.post("/", status_code=201)
async def create_order(body: CreateOrderInput, session: AsyncSession = Depends(get_db)):
    order = Order(**body.model_dump())
    session.add(order)
    await session.commit()
    return OrderResponse.model_validate(order)
```

### Medium project (5-15 endpoints, 3-5 dev, business logic mulai kompleks)

```
app/
├── features/
│   ├── orders/
│   │   ├── router.py      ← wiring endpoint
│   │   ├── service.py     ← use-case / business logic
│   │   └── schemas.py     ← Pydantic input/output
│   └── products/
│       ├── router.py
│       └── service.py
├── shared/
│   ├── db/session.py
│   ├── errors/app_error.py
│   └── security/
└── main.py

# service.py — business logic terpisah dari router
class OrdersService:
    def __init__(self, session: AsyncSession = Depends(get_db)):
        self.session = session
    
    async def create_order(self, input: CreateOrderInput) -> Order:
        product = await self.session.get(Product, input.product_id)
        if not product or product.stock < input.quantity:
            raise AppError("OUT_OF_STOCK", 400)
        order = Order(**input.model_dump())
        self.session.add(order)
        await self.session.commit()
        return order
```

### Complex project (> 15 endpoints, > 5 dev, multiple domains, high business complexity)

```
app/
├── features/
│   ├── orders/
│   │   ├── router.py
│   │   ├── service.py
│   │   ├── repository.py  ← abstraksi DB queries
│   │   └── schemas.py
│   └── inventory/
│       ├── service.py
│       └── repository.py
├── shared/
│   ├── domain/             ← shared business rules
│   │   └── pricing/
│   │       └── calculate_discount.py
│   ├── db/
│   └── errors/
└── main.py

# Gunakan repository pattern HANYA jika:
# - Perlu switch DB provider (SQLAlchemy → raw SQL)
# - Complex query reuse (10+ use cases pakai query yang sama)
# - Testing perlu banyak mock DB calls
```

**Anti-pattern**: Jangan paksa struktur complex untuk project simple. Kalau cuma 3 CRUD endpoints, feature-first + service layer sudah overkill — langsung endpoint + DB call cukup.

---

## 2. Feature-first default (untuk medium+)

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

## 3. `main.py` — lifespan, bukan `on_event`

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

## 4. Dependency injection — `Depends` yang benar

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

## 5. Schema Pydantic v2

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

## 6. Error handling — wiring ke AppError dari `common`

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

## 7. Testing

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

## 8. Tooling

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

## 9. Docker

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
