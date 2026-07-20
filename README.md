# Advanced Web Development Frameworks (ITUE301)

## Practical 2: Routing and Interactive Forms

**Student Name:** Shubham Dholakiya  
**College:** CHARUSAT (Charotar University of Science and Technology)  
**Branch:** B.Tech Artificial Intelligence & Machine Learning  
**Semester:** 5th Semester  
**GitHub Repository:** [https://github.com/SHUBHAM98799/AWT](https://github.com/SHUBHAM98799/AWT)  
**Current Branch:** `practical-2`

---

### 📝 Description
This application builds on Practical 1 by adding full client-side routing, interactive forms, and dynamic UI state toggles. The styling incorporates a premium, glassmorphic dark theme, custom background aurora gradients, and interactive mouse cursor glows.

### 🛠️ Key Fulfillments
1. **React Router v6**: Wrapped application root in `BrowserRouter` and configured routes for Home (`/`), Projects (`/projects`), Contact (`/contact`), and Not Found (`*`).
2. **Controlled Form Inputs**: Leveraged controlled component logic (`useState`) on name, email, and message fields in the `Contact` page.
3. **Live Character Metrics**: Tracks real-time input length and logs character feedback strings.
4. **Theme Toggle States**: Custom light/dark theme switch that feeds parameters into the floating `NavBar` component.
5. **Interactive AI Terminal**: Simulated monospaced shell console to process user queries.

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
│   ├── Projects.jsx  # Case-study grids highlighting tech tags
│   ├── Contact.jsx   # Controlled communication form
│   └── NotFound.jsx  # Custom 404 page
├── App.jsx           # Coordinates parent hooks, layout routes, and cursor tracking
├── main.jsx          # Entry point mounting Router context
├── App.css           # Styling parameters
└── index.css         # Customized core design system stylesheet
```

---

### 🚀 How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Launch Developer Server**:
   ```bash
   npm run dev
   ```

3. **Verify Build Compilation**:
   ```bash
   npm run build
   ```

4. **Verify ESLint Rules**:
   ```bash
   npm run lint
   ```
