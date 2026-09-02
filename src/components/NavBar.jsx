import { NavLink } from 'react-router-dom'

export default function NavBar({ onToggleTheme, dark }) {
  return (
    <nav className="nav">
      <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : undefined}>
        Home
      </NavLink>
      <NavLink to="/projects" className={({ isActive }) => isActive ? 'active' : undefined}>
        Projects
      </NavLink>
      <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : undefined}>
        Contact
      </NavLink>
      <NavLink to="/todo" className={({ isActive }) => isActive ? 'active' : undefined}>
        Todo
      </NavLink>
      <NavLink to="/login" className={({ isActive }) => isActive ? 'active' : undefined}>
        Login
      </NavLink>
      <NavLink to="/register" className={({ isActive }) => isActive ? 'active' : undefined}>
        Register
      </NavLink>
      <div style={{ marginLeft: '1rem', borderLeft: '1px solid var(--surface-border)', paddingLeft: '1rem', display: 'flex', alignItems: 'center' }}>
        <button className="btn" onClick={onToggleTheme} aria-label="Toggle Theme">
          {dark ? (
            <>
              {/* Sun icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }}>
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
            </>
          ) : (
            <>
              {/* Moon icon */}
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-secondary)' }}>
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            </>
          )}
        </button>
      </div>
    </nav>
  )
}
