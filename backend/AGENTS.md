# Log Analysis Platform — Agent Instructions

Guidance for AI coding assistants working in this repository: a **NestJS (Fastify) + Prisma + PostgreSQL** backend built with Clean Architecture and DDD (see [README.md](README.md), [docs/PRD.md](docs/PRD.md)).

## Cursor Cloud specific instructions

### Infrastructure

- **PostgreSQL 16** runs via Docker Compose. Start it before running the app or e2e tests: `pnpm db:up:dev` (dev DB) or `pnpm db:up:test` (test DB, uses `.env.test` / `docker-compose.test.yml`).
- Redis is used via `ioredis` but is **not** provisioned in Docker Compose — ensure a Redis instance is reachable at `REDIS_HOST`/`REDIS_PORT` (see `.env.example`) if a task depends on caching.
- Docker daemon must be started first in Cloud Agent VMs: `dockerd &>/var/log/dockerd.log &` (wait ~5s), then run the `db:up:*` script above.

### Running the application

- Dev mode (watch, loads `.env.development`): `pnpm start:dev`.
- Debug mode: `pnpm start:debug`.
- Production: `pnpm build` then `pnpm start:prod` (loads `.env.production`).
- The app listens on port `3333` by default (`PORT` in `.env.*`). Swagger UI is at `http://localhost:3333/docs`.

### Testing

- Unit tests (Vitest, files matching `.test.`): `pnpm test:unit`.
- E2E tests (files matching `.e2e-spec.ts`): `pnpm test:e2e`. Requires PostgreSQL running via `pnpm db:up:test` and migrations applied via `pnpm migrate:test`. E2e tests run serially (`singleFork: true`, `fileParallelism: false` in `vitest.config.e2e.mts`).
- Coverage: `pnpm test:coverage`.
- Type check only: `pnpm check-types`.

### Key caveats

- **Never create Prisma migrations manually** — always use `prisma migrate dev` (via `pnpm migrate:dev` or `pnpm migrate:test`), never hand-edit `prisma/migrations/`.
- All endpoints are **REST**, documented with `@nestjs/swagger` decorators — no GraphQL.
- `pnpm lint` runs ESLint with `--fix` (auto-fixes on commit via Husky/lint-staged too).
- Env files (`.env.development`, `.env.test`, `.env.production`) are loaded explicitly per script via `dotenv-cli` or `--env-file` — there is no implicit auto-loading, so don't add ad-hoc `dotenv.config()` calls.

---

## Architecture Principles

**Clean Architecture layers** (see [README.md](README.md#-architecture) for the full diagram):

- `src/core/` — base abstractions (`Entity`, `UseCase`, `WebController`).
- `src/domain/enterprise/entities/` — domain entities (unique identity), `value-objects/` — immutable domain concepts.
- `src/domain/application/usecases/` — business operations; `repositories/` — repository interfaces (`type` + `Symbol` pair) for dependency inversion.
- `src/infra/http/presentation/` — controllers, decorators, response helpers (Package by Feature — see below).
- `src/infra/persistence/repositories/{prisma,in-memory}/` — Prisma implementations for production, in-memory for tests.
- `src/infra/{auth,adapters,cache}/` — JWT auth, anti-corruption adapters (e.g. Bcrypt), Redis cache.
- `src/shared/` — cross-cutting concerns (e.g. domain error base classes); `src/lib/` — reusable utilities.

**Package by Feature**: co-locate everything for one HTTP feature in a single controller folder — `*.controller.ts`, `*.schema.ts` (Zod), `*.controller.e2e-spec.ts` — e.g. `src/infra/http/presentation/controllers/create-account/`.

**Key conventions:**

- One class per file.
- Repository interfaces declared as `type + Symbol` (e.g. `UsersRepository`), matching existing repositories under `src/domain/application/repositories/`.
- Use cases implement the shared `UseCase` base and live one-per-folder under `src/domain/application/usecases/`.
- Request/response validation via Zod schemas + `ZodValidationPipe` (`src/infra/http/presentation/pipes/`), not class-validator.
- Domain-specific errors extend the existing error patterns in `src/shared/application/errors/` and are translated to HTTP status codes in controllers.
- No nested ternaries — prefer a registry/strategy map for branching logic (e.g. classifiers, mappers).

### What to read for a given task

| Task | Read |
|------|------|
| Understand structure, patterns, design patterns used, test conventions | [README.md](README.md) |
| Understand current feature scope / data model / API surface being built | [docs/PRD.md](docs/PRD.md) |
| Designing/evaluating module boundaries in this modular monolith | `nestjs-modular-monolith` skill |
| Reviewing or refactoring domain entities/use cases for DDD richness | `tactical-ddd` skill |
| Mapping business domains / bounded contexts | `domain-analysis` skill |
| General implementation/refactor/bug-fix hygiene | `coding-guidelines` skill |

Only load what the task needs — don't read the whole `docs/` tree or every skill up front. See [Docs](#docs) and [Skills](#skills) below for the full reference of what's available and when to reach for each one.

---

## General Rules

### Docs

- [README.md](README.md) — repo structure, Clean Architecture layers, design patterns, and test conventions. Read before implementing anything unfamiliar.
- [docs/PRD.md](docs/PRD.md) — current feature scope, data model, and API surface being built. Read before implementing a feature to confirm requirements.
- [docs/integration-patterns.md](docs/integration-patterns.md) — patterns for external service integration: client encapsulation, injection, logging, metrics/health checks, circuit breakers, retries, event systems, and integration security. Read before adding/modifying an external API client, queue producer/consumer, or other cross-boundary integration.
- `docs/` currently holds `PRD.md` and `integration-patterns.md`. Don't read the whole `docs/` tree speculatively — load only the doc the task needs.

### Skills

Skills live under `.cursor/skills/<name>/SKILL.md`. When a skill matches the task, read its `SKILL.md` and follow it immediately as your first action rather than just mentioning it. Only load the skill(s) the task needs.

**Architecture and decomposition** (analyzing/evaluating structure of this modular monolith):

- `component-identification-sizing` — map components and measure size to decide what to extract/decompose first.
- `component-common-domain-detection` — find business logic duplicated across components before consolidating it.
- `component-flattening-analysis` — find misplaced classes/orphaned code that should live inside a component instead of at the root.
- `coupling-analysis` — assess coupling (strength/distance/volatility) between modules before deciding what to decouple.
- `domain-analysis` — identify business domains/bounded contexts from scratch (DDD strategic design).
- `domain-identification-grouping` — group already-identified components into domains/services.
- `nestjs-modular-monolith` — design/implement bounded contexts, module boundaries, and event-driven module communication in NestJS.

**Domain modeling**:

- `tactical-ddd` — detect anemic domain models and refactor entities/use cases into rich domain models (Entities, Value Objects, Aggregates, Domain Events). Domain layer only, not module/service boundaries.

**Implementation hygiene**:

- `coding-guidelines` — behavioral checklist to avoid common LLM coding mistakes; use for any implementation, refactor, or bug-fix task.

**Security**:

- `security-best-practices` — framework-specific secure-by-default review, only when explicitly asked for a security review.
- `security-ownership-map` — git-history-based ownership/bus-factor analysis for sensitive code paths.

**Docs and decision records**:

- `docs-writer` — write/review/edit markdown docs (READMEs, guides) with consistent structure and tone.
- `create-adr` — document an already-made architectural decision and its rationale.
- `create-rfc` — propose a significant change and drive alignment before a decision is made.
- `technical-design-doc-creator` — write a full technical design doc / implementation spec before building a feature.
- `confluence-assistant` — search, create, or update Confluence pages via the Atlassian MCP (see [Confluence config](#confluence)).

**Planning and evaluation**:

- `tlc-spec-driven` — spec-driven project/feature planning (specify → design → tasks → execute) with persistent memory across sessions.
- `spec-driven-eval` — grade how completely an implementation fulfills a PRD/spec; explicit-invoke only, never auto-triggers.
- `the-fool` — devil's advocate/pre-mortem/red-team pass on a plan or decision before committing to it; critique only, doesn't build solutions.

**Meta / authoring**:

- `skill-architect` — design and author a new skill from scratch.
- `subagent-creator` — design a generic (non-Cursor-specific) AI subagent.
- `cursor-subagent-creator` — design a Cursor-specific subagent under `.cursor/agents/`.

### Context7 MCP

Always use Context7 when generating code, setup, or configuration steps for a library/framework (NestJS, Prisma, Fastify, Zod, Vitest, etc.), or when looking up API documentation — resolve the library id and fetch docs automatically, don't wait to be asked.

### Writing implementation plans

Write high quality, maintainable code while avoiding overengineering. Be pragmatic and follow this repo's existing patterns (README, PRD) before defaulting to generic industry practice.

Implementation plans must include verification steps: `pnpm build`, `pnpm check-types`, `pnpm lint`, and `pnpm test:e2e` (or `pnpm test:unit` when e2e isn't relevant).

### Implementation and Testing

Always include tests that cover the happy paths and important edge cases:

- Unit tests (Vitest, AAA pattern with blank-line separation, `sut` naming, in-memory repositories, test data builders) for use cases and pure logic.
- E2E tests (`*.e2e-spec.ts`, Supertest) for controllers/endpoints, following existing examples like `create-account.controller.e2e-spec.ts`.

### Database entities and migrations

Never create or hand-edit Prisma migrations manually — always generate them via `prisma migrate dev` (`pnpm migrate:dev` for the dev DB, `pnpm migrate:test` for the test DB). Schema source of truth is `prisma/schema.prisma`.

---

## Integrations Config

### Confluence

- **Cloud ID:** d58e860b-469d-4463-8f46-684934a5a851
- **URL:** [https://techleadsclub.atlassian.net/](https://techleadsclub.atlassian.net/)

The Cloud ID can be:

- A site URL (e.g., `https://techleadsclub.atlassian.net/`)
- A UUID from `getAccessibleAtlassianResources`
