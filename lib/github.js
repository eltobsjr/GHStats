const BASE = 'https://api.github.com'

function buildHeaders() {
  return {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(process.env.GITHUB_TOKEN && { 'Authorization': `Bearer ${process.env.GITHUB_TOKEN}` }),
  }
}

async function rest(path) {
  const res = await fetch(`${BASE}${path}`, { headers: buildHeaders() })
  if (!res.ok) {
    const err = new Error(`GitHub API ${res.status}`)
    err.status = res.status
    throw err
  }
  return res.json()
}

async function graphql(query, variables = {}) {
  if (!process.env.GITHUB_TOKEN) return null
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    const err = new Error(`GraphQL ${res.status}`)
    err.status = res.status
    throw err
  }
  const json = await res.json()
  if (json.errors) throw new Error(json.errors[0].message)
  return json.data
}

function createClient() {
  return {
    async getUser(username) {
      return rest(`/users/${username}`)
    },

    async getRepos(username) {
      let page = 1, repos = []
      while (true) {
        const batch = await rest(`/users/${username}/repos?per_page=100&page=${page}&type=owner`)
        repos = repos.concat(batch)
        if (batch.length < 100) break
        page++
      }
      return repos
    },

    async getRepoLanguages(username, repo) {
      return rest(`/repos/${username}/${repo}/languages`)
    },

    async getRepoCommits(username, repo, page = 1) {
      return rest(`/repos/${username}/${repo}/commits?author=${username}&per_page=100&page=${page}`)
    },

    async getContributionsCalendar(username) {
      const data = await graphql(`
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              contributionCalendar {
                totalContributions
                weeks { contributionDays { date contributionCount } }
              }
            }
          }
        }`, { login: username })
      return data?.user?.contributionsCollection?.contributionCalendar ?? null
    },

    async getCommitContributionsByRepo(username) {
      const data = await graphql(`
        query($login: String!) {
          user(login: $login) {
            contributionsCollection {
              commitContributionsByRepository {
                contributions(first: 100) {
                  nodes { occurredAt commitCount }
                }
              }
            }
          }
        }`, { login: username })
      return data?.user?.contributionsCollection?.commitContributionsByRepository ?? null
    },

    async getContributionHeatmapHtml(username) {
      const res = await fetch(`https://github.com/users/${username}/contributions`)
      if (!res.ok) {
        const err = new Error(`Heatmap fetch ${res.status}`)
        err.status = res.status
        throw err
      }
      return res.text()
    },
  }
}

module.exports = { createClient }
