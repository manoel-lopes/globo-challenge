# NestJS Clean Architecture Template

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A robust RESTful API for a **Log Analysis Platform**, built with **NestJS**, **TypeScript**, and following **Clean Architecture** and **Domain-Driven Design** principles. Import log files, classify records, query/filter/search entries, and consume dashboard analytics through a REST API.


## 🛠️ Technologies

- [Node.js](https://nodejs.org/)
- [Fastify](https://www.fastify.io/)
- [TypeScript](https://www.typescriptlang.org/)
- [PostgreSQL](https://www.postgresql.org/)
- [Prisma](https://www.prisma.io/)
- [Redis](https://redis.io/)
- [Zod](https://zod.dev/)
- [Vitest](https://vitest.dev/)
- [Docker](https://www.docker.com/)
- [Husky](https://typicode.github.io/husky/)


## 🏛️ Architecture

### 🎯 Clean Architecture

This project is structured following the principles of **Clean Architecture** by Robert C. Martin. This architectural style emphasizes the separation of concerns, creating a system that is independent of frameworks, UI, and databases.

![Clean Architecture Diagram](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

*Image courtesy of Robert C. Martin (Uncle Bob)*

The core of the application is built around the **Domain** and **Application** layers, which contain the business logic and are independent of any external frameworks. The outer layers, **Presentation** and **Infrastructure**, handle details like HTTP requests, database interactions, and other external services.

### 💎 Domain-Driven Design (DDD)

It uses concepts from **Domain-Driven Design** to model the business domain.

- **Entities**: Core objects of the domain with a unique identifier.
- **Value Objects**: Objects that represent a descriptive aspect of the domain without a conceptual identifier.


## 🏗️ Design Patterns

- **Adapter**: Converts the interface of a class into another interface clients expect. Adapter lets classes work together that couldn't otherwise because of incompatible interfaces.
- **Strategy**: Defines a family of algorithms, encapsulates each one, and makes them interchangeable. Strategy lets the algorithm vary independently from clients that use it.
- **Proxy**: Provides a surrogate or placeholder for another object to control access to it. The proxy implements the same interface as the real subject, so it can be used in place of the real object.
- **Simple Factory**: Centralizes object creation in a single place, instantiating concrete classes without exposing construction details to the client.
- **Static Factory Method**: A static factory method is a static method that returns an instance of its class, providing an alternative to using a public constructor. Instead of directly invoking `new`, clients call this method, which may hide complex creation logic, apply validation, cache instances, or return subtypes.
- **Singleton**: Ensures a class has only one instance and provides a global point of access to it. This pattern prevents multiple instances from being created, which is useful for managing shared resources like database connections, cache instances, or queue connections.
- **Mapper**: An object that sets up a bidirectional mapping between two different representations, such as between an in-memory object model and a database.
- **Layer Supertype**: An abstract superclass that provides shared common behavior for all subclasses in a logical layer.
- **Repository**: Mediates between the domain and data mapping layers using a collection-like interface for accessing domain objects.

## 🧪 Test Patterns & Quality

### 🎯 Test Structure (AAA Pattern)

All tests follow the **Arrange-Act-Assert (AAA)** pattern with visual separation using blank lines:

```typescript
it('should do something', async () => {
  // Arrange: setup test data and dependencies
  const entity = await createAndSave(makeEntity, repository, { prop: 'value' })
  const input = { id: entity.id, field: 'value' }

  // Act: execute the operation
  const result = await sut.execute(input)

  // Assert: verify expectations
  expectEntityToMatch(result, { expectedProp: 'value' })
})
```

### 🔬 Test Patterns

- **In-Memory Database**: Unit and integration tests use in-memory repositories for fast, isolated testing
- **Stubs**: Controlled, predictable behavior for external dependencies
- **Spies/Mocks**: Verify interactions between components
- **Factory Functions**: Generate consistent, repeatable test data
- **System Under Test (SUT)**: Consistent naming with `sut` variable for clarity
- **Test Data Builder**: Fluent API builders with method chaining for flexible test data creation

---

## 📦 Package by Feature

This project follows the **Package by Feature** organizational pattern, where code is grouped by business capability rather than technical layer. Each feature contains all related files (controller, schema, tests) in a single directory.

### Why Package by Feature?

- **Cohesion**: All files for a feature live together
- **Maintainability**: Changes to a feature affect only one directory
- **Discoverability**: Easy to find all code related to a feature
- **Reduced coupling**: Features are self-contained units

### Example: List Log Files Feature

```
src/infra/http/presentation/controllers/list-log-files/
├── list-log-files.controller.ts      # NestJS controller
├── ports/list-log-files.protocol.ts  # Zod validation schema
└── list-log-files.controller.e2e-spec.ts  # E2E tests
```

All files related to listing log files are co-located, making the feature easy to understand, modify, and test.

---

## 📂 Project Structure

```
template-nest-api/
├── prisma/                         # Database Schemas & Migrations
│
├── src/
│   ├── core/                       # 🔌 Base abstractions Entity, UseCase, WebController
│   ├── domain/                     # 🏛️ Business logic independent of frameworks
│   │   ├── application/            # 📋 Application Business Rules
│   │   │   ├── usecases/           # ⚡ Use cases implementing business operations
│   │   │   └── repositories/       # 🔌 Repository interfaces for DIP
│   │   │
│   │   └── enterprise/             # 💎 Enterprise Business Rules
│   │       ├── entities/           # 🎭 Entities domain objects with unique identity
│   │       └── value-objects/      # 💠 Value Objects immutable domain concepts
│   │
│   ├── infra/                      # ⚙️ External dependencies (frameworks, drivers)
│   │   │
│   │   ├── http/                   # 🌐 HTTP layer (Package by Feature)
│   │   │   ├── presentation/       # 🎨 API endpoints
│   │   │   │   ├── controllers/    # 🎮 Feature-based controllers
│   │   │   │   ├── decorators/     # 🏷️ Custom decorators
│   │   │   │   └── helpers/        # 📤 HTTP response builders
│   │   │   ├── schemas/            # 📋 Shared Zod schemas
│   │   │   ├── pipes/              # 🔧 Validation pipes
│   │   │   └── errors/             # ❌ HTTP-specific errors
│   │   │
│   │   ├── adapters/               # 🛡️ Anti-corruption layer for external services
│   │   │
│   │   ├── persistence/            # 💾 Data persistence layer
│   │   │   ├── mappers/            # 🔄 Domain ↔ Persistence mapping
│   │   │   └── repositories/       # 📦 Repository implementations
│   │   │       ├── prisma/         # 🐘 PostgreSQL with Prisma ORM
│   │   │       └── in-memory/      # 🧪 In-memory for testing
│   │   │
│   │   ├── log-processing/         # 📑 File parser and classifier registry
│   │   └── cache/                  # 🚀 Redis-backed caching
│   │
│   ├── shared/                     # 🔄 Cross-cutting concerns shared across layers
│   └── lib/                        # 📚 Reusable library utilities
│
├── tests/                          # 🧪 Test utilities
│   ├── builders/                   # Test Data Builders (Fluent API)
│   └── helpers/                    # Test Helper Functions
│
├── .env.example                    # Example environment variables
├── docker-compose.development.yml  # Dev container config file
├── docker-compose.test.yml         # Test containers config file
├── tsconfig.json                   # TypeScript configuration
├── eslint.config.mjs               # ESLint configuration
├── vitest.config.mts               # Vitest test configuration
├── .lintstagedrc.mjs               # Lint-staged configuration
├── .husky/                         # Git hooks
└── package.json                    # Dependencies and scripts
```

## 🚀 Setup & Installation

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm
- Docker and Docker Compose

### Installation Steps

1.  **Clone the repository.**
2.  **Install dependencies** using `pnpm install`.
3.  **Set up development environment variables** by copying `.env.example` to `.env.development` and filling it with your database credentials.
    Example `.env.development`:
    ```
    DB_USER=<your_db_user>
    DB_PASSWORD=<your_db_password>
    DB_NAME=<your_db_name>
    DB_PORT=<your_db_port>
    ```
4.  **Start the database and Redis** using the provided `pnpm` script:
    ```bash
    pnpm run db:up:dev
    ```
5.  **Run database migrations** using the provided `pnpm` script:
    ```bash
    pnpm run migrate:dev
    ```

### Running the Application

-   **Development Mode**: `pnpm run start:dev`
-   **Production Mode**: `pnpm run build` and then `pnpm run start`

---

## 🧪 Testing

This project uses `vitest` for testing.

### Unit Tests

- **Run unit tests:**
  ```bash
  pnpm test:unit
  ```

### E2E Tests

The E2E (End-to-End) tests require a running PostgreSQL database. You can easily set one up using Docker Compose and the provided scripts.

**1. Set up the Test Database**

- **Create a `.env.test` file** in the root of the project. You can copy the example credentials below.

  Example `.env.test`:
  ```
  DB_USER=docker
  DB_PASSWORD=docker
  DB_NAME=app_test
  DB_PORT=5433
  ```

- **Start the test database** with the following command:

  ```bash
  pnpm run db:up:test
  ```

  This will start a PostgreSQL container in the background.

- **Run database migrations** for the test database:
  ```bash
  pnpm run migrate:test
  ```

**2. Run E2E tests**

- Once the test database is running, you can run the E2E tests:
  ```bash
  pnpm run test:e2e
  ```

### Test Coverage

- **Generate test coverage report:**
  ```bash
  pnpm test:ci
  ```

---

## 📖 API Documentation

###  Swagger Documentation

This project uses Swagger for interactive API documentation. Once the application is running, the Swagger UI can be accessed at:

[http://localhost:3333/docs](http://localhost:3333/docs)

### Authentication

This API has no authentication or authorization layer. All endpoints operate in a single shared space, with no per-user scoping of log files or entries (see [docs/PRD.md](docs/PRD.md) for rationale).

### Concepts: LogFile vs LogEntry

A **LogFile** represents one uploaded file: its name, checksum, processing status, and line counters. A **LogEntry** represents one classified line from that file: its level, timestamp, source, message, and raw content. One `LogFile` produces many `LogEntry` rows (`LogFile` 1 → N `LogEntry`).

The walkthrough below uploads [`tests/fixtures/sample.log`](tests/fixtures/sample.log), a 5-line fixture, and follows it through every endpoint:

```
[2024-01-01T10:00:00Z] INFO api-gateway Request started
[2024-01-01T10:00:01Z] ERROR api-gateway Connection refused
[2024-01-01T10:00:02Z] WARN worker Disk almost full
{"level":"DEBUG","timestamp":"2024-01-01T10:00:03.000Z","service":"auth","message":"token validated","userId":"u-1"}
plain line without level
```

Each line becomes one `LogEntry`:

| Line | `level` | `source` | `message` |
|---|---|---|---|
| 1 | `INFO` | `api-gateway` | `Request started` |
| 2 | `ERROR` | `api-gateway` | `Connection refused` |
| 3 | `WARN` | `worker` | `Disk almost full` |
| 4 | `DEBUG` | `auth` | `token validated` (with `metadata: { "userId": "u-1" }`) |
| 5 | `UNKNOWN` | `null` | `plain line without level` (no level keyword found) |

Line 5 cannot be classified, so the resulting `LogFile` reports `totalLines: 5`, `processedLines: 5`, and `failedLines: 1` (the failed line is still stored as an `UNKNOWN` entry, never dropped).

### Walkthrough: import → query → dashboard

The steps below chain together: capture `id` from step 1 as `LOG_FILE_ID`, and an entry `id` from step 4 as `ENTRY_ID`.

#### 1. Upload a log file

*   **Method:** `POST`
*   **Path:** `/log-files`
*   **Description:** Uploads a `.log`, `.txt`, `.jsonl`, or `.json` file, parses/classifies each line, and stores structured entries. Files at or below `LOG_SYNC_MAX_BYTES` (default 1 MB) are processed synchronously and return `COMPLETED`. Larger files return `PENDING` immediately and are processed in the background via `LOG_QUEUE_DRIVER` (`inline` = in-process `setImmediate`, default; `bullmq` = Redis-backed BullMQ). Poll `GET /log-files/:id` until status is `COMPLETED` or `FAILED`.
*   **Content-Type:** `multipart/form-data` (field name: `file`)

```bash
curl -s -X POST http://localhost:3333/log-files \
  -F "file=@tests/fixtures/sample.log"
```

**Response:** `201 Created`

```json
{
  "id": "0193a1b2-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
  "filename": "sample.log",
  "status": "COMPLETED",
  "totalLines": 5,
  "processedLines": 5,
  "failedLines": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "processedAt": "2024-01-01T00:00:01.000Z"
}
```

For files larger than `LOG_SYNC_MAX_BYTES`, this same call returns `"status": "PENDING"` with `"processedAt": null` immediately; continue to step 3 to poll for completion.

> Re-uploading the exact same bytes returns `409 Conflict` (checksum-based dedupe). Modify the file content, or use a different fixture, before retrying manually.

#### 2. List log files

*   **Method:** `GET`
*   **Path:** `/log-files`
*   **Query:** `page`, `pageSize`, `order`

```bash
curl -s "http://localhost:3333/log-files?page=1&pageSize=10"
```

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "0193a1b2-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "filename": "sample.log",
      "status": "COMPLETED",
      "totalLines": 5,
      "processedLines": 5,
      "failedLines": 1,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "processedAt": "2024-01-01T00:00:01.000Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 1
}
```

#### 3. Get log file by id

*   **Method:** `GET`
*   **Path:** `/log-files/:id`
*   **Purpose:** Poll this endpoint after an asynchronous upload until `status` settles to `COMPLETED` or `FAILED`.

```bash
curl -s "http://localhost:3333/log-files/LOG_FILE_ID"
```

**Response:** `200 OK` — same shape as the upload response in step 1. A request for an unknown id returns `404` with `"LogFile not found"`.

#### 4. List / filter / search log entries

*   **Method:** `GET`
*   **Path:** `/logs`
*   **Query:**
    - `logFileId` — restrict to one imported file
    - `level` — exact or comma-separated list (`ERROR,FATAL`)
    - `from`, `to` — ISO 8601 bounds
    - `q` — free-text search on `message` / `rawLine`
    - Cursor mode: `cursor`, `limit` (default `50`, max `100`)
    - Offset mode: `page`, `pageSize`, `order`

```bash
# Scope to the imported file and filter by level + free text
curl -s "http://localhost:3333/logs?logFileId=LOG_FILE_ID&level=ERROR&q=Connection"

# Cursor pagination — 2 items per page
curl -s "http://localhost:3333/logs?logFileId=LOG_FILE_ID&limit=2"
curl -s "http://localhost:3333/logs?logFileId=LOG_FILE_ID&limit=2&cursor=<nextCursor>"

# Offset pagination — page/pageSize/totalItems
curl -s "http://localhost:3333/logs?logFileId=LOG_FILE_ID&page=1&pageSize=1"
```

**Response:** `200 OK` (cursor mode)

```json
{
  "items": [
    {
      "id": "0193a1c0-2b3c-7d4e-9f5a-6b7c8d9e0f1a",
      "logFileId": "0193a1b2-1a2b-7c3d-8e4f-5a6b7c8d9e0f",
      "level": "ERROR",
      "timestamp": "2024-01-01T10:00:01.000Z",
      "source": "api-gateway",
      "message": "Connection refused",
      "rawLine": "[2024-01-01T10:00:01Z] ERROR api-gateway Connection refused",
      "metadata": null,
      "createdAt": "2024-01-01T00:00:01.000Z"
    }
  ],
  "nextCursor": null,
  "limit": 2
}
```

Offset mode (`page`/`pageSize`) returns `{ "items": [...], "page": 1, "pageSize": 1, "totalItems": 5 }` instead of `nextCursor`/`limit`.

#### 5. Get log entry by id

*   **Method:** `GET`
*   **Path:** `/logs/:id`

```bash
curl -s "http://localhost:3333/logs/ENTRY_ID"
```

**Response:** `200 OK` — a single entry with the same shape as an item from step 4. An unknown id returns `404` with `"LogEntry not found"`.

#### 6. Dashboard summary

*   **Method:** `GET`
*   **Path:** `/dashboard/summary`
*   **Query:** optional `from`, `to`, `logFileId`

```bash
curl -s "http://localhost:3333/dashboard/summary?logFileId=LOG_FILE_ID"
```

**Response:** `200 OK`

```json
{
  "totalEntries": 5,
  "countsByLevel": {
    "TRACE": 0,
    "DEBUG": 1,
    "INFO": 1,
    "WARN": 1,
    "ERROR": 1,
    "FATAL": 0,
    "UNKNOWN": 1
  },
  "distinctSources": 3,
  "filesProcessed": 1
}
```

An unknown `logFileId` returns `200` with every counter zeroed out, not `404`.

#### 7. Dashboard trends

*   **Method:** `GET`
*   **Path:** `/dashboard/trends`
*   **Query:** `bucket=hour|day` (default `hour`), optional `from`, `to`, `splitByLevel`, `logFileId`

```bash
curl -s "http://localhost:3333/dashboard/trends?bucket=hour&logFileId=LOG_FILE_ID&from=2024-01-01T00:00:00.000Z&to=2024-01-02T00:00:00.000Z&splitByLevel=true"
```

**Response:** `200 OK`

```json
{
  "bucket": "hour",
  "series": [
    {
      "bucket": "2024-01-01T10:00:00.000Z",
      "total": 4,
      "countsByLevel": { "INFO": 1, "ERROR": 1, "WARN": 1, "DEBUG": 1 }
    }
  ]
}
```

`countsByLevel` per bucket is only present when `splitByLevel=true`.

#### 8. Dashboard top sources

*   **Method:** `GET`
*   **Path:** `/dashboard/top-sources`
*   **Query:** `by=volume|errorRate` (default `volume`), `limit` (default `10`), optional `from`, `to`, `logFileId`

```bash
curl -s "http://localhost:3333/dashboard/top-sources?logFileId=LOG_FILE_ID&by=volume&limit=5"
```

**Response:** `200 OK`

```json
[
  { "source": "api-gateway", "total": 2, "errorCount": 1, "errorRate": 0.5 },
  { "source": "worker", "total": 1, "errorCount": 0, "errorRate": 0 },
  { "source": "auth", "total": 1, "errorCount": 0, "errorRate": 0 }
]
```

### Background queue configuration

| Variable | Default | Purpose |
|---|---|---|
| `LOG_QUEUE_DRIVER` | `inline` | `inline` = in-process async; `bullmq` = Redis BullMQ |
| `LOG_QUEUE_CONCURRENCY` | `1` | BullMQ worker concurrency |
| `LOG_QUEUE_ATTEMPTS` | `3` | BullMQ job retry attempts |

The BullMQ worker is embedded in the API process (starts on bootstrap) and shuts down gracefully on SIGTERM. Redis must be reachable when using `bullmq` (and is also used for dashboard caching). Lower `LOG_SYNC_MAX_BYTES` (for example, to `1`) to exercise the asynchronous path with a small fixture.

### Common error responses

| Status | When |
|---|---|
| `400` | Upload request has no file |
| `404` | Unknown `LogFile` or `LogEntry` id |
| `409` | Duplicate upload (same file checksum already imported) |
| `413` | Upload exceeds `MAX_UPLOAD_SIZE` (default 50 MB) |
| `415` | Unsupported file extension |
| `422` | Invalid query/path parameters (for example, a non-UUID id or a non-ISO date) |

See [`.notebook/route-test-playbook.md`](.notebook/route-test-playbook.md) for the full curl-based scenario matrix, or [`docs/api-manual-testing.md`](docs/api-manual-testing.md) for the same scenarios walked through in Insomnia/Postman.

---

## License

This project is licensed under the MIT License.
