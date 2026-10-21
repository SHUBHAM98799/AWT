import './App.css'
import { useState, useEffect, lazy, Suspense } from 'react'
import Header from './components/Header'
import Footer from './components/Footer'
import NavBar from './components/NavBar'
import Home from './pages/Home'
import { Routes, Route, Navigate } from 'react-router-dom'
import { getToken } from './api'

// Lazy load non-critical routes to shrink initial bundle
const Projects = lazy(() => import('./pages/Projects'))
const Contact = lazy(() => import('./pages/Contact'))
const Todo = lazy(() => import('./Todo'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const NotFound = lazy(() => import('./pages/NotFound'))

// Protected Route Component for Practical 7
function ProtectedRoute({ children }) {
  const token = getToken()
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function PageFallback() {
  return (
    <div style={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="loading-spinner" />
    </div>
  )
}

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

  // Optimized mouse coordinates tracking using requestAnimationFrame throttling
  useEffect(() => {
    // Skip if user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let rafId = null
    const handleMouseMove = (e) => {
      if (rafId) return
      rafId = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`)
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`)
        rafId = null
      })
    }
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (rafId) cancelAnimationFrame(rafId)
    }
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
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<Home name={name} role={role} skills={skills} />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/todo" element={
                <ProtectedRoute>
                  <Todo />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </div>
  )
}

export default App
