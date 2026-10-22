# Advanced Web Development Frameworks (ITUE301)

[![CI Pipeline](https://github.com/SHUBHAM98799/AWT/actions/workflows/ci.yml/badge.svg?branch=p12)](https://github.com/SHUBHAM98799/AWT/actions/workflows/ci.yml)

Practical 10 adds asynchronous task notifications and Docker support. See [Practical 10 results, tests, and viva notes](docs/practical-10-results.md).
Practical 12 adds a GitHub Actions CI pipeline. See [Practical 12 results and viva notes](docs/practical-12-results.md).
Practical 13 adds an optional Gemini-backed task-description suggestion. See [Practical 13 results and setup](docs/practical-13-results.md).

## Practical 7: Authentication and Middleware Pipeline

**Student Name:** Shubham Dholakiya  
**College:** CHARUSAT (Charotar University of Science and Technology)  
**Branch:** B.Tech Artificial Intelligence & Machine Learning  
**Semester:** 5th Semester  
**GitHub Repository:** [https://github.com/SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT)  
**Current Branch:** `practical-7`

---

### 📝 Description
Practical 7 implements JWT-based user authentication and server-side input validation middleware into the existing Express REST API backend and React frontend.

It adds user registration with password hashing (`bcryptjs`), user login with JSON Web Token (`jsonwebtoken`) generation (1-hour expiry), authentication middleware (`authenticateToken`), input validation middleware (`validateAuthInput` and `validateTaskInput`), protected task routes, and user profile retrieval (`GET /me`).

On the React frontend, it introduces `/register` and `/login` interfaces, auto-attaches JWT `Authorization: Bearer <token>` headers to central API calls in `src/api.js`, handles 401 unauthorized session expiries with automatic token cleanup and login redirects, and provides a Logout action.

---

### 🛠️ Architecture Pipeline
```
REGISTER / LOGIN
React Frontend (localhost:5173)
       │
       │ POST /register or POST /login (JSON body)
       ▼
Express Server (localhost:5000)
       │
       ├─► Validation Middleware (validateAuthInput)
       │
       ├─► bcrypt.hash / bcrypt.compare
       │
       └─► Mongoose ORM ──► MongoDB (users collection)

PROTECTED TASK REQUEST
React Frontend (localhost:5173)
       │
       │ Authorization: Bearer <token>
       ▼
Express Server (localhost:5000)
       │
       ├─► Global Request Logger (saves to CSV & MongoDB)
       │
       ├─► Auth Middleware (authenticateToken & jwt.verify)
       │
       ├─► Validation Middleware (validateTaskInput)
       │
       └─► Task Controller ──► Mongoose ORM ──► MongoDB (tasks collection)
```

---

### 🔌 REST API Endpoints

#### Authentication Endpoints
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/register` | Public | Registers a new user with bcrypt password hashing |
| **POST** | `/login` | Public | Authenticates user credentials & returns JWT token |
| **GET** | `/me` | Protected (JWT) | Returns current authenticated user profile (`_id`, `email`) |

#### Protected Task CRUD Endpoints
| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/tasks` | Protected (JWT) | Retrieves all tasks from MongoDB |
| **POST** | `/tasks` | Protected (JWT) | Creates a task after title validation |
| **PUT** | `/tasks/:id` | Protected (JWT) | Updates a task after ID & title validation |
| **DELETE** | `/tasks/:id` | Protected (JWT) | Deletes a task by MongoDB ObjectId |

---

### 🛡️ Security & Validation Highlights

1. **Password Hashing**: User passwords are never stored in plain text. Stored passwords in MongoDB `users` collection use `bcryptjs` salt rounds (10).
2. **JWT Secret Management**: `JWT_SECRET` is safely read from `.env` on the server and is never committed to GitHub or exposed to the frontend.
3. **Token Verification**: Auth middleware extracts `Authorization: Bearer <token>` and executes `jwt.verify()` inside a `try/catch` block to prevent server crashes on malformed or expired tokens.
4. **Server-Side Validation**: Reject missing or empty task titles and invalid email/password inputs with `400 Bad Request` prior to database execution.
5. **Frontend 401 Interception**: Intercepts `401 Unauthorized` responses, clears invalid client tokens from `localStorage`, displays a session expiry message, and redirects to `/login`.
6. **Logging & CSV Persistence**: All incoming requests (including `/register`, `/login`, `/me`, `/tasks`) are automatically appended to `logs/requests.log.csv` and saved in MongoDB `requestLogs`.

---

### 🚀 Environment & Setup Instructions

#### Step 1: Configure Environment Variables
Create a `.env` file in the project root:
```env
MONGO_URI=mongodb://127.0.0.1:27017/todoDB
JWT_SECRET=your_secure_jwt_secret_key_here
```
*(Note: `.env` is ignored in `.gitignore` and must NOT be committed.)*

#### Step 2: Install Dependencies
```bash
npm install
```

#### Step 3: Start MongoDB
Ensure MongoDB is running locally on port `27017`:
```bash
mongod --dbpath <path-to-db> --port 27017
```

#### Step 4: Start Express Backend
Run the backend server on port `5000`:
```bash
node server.cjs
```

#### Step 5: Start React Frontend
Run the Vite development server on port `5173`:
```bash
npm run dev
```

---

### 📦 Production Build Verification
To compile the frontend production bundle:
```bash
npm run build
```
