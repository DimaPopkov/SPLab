import { FRAMEWORK_MODEL } from '../../data/frameworkModel.js';

const LAYER_LABELS = {
  frontend: 'Фронтенд',
  backend: 'Бэкенд',
};

function CodeList({ items }) {
  return (
    <ul className="chips chips--code">
      {items.map((item) => (
        <li key={item}>
          <code>{item}</code>
        </li>
      ))}
    </ul>
  );
}

export default function FrameworkTable() {
  return (
    <section className="card" aria-labelledby="model-title">
      <header className="card__header">
        <h2 className="card__title" id="model-title">
          Что мы ищем для каждого стека
        </h2>
      </header>

      <p className="card__lead">
        Таблица «язык — фреймворк» с параметрами поиска. Именно на неё опираются все три шага.
      </p>

      <div className="table-wrap">
        <table className="model-table">
          <thead>
            <tr>
              <th scope="col">Язык</th>
              <th scope="col">Фреймворк</th>
              <th scope="col">Слой</th>
              <th scope="col">Расширения</th>
              <th scope="col">Манифесты</th>
              <th scope="col">Файлы настроек</th>
            </tr>
          </thead>
          <tbody>
            {FRAMEWORK_MODEL.map((row) => (
              <tr key={row.id}>
                <td>{row.language}</td>
                <td>{row.framework}</td>
                <td>
                  <span className={`badge badge--${row.layer}`}>{LAYER_LABELS[row.layer]}</span>
                </td>
                <td>
                  <CodeList items={row.extensions} />
                </td>
                <td>
                  <CodeList items={row.manifests} />
                </td>
                <td>
                  <CodeList items={row.configFiles} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
