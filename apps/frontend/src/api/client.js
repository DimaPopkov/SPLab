const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
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
  ping: () => request('/ping'),
  getMe: () => request('/auth/me'),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getRepos: () => request('/scanner/repos'),
  scanRepo: (repoFullName) =>
    request('/scanner/scan', {
      method: 'POST',
      body: JSON.stringify({ repo_full_name: repoFullName }),
    }),
  getReport: (reportId) => request(`/scanner/reports/${reportId}`),

  // Запускает сканирование через RabbitMQ и ждёт завершения воркером
  async scanRepoAndWait(repoFullName, onStatusChange) {
    let report = await this.scanRepo(repoFullName);
    if (onStatusChange) onStatusChange(report);

    while (report.status === 'pending' || report.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      report = await this.getReport(report.id);
      if (onStatusChange) onStatusChange(report);
    }

    if (report.status === 'failed') {
      throw new Error('Ошибка во время сканирования репозитория в воркере');
    }

    return report;
  },

  loginUrl: `${API_BASE}/auth/github/login`,
};
