import { Link } from 'react-router-dom';

import { GitHubIcon } from '../icons.jsx';

// Пример отчёта — только для показа на главной, настоящих данных здесь нет.
const REPORT_LINES = [
  { status: 'ok', label: 'Успешно', text: 'Стек определён: Java / Spring Boot, JavaScript / React' },
  { status: 'ok', label: 'Успешно', text: 'Прочитаны README.md, pom.xml и package.json' },
  { status: 'ok', label: 'Успешно', text: 'Подобраны шаблоны проверки: spring-boot, react' },
  { status: 'warn', label: 'Предупреждение', text: 'Библиотеки с уязвимостями: 2' },
  { status: 'err', label: 'Ошибка', text: 'Подозрительные библиотеки: 1' },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__text">
          <h1 className="hero__title">
            Находим уязвимые и вредоносные библиотеки в вашем проекте
          </h1>
          <p className="hero__lead">
            Подключите репозиторий через GitHub: мы определим стек, прочитаем настройки
            и проверим зависимости по шаблонам для вашего языка и фреймворка.
          </p>
          <div className="hero__actions">
            <Link to="/profile" className="btn btn--primary btn--lg">
              <GitHubIcon size={18} />
              Подключить GitHub
            </Link>
            <a href="#how" className="btn btn--secondary btn--lg">
              Как это работает
            </a>
          </div>
        </div>

        <figure className="report" aria-label="Пример отчёта о проверке">
          <figcaption className="report__bar">Пример отчёта о проверке</figcaption>
          <div className="report__body">
            <p className="report__project">example/web-shop</p>
            <ul className="report__list">
              {REPORT_LINES.map((line) => (
                <li className="report__item" key={line.text}>
                  <span className={`report__dot report__dot--${line.status}`} aria-hidden="true" />
                  <span>
                    <span className="sr-only">{line.label}: </span>
                    {line.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </figure>
      </div>
    </section>
  );
}
