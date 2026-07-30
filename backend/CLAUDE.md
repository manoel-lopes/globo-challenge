# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NestJS API Template - a backend API template built with NestJS v11 (Fastify), TypeScript, PostgreSQL (Prisma). Follows Clean Architecture, Domain-Driven Design, and SOLID principles.

## Quick Reference

### Essential Commands
```bash
pnpm install                    # Install dependencies
pnpm run start:dev              # Development mode with hot reload
pnpm run build                  # Compile TypeScript
pnpm run check-types            # Type check without emitting
pnpm run lint                   # ESLint with auto-fix
```

### Testing
```bash
pnpm test                       # Run all tests
pnpm test:unit                  # Unit tests only
pnpm test:e2e                   # E2E tests
pnpm test:coverage              # With coverage report
```

### Database
```bash
pnpm run db:up:dev              # Start PostgreSQL container
pnpm run migrate:dev            # Run migrations
pnpm run migrate:reset:dev      # Reset database
```

### Environment Setup
```bash
cp .env.example .env.development
cp .env.example .env.test
```

## Architecture

### Layer Structure
```
src/
├── core/                    # Base abstractions (Entity, UseCase)
├── domain/                  # Business logic (framework-independent)
│   ├── application/
│   │   ├── repositories/    # Repository interfaces
│   │   └── usecases/        # Use cases
│   └── enterprise/
│       └── entities/        # Domain entities
├── infra/                   # External dependencies
│   ├── adapters/            # Security adapters
│   ├── auth/                # JWT authentication
│   ├── env/                 # Environment configuration
│   ├── persistence/         # Prisma repositories
│   └── http/
│       └── presentation/
│           ├── controllers/ # HTTP controllers
│           ├── pipes/       # Validation pipes
│           └── decorators/  # Custom decorators
├── shared/                  # Shared types and errors
└── main.ts                  # Entry point
```

### Key Patterns

**Interface Adapter Pattern** - Repositories and adapters follow:

1. Define interface + Symbol:
```typescript
export type UsersRepository = { ... }
export const UsersRepository = Symbol('UsersRepository')
```

2. Register in module:
```typescript
{ provide: UsersRepository, useClass: PrismaUsersRepository }
```

3. Inject using Symbol:
```typescript
@Inject(UsersRepository) private readonly usersRepository: UsersRepository
```

**Global Modules**: `RepositoriesModule`, `UseCasesModule`, `EnvModule`, `SecurityModule`

## Code Style Rules

- `no-explicit-any`: ERROR
- `no-console`: ERROR
- `max-len`: 120 characters
- **NO nested ternaries** - use registry pattern
- **ONE class per file**

## API Endpoints

- `POST /auth` - Login (public)
- `POST /users` - Create account (public)
- `GET /users/:id` - Get user by ID (authenticated)
- `PUT /users` - Update account (authenticated)
- `DELETE /users` - Delete account (authenticated)
