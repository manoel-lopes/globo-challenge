# Coding Patterns

Implementation reference for repositories, use cases, controllers, entities, and database configuration in this **NestJS (Fastify) + Prisma + PostgreSQL** backend, built with Clean Architecture and DDD.

> **Module structure**: For guidance on module boundaries and organizing this codebase as a modular monolith, see [`.cursor/skills/nestjs-modular-monolith/SKILL.md`](../.cursor/skills/nestjs-modular-monolith/SKILL.md).

---

## Repository Pattern & Persistence Encapsulation

Repositories MUST encapsulate all Prisma-specific logic behind a domain-defined interface and never expose `PrismaClient`, `@prisma/client` types, or query builders to use cases.

**Rules:**

- ✅ Declare a repository as a `type` + same-named `Symbol` pair in `src/domain/application/repositories/`
- ✅ Implement that interface with a `Prisma*Repository` class injected with `PrismaService`
- ✅ Implement a parallel `InMemory*Repository` (extending `BaseInMemoryRepository`) for unit tests
- ✅ Add custom query methods with business-meaningful names (`findByEmail`, not `findOneByWhere`)
- ❌ Never let use cases import `@prisma/client` or call `PrismaService` directly
- ❌ Never return raw Prisma query results shaped differently from the domain entity
- ❌ Never leak `where`/`include`/`select` objects out of the repository

**Interface (`type` + `Symbol`):**

```typescript
// src/domain/application/repositories/users.repository.ts
import type { User, UserProps } from '@/domain/enterprise/entities/user.entity'

export type UsersRepository = {
  create(user: UserProps): Promise<User>
  findById(id: string): Promise<User | null>
  findByEmail(email: string): Promise<User | null>
}

export const UsersRepository = Symbol('UsersRepository')
```

**Prisma implementation — production:**

```typescript
// src/infra/persistence/repositories/prisma/prisma-users.repository.ts
import { Injectable } from '@nestjs/common'
import type { UsersRepository } from '@/domain/application/repositories/users.repository'
import { PrismaService } from '@/infra/persistence/prisma.service'
import type { User, UserProps } from '@/domain/enterprise/entities/user.entity'

@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  constructor (private readonly prisma: PrismaService) {}

  async create (data: UserProps): Promise<User> {
    return this.prisma.user.create({ data })
  }

  async findByEmail (userEmail: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email: userEmail } })
    if (!user) return null
    return user
  }
}
```

**In-memory implementation — unit tests:**

```typescript
// src/infra/persistence/repositories/in-memory/in-memory-users.repository.ts
import type { UsersRepository } from '@/domain/application/repositories/users.repository'
import type { User } from '@/domain/enterprise/entities/user.entity'
import { BaseInMemoryRepository as BaseRepository } from './base/base-in-memory.repository'

export class InMemoryUsersRepository extends BaseRepository<User> implements UsersRepository {
  async findByEmail (email: string): Promise<User | null> {
    return this.findOneBy('email', email)
  }
}
```

`BaseInMemoryRepository` (`src/infra/persistence/repositories/in-memory/base/base-in-memory.repository.ts`) provides `create`, `findById`, `delete`, pagination helpers, and protected `findOneBy`/`updateOne` helpers, so each concrete repository only implements its domain-specific query methods.

**Wiring — bind interface to implementation via the `Symbol` token:**

```typescript
// src/infra/persistence/repositories/repositories.module.ts
@Global()
@Module({
  imports: [CacheModule, PrismaModule],
  providers: [
    PrismaUsersRepository,
    {
      provide: UsersRepository,
      useClass: PrismaUsersRepository,
    },
  ],
  exports: [UsersRepository],
})
export class RepositoriesModule {}
```

```typescript
// ❌ BAD: use case reaches into Prisma directly, bypassing the repository contract
@Injectable()
export class CreateAccountUseCase {
  constructor (private readonly prisma: PrismaService) {}

  async execute (req: CreateAccountRequest) {
    const existing = await this.prisma.user.findUnique({ where: { email: req.email } }) // ❌
    // ...
  }
}
```

---

## Prisma Leakage Prevention

Use cases MUST NEVER use Prisma syntax directly. All `where`, `include`, `select`, and Prisma types MUST be encapsulated in repository methods with business-meaningful names.

**Rules:**

- ✅ Create repository methods with business-meaningful names for every access pattern a use case needs
- ✅ Keep `@prisma/client` imports and Prisma-specific types ONLY in `src/infra/persistence/`
- ❌ Never use `where:`/`include:`/`select:` syntax in use cases
- ❌ Never import Prisma types (`Prisma.UserWhereInput`, etc.) in the domain or application layers

```typescript
// ❌ BAD: use case coupled to Prisma
const user = await this.prisma.user.findUnique({
  where: { email, id: { not: excludedId } },
})
import type { Prisma } from '@prisma/client' // ❌ Never in use cases

// ✅ GOOD: repository encapsulates Prisma details
@Injectable()
export class PrismaUsersRepository implements UsersRepository {
  async findByEmailExcludingId (email: string, excludedId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { email, id: { not: excludedId } },
    })
  }
}

// ✅ Use case calls the clean domain method — zero Prisma imports
const user = await this.usersRepository.findByEmailExcludingId(email, excludedId)
```

**Method naming**: express business intent, not the underlying query shape:

```typescript
// ✅ Good
findByEmail(email)
findActiveByUserId(userId)

// ❌ Bad
findOneWithWhere(filter)
queryUsers(prismaArgs)
```

---

## Lean Controller Pattern

Controllers MUST be lean and only handle HTTP concerns. All business logic and data access MUST live in use cases.

**Rules:**

- ✅ Keep controller `handle` methods short — validate, call one use case, translate errors
- ✅ Only call use cases (never repositories)
- ✅ Validate the request body/params/query with a Zod schema via `ZodValidationPipe`
- ✅ Translate domain errors to Nest HTTP exceptions with `instanceof` checks
- ❌ Never put business logic (branching on domain state, calculations, orchestration) in controllers
- ❌ Never inject or call repositories directly from controllers
- ❌ Never construct or mutate domain entities in controllers

**Controller responsibilities (ONLY):**

1. Extract request data (`@Body`, `@Param`, `@Query`) with a `ZodValidationPipe(schema)`
2. Call the use case's `execute()` method once, passing primitives from the validated body
3. Catch and translate domain errors to the matching Nest HTTP exception
4. Return the use case's result as-is (or void + `@HttpCode`) — no manual DTO re-shaping today

```typescript
// ✅ GOOD: lean controller — src/infra/http/presentation/controllers/create-account/create-account.controller.ts
@ApiTags('Users')
@Controller('users')
export class CreateAccountController {
  constructor (private readonly createAccountUseCase: CreateAccountUseCase) {}

  @Public()
  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiBody({ type: CreateAccountBodyDto })
  @ApiCreatedResponse('Account created successfully')
  @ApiConflictResponse('Conflict - email already registered')
  async handle (@Body(new ZodValidationPipe(createAccountBodySchema)) body: CreateAccountBodyDto) {
    try {
      const { name, email, password } = body
      await this.createAccountUseCase.execute({ name, email, password })
    } catch (error) {
      if (error instanceof UserWithEmailAlreadyRegisteredError) {
        throw new ConflictException(error.message)
      }
      throw error
    }
  }
}

// ❌ BAD: fat controller with repository injection and inline business logic
@Controller('users')
export class CreateAccountController {
  constructor (
    private readonly usersRepository: UsersRepository, // ❌ never inject repositories in controllers
    private readonly passwordHasher: PasswordHasher      // ❌ orchestration belongs in a use case
  ) {}

  @Post()
  async handle (@Body() body: CreateAccountBodyDto) {
    const existing = await this.usersRepository.findByEmail(body.email) // ❌ business logic in controller
    if (existing) throw new ConflictException('Email already registered')
    const hashed = await this.passwordHasher.hash(body.password)
    return this.usersRepository.create({ ...body, password: hashed })
  }
}
```

**Use case vs. controller responsibilities:**

| Responsibility | Use Case | Controller |
| --- | --- | --- |
| Business logic | ✅ | ❌ |
| Repository calls | ✅ | ❌ |
| Orchestration (multiple ports) | ✅ | ❌ |
| Request validation (Zod schema) | ❌ | ✅ |
| HTTP status codes | ❌ | ✅ |
| Domain error → HTTP exception translation | ❌ | ✅ |
| Swagger documentation | ❌ | ✅ |

---

## Use Case Pattern

Use cases hold all business logic and orchestration. They implement the shared `UseCase` type, live one-per-folder, and communicate failure by **throwing** domain errors — this codebase does not use an `Either`/`Result` return type.

**Rules:**

- ✅ Implement the shared `UseCase` type from `src/core/domain/application/use-case.ts`
- ✅ One use case per folder under `src/domain/application/usecases/<feature>/`, with a co-located `.usecase.test.ts` and an `errors/` folder for feature-local errors
- ✅ Inject ports (repositories, `PasswordHasher`, etc.) with `@Inject(Symbol)`
- ✅ Throw a specific domain `Error` subclass for each failure case — never generic `Error`
- ❌ Never return `{ left, right }`/`Either` — throw instead
- ❌ Never catch and swallow domain errors inside a use case; let them propagate to the controller

```typescript
// src/core/domain/application/use-case.ts
export type Request = Record<string, unknown>
export type Response = unknown

export type UseCase = {
  execute(req: Request): Promise<Response>
}
```

```typescript
// src/domain/application/usecases/create-account/create-account.usecase.ts
type CreateAccountRequest = UserProps

@Injectable()
export class CreateAccountUseCase implements UseCase {
  constructor (
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}

  async execute (req: CreateAccountRequest) {
    const { name, email, password } = req
    const userAlreadyExists = await this.usersRepository.findByEmail(email)
    if (userAlreadyExists) {
      throw new UserWithEmailAlreadyRegisteredError()
    }
    const hashedPassword = await this.passwordHasher.hash(password)
    await this.usersRepository.create({ name, email, password: hashedPassword })
  }
}
```

Register and export every use case from `UseCasesModule` (`src/domain/application/usecases/usecases.module.ts`):

```typescript
@Global()
@Module({
  imports: [RepositoriesModule],
  providers: [AuthenticateUserUseCase, CreateAccountUseCase],
  exports: [AuthenticateUserUseCase, CreateAccountUseCase],
})
export class UseCasesModule {}
```

---

## Domain Entity Purity

Domain entities MUST remain agnostic of Prisma (or any ORM). They are plain TypeScript interfaces describing the ubiquitous language — never Prisma-generated types, decorators, or classes.

**Rules:**

- ✅ Define entities as interfaces in `src/domain/enterprise/entities/` extending the shared `Entity`
- ✅ Derive "create" input types from the entity with the shared `Props<T>` helper (strips `id`/`createdAt`/`updatedAt`)
- ✅ Keep Prisma model/table naming (`model User { ... @@map("users") }`) confined to `prisma/schema.prisma`
- ❌ Never import `@prisma/client` types into `src/domain/` or `src/core/`
- ❌ Never let a repository return a raw Prisma payload shaped differently from the domain entity
- ❌ Never add ORM decorators (or any framework decorator) to a domain entity

```typescript
// src/core/domain/entity.ts
export interface Entity {
  id: string
  createdAt: Date
  updatedAt?: Date | null
}
```

```typescript
// src/domain/enterprise/entities/user.entity.ts
import type { Entity } from '@/core/domain/entity'
import type { Props } from '@/shared/types/props'

export type UserProps = Props<User>

export interface User extends Entity {
  name: string
  email: string
  password: string
}
```

```typescript
// ❌ BAD: domain entity coupled to Prisma
import type { User as PrismaUser } from '@prisma/client' // ❌ never in the domain layer

export type User = PrismaUser
```

The Prisma model name and `@@map` mirror the entity's ubiquitous-language name, but that mapping lives only at the persistence boundary:

```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(uuid(7))
  name      String
  email     String   @unique
  password  String
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@map("users")
}
```

---

## Transaction Management

Repository methods that perform multiple writes, or a read-then-write that must stay consistent, MUST wrap the operation in `prisma.$transaction`. This project has a single PostgreSQL database, so there is no `connectionName` to specify — the transaction is scoped to the single `PrismaService` instance.

**Rules:**

- ✅ Wrap multi-write operations in `this.prisma.$transaction(...)` inside the repository method
- ✅ Apply to read-then-write sequences that must avoid race conditions
- ✅ Apply to cross-entity writes that must succeed or fail together
- ❌ Never perform multi-step writes as separate, unwrapped `await` calls in a repository or use case
- ❌ Never wrap read-only queries in `$transaction`
- ❌ Never manage transactions from a use case — encapsulate them in the repository, consistent with the Prisma-leakage rule above

```typescript
// ❌ BAD: two writes with no atomicity — a crash between them leaves inconsistent state
async createUserWithProfile (data: UserProps, bio: string) {
  const user = await this.prisma.user.create({ data })
  await this.prisma.profile.create({ data: { userId: user.id, bio } }) // ❌ not atomic
  return user
}

// ✅ GOOD: single repository method, atomic via $transaction
async createUserWithProfile (data: UserProps, bio: string) {
  return this.prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data })
    await tx.profile.create({ data: { userId: user.id, bio } })
    return user
  })
}

// ✅ Read-only — no transaction needed
async findByEmail (email: string) {
  return this.prisma.user.findUnique({ where: { email } })
}
```

---

## DB Configuration

This project uses a single Prisma `DataSource` against one PostgreSQL database — there is no per-module database or named connection.

**`PrismaService`** extends `PrismaClient`, using the `@prisma/adapter-pg` driver adapter with a connection string resolved from `EnvService`, and manages connect/disconnect via Nest lifecycle hooks:

```typescript
// src/infra/persistence/prisma.service.ts
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor (envService: EnvService) {
    const adapter = new PrismaPg({ connectionString: envService.getDatabaseUrl() })
    super({ adapter })
  }

  async onModuleInit () {
    await this.$connect()
  }

  async onModuleDestroy () {
    await this.$disconnect()
  }
}
```

`PrismaService` is provided once by a `@Global()` `PrismaModule` and injected by class (not by `Symbol`) into every Prisma repository:

```typescript
// src/infra/persistence/prisma.module.ts
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

The database URL is assembled in `prisma.config.ts` (used by the Prisma CLI for migrations) and mirrored by `EnvService.getDatabaseUrl()` at runtime — both read from the same `DB_*` env vars, never hardcoded:

```typescript
// prisma.config.ts
const databaseUrl = `postgresql://${env('DB_USER')}:${encodeURIComponent(env('DB_PASSWORD'))}@${env('DB_HOST')}:${env('DB_PORT')}/${env('DB_NAME')}?schema=public`

export default defineConfig({
  schema: 'prisma',
  migrations: { path: 'prisma/migrations' },
  datasource: { url: databaseUrl },
})
```

**Rules:**

- ✅ Prisma model names are PascalCase singular (`model User`); table names are mapped with `@@map('users')` (snake_case plural)
- ✅ Read the connection string from env vars, never commit real credentials
- ✅ Generate migrations only via `pnpm migrate:dev` / `pnpm migrate:test` (`prisma migrate dev`)
- ❌ Never hand-edit files under `prisma/migrations/`
- ❌ Never instantiate a second `PrismaClient`/`DataSource` outside `PrismaService`

---

## Dependency Inversion & Layer Boundaries

Dependencies MUST point inward: `domain` never imports from `infra`. Cross-layer wiring happens exclusively through `type` + `Symbol` ports resolved by Nest's DI container — this is the mechanism that keeps use cases persistence-agnostic and testable with in-memory repositories.

**Rules:**

- ✅ Define every port (repository, `PasswordHasher`, cache client) as a `type`/`interface` + `Symbol` pair
- ✅ Bind the `Symbol` to a concrete implementation with `{ provide: Symbol, useClass: Impl }` in an infra module
- ✅ Inject ports into use cases with `@Inject(Symbol)`, typed by the interface — never the concrete class
- ❌ Never import a class from `src/infra/` into `src/domain/` or `src/core/`
- ❌ Never inject a concrete Prisma/Redis class directly into a use case — always go through its port

```typescript
// ✅ Port defined once, alongside the domain
// src/infra/adapters/security/ports/password-hasher.ts
export interface PasswordHasher {
  hash: (password: string) => Promise<string>
  compare: (password: string, hashedPassword: string) => Promise<boolean>
}

export const PasswordHasher = Symbol('PasswordHasher')
```

```typescript
// ✅ Use case depends on the port, not the implementation
@Injectable()
export class CreateAccountUseCase implements UseCase {
  constructor (
    @Inject(UsersRepository) private readonly usersRepository: UsersRepository,
    @Inject(PasswordHasher) private readonly passwordHasher: PasswordHasher
  ) {}
}
```

```typescript
// ✅ Redis is wired the same way — a Symbol token, not a concrete class
// src/infra/cache/cache.module.ts
export const REDIS_CLIENT = Symbol('REDIS_CLIENT')

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (envService: EnvService) => new Redis({
        host: envService.get('REDIS_HOST'),
        port: envService.get('REDIS_PORT'),
        db: envService.get('REDIS_DB'),
      }),
      inject: [EnvService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class CacheModule {}
```

```typescript
// ❌ BAD: use case depends on a concrete infra class instead of a port
import { BcryptPasswordHasher } from '@/infra/adapters/security/bcrypt-password-hasher' // ❌

@Injectable()
export class CreateAccountUseCase {
  constructor (private readonly passwordHasher: BcryptPasswordHasher) {} // ❌ not swappable/mockable
}
```

Module composition follows the same inward-pointing chain — `RepositoriesModule` → `UseCasesModule` → `ControllersModule`, wired from the root `AppModule`:

```typescript
// src/app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({ validate: (env) => envSchema.parse(env), isGlobal: true }),
    EnvModule,
    RepositoriesModule,
    SecurityModule,
    AuthModule,
    UseCasesModule,
    ControllersModule,
  ],
})
export class AppModule {}
```

---

## Domain Errors & HTTP Translation

Domain errors are plain `Error` subclasses. They carry no HTTP knowledge — translation to a status code happens only in the controller, via `instanceof` checks.

**Rules:**

- ✅ Extend `Error` for every domain/application failure; give it a clear, user-facing `message`
- ✅ Put feature-local errors under `usecases/<feature>/errors/`; put cross-feature errors under `src/shared/application/errors/`
- ✅ Translate each domain error to a Nest HTTP exception in the controller's `catch` block, then re-throw unknown errors
- ❌ Never throw a Nest `HttpException` from inside a use case
- ❌ Never let a use case know which HTTP status a failure maps to

```typescript
// src/shared/application/errors/resource-not-found.error.ts — shared across features
type Resource = 'User'

export class ResourceNotFoundError extends Error {
  constructor (resource: Resource) {
    super(`${resource} not found`)
  }
}
```

```typescript
// src/domain/application/usecases/create-account/errors/user-with-email-already-registered.error.ts — feature-local
export class UserWithEmailAlreadyRegisteredError extends Error {
  constructor () {
    super('User with email already registered')
  }
}
```

```typescript
// src/infra/http/presentation/controllers/authenticate-user/authenticate-user.controller.ts
async handle (@Body(new ZodValidationPipe(authenticateUserBodySchema)) body: AuthenticateUserBodyDto) {
  try {
    return await this.authenticateUserUseCase.execute(body)
  } catch (error) {
    if (error instanceof InvalidPasswordError) {
      throw new UnauthorizedException(error.message)
    }
    if (error instanceof ResourceNotFoundError) {
      throw new NotFoundException(error.message)
    }
    throw error
  }
}
```

---

## Request Validation with Zod

Requests are validated with Zod schemas via `ZodValidationPipe`, not `class-validator` DTOs.

**Rules:**

- ✅ Define one Zod schema + `createZodDto` DTO per endpoint in `ports/<feature>.protocol.ts`, co-located with the controller
- ✅ Apply `new ZodValidationPipe(schema)` per-parameter on `@Body()`/`@Param()`/`@Query()`
- ✅ Use the generated DTO class only for `@ApiBody({ type: ... })` swagger typing
- ❌ Never use `class-validator` decorators (`@IsString()`, etc.) — this project standardizes on Zod
- ❌ Never validate manually inside the controller body — let the pipe throw

```typescript
// src/infra/http/presentation/controllers/create-account/ports/create-account.protocol.ts
import { createZodDto } from 'nestjs-zod'
import { z } from 'zod'

export const createAccountBodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(6).max(12),
})

export class CreateAccountBodyDto extends createZodDto(createAccountBodySchema) {}
```

```typescript
// src/infra/http/presentation/pipes/zod-validation.pipe.ts
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor (private schema: z.ZodSchema) {}

  transform (value: unknown) {
    try {
      return this.schema.parse(value)
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues[0]?.message || 'Validation failed'
        throw message.includes('is required')
          ? new BadRequestException(message)
          : new UnprocessableEntityException(message)
      }
      throw error
    }
  }
}
```

Swagger documentation is applied per-controller with `@nestjs/swagger` decorators, plus shared response-shape helpers from `src/infra/http/presentation/decorators/api-responses.decorator.ts` (`ApiCreatedResponse`, `ApiConflictResponse`, `ApiUnprocessableEntityResponse`, etc.) to keep decorator lists short and consistent across controllers.

---

## File Naming Conventions

Co-locate everything for one feature by aggregate/feature folder. Use file suffixes to signal each file's role — not technical subfolders.

| Suffix / Category | Convention | Example |
| --- | --- | --- |
| `.entity.ts` | Domain entity interface | `src/domain/enterprise/entities/user.entity.ts` |
| `.repository.ts` | Repository interface (`type`+`Symbol`) or implementation | `src/domain/application/repositories/users.repository.ts`, `prisma-users.repository.ts` |
| `.usecase.ts` / `.usecase.test.ts` | Business logic + unit test | `src/domain/application/usecases/create-account/create-account.usecase.ts` |
| `errors/*.error.ts` | Domain/application errors | `usecases/create-account/errors/user-with-email-already-registered.error.ts` |
| `.controller.ts` / `.controller.e2e-spec.ts` | HTTP controller + e2e test | `create-account.controller.ts`, `create-account.controller.e2e-spec.ts` |
| `ports/*.protocol.ts` | Zod schema + `createZodDto` DTO for one endpoint | `create-account/ports/create-account.protocol.ts` |
| `.module.ts` | Nest module (wiring) | `usecases.module.ts`, `repositories.module.ts` |
| `.pipe.ts` / `.decorator.ts` / `.guard.ts` / `.strategy.ts` | Cross-cutting infra pieces | `zod-validation.pipe.ts`, `jwt-auth.guard.ts` |
| Feature/aggregate folders | kebab-case | `create-account/`, `authenticate-user/` |
| Classes / interfaces | PascalCase | `CreateAccountUseCase`, `UsersRepository` |
| Prisma model / table | PascalCase model, `@@map` snake_case table | `model User` → `@@map("users")` |
| DI tokens | `Symbol('PascalCaseName')` | `Symbol('UsersRepository')`, `Symbol('PasswordHasher')` |

---

## Enum Usage

Always use enum members (or a Zod `z.enum`) instead of raw string literals for any value that belongs to a finite, named set of options (statuses, log levels, environments, etc.).

**Rules:**

- ✅ Model finite value sets with `z.enum([...])` (validated at the boundary) and derive the TS type with `z.infer`
- ✅ Reference the same named values everywhere that set is used — request validation, use cases, and tests
- ❌ Never use raw string literals where a named set already exists (`'production'`, `'PENDING'`)
- ❌ Never fall back to an inline string literal (`?? 'development'`) when the enum/schema already declares a default

```typescript
// ✅ GOOD: environment values modeled once with z.enum — src/infra/env/env.ts
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  // ...
})

export type Env = z.infer<typeof envSchema>
```

```typescript
// ✅ GOOD: consuming code branches on the same named values, not ad-hoc strings
const logLevels: Record<Env['NODE_ENV'], LogLevels> = {
  test: 'silent',
  development: 'info',
  production: 'error',
}
```

This applies equally to new domain concepts as they're introduced — e.g. the planned `LogFile.status` (`PENDING | PROCESSING | COMPLETED | FAILED`) and `LogEntry.level` (`TRACE | DEBUG | INFO | WARN | ERROR | FATAL | UNKNOWN`) from [`docs/PRD.md`](PRD.md) should be modeled as a `z.enum` (and a matching Prisma `enum`) rather than validated with raw string comparisons, and referenced by that enum everywhere, including test fixtures and seed data.

---

## Common Anti-Patterns

| Anti-Pattern | Fix |
| --- | --- |
| `where:`/`include:`/Prisma operators in use cases | Encapsulate in a repository method with a business-meaningful name |
| `@prisma/client` types imported in `src/domain/` | Keep Prisma types confined to `src/infra/persistence/` |
| Repository injected in a controller | Inject the use case only |
| Controller with branching business logic | Move logic into a use case |
| Multi-write repository method without `$transaction` | Wrap in `this.prisma.$transaction(...)` |
| `$transaction` on a read-only query | Remove the wrapper |
| Domain entity typed as `PrismaClient`'s generated model | Define an ORM-agnostic `interface` extending `Entity` |
| Concrete class injected instead of a port | Define a `type`/`interface` + `Symbol`, bind with `provide`/`useClass` |
| Use case throwing a Nest `HttpException` | Throw a domain `Error` subclass; translate to HTTP only in the controller |
| `class-validator` decorators on request DTOs | Use a Zod schema + `ZodValidationPipe` |
| Raw string literals instead of enum/`z.enum` members (`'production'`, `'PENDING'`) | Use the named schema/enum value everywhere |
| Hand-edited files under `prisma/migrations/` | Regenerate via `pnpm migrate:dev` / `pnpm migrate:test` |
