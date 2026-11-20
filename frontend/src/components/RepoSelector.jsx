export function RepoSelector({ repos, selectedRepo, onSelect, onScan, scanning }) {
  return (
    <section className="card">
      <div className="card__header">
        <h2 className="card__title">Выбор репозитория для аудита</h2>
      </div>
      <div className="card__body">
        <div className="form-row">
          <select
            value={selectedRepo}
            onChange={(e) => onSelect(e.target.value)}
            className="select"
            disabled={scanning || repos.length === 0}
          >
            {repos.length === 0 && <option>Репозитории не найдены</option>}
            {repos.map((r) => (
              <option key={r.id} value={r.full_name}>
                {r.full_name} {r.private ? '(Private)' : ''}
              </option>
            ))}
          </select>
          <button
            onClick={onScan}
            disabled={scanning || !selectedRepo}
            className="btn btn--primary"
          >
            {scanning ? 'Сканирование...' : 'Запустить проверку'}
          </button>
        </div>
      </div>
    </section>
  );
}