import { useState, useRef, useEffect } from 'react'

export default function AITerminal() {
  const [history, setHistory] = useState([
    { text: 'Initialising AI core interface...', type: 'muted' },
    { text: 'System diagnostics... ONLINE', type: 'success' },
    { text: 'Welcome to Shubham\'s command line. Type /help to list active systems.', type: 'white' }
  ])
  const [inputVal, setInputVal] = useState('')
  const terminalBodyRef = useRef(null)

  // Scroll terminal body to bottom on output updates
  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight
    }
  }, [history])

  const handleCommand = (cmdText) => {
    const cleanCmd = cmdText.trim().toLowerCase()
    if (!cleanCmd) return

    const newHistory = [...history, { text: `shubham@core:~$ ${cmdText}`, type: 'cyan' }]

    switch (cleanCmd) {
      case '/help':
        newHistory.push({
          text: 'Available Commands:\n  /about    - Core academic & background information\n  /skills   - Categorized developer specifications\n  /projects - Active AI SaaS & product builds\n  /dream    - Mission statement\n  /clear    - Purge terminal records',
          type: 'white'
        })
        break
      case '/about':
        newHistory.push({
          text: 'NAME: Shubham Dholakiya\nROLE: AI/ML Student & Future AI Engineer\nINSTITUTION: CHARUSAT University, India\nYEAR: 3rd Year (Semester 5)\nDEPT: B.Tech Artificial Intelligence & Machine Learning',
          type: 'white'
        })
        break
      case '/skills':
        newHistory.push({
          text: 'AI ENGIN: OpenAI API, Prompt Design, RAG pipelines, Vector databases (Qdrant), Scraping\nBACKEND:  Python, FastAPI, REST, PostgreSQL, Prisma ORM\nFRONTEND: React, Vite, CSS Modules, Responsive architecture\nDEV-OPS:  Git, GitHub, AWS EC2, Vercel deployments',
          type: 'white'
        })
        break
      case '/projects':
        newHistory.push({
          text: '1. VELDORA AI: Website training scrape engine, Qdrant vector database storage, autonomous RAG chatbot.\n2. DISNEY-AI STORIES: Narrative interactive cinematic UI storytelling platform.\n3. INSTA GIVEAWAY: Automated follower database analyzer & verification selector.',
          type: 'white'
        })
        break
      case '/dream':
        newHistory.push({
          text: 'MISSION OBJECTIVE:\n"To become a world-class AI Engineer, build autonomous SaaS engines, and automate business architectures at global scale."',
          type: 'purple'
        })
        break
      case '/clear':
        setHistory([])
        setInputVal('')
        return
      default:
        newHistory.push({
          text: `Command not recognized: "${cmdText}". Type /help to see valid targets.`,
          type: 'muted'
        })
    }

    setHistory(newHistory)
    setInputVal('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleCommand(inputVal)
  }

  return (
    <div className="terminal-window">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="terminal-dot dot-red"></span>
          <span className="terminal-dot dot-yellow"></span>
          <span className="terminal-dot dot-green"></span>
        </div>
        <div className="terminal-title">core@shubham-ai-stack:~</div>
        <div style={{ width: '40px' }}></div>
      </div>
      
      <div className="terminal-body" ref={terminalBodyRef}>
        {history.map((line, idx) => (
          <div 
            key={idx} 
            className={`terminal-line ${
              line.type === 'muted' ? 'terminal-text-muted' : 
              line.type === 'success' ? 'terminal-text-green' : 
              line.type === 'purple' ? 'terminal-text-purple' :
              line.type === 'cyan' ? 'terminal-text-cyan' :
              'terminal-text-white'
            }`}
            style={{ whiteSpace: 'pre-wrap', marginBottom: '0.4rem' }}
          >
            {line.text}
          </div>
        ))}

        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="terminal-prompt">shubham@core:~$</span>
          <input 
            type="text" 
            className="terminal-input-el" 
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type /help or click below..."
            autoComplete="off"
            spellCheck="false"
          />
        </form>
      </div>

      <div style={{ padding: '0.75rem 1rem', background: '#090f1e', borderTop: '1px solid rgba(255,255,255,0.03)' }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>Quick Directives:</div>
        <div className="terminal-quick-links">
          <button className="terminal-btn" onClick={() => handleCommand('/about')}>/about</button>
          <button className="terminal-btn" onClick={() => handleCommand('/skills')}>/skills</button>
          <button className="terminal-btn" onClick={() => handleCommand('/projects')}>/projects</button>
          <button className="terminal-btn" onClick={() => handleCommand('/dream')}>/dream</button>
          <button className="terminal-btn" onClick={() => handleCommand('/clear')}>/clear</button>
        </div>
      </div>
    </div>
  )
}
