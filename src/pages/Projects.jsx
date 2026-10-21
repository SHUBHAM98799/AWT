import { useState, useMemo } from 'react'
import useGitHubRepos from '../hooks/useGitHubRepos'
import RepoCard from '../components/RepoCard'
import Pagination from '../components/Pagination'

const DEFAULT_USERNAME = 'SHUBHAM98799'
const REPOS_PER_PAGE = 6

export default function Projects() {
  // Mode selection state: 'my-repos' or 'search-users'
  const [mode, setMode] = useState('my-repos')

  // Username search state
  const [inputValue, setInputValue] = useState(DEFAULT_USERNAME)
  const [searchedUsername, setSearchedUsername] = useState(DEFAULT_USERNAME)

  // Repo search filter state
  const [repoFilter, setRepoFilter] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch repos via custom hook
  const { repos, loading, error, retry } = useGitHubRepos(searchedUsername)

  // Filter repos by search query (client-side)
  const filteredRepos = useMemo(() => {
    if (!repoFilter.trim()) return repos
    const query = repoFilter.toLowerCase()
    return repos.filter(
      (repo) =>
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query)) ||
        (repo.language && repo.language.toLowerCase().includes(query))
    )
  }, [repos, repoFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredRepos.length / REPOS_PER_PAGE)
  const paginatedRepos = useMemo(() => {
    const start = (currentPage - 1) * REPOS_PER_PAGE
    return filteredRepos.slice(start, start + REPOS_PER_PAGE)
  }, [filteredRepos, currentPage])

  // Handlers
  const handleModeChange = (newMode) => {
    setMode(newMode)
    setRepoFilter('')
    setCurrentPage(1)
    if (newMode === 'my-repos') {
      setSearchedUsername(DEFAULT_USERNAME)
      setInputValue(DEFAULT_USERNAME)
    } else {
      setSearchedUsername('')
      setInputValue('')
    }
  }

  const handleSearch = () => {
    setSearchedUsername(inputValue.trim())
    setRepoFilter('')
    setCurrentPage(1)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch()
  }

  const handleRepoFilterChange = (e) => {
    setRepoFilter(e.target.value)
    setCurrentPage(1) // Reset to page 1 on filter change
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
    // Scroll to top of repo grid
    document.getElementById('repo-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section>
      <h2>// GITHUB REPOSITORIES</h2>
      <p className="about-text" style={{ fontSize: '0.95rem', color: 'var(--muted)' }}>
        Live repository data fetched from the GitHub API. Explore default projects or search other users.
      </p>

      {/* ─── Mode Toggle Buttons ─── */}
      <div className="github-mode-toggles">
        <button
          className={`btn ${mode === 'my-repos' ? 'toggle-active' : 'toggle-inactive'}`}
          onClick={() => handleModeChange('my-repos')}
        >
          My Repositories
        </button>
        <button
          className={`btn ${mode === 'search-users' ? 'toggle-active' : 'toggle-inactive'}`}
          onClick={() => handleModeChange('search-users')}
        >
          Search Other Users
        </button>
      </div>

      {/* ─── Username Search (Only in search-users mode) ─── */}
      {mode === 'search-users' && (
        <div className="github-search-bar">
          <div className="github-search-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
          </div>
          <input
            type="text"
            id="github-search-input"
            name="github-username"
            aria-label="GitHub username to inspect"
            className="form-control github-input"
            placeholder="Enter GitHub username..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button className="btn btn-primary github-search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      )}

      {/* ─── Active User Badge ─── */}
      {searchedUsername && !loading && !error && (
        <div className="github-user-badge">
          <span className="badge-label">Showing repos for</span>
          <span className="badge-username">@{searchedUsername}</span>
          <span className="badge-count">{filteredRepos.length} repositories</span>
        </div>
      )}

      {/* ─── Loading State ─── */}
      {loading && (
        <div className="github-status">
          <div className="loading-spinner" />
          <p>Fetching repositories for <strong>@{searchedUsername}</strong>...</p>
        </div>
      )}

      {/* ─── Error State ─── */}
      {error && (
        <div className="github-status github-error">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={retry}>
            Retry
          </button>
        </div>
      )}

      {/* ─── Results Section ─── */}
      {!loading && !error && (
        <div id="repo-results">
          {/* Repo Filter Search */}
          {repos.length > 0 && (
            <div className="repo-filter-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                id="repo-filter-input"
                name="repo-filter"
                aria-label="Filter repositories by name or language"
                className="form-control repo-filter-input"
                placeholder="Filter repositories..."
                value={repoFilter}
                onChange={handleRepoFilterChange}
              />
            </div>
          )}

          {/* No Repos Found */}
          {filteredRepos.length === 0 && !loading && searchedUsername && (
            <div className="github-status github-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                <line x1="9" y1="14" x2="15" y2="14" />
              </svg>
              <p>No repositories found.</p>
            </div>
          )}

          {/* Prompt to Search (if username is cleared/empty in Search mode) */}
          {mode === 'search-users' && !searchedUsername && !loading && (
            <div className="github-status github-empty">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.4 }}>
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p>Type a GitHub username above to search public repositories.</p>
            </div>
          )}

          {/* Repos Grid */}
          {paginatedRepos.length > 0 && (
            <ul className="projects-grid">
              {paginatedRepos.map((repo) => (
                <RepoCard key={repo.id} repo={repo} />
              ))}
            </ul>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  )
}
