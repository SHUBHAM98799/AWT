import About from '../components/About'
import Skills from '../components/Skills'
import AITerminal from '../components/AITerminal'

export default function Home({ skills = {} }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      {/* Bio Information Section */}
      <About />

      {/* Interactive Terminal Shell Simulator */}
      <section className="terminal-section">
        <h2>// INTERACTIVE AI CORE SYSTEM</h2>
        <p className="about-text" style={{ fontSize: '0.95rem', marginBottom: '1rem', color: 'var(--muted)' }}>
          Run manual query protocols against the core profile database by inputting directives below.
        </p>
        <AITerminal />
      </section>

      {/* Categorized Skills Section */}
      <Skills skills={skills} />

    </div>
  )
}
