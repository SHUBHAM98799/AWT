export default function About() {
  const interests = [
    { emoji: '🤖', label: 'AI & LLMs' },
    { emoji: '⚡', label: 'Automation' },
    { emoji: '💻', label: 'Product Building' },
    { emoji: '🚀', label: 'SaaS Startups' },
    { emoji: '🌐', label: 'Open Source' },
    { emoji: '📚', label: 'Continuous Learning' }
  ]

  return (
    <section className="about-section">
      <h2>// SYSTEM SUMMARY</h2>
      
      <div className="about-card">
        <p className="about-text" style={{ marginBottom: '1.25rem' }}>
          Based in <strong>India</strong>, I am a 3rd-year <strong>Artificial Intelligence & Machine Learning</strong> student at 
          <strong> CHARUSAT</strong> (Charotar University of Science and Technology). 
          I operate at the intersection of full-stack engineering, prompt design, and data scraping to build autonomous SaaS applications.
        </p>
        <p className="about-text" style={{ color: 'var(--text-h)', fontWeight: '500' }}>
          &ldquo;My dream is to become a world-class AI Engineer and build intelligent SaaS companies that automate complex workflows at scale.&rdquo;
        </p>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="skills-category-title" style={{ marginBottom: '1rem' }}>Personal Core Parameters</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {interests.map((item, idx) => (
            <div key={idx} className="skill-tag" style={{ border: '1px solid rgba(168, 85, 247, 0.2)', background: 'var(--accent-secondary-light)' }}>
              <span>{item.emoji}</span>
              <span style={{ color: 'var(--text-h)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <h3 className="skills-category-title" style={{ marginBottom: '1rem' }}>Academic Journey</h3>
        <div className="timeline">
          <div className="timeline-item">
            <div className="timeline-dot"></div>
            <div className="timeline-title">B.Tech in Artificial Intelligence & Machine Learning</div>
            <div className="timeline-meta">CHARUSAT University • Semester 5 (3rd Year)</div>
            <p className="about-text" style={{ fontSize: '0.95rem' }}>
              Building deep foundations in neural networks, database engineering, cloud deployment, and advanced web frame architectures.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
