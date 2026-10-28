# Practical 13: AI API Integration into a Web Application

## Objective

Offer an authenticated user an optional Gemini-generated task description. The suggestion stays editable in the existing task form; it is saved only if the user submits the task. The Pending, Ongoing, and Completed board and task CRUD routes remain available if Gemini is unavailable.

## Request flow and API

The task form sends only the entered title to `POST /api/ai/generate-description` on the Express backend. The endpoint uses the authenticated user's JWT, validates and trims the title (maximum 200 characters), applies the per-user/title rate limit, and makes a timed server-to-server request to Gemini. The API key is read only from the backend's `GEMINI_API_KEY` environment variable and sent in the provider request header. It is never sent to React or the browser.

Success response:

```json
{
  "description": "Create and verify a secure backup of the database.",
  "fallback": false
}
```

When the provider is unavailable, the endpoint returns HTTP 503 with an empty description and an explanatory message. Invalid input returns HTTP 400; a repeated title by the same user within one minute returns HTTP 429 and `Retry-After`. Authentication is required. Provider messages and details are not returned to clients.

The provider request has a 10-second timeout. Missing/invalid keys, quota/rate-limit responses, network errors, timeouts, and empty or malformed provider responses all produce the same safe 503 fallback. This endpoint does not fabricate a suggestion. The frontend keeps the title and existing manual description, shows a friendly status, and allows manual task creation.

## Setup

Set a Gemini API key locally in the ignored project `.env` file, using `.env.example` as a placeholder template:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Do not put provider keys in `VITE_*` variables, frontend code, Postman exports, screenshots, or committed files. Restart the Express server after changing `.env`. The feature remains optional; with no configured key, generation returns the fallback and manual task entry continues to work.

Import [`Practical-13-AI-Task-Management.postman_collection.json`](Practical-13-AI-Task-Management.postman_collection.json) into Postman. Configure login credentials only in a private Postman environment. The AI success request is expected to pass only when a valid Gemini key and provider access are configured. Do not store that key in collection variables.

## UI, saved data, and compatibility

The task form has title and editable description fields, a disabled-while-running **Generate Description** button, clear success/fallback feedback, and the disclaimer: **“AI-generated content may be inaccurate. Review and edit before saving.”** A suggestion is not automatically saved. Users can also edit descriptions on existing tasks.

Task descriptions are optional and default to an empty string. Existing documents without a description continue to load; the board displays a description only when one exists. Create and update endpoints accept descriptions up to 2000 characters. Title and status behavior, caching, authentication, EventEmitter notifications, request logging, and MongoDB persistence are retained.

## Rate limiting

The in-memory limiter allows one generation attempt per authenticated user and normalized task title per minute. It stores a SHA-256 context key rather than the title and bounds storage to 500 entries, expiring old entries and evicting the oldest if full. It is per-process, resets when the server restarts, and is not a distributed or production-grade limiter; production deployments with multiple instances should use a shared rate-limit store.

## Responsible AI, privacy, and governance

Only the task title is sent to Gemini. Do not include passwords, tokens, personal or sensitive information, confidential records, or other data the provider does not need. Review the provider's data handling, retention, and applicable organizational policies before production use. A generated description can be inaccurate or unsuitable; the user must review and edit it before saving.

## Verification results

Tests use Node's built-in `node:test` runner and mocked provider functions; they make no paid provider calls and do not prove a live Gemini integration. Automated coverage verifies authentication, missing/blank/oversized title validation, a structured mocked success, provider failure fallback without leaking error details, missing-key handling, network/malformed response handling, per-user/title rate limiting, malformed JSON handling, and existing health/auth checks. The Practical 12 health test's incorrect expected status from the parent branch is corrected on `p13` to its actual HTTP 200.

Run:

```sh
npm test
npm run build
```

| Check | Result |
|---|---|
| Local `p13` implementation commit | `2977d8f` — `Practical 13 - AI API Integration` |
| Push and remote GitHub verification | Blocked — `git push -u origin p13` could not obtain a password; no remote run or branch is claimed |
| Mocked AI and API tests | 14 tests, 0 failures |
| Live Gemini API request | Not performed with a real credential |
| Frontend production build | Passed with `vite build` |
| Manual Postman/UI verification | Requires local `.env`, running MongoDB, and authenticated test account |
| Screenshots and remote push | See [`practical-13-screenshots/README.md`](practical-13-screenshots/README.md); only genuine captures are reported |

## Viva questions

1. **Why should the AI key remain on the backend?** Backend-only storage prevents the key from being embedded in a public browser bundle or exposed in browser network calls and allows centralized access controls.
2. **Why send only the task title?** Minimizing transmitted data reduces privacy exposure and avoids disclosing sensitive information the AI does not need to draft a description.
3. **What happens if Gemini is unavailable?** The endpoint returns a safe fallback response; the UI retains the user's input and allows manual description entry and normal task creation.
4. **Is an AI-generated description saved automatically?** No. The user can edit or reject it and must explicitly submit the task form to save it.
5. **What are the limits of the rate limiter?** It limits repeated requests per process and title, but resets on restart and is not shared between server instances.
