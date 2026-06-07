---
name: nestjs-readability/modules
---

## Module Per Feature

Satu feature punya module sendiri. Export hanya provider yang benar-benar dibutuhkan feature lain.

```ts
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
```

Jangan export semua provider biar gampang — itu bikin coupling liar.

## App Module — Wiring, Bukan Logic

```ts
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    OrdersModule,
  ],
})
export class AppModule {}
```

## File Naming

```txt
orders.controller.ts
orders.service.ts
orders.repository.ts
orders.schema.ts
orders.types.ts
orders.module.ts
```

Hindari: `orderHandler.ts`, `orderManager.ts`, `orderLogic.ts`, `orderUtils.ts`.
