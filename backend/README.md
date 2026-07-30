# NestJS Clean Architecture Template

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A robust RESTful API template built with **NestJS**, **TypeScript**, and following **Clean Architecture** and **Domain-Driven Design** principles. This project creates a scalable, maintainable, and testable codebase that is independent of frameworks and external dependencies.


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

### Example: Create Account Feature

```
src/infra/http/presentation/controllers/create-account/
├── create-account.controller.ts      # NestJS controller
├── create-account.schema.ts          # Zod validation schema
└── create-account.controller.e2e-spec.ts  # E2E tests
```

All files related to creating an account are co-located, making the feature easy to understand, modify, and test.

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
│   │   │   └── security/           # 🔐 Password hashing (Bcrypt)
│   │   │
│   │   ├── persistence/            # 💾 Data persistence layer
│   │   │   ├── mappers/            # 🔄 Domain ↔ Persistence mapping
│   │   │   └── repositories/       # 📦 Repository implementations
│   │   │       ├── prisma/         # 🐘 PostgreSQL with Prisma ORM
│   │   │       └── in-memory/      # 🧪 In-memory for testing
│   │   │
│   │   ├── auth/                   # 🔒 JWT authentication
│   │   └── doubles/                # 🎭 Test doubles (stubs, mocks)
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

Most routes require authentication using a JWT Token.

## Session

### Authenticates a user

*   **Method:** `POST`
*   **Path:** `/auth`
*   **Description:** Authenticates a user by verifying their email and password. If the credentials are correct, it returns a JWT token.
*   **Authentication:** Not required

**Request Body:**

```json
{
  "email": "johndoe@example.com",
  "password": "password123"
}
```

**Response:**

*   **Status:** `200 OK`
*   **Body:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
}
```

---

## Users

### Creates a new user account

*   **Method:** `POST`
*   **Path:** `/users`
*   **Description:** Creates a new user account. It checks if the email is already registered and hashes the password before saving the user to the database.
*   **Authentication:** Not required

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "Pass123!"
}
```

**Validation Rules:**
- `name`: Required, minimum 1 character
- `email`: Required, valid email format
- `password`: Required, minimum 6 characters, maximum 12 characters

**Response:**

*   **Status:** `201 Created`
*   **Body:** No body

---

## License

This project is licensed under the MIT License.
