import { useState, useEffect } from 'react'

const WORDS = ['Future AI Engineer', 'Full Stack Developer', 'AI/ML Specialist', 'SaaS Product Builder']

export default function Header({ name, themeColor }) {
  const [index, setIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)
  const [reverse, setReverse] = useState(false)

  // Typing effect logic
  useEffect(() => {
    if (subIndex === WORDS[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 1500)
      return () => clearTimeout(timeout)
    }

    if (subIndex === 0 && reverse) {
      const timeout = setTimeout(() => {
        setReverse(false)
        setIndex((prev) => (prev + 1) % WORDS.length)
      }, 50)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1))
    }, reverse ? 30 : 80)

    return () => clearTimeout(timeout)
  }, [subIndex, reverse, index])

  // Derive text directly on render to prevent redundant state sync effects
  const text = WORDS[index].substring(0, subIndex)

  return (
    <header className="site-header" style={{ backgroundColor: themeColor }}>
      <div className="header-content">
        <h1 className="site-title">{name}</h1>
        <div className="site-subtitle">
          <span>&gt; {text}</span>
          <span className="typing-cursor"></span>
        </div>
      </div>
    </header>
  )
}
