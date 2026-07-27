import './App.css'
import { useState, useEffect } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import Projects from './pages/Projects'
import Contact from './pages/Contact'
import Todo from './Todo'
import NotFound from './pages/NotFound'
import { Routes, Route } from 'react-router-dom'

function App() {
  const [dark, setDark] = useState(true)
  const name = 'Shubham Dholakiya'
  const role = 'Future AI Engineer'
  const themeColor = dark ? 'rgba(6, 182, 212, 0.06)' : 'rgba(2, 132, 199, 0.05)'

  const skills = {
    frontend: ['React', 'Vite', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS', 'Responsive Design', 'Component Architecture'],
    backend: ['Python', 'FastAPI', 'REST APIs', 'Authentication'],
    database: ['PostgreSQL', 'Prisma ORM', 'Vector Database (Qdrant)'],
    ai: ['OpenAI API', 'Prompt Engineering', 'RAG', 'Embeddings', 'LLMs', 'Website Scraping', 'Automation'],
    tools: ['Git', 'GitHub', 'AWS EC2', 'Vercel']
  }

  // Track mouse coordinates for interactive glow effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <div className={dark ? 'theme-dark' : 'theme-light'}>
      {/* Background visual components */}
      <div className="aurora-bg">
        <div className="grid-overlay"></div>
        <div className="aurora-orb orb-1"></div>
        <div className="aurora-orb orb-2"></div>
      </div>
      <div className="cursor-glow"></div>

      <div className="app-root">
        <Header name={name} role={role} themeColor={themeColor} />
        <NavBar onToggleTheme={() => setDark(d => !d)} dark={dark} />

        <main>
          <Routes>
            <Route path="/" element={<Home name={name} role={role} skills={skills} />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/todo" element={<Todo />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
