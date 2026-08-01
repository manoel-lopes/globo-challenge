# Log Analysis Platform

A full-stack log analysis platform: import log files, automatically parse and classify their entries, then browse, filter, search, and visualize them.

- **Backend**: NestJS (Fastify) + Prisma + PostgreSQL + Redis — see [backend/README.md](backend/README.md)
- **Frontend**: React + Vite + TanStack Router/Query — see [frontend](frontend)

## Quick start (Docker)

The fastest way to try the whole app — API, database, cache, and UI — with sample data already loaded.

**Prerequisites**: Docker and Docker Compose.

```bash
docker compose up --build -d
```

This single command:

1. Starts PostgreSQL and Redis.
2. Runs database migrations (`migrate` service).
3. Builds and starts the backend API.
4. Seeds the database with 3 realistic sample log files, uploaded through the real `POST /log-files` API (`seed` service) — skipped automatically if the database already has data, so it's safe to re-run.
5. Builds and serves the frontend.

Once it's up:

- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend Swagger docs**: [http://localhost:3333/docs](http://localhost:3333/docs)

### Checking status

```bash
docker compose ps
docker compose logs -f backend
docker compose logs seed
```

`migrate` and `seed` are one-shot jobs — they should show `Exited (0)` once the stack is healthy.

### Resetting and reseeding

```bash
docker compose down -v
docker compose up --build -d
```

`down -v` removes the Postgres volume, so the next `up` starts from an empty database and the seed step runs again.

### Configuration

Default ports and credentials work with no setup. To override them, copy [.env.example](.env.example) to `.env` and adjust:

```bash
cp .env.example .env
```

## Testing

### Verify the running stack

No setup required beyond `docker compose up --build -d` — the database is already seeded.

Quick API checks:

```bash
curl -s "http://localhost:3333/log-files?page=1&pageSize=10"
curl -s "http://localhost:3333/dashboard/summary"
```

Both should return `200 OK` with the 3 seeded log files and non-zero aggregate counts.

UI walkthrough at [http://localhost:8080](http://localhost:8080):

1. **Dashboard** — cards and charts should show non-empty data (total entries, level distribution, trends) for the default "Last 7 days" range.
2. **Logs** — the table should list classified entries with level/source/timestamp; clicking a row opens the detail dialog.
3. **Imports** — the 3 seeded files should show status `COMPLETED`; drop or choose a `.log`/`.txt`/`.jsonl` file to confirm a real upload processes end-to-end and appears in the table.

For interactively exploring or trying individual endpoints, use the Swagger UI at [http://localhost:3333/docs](http://localhost:3333/docs).

### Run automated test suites

These run locally against each app's own tooling, not through the Docker Compose stack above.

**Backend** (see [backend/README.md](backend/README.md#-testing) for full details):

```bash
cd backend
pnpm test:unit
pnpm db:up:test && pnpm migrate:test && pnpm test:e2e
pnpm test:coverage
```

**Frontend**:

```bash
cd frontend
pnpm test
```

## Local development (without Docker)

For active development on either app, run them directly instead of through the Docker Compose stack:

- Backend: see [backend/README.md](backend/README.md) (`pnpm db:up:dev`, `pnpm migrate:dev`, `pnpm start:dev`).
- Frontend: `cd frontend && pnpm install && pnpm dev` (defaults to calling the API at `http://localhost:3333`, configurable via `frontend/.env`).
