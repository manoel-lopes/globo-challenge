# API Manual Testing Guide (Insomnia / Postman)

How to exercise every API route by hand in a REST client, covering the same happy-path, edge-case, and error scenarios proven by the automated e2e suite, using the fixtures already checked into [`tests/fixtures/`](../tests/fixtures/).

This is the GUI-client counterpart to [`.notebook/route-test-playbook.md`](../.notebook/route-test-playbook.md) (curl-based) and [`docs/test-plan.md`](test-plan.md) (requirement traceability). For request/response shapes with full JSON examples, see the [README walkthrough](../README.md#-api-documentation).

## Prerequisites

```bash
pnpm db:up:dev && pnpm migrate:dev && pnpm start:dev
```

- API listens on `http://localhost:3333`; Swagger UI at `/docs`.
- Redis must be reachable (dashboard cache + BullMQ worker start regardless of `LOG_QUEUE_DRIVER`).
- No authentication — every request in this guide is unauthenticated by design.

## 1. Environment setup

Create one environment in your client (Postman: "Environment"; Insomnia: "Base Environment") with these variables. Requests below reference them as `{{variableName}}`.

| Variable | Initial value | Set by |
|---|---|---|
| `baseUrl` | `http://localhost:3333` | you, manually |
| `logFileId` | *(empty)* | capture from §5.A upload response |
| `logEntryId` | *(empty)* | capture from §5.C list response |
| `nextCursor` | *(empty)* | capture from a cursor-paginated §5.C response |

### Postman

1. Create an Environment with the variables above; select it top-right.
2. On the upload request, add a **Tests** (or **Post-response**) script to auto-populate `logFileId`:

   ```javascript
   const body = pm.response.json();
   if (pm.response.code === 201) {
     pm.environment.set('logFileId', body.id);
   }
   ```

3. Do the same on the list-logs request to capture `logEntryId` / `nextCursor`:

   ```javascript
   const body = pm.response.json();
   if (body.items?.length) pm.environment.set('logEntryId', body.items[0].id);
   if (body.nextCursor) pm.environment.set('nextCursor', body.nextCursor);
   ```

### Insomnia

1. Create a Base Environment with `baseUrl` (and empty placeholders for the rest).
2. Insomnia has no built-in "set variable from response" without a plugin; the practical options are:
   - Manually copy `id` / `nextCursor` from the response pane into the environment after each call (fine for a handful of manual runs), or
   - Use a template tag that reads directly from a prior response: right-click the field → **Insert Template Tag** → **Response ▸ Body Attribute**, pick the upload request, and set the JSONPath to `$.id`. This re-runs the referenced request's *last stored response*, no scripting needed.

## 2. Multipart upload setup (both clients)

`POST /log-files` is the only endpoint that takes a body, and it must be `multipart/form-data` with a single field named `file`:

- **Postman:** Body tab → `form-data` → key `file`, type switched from `Text` to `File` → choose the fixture from disk.
- **Insomnia:** Body tab → `Multipart Form` → key `file` → click the file icon (not text) → choose the fixture from disk.

Point the file picker at the repo's `tests/fixtures/` folder (use the workspace absolute path, e.g. `<repo>/tests/fixtures/sample.log`).

> Re-uploading identical bytes always returns `409 Conflict` (SHA-256 checksum dedupe). Before re-running an upload scenario, duplicate the fixture and append/change one line (mirrors the `saltLogContent` test helper) — otherwise every client-side retry after the first will 409.

## 3. Fixture catalog

| Fixture | Lines | Used for |
|---|---|---|
| `tests/fixtures/sample.log` | 5 (1 unparseable) | Baseline happy path; `.txt`/`.jsonl` variants below are byte-equivalent content in other supported formats |
| `tests/fixtures/sample.txt` | 5 (1 unparseable) | Same content as `sample.log`, proves the `.txt` extension is accepted |
| `tests/fixtures/sample.jsonl` | 5 (1 unparseable) | Same content as `sample.log`, JSON-lines format |
| `tests/fixtures/all-levels.log` | 10, all classify | Every severity + alias: `INFORMATION`→INFO, `WARNING`→WARN, `ERR`→ERROR, `CRITICAL`→FATAL; `failedLines=0` |
| `tests/fixtures/malformed.log` | 7 (3 unparseable) | Garbage/truncated lines still import as `COMPLETED`, stored as `UNKNOWN`, never dropped |
| `tests/fixtures/custom-format.log` | 5 | Heuristic keyword classifier on non-standard formats (e.g. "charge declined"→ERROR, "cart abandoned"→WARN) |
| `tests/fixtures/mixed-timestamps.log` | 6 | Timestamp normalization: offset-aware ISO, epoch millis, `time` field, year-less syslog, unparseable → import-time fallback |

No `empty.log` fixture is checked in — to test the empty-file scenario, create a 0-byte file yourself and upload it (expect `201`, `COMPLETED`, `totalLines: 0`).

## 4. Query parameter reference

Copy these into your client's Params tab; toggle checkboxes on/off per scenario instead of retyping URLs.

**`GET /log-files`** — `page`, `pageSize` (max 100), `order` (`asc`/`desc`, default `desc`)

**`GET /logs`** — `logFileId`, `level` (comma-separated, e.g. `ERROR,WARN`), `from`/`to` (ISO 8601), `q` (free text on `message`/`rawLine`), plus either:
- Cursor mode: `cursor`, `limit` (1–100, default 50)
- Offset mode: `page`, `pageSize` (max 100), `order`

**`GET /dashboard/summary`** — `from`, `to`, `logFileId` (all optional)

**`GET /dashboard/trends`** — adds `bucket` (`hour`/`day`, default `hour`), `splitByLevel` (`true`/`false`)

**`GET /dashboard/top-sources`** — adds `by` (`volume`/`errorRate`, default `volume`), `limit` (default 10)

## 5. Scenario matrix by route

### A. Import — `POST {{baseUrl}}/log-files`

| Scenario | How to set it up in the client | Expect |
|---|---|---|
| Happy path, sync | Attach `sample.log` (or any salted fixture ≤ `LOG_SYNC_MAX_BYTES`) | `201`, `status: COMPLETED`, `totalLines: 5`, `processedLines: 5`, `failedLines: 1` |
| Format variants | Attach `sample.txt`, then `sample.jsonl` (salt each first) | Same shape as above, per extension |
| Missing file | Send with an empty/no body, or `multipart/form-data` with no `file` field | `400` — `"Log file is required"` |
| Bad extension | Rename any fixture to `.csv` before attaching, or attach any non-log file | `415` — unsupported media type |
| Oversize | Attach a file larger than `MAX_UPLOAD_SIZE` (default 50 MB) | `413` |
| Duplicate content | Attach the exact same bytes twice in a row | Second call `409 Conflict`, references the original file's `id` |
| Async path | Lower `LOG_SYNC_MAX_BYTES` (e.g. to `1`) and restart the app, then upload any fixture | `201`, `status: PENDING` — continue to §5.B to poll |
| All severities | Attach `all-levels.log` | `201`, `failedLines: 0` |
| Malformed lines | Attach `malformed.log` | `201`, `COMPLETED`, `failedLines: 3` (not dropped) |

Save the response `id` into `{{logFileId}}` (see §1) — every other section below depends on it.

### B. Log files — `GET {{baseUrl}}/log-files` and `GET {{baseUrl}}/log-files/:id`

| Scenario | Request | Expect |
|---|---|---|
| List paginated | `GET /log-files?page=1&pageSize=10` | `200`, `{ items, page, pageSize, totalItems }` |
| Get by id | `GET /log-files/{{logFileId}}` | `200`, same shape as the upload response |
| Poll pending import | Repeat the same request every second after an async upload | `status` transitions `PENDING` → `PROCESSING` → `COMPLETED`/`FAILED` |
| Unknown id | `GET /log-files/00000000-0000-0000-0000-000000000000` | `404` — `"LogFile not found"` |
| Non-UUID id | `GET /log-files/not-a-uuid` | `422` |
| Invalid page | `GET /log-files?page=0` | `422` |

### C. Logs — `GET {{baseUrl}}/logs` and `GET {{baseUrl}}/logs/:id`

Prerequisite: `{{logFileId}}` set from a `sample.log` upload.

| Scenario | Params to toggle on | Expect |
|---|---|---|
| Cursor page | `logFileId={{logFileId}}`, `limit=2` | `200`, 2 items + `nextCursor` |
| Next cursor page | add `cursor={{nextCursor}}` | `200`, different item ids |
| Default limit | omit `limit` | defaults to `50` |
| Single level filter | `level=ERROR` | every item has `level: ERROR` |
| Multi-level filter | `level=ERROR,WARN` | only those levels present |
| Free-text search | `q=Connection` | ≥1 match |
| No-match search | `q=this-string-does-not-exist` | `200`, `items: []` |
| Date window | `from`/`to` ISO datetimes | subset by `timestamp` |
| Offset mode | `page=1&pageSize=1` | `200`, `totalItems: 5`, one item |
| Combined filters | `level=ERROR&q=Connection&logFileId={{logFileId}}` | intersection of all filters |
| Bad UUID | `logFileId=not-a-uuid` or `cursor=not-a-uuid` | `422` |
| Bad date | `from=not-a-date` | `422` |
| Out-of-range limit | `limit=0` or `limit=101` | `422` |
| Get entry by id | `GET /logs/{{logEntryId}}` | `200`, full entry incl. `rawLine` |
| Unknown entry | `GET /logs/00000000-0000-0000-0000-000000000000` | `404` |

### D. Dashboard — `/dashboard/summary`, `/dashboard/trends`, `/dashboard/top-sources`

| Scenario | Request | Expect |
|---|---|---|
| Summary for a file | `GET /dashboard/summary?logFileId={{logFileId}}` | `200`, `{ totalEntries, countsByLevel, distinctSources, filesProcessed }` |
| Summary, unknown file | `GET /dashboard/summary?logFileId=00000000-0000-0000-0000-000000000000` | `200`, all counters zeroed (not `404`) |
| Trends, default bucket | `GET /dashboard/trends?logFileId={{logFileId}}` | `bucket: "hour"` when omitted |
| Trends with range | add `from`/`to` ISO bounds | `200`, `{ bucket, series }`, `series.length >= 1` |
| Trends split by level | add `splitByLevel=true` | each series item includes `countsByLevel` |
| Top sources | `GET /dashboard/top-sources?logFileId={{logFileId}}&by=volume` | `200`, ranked `[{ source, total, errorCount, errorRate }]` |
| Invalid bucket | `bucket=minute` | `422` |
| Invalid query param | non-ISO `from`/`to`, or non-UUID `logFileId` | `422` |

### E. Classification spot-checks

Upload each fixture, then `GET /logs?logFileId={{logFileId}}` to inspect the resulting `level` / `timestamp` / `rawLine`:

| Fixture | Verify in the response |
|---|---|
| `all-levels.log` | Aliases normalized (`WARNING`→WARN, `ERR`→ERROR, etc.); `countsByLevel` sums to 10 via `/dashboard/summary`; `UNKNOWN=0` |
| `custom-format.log` | Non-standard lines still classify via keyword heuristics |
| `mixed-timestamps.log` | All timestamps normalize to UTC ISO regardless of original format; the unparseable line falls back to import time |
| Same fixture uploaded twice (salted) | Classification is identical across imports for the unchanged lines |

## 6. Suggested end-to-end run (one request folder)

Group these as a folder in your client and run top-to-bottom, propagating `{{logFileId}}` / `{{logEntryId}}` / `{{nextCursor}}` as you go:

1. `POST /log-files` with a salted `sample.log` → expect `COMPLETED` → capture `logFileId`
2. `GET /log-files/{{logFileId}}` → counts match step 1
3. `GET /logs?logFileId={{logFileId}}&level=ERROR&q=Connection` → capture an entry id into `logEntryId`
4. `GET /logs?logFileId={{logFileId}}&limit=2` repeatedly with `cursor={{nextCursor}}` until `nextCursor` is `null`
5. `GET /logs/{{logEntryId}}` → full entry detail
6. `GET /dashboard/summary|trends|top-sources?logFileId={{logFileId}}`
7. Re-run step 1 with the **unmodified** fixture → expect `409`
8. Lower `LOG_SYNC_MAX_BYTES` (e.g. to `1`), restart the app, repeat step 1 → `PENDING` → poll step 2 until settled (works with `LOG_QUEUE_DRIVER=inline` and `bullmq`)

## 7. Gotchas specific to manual testing

- **409 on retry:** identical upload bytes always dedupe by checksum. Salt the fixture (append/change a line) before re-uploading in a new run.
- **No auth headers needed:** this API has no auth layer; don't waste time configuring bearer tokens even though Swagger shows an auth scheme.
- **Redis is always required:** the BullMQ worker starts on boot regardless of `LOG_QUEUE_DRIVER=inline`; requests will fail at startup if Redis isn't reachable.
- **Async path is env-gated:** to see `PENDING`/polling behavior without a huge file, temporarily lower `LOG_SYNC_MAX_BYTES` and restart the app.
- **Dashboard cache:** dashboard reads are cached (`CACHE_TTL_SECONDS`); a fresh import invalidates the cache automatically, so results should always reflect the latest upload.

## See also

- [Swagger UI](http://localhost:3333/docs) — live schema and try-it-out for every endpoint
- [`.notebook/route-test-playbook.md`](../.notebook/route-test-playbook.md) — the curl equivalent of this guide
- [`docs/test-plan.md`](test-plan.md) — full requirement-to-test traceability matrix
- [README API Documentation](../README.md#-api-documentation) — full JSON response examples for every endpoint
