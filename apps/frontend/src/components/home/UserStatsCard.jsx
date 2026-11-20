import nullAvatar from '../../assets/null_avatar.png';

import { GitHubIcon } from '../icons.jsx';

// Макет: позже эти данные будут приходить с бэкенда.
const STATS = [
  { id: 'projects', label: 'Проверено проектов', value: 12 },
  { id: 'libs', label: 'Проверено библиотек', value: 148 },
  { id: 'vulns', label: 'Найдено уязвимостей', value: 7 },
  { id: 'suspicious', label: 'Подозрительных пакетов', value: 1 },
];

const RISKS = [
  { id: 'critical', label: 'Критические', count: 1 },
  { id: 'high', label: 'Высокие', count: 2 },
  { id: 'medium', label: 'Средние', count: 3 },
  { id: 'low', label: 'Низкие', count: 1 },
];

export default function UserStatsCard() {
  const totalRisks = RISKS.reduce((sum, risk) => sum + risk.count, 0);
  const riskSummary = RISKS.map((risk) => `${risk.label}: ${risk.count}`).join(', ');

  return (
    <section className="card user-card" aria-labelledby="user-card-name">
      <img
        className="user-card__avatar"
        src={nullAvatar}
        alt="Аватар пользователя"
        width="112"
        height="112"
      />
      <h2 className="user-card__name" id="user-card-name">
        NICKNAME
      </h2>
      <p className="user-card__hint">Данные появятся после входа через GitHub</p>

      <button type="button" className="btn btn--primary btn--block">
        <GitHubIcon size={16} />
        Войти через GitHub
      </button>

      <div className="user-card__section">
        <h3 className="user-card__section-title">Ваша статистика</h3>
        <dl className="stats">
          {STATS.map((stat) => (
            <div className="stats__item" key={stat.id}>
              <dt className="stats__label">{stat.label}</dt>
              <dd className="stats__value">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="user-card__section">
        <h3 className="user-card__section-title">Найденные риски</h3>
        <div className="risk-bar" role="img" aria-label={riskSummary}>
          {RISKS.map((risk) => (
            <span
              key={risk.id}
              className={`risk-bar__seg risk-bar__seg--${risk.id}`}
              style={{ width: `${(risk.count / totalRisks) * 100}%` }}
            />
          ))}
        </div>
        <ul className="risk-legend">
          {RISKS.map((risk) => (
            <li key={risk.id}>
              <span className={`risk-legend__swatch risk-bar__seg--${risk.id}`} aria-hidden="true" />
              {risk.label}
              <span className="risk-legend__count">{risk.count}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="user-card__note">Это макет: цифры показаны для примера.</p>
    </section>
  );
}
