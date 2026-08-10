# Test Plan Traceability Matrix

Maps every test case (TC) from the Full Stack Challenge 01 test plan to its evidence in this
repository. This project implements the **backend only** (see [PRD.md](PRD.md) §2.2 Non-goals):
there is no React frontend, so UI-rendering test cases are marked **Out of scope** with an
API-level equivalent noted where one exists.

Status legend:

- **Covered** — already proven by an existing test before this work started.
- **New test** — a test was added as part of this effort to prove the case.
- **Gap fixed** — a real behavioral gap was found and fixed, then covered by a new test.
- **Out of scope** — no frontend exists; noted with the closest backend equivalent, if any.

## 1. Log file import

| TC    | Description                                                               | Status    | Evidence                                                                                              | Note                                                                                                                                   |
| ----- | ------------------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| TC-01 | Upload a valid log file and confirm accepted/stored                       | Covered   | `create-log-file.controller.e2e-spec.ts` → `should import $filename and return COMPLETED status` | `.log`, `.txt`, `.jsonl`, `.json` all covered via `it.each`                                                                  |
| TC-02 | Reject unsupported extension with clear error                             | Covered   | `create-log-file.controller.e2e-spec.ts` → `should return 415 for unsupported file types`        | `UnsupportedFileTypeError` → 415                                                                                                    |
| TC-03 | Empty file handled gracefully                                             | New test  | `create-log-file.controller.e2e-spec.ts` (new case using `tests/fixtures/empty.log`)              | Behavior: accepted,`COMPLETED`, `totalLines=0`, no crash — documented as intentional, not changed                                 |
| TC-04 | Large file (hundreds of thousands of lines) imports without timeout/crash | New test  | `tests/e2e/large-import.e2e-spec.ts`                                                                | ~100k lines, configurable via`E2E_LARGE_IMPORT_LINES`; asserts `COMPLETED`, full row count, wall-clock budget                      |
| TC-05 | Multiple files processed correctly in sequence/parallel                   | New test  | `create-log-file.controller.e2e-spec.ts` (new sequential + `Promise.all` cases)                   | Each upload distinct content to avoid duplicate-checksum collisions                                                                    |
| TC-06 | Malformed/corrupted lines don't break the whole import                    | New test  | `tests/fixtures/malformed.log` + `create-log-file.controller.e2e-spec.ts`                         | 7 lines, 3 unparseable → stored as`UNKNOWN`, `failedLines=3`, import still `COMPLETED`                                          |
| TC-07 | Cancelled/aborted mid-upload leaves no partial/corrupted data             | New test  | `create-log-file.controller.e2e-spec.ts` (new aborted-request case)                                 | Truncated-size case already covered (413 →`FAILED` + temp file cleanup); client-abort case added                                    |
| TC-08 | Re-upload same file handled as designed                                   | Gap fixed | `import-log-file.usecase.ts` (sha256 checksum) + `create-log-file.controller.e2e-spec.ts`         | Was previously undetected (every upload created a new`LogFile`); now rejected with `409 Conflict` referencing the original file id |

## 2. Processing and automatic classification

| TC    | Description                                                     | Status    | Evidence                                                                                                                                         | Note                                                                                                            |
| ----- | --------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- |
| TC-09 | Different severity levels classified correctly                  | New test  | `tests/fixtures/all-levels.log` + `log-classification.e2e-spec.ts` → `should classify every severity level and its aliases`               | TRACE/DEBUG/INFO/WARN/ERROR/FATAL plus`WARNING`/`CRITICAL`/`INFORMATION`/`ERR` aliases                  |
| TC-10 | Non-standard/custom format still classifies or fails gracefully | New test  | `tests/fixtures/custom-format.log` + `log-classification.e2e-spec.ts` → `should fall back to keyword heuristics for non-standard formats` | Heuristic classifier keyword-matches even outside any recognized structure                                      |
| TC-11 | Timestamps normalized regardless of original format             | Gap fixed | `tests/fixtures/mixed-timestamps.log` + `log-classification.e2e-spec.ts` (timestamp cases)                                                   | ISO w/ offset, epoch millis, syslog year-less format all covered; syslog year-inference bug fixed (see Phase 2) |
| TC-12 | Classification consistent across repeat imports                 | New test  | `log-classification.e2e-spec.ts` → `should classify the same log lines identically across imports`                                          | Same lines produce identical level/timestamp/source/message on a second import                                  |
| TC-13 | Processing performance/time for large batches acceptable        | New test  | `tests/e2e/large-import.e2e-spec.ts`                                                                                                           | Batch inserts of 1000; asserts import completes within budget and a filtered query stays under 2s               |

## 3. Structured storage

| TC    | Description                                          | Status    | Evidence                                                                                                        | Note                                                                                                                     |
| ----- | ---------------------------------------------------- | --------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| TC-14 | Records persisted with all expected fields           | Covered   | `get-log-entry-by-id.controller.e2e-spec.ts`, `list-logs.controller.e2e-spec.ts`                            | `LogEntry`: timestamp, level, message, source, rawLine, metadata                                                       |
| TC-15 | Data survives app/server restart                     | New test  | `tests/e2e/persistence.e2e-spec.ts` → `should keep imported data available after the application restarts` | Closes and rebuilds the Nest app against the same schema                                                                 |
| TC-16 | No data loss on concurrent imports                   | New test  | `create-log-file.controller.e2e-spec.ts` (parallel `Promise.all` case)                                      | Verifies all parallel uploads land with correct, non-overlapping entry counts                                            |
| TC-17 | Indexes/queries support efficient retrieval at scale | Gap fixed | `tests/e2e/persistence.e2e-spec.ts` (index existence + `EXPLAIN` checks)                                    | Added missing`gin_trgm_ops` index on `rawLine` (previously only `message` was indexed, though `q` searches both) |

## 4. Log query in responsive table

| TC    | Description                               | Status       | Evidence                                                                                          | Note                                                                                                             |
| ----- | ----------------------------------------- | ------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| TC-18 | Table renders on desktop/tablet/mobile    | Out of scope | —                                                                                                | No frontend in this repo (PRD §2.2). API responses are shaped for table rendering by any client (`GET /logs`) |
| TC-19 | Columns displayed and sortable            | Gap fixed    | `list-logs.controller.e2e-spec.ts` (new `order=asc`/`order=desc` cursor cases)              | `order` was accepted but silently ignored in cursor-pagination mode; now honored                               |
| TC-20 | Table updates when new logs are imported  | New test     | `dashboard.controller.e2e-spec.ts` (cache-invalidation case)                                    | `GET /logs` always reflects latest DB state; dashboard cache invalidates on new import                         |
| TC-21 | Empty state (no logs) shown appropriately | New test     | `dashboard-empty-state.e2e-spec.ts` → `should return an empty log listing before any import` | `GET /logs` returns `{ items: [], nextCursor: null }`                                                        |

## 5. Filters and text search

| TC    | Description                                         | Status   | Evidence                                                                                                 | Note                                                                          |
| ----- | --------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| TC-22 | Filter by single level                              | Covered  | `list-logs.controller.e2e-spec.ts` → `should filter logs by level and free-text search`             |                                                                               |
| TC-23 | Filter by multiple levels                           | Covered  | `list-logs.controller.e2e-spec.ts` → `should filter logs by comma-separated levels`                 |                                                                               |
| TC-24 | Filter by date range                                | Covered  | `list-logs.controller.e2e-spec.ts` → `should filter logs by from/to date window`                    |                                                                               |
| TC-25 | Combined level + date + text filters (intersection) | New test | `list-logs.controller.e2e-spec.ts` (new combined-filter case)                                          |                                                                               |
| TC-26 | Text search with existing term returns matches      | Covered  | `list-logs.controller.e2e-spec.ts` → `should filter logs by level and free-text search`             |                                                                               |
| TC-27 | Text search with non-existent term returns empty    | Covered  | `list-logs.controller.e2e-spec.ts` → `should return empty items when free-text search has no match` |                                                                               |
| TC-28 | Case-insensitive, partial-match search              | New test | `list-logs.controller.e2e-spec.ts` (new case-insensitive/partial-match case)                           | `q` uses Postgres `ILIKE`-style `contains` with `mode: 'insensitive'` |
| TC-29 | Clearing filters restores full/default dataset      | New test | `list-logs.controller.e2e-spec.ts` (new no-filter baseline case)                                       |                                                                               |
| TC-30 | Filters persist while paginating/scrolling          | New test | `list-logs.controller.e2e-spec.ts` (new filter-persistence-across-cursor-pages case)                   |                                                                               |

## 6. Pagination / infinite scroll

| TC    | Description                                             | Status       | Evidence                                                                                     | Note                                                                                  |
| ----- | ------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| TC-31 | Pagination/infinite scroll loads more records correctly | Covered      | `list-logs.controller.e2e-spec.ts` → `should follow cursor pagination to the next page` |                                                                                       |
| TC-32 | No duplicate/missing records across pages               | New test     | `list-logs.controller.e2e-spec.ts` (new full-cursor-walk case)                             | Walks every page and asserts the union equals the full dataset with no repeats        |
| TC-33 | Smooth performance scrolling large datasets             | Out of scope | —                                                                                           | No frontend; server-side equivalent covered by TC-13/TC-49 (query latency under load) |
| TC-34 | Loading indicator while fetching                        | Out of scope | —                                                                                           | Frontend-only concern; not applicable to a REST API                                   |
| TC-35 | Correct behavior at end of data                         | New test     | `list-logs.controller.e2e-spec.ts` (new end-of-data case)                                  | `nextCursor: null` once the last page is reached                                    |

## 7. Dashboard and statistical charts

| TC    | Description                                             | Status       | Evidence                                                              | Note                                                                                                                 |
| ----- | ------------------------------------------------------- | ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TC-36 | Dashboard indicators match actual stored data           | New test     | `dashboard.controller.e2e-spec.ts` (new totals-reconciliation case) | `dashboard/summary.totalEntries` cross-checked against `GET /logs` `totalItems`                                |
| TC-37 | Charts render correctly with real data                  | Out of scope | —                                                                    | No frontend;`GET /dashboard/trends` and `/dashboard/top-sources` return chart-ready pre-aggregated series        |
| TC-38 | Charts update after new logs imported                   | New test     | `dashboard.controller.e2e-spec.ts` (cache-invalidation case)        | Redis cache invalidated (`dashboard:*` pattern) on every `createMany` insert                                     |
| TC-39 | Dashboard handles no-data state gracefully              | New test     | `dashboard-empty-state.e2e-spec.ts`                                 | Zeroed summary, empty trend series, empty top-sources before any import                                              |
| TC-40 | Charts responsive/legible on different screens          | Out of scope | —                                                                    | No frontend; chart data shape is client-agnostic                                                                     |
| TC-41 | Statistical calculations accurate against known dataset | Gap fixed    | `dashboard.controller.e2e-spec.ts` (deterministic-fixture case)     | `filesProcessed` previously ignored `from`/`to`; now scoped to the same date window as the rest of the summary |

## 8. General non-functional / technical requirements

| TC    | Description                                                          | Status              | Evidence                                                                                                    | Note                                                                                                                                               |
| ----- | -------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-42 | Frontend built in ReactJS, cross-browser                             | Out of scope        | —                                                                                                          | No frontend in this repo (PRD §2.2 Non-goals)                                                                                                     |
| TC-43 | Backend (Node) exposes working API endpoints for all core features   | Covered             | Full e2e suite across`log-files`, `logs`, `dashboard` controllers                                     | See PRD §6 API Surface                                                                                                                            |
| TC-44 | Application runs via Docker (build + run)                            | Gap fixed           | `Dockerfile`, `docker-compose.yml` (`api` service)                                                    | Previously only Postgres + Redis were containerized; no app image existed                                                                          |
| TC-45 | Docker setup includes all necessary services communicating correctly | Gap fixed           | `docker-compose.yml` (api + postgres + redis, healthchecked `depends_on`)                               |                                                                                                                                                    |
| TC-46 | Source code in a well-organized GitHub repository                    | Not applicable here | —                                                                                                          | Workspace is not a git repository; requires`git init` + a remote, which was intentionally not done without explicit request                      |
| TC-47 | README documents setup/execution and works from a clean environment  | Gap fixed           | `README.md` (rewritten)                                                                                   | Retitled, added Docker quickstart, corrected stale`pnpm test:ci` reference, documented duplicate-upload/empty-file behavior                      |
| TC-48 | Proper error handling/validation on frontend and backend             | Gap fixed (backend) | Global exception filter (`src/infra/http/presentation/filters/`) + Zod validation (`ZodValidationPipe`) | Frontend feedback out of scope; backend now returns a consistent`{ statusCode, message, error }` body for all failures, not just Zod/domain ones |
| TC-49 | Performance under realistic/large dataset                            | New test            | `tests/e2e/large-import.e2e-spec.ts`                                                                      | Import + filtered/paginated query timing assertions                                                                                                |
| TC-50 | Overall UX/UI consistency across main flows                          | Out of scope        | —                                                                                                          | No frontend; API consistency (naming, pagination shape, error format) is the backend analogue                                                      |

## Acceptance criteria summary

- **Functional requirements** (import, processing, storage, query, filters, search,
  pagination, dashboard): all covered by the matrix above, with 5 real gaps identified and
  fixed rather than only tested around (TC-08, TC-11, TC-17, TC-19, TC-41, TC-48).
- **Large-volume performance**: exercised by `tests/e2e/large-import.e2e-spec.ts` at
  ~100k lines; streaming parse + batched inserts + indexed queries keep it within budget.
- **Docker**: `docker compose up --build` brings up `api` + `postgres` + `redis` together
  from a clean checkout (see `README.md`).
- **Documentation**: `README.md` documents setup, execution, and the behaviors called out
  above; this file provides full requirement traceability for an evaluator.
- **Error handling**: domain errors map to specific HTTP statuses (400/404/409/413/415/422);
  anything unexpected is caught by the global exception filter instead of leaking internals.
- **Source control**: not established in this workspace (TC-46) — flagged above rather than
  assumed.
