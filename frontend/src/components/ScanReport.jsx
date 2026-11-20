export function ScanReport({ report }) {
  if (!report) return null;

  const { stack = {}, stats = {}, issues = [] } = report;
  const languages = Object.entries(stack.languages || {});
  const frameworks = stack.frameworks || [];

  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = issues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = issues.filter((i) => i.severity === 'MEDIUM').length;

  const score = stats.security_score ?? 100;
  const scoreClass = score >= 80 ? 'score-good' : score >= 50 ? 'score-warn' : 'score-bad';

  const LANG_COLORS = {
    Python: '#3572A5',
    JavaScript: '#f1e05a',
    TypeScript: '#3178c6',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Dockerfile: '#384d54',
    Shell: '#89e051',
  }; 

  const FALLBACK_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#a371f7', '#f78166'];

  function getLangColor(lang, index) {
    return LANG_COLORS[lang] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
  }

  return (
    <div className="report-dashboard">
      {/* БЛОК 1: Стек проекта */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">1. Стек проекта</h2>
          {stats.default_branch && (
            <span className="badge">ветка: {stats.default_branch}</span>
          )}
        </div>
        <div className="card__body">
          {languages.length > 0 && (
            <div className="stack-block">
                <div className="stack-label">Языки репозитория</div>
                <div className="lang-bar">
                {languages.map(([lang, pct], idx) => (
                    <div
                    key={lang}
                    className="lang-bar__segment"
                    style={{
                        width: `${Math.max(pct, 4)}%`,
                        backgroundColor: getLangColor(lang, idx),
                    }}
                    title={`${lang}: ${pct}%`}
                    />
                ))}
                </div>
                <div className="lang-legend">
                {languages.map(([lang, pct], idx) => (
                    <span key={lang} className="lang-item">
                    <span
                        className="lang-dot"
                        style={{ backgroundColor: getLangColor(lang, idx) }}
                    />
                    <strong>{lang}</strong> {pct}%
                    </span>
                ))}
                </div>
            </div>
         )}

          <div className="stack-block" style={{ marginTop: languages.length ? '18px' : 0 }}>
            <div className="stack-label">Обнаруженные технологии и инструменты</div>
            {frameworks.length > 0 ? (
              <ul className="chips">
                {frameworks.map((fw) => (
                  <li key={fw}>{fw}</li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-sm">Специфичные фреймворки не определены</p>
            )}
          </div>
        </div>
      </section>

      {/* БЛОК 2: Статистика проекта */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">2. Статистика репозитория</h2>
          <span className={`badge ${scoreClass}`}>Security Score: {score}%</span>
        </div>
        <div className="card__body">
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-box__val">{stats.commits ?? '—'}</span>
              <span className="metric-box__lbl">Коммитов</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">
                {stats.total_lines ? stats.total_lines.toLocaleString() : '—'}
              </span>
              <span className="metric-box__lbl">Проверено строк</span>
            </div>
            <div className="metric-box">
              <span className="metric-box__val">
                {stats.scanned_files ?? 0} / {stats.target_files ?? stats.total_files ?? 0}
            </span>
              <span className="metric-box__lbl">Файлов просканировано</span>
            </div>
            <div className="metric-box">
              <span className={`metric-box__val ${scoreClass}`}>{score}%</span>
              <span className="metric-box__lbl">Индекс защиты</span>
            </div>
          </div>
        </div>
      </section>

      {/* БЛОК 3: Аудит уязвимостей */}
      <section className="card">
        <div className="card__header">
          <div className="card__header-left">
            <h2 className="card__title">3. Аудит безопасности</h2>
          </div>
          <div className="severity-summary">
            {criticalCount > 0 && <span className="badge badge--critical">Critical: {criticalCount}</span>}
            {highCount > 0 && <span className="badge badge--high">High: {highCount}</span>}
            {mediumCount > 0 && <span className="badge badge--medium">Medium: {mediumCount}</span>}
            <span className="badge">Всего: {issues.length}</span>
          </div>
        </div>

        <div className="card__body">
          {issues.length === 0 ? (
            <div className="scan-clean-box">
              <span className="dot-green" />
              <span>Уязвимостей и утечек секретов не обнаружено. Код чист!</span>
            </div>
          ) : (
            <div className="issue-list">
              {issues.map((item, idx) => (
                <div key={idx} className="issue-item">
                  <div className="issue-item__top">
                    <span className={`badge badge--${item.severity.toLowerCase()}`}>
                      {item.severity}
                    </span>
                    <strong>{item.rule}</strong>
                  </div>
                  <div className="issue-item__path">
                    {item.file} : строка {item.line}
                  </div>
                  <code className="issue-item__code">{item.snippet}</code>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}