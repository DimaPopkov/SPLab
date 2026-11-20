export function ScanReport({ report }) {
  if (!report) return null;

  const isPending = report.status === 'pending' || report.status === 'processing';
  const isFailed = report.status === 'failed';

  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Отчёт: {report.repo_full_name}</h2>
        {isPending && <span className="badge">В очереди ({report.status})...</span>}
        {isFailed && <span className="badge badge--critical">Ошибка сканирования</span>}
        {report.status === 'completed' && (
          <span className="badge">Проблем: {report.issues.length}</span>
        )}
      </div>

      <div className="card__body">
        {isPending && (
          <p>Задача отправлена в RabbitMQ. Воркер сканирует файлы репозитория...</p>
        )}

        {isFailed && (
          <p className="scan-error">Не удалось завершить сканирование. Проверьте доступ к репозиторию.</p>
        )}

        {report.status === 'completed' && (
          report.issues.length === 0 ? (
            <p className="scan-clean">Уязвимостей по базовым правилам не обнаружено.</p>
          ) : (
            <div className="issue-list">
              {report.issues.map((item, idx) => (
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
          )
        )}
      </div>
    </section>
  );
}
