export default function Skills({ skills = {} }) {
  const categories = Object.keys(skills)

  const formatCategory = (name) => {
    if (name === 'ai') return 'Artificial Intelligence & Agentic Workflows'
    if (name === 'frontend') return 'Frontend Engineering'
    if (name === 'backend') return 'Backend & Service Layers'
    if (name === 'database') return 'Databases & Vector Storage'
    return 'Infrastructure & Tooling'
  }

  return (
    <section className="skills-section">
      <h2>// TECHNICAL SPECIFICATIONS</h2>
      
      <div className="skills-container">
        {categories.map((cat) => (
          <div key={cat} className="skills-category">
            <h3 className="skills-category-title">{formatCategory(cat)}</h3>
            <ul className="skills-grid">
              {skills[cat].map((s, i) => (
                <li key={i} className="skill-tag">
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent)', marginRight: '4px' }}></span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
}
