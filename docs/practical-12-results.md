# Practical 12: CI/CD Pipeline with GitHub Actions

## Objective

Run automated API tests and a production frontend build in GitHub Actions on pushes to `main` or `p12`, and on pull requests targeting `main`. The `p12` push trigger allows the practical branch to run the same checks without pushing changes to `main`.

## Workflow

The workflow is [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), named **CI Pipeline**. It runs on `ubuntu-latest`, sets up Node.js 24, installs packages with `npm install`, runs `npm test`, and runs `npm run build`. A failing test or build fails the workflow.

The project uses Node's built-in `node:test` test runner, so no additional test dependencies or live MongoDB service are needed. The HTTP tests start the exported Express app on an ephemeral local port and verify:

- `GET /status` returns the health response.
- `POST /register` rejects a blank email with HTTP 400 before database access.
- `GET /tasks` rejects an unauthenticated request with HTTP 401.

When `server.cjs` is run directly, it retains its normal MongoDB connection and server startup. Importing it from tests exports the same Express app without opening a database connection or listening on the production port.

## Verification status

| Check | Result |
|---|---|
| Local automated tests | PASS — 4 tests, 0 failures (3 HTTP endpoint tests and the existing event-notification test) |
| Local production frontend build | PASS — `vite build` completed |
| Initial valid pipeline commit | `b7f08a0` — tests and build passed locally; push to `origin/p12` was blocked because Git could not obtain a password |
| GitHub Actions initial passing run | Not verified — the branch was not pushed, so no Actions run was created |
| Deliberately failed run | Not performed — the required initial green GitHub Actions run was not confirmed |
| Final GitHub Actions run | Not verified — no remote run could be started or inspected |

Remote run links and screenshots are therefore not available. The workflow badge in the repository README points to the actual `CI Pipeline` workflow; its status must be read from GitHub and is not asserted by this document. The deliberately incorrect assertion has not been committed, so the branch's tests remain passing.

Once GitHub authentication and push access are available, first push the valid pipeline and confirm the `p12` run is green. Only then perform the temporary incorrect-assertion demonstration, verify its red run and assertion log, restore the assertion, and verify a final green run. Do not consider the practical evidence complete until those actual runs are available.

## Screenshot evidence

No screenshots were captured in this Codespaces session: it has no authenticated GitHub UI or screenshot-capable browser, and no Actions runs could be created or verified. See [`practical-12-screenshots/README.md`](practical-12-screenshots/README.md) for the requested filenames and Mac capture instructions. Do not use locally generated images as GitHub Actions evidence.

## Viva answers

1. **What is the difference between Continuous Integration and Continuous Deployment?** Continuous Integration frequently integrates code and automatically runs checks such as tests and builds. Continuous Deployment automatically releases changes to a production environment after the required checks pass.
2. **What does this practical demonstrate?** It demonstrates using GitHub Actions to install project dependencies, run real HTTP/API tests, and build the production frontend on branch pushes and pull requests.
3. **Why do automated tests on push catch problems earlier?** They run close to the change, provide repeatable feedback before later integration or release, and identify regressions while the responsible change is still easy to find.
4. **How does an incorrect test-file path differ from a genuine failed assertion?** A bad path prevents the intended test from being discovered or loaded. A genuine assertion failure means the test ran and reported that observed application behavior did not match its expected value.
5. **What does a failed GitHub Actions check tell the developer?** At least one configured job or step returned a failure, so the change did not satisfy that workflow's checks. The developer should inspect the failed step's logs to identify whether tests, installation, or the build failed.
