# Practical 10: Asynchronous Processing with Event-Driven Architecture

**Branch:** `practical-10`  
**Repository:** [SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT/tree/practical-10)

## Objective

Use Node.js's built-in `EventEmitter` to process task notifications independently of the HTTP request, while retaining the existing Express, Mongoose, JWT authentication, and Practical 9 cache behavior.

## Event flow

The server loads the shared emitter and listeners before opening its HTTP listener. `POST /tasks` validates the authenticated request, saves the task, invalidates the task-list cache, and sends `201 Created`. Its response `finish` callback then emits `task-created`. The listener logs receipt, handler start, and completion timestamps with an approximately two-second simulated delay. The delay is not in the route handler.

`DELETE /tasks/:id` likewise emits `task-deleted` after its response finishes. Event payloads contain only the task ID, title, and authenticated user ID; they never include credentials or JWTs. Asynchronous listener errors are forwarded to the registered `error` listener.

## Verification

Run the event tests with:

```sh
npm test
```

The automated test verifies that event emission returns immediately, creation completion follows the simulated delay, deletion has its own notification, and listener failures are safely logged. Run `npm run lint` and `npm run build` for project checks.

To observe the behavior manually, create a task through the authenticated frontend or `POST /tasks`. The API logs the save and `201` response timestamps first; the event logs then show the notification receipt, handler start, and completion about two seconds later.

### Results captured in the development container

| Check | Result |
|---|---|
| `npm test` | PASS — asynchronous creation, deletion notification, and handled listener error |
| `npm run build` | PASS — production frontend bundle generated |
| Docker Compose config and API/frontend image builds | PASS |
| Container `/status` and frontend HTTP responses | PASS |
| `npm run lint` | Existing failures in `src/Todo.jsx` and `src/hooks/useGitHubRepos.js`; neither file is changed by Practical 10 |
| Authenticated API-to-MongoDB CRUD in this dev container | BLOCKED — Mongo is healthy locally, but the container bridge times out for API-to-Mongo TCP connections |

The API/Mongo integration should be rerun in an environment where Docker bridge networking permits service-to-service TCP connections.

## Docker

Copy `.env.example` to `.env` and set a private `JWT_SECRET`. Then start the complete stack:

```sh
docker compose up --build
```

Open the frontend at `http://localhost:8080`; the API is available at `http://localhost:5000`. MongoDB data persists in the `mongo-data` volume. Do not commit `.env` or any real credentials.

To stop the services while preserving MongoDB data, run `docker compose down`. To remove the database volume as well, run `docker compose down -v`.
