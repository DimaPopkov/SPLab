const API_BASE = 'http://localhost:8000/api'; // Ссылка на наш главный API

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include', // Обязательно для отправки HttpOnly cookie
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `Ошибка HTTP: ${response.status}`);
  }

  return response.json();
}

export const api = {
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getRepos: () => request('/scanner/repos'),
  getReport: (reportId) => request(`/scanner/report/${reportId}`),
  getProfileSummary: () => request('/scanner/profile-summary'),
  scanRepo: (repoFullName) =>
    request('/scanner/scan', {
      method: 'POST',
      body: JSON.stringify({ repo_full_name: repoFullName }),
    }),
  loginUrl: `${API_BASE}/auth/github/login`,
};