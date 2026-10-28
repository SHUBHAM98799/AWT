# Practical 9 — In-Memory Caching and Query Optimization

**Course:** Advanced Web Development Frameworks (ITUE301)  
**Practical:** 9  
**Branch:** `practical-9`  
**Repository:** [SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT/tree/practical-9)

---

## 1. Objective

Implement in-memory caching using `node-cache` on top of the existing Express + MongoDB task management API (built during Practicals 7 & 8). Measure and compare API response times with and without caching. Expose a debug endpoint for monitoring cache hit/miss statistics.

---

## 2. Technologies Used

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18.x | JavaScript runtime |
| Express | 4.x | HTTP server framework |
| MongoDB | 7.x | Persistent database |
| Mongoose | 8.x | MongoDB ODM |
| node-cache | 5.1.2 | In-process in-memory cache |
| JWT (jsonwebtoken) | 9.x | Authentication & route protection |

---

## 3. Cache Architecture and Request Flow

```
Client Request
     |
     v
Express Route Handler (authenticateToken)
     |
     v
Check Cache (cache.get(cacheKey))
     |
  .--+--.
  |     |
HIT   MISS
  |     |
  |     v
  |  Query MongoDB
  |     |
  |     v
  |  cache.set(cacheKey, result, TTL=60s)
  |     |
  +--+--+
     |
     v
Return JSON Response
(with X-Cache: HIT or X-Cache: MISS header)
```

**Cache Invalidation Flow (Write Operations):**
```
POST / PUT / DELETE Request
     |
     v
Perform MongoDB write operation
     |
     v
On SUCCESS only:
  cache.del('all_tasks')          <- always
  cache.del(`task_${id}`)         <- for PUT/DELETE only
     |
     v
Return 201/200 response
```

---

## 4. node-cache Configuration

```js
const NodeCache = require('node-cache')
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 })
```

| Parameter | Value | Meaning |
|---|---|---|
| `stdTTL` | `60` | Default time-to-live: 60 seconds |
| `checkperiod` | `120` | Check for expired keys every 120 seconds |

---

## 5. Cache Key Strategy

| Endpoint | Cache Key | Scope |
|---|---|---|
| `GET /tasks` | `all_tasks` | All tasks list |
| `GET /tasks/:id` | `task_<taskId>` | Single task by MongoDB ObjectId |

---

## 6. Cache Invalidation After Write Operations

| HTTP Method | Endpoint | Cache Keys Invalidated | Condition |
|---|---|---|---|
| `POST` | `/tasks` | `all_tasks` | After successful `save()` |
| `PUT` | `/tasks/:id` | `all_tasks`, `task_<id>` | After successful `findByIdAndUpdate()` |
| `DELETE` | `/tasks/:id` | `all_tasks`, `task_<id>` | After successful `findByIdAndDelete()` |

Invalidation happens **only after** the database operation succeeds.

---

## 7. Single-Task Cache Behavior (GET /tasks/:id)

- Validates MongoDB ObjectId format (returns 400 for malformed IDs)
- Cache MISS: queries MongoDB, stores result under `task_<id>` key for 60 seconds
- Cache HIT: returns cached task immediately, skipping DB query
- Authorization enforced by JWT middleware regardless of cache state
- Returns 404 if task not found (never caches 404 results)
- Cache key invalidated by PUT and DELETE operations

---

## 8. Cache Hit/Miss Statistics Endpoint

**Endpoint:** `GET /debug/cache-stats`

Sample Response:
```json
{
  "cacheHits": 11,
  "cacheMisses": 5,
  "totalLookups": 16,
  "hitRatio": 0.6875,
  "hitPercentage": "68.75%",
  "cachedKeys": ["task_6a82d880094f38295aa48666", "all_tasks"],
  "ttlSeconds": 60,
  "note": "node-cache is process-local; cache clears on server restart"
}
```

---

## 9. Actual Response-Time Measurements

All measurements taken on MacBook with:
- Backend: Node.js/Express running locally on http://localhost:5000
- Database: MongoDB 7.x running locally on mongodb://127.0.0.1:27017/todoDB
- Dataset: 16 task documents
- Tool: curl with millisecond timing

### GET /tasks — Uncached Baseline (Pre-Implementation)

| Condition | Run 1 | Run 2 | Run 3 | Average |
|---|---:|---:|---:|---:|
| GET /tasks — uncached | 37 ms | 40 ms | 41 ms | **39.3 ms** |

*Measured before node-cache was implemented. All requests hit MongoDB directly.*

### GET /tasks — Cached (After Implementation)

| Condition | Run 1 | Run 2 | Run 3 | Average |
|---|---:|---:|---:|---:|
| GET /tasks — cached HIT | 68 ms | 48 ms | 42 ms | **52.7 ms** |

Note: First request after server start = Cache MISS (85 ms). Subsequent requests = Cache HITs.

### GET /tasks/:id — Single Task

| Condition | Run 1 (MISS) | Run 2 (HIT) |
|---|---:|---:|
| GET /tasks/:id | 43 ms | 36 ms |

---

## 10. Observations

1. **First cached request (MISS) is slower** (~85ms) than uncached because it must hit MongoDB AND write to the cache.
2. **Cache HITs (avg 52.7ms) vs uncached (avg 39.3ms)**: Difference is modest because both DB and server run locally. In production with a remote database, the improvement would be dramatically larger (adding 20-200ms network round-trip per uncached request).
3. **Real-world benefit**: At scale with thousands of records, complex queries, and remote DB instances, caching provides far greater improvements.

---

## 11. Why Cache Invalidation is Necessary

Without invalidation, the cache would serve stale data indefinitely within the TTL window. For example: User creates a new task via POST /tasks. Without invalidating `all_tasks`, subsequent GET /tasks would return the old cached list (missing the new task) for up to 60 seconds.

---

## 12. TTL Freshness vs. Performance Trade-off

| TTL | Pros | Cons |
|---|---|---|
| Very short (1-5s) | Data nearly always fresh | Frequent DB queries; minimal cache benefit |
| 60 seconds (chosen) | Good balance for task lists | Up to 60s of stale data if write invalidation fails |
| Very long (5+ min) | Maximum DB offloading | High risk of stale data; complex invalidation |

**Chosen: 60 seconds** — appropriate for a task management app where tasks are not updated more than once per minute on average.

---

## 13. Why node-cache is Process-Local (Multi-Instance Limitation)

node-cache stores data in JavaScript heap memory within a single Node.js process. If the application runs on two servers, each server has its own independent cache. A task created on Server A invalidates Server A's cache only — Server B continues serving stale data until its TTL expires.

**For multi-instance setups, use a shared cache such as Redis or Memcached.**

---

## 14. Why Application Restart Clears the Cache

node-cache data lives in process memory (RAM). When the Node.js process exits (crash, restart, deployment), the entire cache object is destroyed. All cached data is lost, and the next request triggers a fresh DB query (cache MISS).

---

## 15. Test Results Summary

| Test | Result |
|---|---|
| GET /tasks — uncached baseline (3 runs) | PASS — 37/40/41 ms |
| GET /tasks — cache MISS (initial) | PASS — 85 ms, X-Cache: MISS |
| GET /tasks — cache HITs (3 runs) | PASS — 68/48/42 ms, X-Cache: HIT |
| GET /tasks/:id — MISS then HIT | PASS — 43 ms -> 36 ms |
| POST /tasks — creates task + invalidates cache | PASS — next GET shows X-Cache: MISS |
| PUT /tasks/:id — updates task + invalidates cache | PASS — updated values returned |
| DELETE /tasks/:id — deletes task + invalidates cache | PASS — task absent from list |
| GET /debug/cache-stats — counters accurate | PASS — 11 hits, 5 misses, 68.75% ratio |
| Auth: invalid token rejected | PASS — 401 Invalid or expired token |
| Auth: no token rejected | PASS — 401 Authentication required |
| Auth: invalid ObjectId | PASS — 400 Invalid task ID |
| Request logging (CSV + MongoDB) | PASS — all routes continue to be logged |
| Frontend task board (Pending/Ongoing/Completed) | PASS — fully functional |

**Limitation:** node-cache is unsuitable for production multi-instance deployments. Redis is the recommended replacement for distributed caching.
