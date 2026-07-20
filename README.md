# Advanced Web Development Frameworks (ITUE301)

## Practical 1: Introduction to React and Component Architecture

**Student Name:** Shubham Dholakiya  
**College:** CHARUSAT (Charotar University of Science and Technology)  
**Branch:** B.Tech Artificial Intelligence & Machine Learning  
**Semester:** 5th Semester  
**GitHub Repository:** [https://github.com/SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT)

---

### 📝 Description
This application implements a static student profile directory demonstrating basic component structures and props data flow under React 19 and Vite. The design focuses purely on custom element isolation and structural reusability. It is unstyled and performs direct component mounts.

### 🛠️ Technologies Used
- **Core React 19**: Rendering functional components and processing dynamic attributes.
- **Vite 8**: Modern module bundler with Hot Module Replacement (HMR).
- **JSX**: Syntax extension to integrate structural elements inside JavaScript.
- **Props**: Unidirectional data-sharing bindings.

### 📂 Folder Structure
The source directories are organized under standard components and layout layers. All styling has been temporarily disabled. Future views are preserved but remain unimported.

```
src/
├── assets/           # Media parameters and icons
├── components/       # Reusable components
│   ├── Header.jsx    # Accepts "name" and renders student details
│   ├── About.jsx     # Bio context and academic background
│   ├── Skills.jsx    # Accepts "skillList" and maps values in standard bullets
│   ├── Footer.jsx    # Simple unstyled copyright footer
│   ├── Navbar.jsx    # (Unused for Practical 1)
│   └── AITerminal.jsx# (Unused for Practical 1)
├── pages/            # Core layout wrappers (Unused for Practical 1)
│   ├── Home.jsx
│   ├── Projects.jsx
│   ├── Contact.jsx
│   └── NotFound.jsx
├── App.jsx           # Parent layout and props controller
├── main.jsx          # React app mounting root
├── App.css           # Preserved layout styles (Unimported)
└── index.css         # Preserved custom stylesheet (Unimported)
```

---

### 🚀 How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Local Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view the plain text component composition.

3. **Verify Build Compilation**:
   ```bash
   npm run build
   ```

4. **Verify ESLint Rules**:
   ```bash
   npm run lint
   ```

---

### 🎯 Learning Outcomes
- Understood the core concepts of React components and JSX.
- Structured separate components following a modular layout tree.
- Passed static properties (`name` and `skillList`) from the parent layout to children.
- Verified how React isolates rendering responsibilities.
