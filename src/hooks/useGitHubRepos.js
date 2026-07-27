import { useState, useEffect, useCallback } from 'react'

/**
 * Custom hook to fetch GitHub repositories for a given username.
 * - Excludes forked repositories
 * - Sorts by most recently updated
 * - Handles loading, error, and retry states
 */
export default function useGitHubRepos(username) {
  const [repos, setRepos] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchRepos = useCallback(async () => {
    if (!username.trim()) {
      setRepos([])
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `https://api.github.com/users/${username.trim()}/repos?per_page=100&sort=updated&direction=desc`
      )

      if (!response.ok) {
        if (response.status === 404) {
          setRepos([])
          setError(null)
          setLoading(false)
          return
        }
        throw new Error(`GitHub API error: ${response.status}`)
      }

      const data = await response.json()

      // Filter out forks and sort by recently updated
      const filtered = data
        .filter((repo) => !repo.fork)
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))

      setRepos(filtered)
      setError(null)
    } catch (err) {
      setError(err.message || 'Failed to fetch repositories.')
      setRepos([])
    } finally {
      setLoading(false)
    }
  }, [username])

  useEffect(() => {
    fetchRepos()
  }, [fetchRepos])

  return { repos, loading, error, retry: fetchRepos }
}
