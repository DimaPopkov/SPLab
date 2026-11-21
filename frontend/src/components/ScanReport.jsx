import { useState, useEffect } from 'react';

const SEVERITY_PRIORITY = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
};

export function ScanReport({ report }) {
  if (!report) return null;

  const [fileQuery, setFileQuery] = useState('');
  const [selectedFilePath, setSelectedFilePath] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedFilePath(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const { stack = {}, stats = {}, issues = [] } = report;
  const filesList = stats.files_list || [];
  const filteredFiles = filesList.filter((f) =>
    f.path.toLowerCase().includes(fileQuery.toLowerCase())
  );

  const dependencies = stats.dependencies || [];
  const vulnDepsCount = dependencies.filter((d) => d.vulns && d.vulns.length > 0).length;

  const sortedIssues = [...issues].sort(
    (a, b) => (SEVERITY_PRIORITY[a.severity] ?? 99) - (SEVERITY_PRIORITY[b.severity] ?? 99)
  );

  const selectedFileIssues = selectedFilePath
    ? sortedIssues.filter((item) => item.file === selectedFilePath)
    : [];

  const languages = Object.entries(stack.languages || {});
  const frameworks = stack.frameworks || [];

  const criticalCount = sortedIssues.filter((i) => i.severity === 'CRITICAL').length;
  const highCount = sortedIssues.filter((i) => i.severity === 'HIGH').length;
  const mediumCount = sortedIssues.filter((i) => i.severity === 'MEDIUM').length;

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
          <h2 className="card__title">1. Информация</h2>
          {stats.default_branch && (
            <span className="badge">Ветка: {stats.default_branch}</span>
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
          <h2 className="card__title">2. Статистика репозитория и сканирования</h2>
          <span className={`badge ${scoreClass}`}>Индекс безопасности: {score}%</span>
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

      {/* БЛОК 3: Сторонние библиотеки и уязвимости (SCA / CVE) */}
      <section className="card">
        <div className="card__header">
          <h2 className="card__title">3. Зависимости и уязвимости библиотек</h2>
          <div className="severity-summary">
            {vulnDepsCount > 0 && (
              <span className="badge badge--critical">Уязвимых: {vulnDepsCount}</span>
            )}
            <span className="badge">Библиотек: {dependencies.length}</span>
          </div>
        </div>

        <div className="card__body">
          {dependencies.length === 0 ? (
            <p className="text-muted-sm">
              Файлы зависимостей (requirements.txt, package.json) в репозитории не обнаружены.
            </p>
          ) : (
            <div className="scanned-files-list">
              {dependencies.map((dep, idx) => {
                const hasVulns = dep.vulns && dep.vulns.length > 0;
                return (
                  <div
                    key={idx}
                    className="scanned-file-row"
                    style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{dep.name}</strong>
                        <span className="badge">{dep.version ? `v${dep.version}` : 'версия не указана'}</span>
                        <span className="badge">{dep.ecosystem}</span>
                      </div>

                      <div className="scanned-file-row__meta">
                        <span className="scanned-file-row__lines">{dep.source}</span>
                        {hasVulns ? (
                          <span className="badge badge--critical">CVE: {dep.vulns.length}</span>
                        ) : (
                          <span className="badge score-good">OK</span>
                        )}
                      </div>
                    </div>

                    {hasVulns && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px', borderLeft: '2px solid var(--danger)' }}>
                        {dep.vulns.map((v, vIdx) => (
                          <div key={vIdx} style={{ fontSize: '12px' }}>
                            <strong style={{ color: 'var(--danger)' }}>{v.id}:</strong>{' '}
                            <span style={{ color: 'var(--text-muted)' }}>{v.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* БЛОК 4: Аудит уязвимостей */}
      <section className="card">
        <div className="card__header">
          <div className="card__header-left">
            <h2 className="card__title">4. Уязвимости и аудит безопасности</h2>
          </div>
          <div className="severity-summary">
            {criticalCount > 0 && <span className="badge badge--critical">Критический: {criticalCount}</span>}
            {highCount > 0 && <span className="badge badge--high">Высокий: {highCount}</span>}
            {mediumCount > 0 && <span className="badge badge--medium">Средний: {mediumCount}</span>}
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
              {sortedIssues.map((item, idx) => (
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

      {/* БЛОК 5: Список проверенных файлов */}
      {filesList.length > 0 && (
        <section className="card">
          <div className="card__header">
            <h2 className="card__title">5. Проверенные файлы</h2>
            <span className="badge">Всего: {filesList.length}</span>
          </div>
          <div className="card__body">
            <input
              type="text"
              className="select"
              placeholder="Фильтр по пути файла (например: settings.py или components/)..."
              value={fileQuery}
              onChange={(e) => setFileQuery(e.target.value)}
              style={{ width: '100%', marginBottom: '12px' }}
            />

            <div className="scanned-files-list">
              {filteredFiles.map((f, idx) => {
                const hasIssues = f.issues > 0;
                return (
                  <div
                    key={idx}
                    className={`scanned-file-row ${hasIssues ? 'scanned-file-row--clickable' : ''}`}
                    onClick={() => hasIssues && setSelectedFilePath(f.path)}
                    title={hasIssues ? 'Нажмите, чтобы посмотреть найденные проблемы в файле' : undefined}
                  >
                    <span className="scanned-file-row__path">{f.path}</span>
                    <div className="scanned-file-row__meta">
                      <span className="scanned-file-row__lines">{f.lines} строк</span>
                      {hasIssues ? (
                        <span className="badge badge--critical">проблем: {f.issues}</span>
                      ) : (
                        <span className="badge score-good">OK</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Модальное окно с уязвимостями выбранного файла */}
      {selectedFilePath && (
        <div className="modal-backdrop" onClick={() => setSelectedFilePath(null)}>
          <div className="modal-window card" onClick={(e) => e.stopPropagation()}>
            <div className="card__header">
              <div className="card__header-left">
                <h3 className="card__title" style={{ textTransform: 'none' }}>
                  {selectedFilePath}
                </h3>
                <span className="badge badge--critical">
                  проблем: {selectedFileIssues.length}
                </span>
              </div>
              <button
                type="button"
                className="btn btn--secondary btn--m"
                onClick={() => setSelectedFilePath(null)}
              >
                Закрыть
              </button>
            </div>

            <div className="card__body modal-window__body">
              <div className="issue-list">
                {selectedFileIssues.map((item, idx) => (
                  <div key={idx} className="issue-item">
                    <div className="issue-item__top">
                      <span className={`badge badge--${item.severity.toLowerCase()}`}>
                        {item.severity}
                      </span>
                      <strong>{item.rule}</strong>
                    </div>
                    <div className="issue-item__path">Строка {item.line}</div>
                    <code className="issue-item__code">{item.snippet}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}