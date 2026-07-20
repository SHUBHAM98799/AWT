// import './App.css'
import Header from './components/Header'
import About from './components/About'
import Skills from './components/Skills'
import Footer from './components/Footer'

function App() {
  const name = 'Shubham Dholakiya'
  const skillList = [
    'React',
    'Vite',
    'JavaScript',
    'HTML',
    'CSS',
    'Tailwind CSS',
    'Responsive Design',
    'Component Architecture',
    'Python',
    'FastAPI',
    'REST APIs',
    'PostgreSQL',
    'Prisma ORM',
    'Vector Database (Qdrant)',
    'OpenAI API',
    'Prompt Engineering',
    'RAG',
    'Embeddings',
    'LLMs',
    'Website Scraping',
    'Automation',
    'Git',
    'GitHub',
    'AWS EC2',
    'Vercel'
  ]

  return (
    <div>
      <Header name={name} />
      <About />
      <Skills skillList={skillList} />
      <Footer />
    </div>
  )
}

export default App
