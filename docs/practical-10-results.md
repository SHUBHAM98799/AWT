# Practical 10: Asynchronous Processing with Event-Driven Architecture

**Branch:** `practical-10`

**Repository:** [SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT/tree/practical-10)

## Objective and Architecture

Use Node.js's built-in `EventEmitter` for task notifications while preserving the existing Express, Mongoose, JWT authentication, task CRUD, request logging, and Practical 9 in-memory cache.

`events.cjs` exports one shared emitter. `server.cjs` imports the listener module once during startup, before requests are served. Task routes persist or delete through Mongoose before registering a response `finish` callback. That callback schedules the event with `setImmediate`, so the response is sent before `emit()` invokes any listeners. `emit()` itself is synchronous; event-loop scheduling is what defers dispatch. The creation listener uses `setTimeout` for an asynchronous two-second delay, not a blocking loop.

The `task-created` listener logs handler start, task title, authenticated user ID, notification timestamp, and completion timestamp. The `task-deleted` listener reports task ID, title, authenticated user ID, and deletion timestamp. Event payloads contain no credentials, JWTs, or secrets. Both listener paths catch failures and report them to a registered `error` listener, so notification errors do not alter a completed HTTP response.

The task model has no owner field and existing routes do not enforce per-user task ownership. This change preserves those existing semantics and uses the authenticated JWT `id` as the assigned-user value for notifications; it does not add ownership restrictions or change the task response shape.

## Practical 9 Cache

The existing `node-cache` TTL, keys, statistics endpoint, and CRUD invalidation remain unchanged. Successful create invalidates `all_tasks`; successful delete invalidates both `all_tasks` and `task_<id>`. Delete notification data is captured from the document returned by the successful delete operation.

## Test and Evidence Results

Run the listener test with `npm test` and build the frontend with `npm run build`. The Postman collection is `docs/Practical-10-Task-Management.postman_collection.json`; set credentials only in a private Postman environment. The collection saves the returned JWT and created task ID to collection variables.

Evidence status for this Codespaces session:

| Check | Result |
|---|---|
| Event listener unit test | PASS — 1 test; verifies dispatch returns before the two-second delay, completion, deletion logging, and error routing |
| Frontend production build | PASS — `npm run build` |
| Docker Compose config and API/frontend image build | PASS — both images build with `npm ci`; lockfile metadata was synchronized |
| Compose startup and API status | PASS — Mongo healthcheck passes and API `/status` returns HTTP 200 on host port 5001 |
| Invalid JWT | PASS — protected `GET /tasks` returns HTTP 401 |
| Authenticated Mongo-backed registration and task CRUD | BLOCKED — registration returned HTTP 500 after Mongoose server-selection timeout; service DNS resolves, but TCP from API to Mongo port 27017 times out |
| Frontend-to-API proxy | BLOCKED — Nginx returns HTTP 504 while the API container cannot reach Mongo's peer-network service |
| Cache invalidation and MongoDB request-log persistence | Not verified; the database-backed task workflow could not complete |
| `npm run lint` | Existing failures in untouched `src/Todo.jsx` and `src/hooks/useGitHubRepos.js` (3 errors, 1 warning) |
| Postman requests and genuine desktop screenshots | Not captured; Postman/browser/desktop screenshot tools are unavailable in this Codespaces container |

No POST response time or real task notification ordering was measured because Mongo-backed registration failed before a task could be created. When captured manually, store screenshots in `Practical-10-Screenshots/`, redact tokens and credentials, and include response timing, notification completion, deletion, MongoDB, cache, Docker, and final GitHub branch/commit evidence. Label application-only captures accurately.

## Docker

Copy `.env.example` to `.env` and set a private `JWT_SECRET`, then run:

```sh
docker compose up --build
```

The frontend is served at `http://localhost:8080` and proxies API requests to the API container. The API is available at `http://localhost:5000`; MongoDB uses a private Compose network and persistent `mongo-data` volume. In Codespaces with occupied host ports, use `API_PORT=5001 FRONTEND_PORT=8081 docker compose up --build`. Stop services with `docker compose down`; remove the database volume only with `docker compose down -v`. `.env` is excluded from Docker's build context and Git.

## Viva

1. **Why does the API response not wait for notification completion?** The route sends the response after the database operation and schedules `emit()` with `setImmediate` from the response `finish` callback. Notification delay then awaits a timer in the listener.
2. **What if notification logic runs directly in the route before responding?** Awaited delays or slow work hold the route open and increase client latency; CPU-bound synchronous work also blocks the Node.js event loop.
3. **Why is EventEmitter suitable for this lab but not a durable distributed queue?** It is built in and simple for same-process events, but events are process-local, with no persistence, retries, backpressure, or cross-instance delivery guarantees.
4. **Why register a listener for the special `error` event?** Emitting `error` without a listener throws and can terminate the process.
5. **What happens to in-memory events if Node.js crashes?** They are lost; they are not persisted for replay after restart.

## Screenshot Checklist

This environment has no available Postman, browser, or desktop screenshot command. Capture the real Postman login (token obscured), POST response, DELETE response, backend timestamp ordering and completion, deletion event, MongoDB persistence/deletion, cache statistics, Docker build, and GitHub branch/commit manually on the host. Do not represent text logs as screenshots.
