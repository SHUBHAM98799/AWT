export default function Projects() {
  const projects = [
    {
      id: 1,
      title: 'Veldora AI',
      subtitle: 'Autonomous AI SaaS Platform',
      desc: 'An AI SaaS engine allowing businesses to register their URL, automatically scrape site contents, run prompt embeddings, store vectors in Qdrant, and serve a RAG chatbot trained purely on their private database.',
      tech: ['React', 'Next.js', 'FastAPI', 'PostgreSQL', 'Prisma', 'Qdrant', 'OpenAI API', 'AWS EC2', 'Vercel'],
      features: ['Website Scraper & Trainer', 'Qdrant Vector Database Integration', 'Intelligent RAG Chatbot Support', 'Secure Multi-Tenant Auth Dashboard']
    },
    {
      id: 2,
      title: 'AI Surprise Experience',
      subtitle: 'Disney-Inspired Cinematic Web Story',
      desc: 'An interactive Disney-inspired AI web experience constructed as a personalized storytelling platform utilizing immersive sound cues, cinematic layout, dynamic scripts, and creative custom widgets.',
      tech: ['React', 'Vite', 'HTML5 Audio', 'CSS Animation', 'OpenAI API', 'JSON Store'],
      features: ['Personalized AI Narrative Generators', 'Dynamic Audio Cue Synchronizations', 'Cinematic Glassmorphic UI Panels', 'Creative Interactive Prompts']
    },
    {
      id: 3,
      title: 'Instagram Giveaway System',
      subtitle: 'Algorithmic CSV Entry Randomizer',
      desc: 'A transparent developer tool built to parse followers database spreadsheet records (CSV), check entry credentials, filter duplicates, and run random selection draws with styled CSS transitions.',
      tech: ['React', 'Vite', 'CSV Parser', 'Web Storage', 'CSS Grid'],
      features: ['Fast Large-Dataset CSV Imports', 'Custom Rule Entry Filtering', 'Interactive Animated Selecting Screen', 'Failsafe Verification Logs']
    }
  ]

  return (
    <section>
      <h2>// PORTFOLIO PROJECTS</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
        A compilation of functional prototypes, SaaS layouts, and core algorithms demonstrating AI model integrations.
      </p>

      <ul className="projects-grid">
        {projects.map((p) => (
          <li key={p.id} className="project-card">
            <div>
              <span className="skills-category-title" style={{ fontSize: '0.75rem' }}>{p.subtitle}</span>
              <h3 className="project-title" style={{ marginTop: '0.25rem' }}>{p.title}</h3>
            </div>
            
            <p className="project-desc">{p.desc}</p>
            
            <div style={{ margin: '0.5rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-h)', fontWeight: 'bold', fontFamily: 'var(--font-mono)' }}>[ SYSTEM_FEATURES ]</span>
              <ul className="project-features">
                {p.features.map((f, idx) => (
                  <li key={idx}>{f}</li>
                ))}
              </ul>
            </div>

            <div className="project-tech">
              {p.tech.map((t, idx) => (
                <span key={idx} className="tech-pill">{t}</span>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
