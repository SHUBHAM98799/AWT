# Advanced Web Development Frameworks (ITUE301)

## Practical 6: Full Stack Integration (React + Express + MongoDB)

**Student Name:** Shubham Dholakiya  
**College:** CHARUSAT (Charotar University of Science and Technology)  
**Branch:** B.Tech Artificial Intelligence & Machine Learning  
**Semester:** 5th Semester  
**GitHub Repository:** [https://github.com/SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT)  
**Current Branch:** `practical-6`

---

### 📝 Description
Practical 6 wires the React frontend with the Express + Mongoose + MongoDB backend into a complete working full-stack application.

The Task/Todo page connects directly to the local MongoDB database via the Express REST API backend, providing real-time data persistence. The frontend includes modern UX improvements such as Optimistic UI updates, toast notifications, loading indicators, and delete confirmation dialogs.

---

### 🛠️ Architecture Flow
```
React Frontend (localhost:5173)
       |
       | fetch API Calls (via central api.js)
       v
Express Backend (localhost:5000)
       |
       | Mongoose ORM
       v
MongoDB Database (localhost:27017)
```

---

### 📂 Folder Structure
The components are modularly organized:
```
src/
├── assets/           # Media parameters and icons
├── components/       # Reusable components
│   ├── Header.jsx    # Accepts "name" and "themeColor" and renders dynamic typing subtitles
│   ├── NavBar.jsx    # Sticky navigation dock supporting routing highlights and theme switches
│   ├── About.jsx     # Timelines and student profile parameters
│   ├── Skills.jsx    # Categorized skill badges
│   ├── AITerminal.jsx# Terminal simulator accepting terminal command directives
│   └── Footer.jsx    # Premium copyright and social links footer
├── pages/            # Core layout wrappers mapped to routes
│   ├── Home.jsx      # Home layout composing About, AITerminal, and Skills
│   ├── Projects.jsx  # Repository explorer fetching from Github API (Practical 3)
│   ├── Contact.jsx   # Controlled communication form
│   └── NotFound.jsx  # Custom 404 page
├── api.js            # [NEW] Central API utility wrapper for backend tasks
├── Task.jsx          # Original task wrapper (kept intact)
├── Todo.jsx          # Full Stack Todo component (optimistic updates, toasts, loading/error states)
├── App.jsx           # Coordinates parent hooks, layout routes, and cursor tracking
├── main.jsx          # Entry point mounting Router context
├── App.css           # Styling parameters (including Toast styles)
└── index.css         # Customized core design system stylesheet
```

---

### 🔌 REST API Endpoints
The Express backend (`server.cjs`) exposes the following endpoints:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/tasks` | Retrieves all tasks from the MongoDB database |
| **POST** | `/tasks` | Creates a new task in the database |
| **PUT** | `/tasks/:id` | Updates a task's title by its MongoDB ObjectId |
| **DELETE** | `/tasks/:id` | Deletes a task by its MongoDB ObjectId |

---

### ⚡ UX Fulfillments

1. **Central API File (`src/api.js`)**: All fetch operations are central and point to a single base backend URL (`http://localhost:5000`).
2. **Optimistic UI (Create)**: When adding a task, the UI updates instantly with a temporary task block. If the API request succeeds, it syncs with the database response; if it fails, it rolls back the changes and restores the text input so data is not lost.
3. **Delete Confirmation Dialog**: Prompts the user before deleting a task to prevent accidental deletions.
4. **Toast Notification System**: Shows dynamic success and error popups upon creating, updating, or deleting tasks.
5. **Operation Guarding**: Inputs and buttons are disabled during active API requests to avoid duplicate submissions.

---

### 🚀 How to Run

#### Step 1: Start MongoDB
Ensure MongoDB is running locally on port `27017`:
```bash
mongod --config /opt/homebrew/etc/mongod.conf
```

#### Step 2: Start Express Backend
Run the backend server on port `5000`:
```bash
node server.cjs
```

#### Step 3: Start React Frontend
In a separate terminal session, run the Vite development server on port `5173`:
```bash
npm run dev
```

---

### 📦 Production Build
To build the React application for production and ensure no compilation errors:
```bash
npm run build
```
