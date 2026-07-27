/**
 * RepoCard — displays a single GitHub repository in the portfolio theme.
 * Shows: name, description, language, stars, forks, last updated, open link.
 */
export default function RepoCard({ repo }) {
  const updatedDate = new Date(repo.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <li className="project-card repo-card">
      {/* Repo Name */}
      <h3 className="project-title repo-name">{repo.name}</h3>

      {/* Description */}
      <p className="project-desc repo-desc">
        {repo.description || 'No description provided.'}
      </p>

      {/* Meta Stats Row */}
      <div className="repo-meta">
        {repo.language && (
          <span className="repo-stat">
            <span className="repo-lang-dot" />
            {repo.language}
          </span>
        )}
        <span className="repo-stat">
          {/* Star icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {repo.stargazers_count}
        </span>
        <span className="repo-stat">
          {/* Fork icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="18" r="3" />
            <circle cx="6" cy="6" r="3" />
            <circle cx="18" cy="6" r="3" />
            <path d="M18 9v2c0 .6-.4 1-1 1H7c-.6 0-1-.4-1-1V9" />
            <path d="M12 12v3" />
          </svg>
          {repo.forks_count}
        </span>
        <span className="repo-stat repo-stat-date">
          {/* Calendar icon */}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
          {updatedDate}
        </span>
      </div>

      {/* Open Repository Link */}
      <a
        href={repo.html_url}
        target="_blank"
        rel="noopener noreferrer"
        className="btn btn-open-repo"
      >
        Open Repository
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
          <polyline points="15 3 21 3 21 9" />
          <line x1="10" y1="14" x2="21" y2="3" />
        </svg>
      </a>
    </li>
  )
}
