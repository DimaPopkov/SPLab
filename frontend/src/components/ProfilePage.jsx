import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { ScanReport } from './ScanReport';

export function ProfilePage({ user }) {
  const [history, setHistory] = useState([]);
  const [popularRepos, setPopularRepos] = useState([]);
  const [activeReport, setActiveReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    api
      .getProfileSummary()
      .then((data) => {
        setHistory(data.history || []);
        setPopularRepos(data.popular_repos || []);
        if (data.history?.length > 0) {
          setActiveReport(data.history);
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="container scanner-workspace">
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Профиль недоступен</h2>
          </div>
          <div className="card__body">
            <p className="text-muted-sm" style={{ marginBottom: '14px' }}>
              Войдите через GitHub, чтобы просматривать историю аудитов и статистику.
            </p>
            <a href={api.loginUrl} className="btn btn--primary">
              Подключить GitHub
            </a>
          </div>
        </section>
      </div>
    );
  }

  const totalScans = history.length;
  const totalIssues = history.reduce((acc, r) => acc + (r.issues_count || 0), 0);
  const avgScore =
    totalScans > 0
      ? Math.round(
          history.reduce((acc, r) => acc + (r.stats?.security_score ?? 100), 0) / totalScans
        )
      : 100;

  return (
    <div className="container scanner-workspace">
      {/* 1. Шапка профиля и сводная телеметрия */}
      <section className="card">
        <div className="card__header">
          <div className="card__header-left">
            {user.avatar_url && (
              <img
                src={user.avatar_url}
                alt={user.username}
                style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border)' }}
              />
            )}
            <h2 className="card__title">Профиль // @{user.username}</h2>
          </div>
          <Link to="/" className="btn btn--primary btn--m">
            + Новый аудит
          </Link>
        </div>
        <div className="card__body">
          <div className="metrics-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="metric-box">
              <span className="metric-box__val">{totalScans}</span>
              <span className="metric-box__lbl">Всего проверок</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">{totalIssues}</span>
              <span className="metric-box__lbl">Выявлено уязвимостей</span>
            </div>
            <div className="metric-box">
              <span className={`metric-box__val ${avgScore >= 80 ? 'score-good' : 'score-warn'}`}>
                {avgScore}%
              </span>
              <span className="metric-box__lbl">Средний Security Score</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Популярные и активные проекты на GitHub */}
      {popularRepos.length > 0 && (
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">Популярные проекты GitHub</h2>
          </div>
          <div className="card__body">
            <div className="repos-grid">
              {popularRepos.map((repo) => (
                <div key={repo.id} className="repo-mini-card">
                  <div className="repo-mini-card__top">
                    <strong className="repo-mini-card__name">{repo.full_name}</strong>
                    <span className="badge">★ {repo.stars}</span>
                  </div>
                  <p className="repo-mini-card__desc">{repo.description}</p>
                  <div className="repo-mini-card__footer">
                    <span className="badge">{repo.language}</span>
                    <button
                      type="button"
                      className="btn btn--secondary btn--m"
                      onClick={() => navigate(`/?repo=${encodeURIComponent(repo.full_name)}`)}
                    >
                      Проверить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. История последних отчётов */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">Последние отчёты</h2>
          <span className="badge">{history.length}</span>
        </div>
        <div className="card__body">
          {loading ? (
            <p className="text-muted-sm">Загрузка истории...</p>
          ) : history.length === 0 ? (
            <p className="text-muted-sm">Вы ещё не запускали проверки репозиториев.</p>
          ) : (
            <div className="scanned-files-list">
              {history.map((item) => {
                const isSelected = activeReport?.id === item.id;
                const score = item.stats?.security_score ?? 100;
                return (
                  <div
                    key={item.id}
                    className="scanned-file-row"
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--surface-elevated)' : undefined,
                    }}
                    onClick={() => setActiveReport(item)}
                  >
                    <div>
                      <strong className="scanned-file-row__path">{item.repo_full_name}</strong>
                      <div className="scanned-file-row__lines">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                      </div>
                    </div>
                    <div className="scanned-file-row__meta">
                      <span className={`badge ${score >= 80 ? 'score-good' : 'score-warn'}`}>
                        Score: {score}%
                      </span>
                      <span className={`badge ${item.issues_count > 0 ? 'badge--critical' : ''}`}>
                        Проблем: {item.issues_count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Детальный просмотр выбранного отчёта */}
      {activeReport && <ScanReport report={activeReport} />}
    </div>
  );
}