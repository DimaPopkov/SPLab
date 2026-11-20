import { BookIcon } from '../icons.jsx';

// Текст «О нас» — заглушка, замените на свой.
export default function AboutCard() {
  return (
    <section className="card" aria-labelledby="about-title">
      <header className="card__header">
        <BookIcon size={16} />
        <h2 className="card__title" id="about-title">
          О нас
        </h2>
      </header>

      <div className="card__body prose">
        <p>
          SPLab помогает найти в проекте библиотеки с уязвимостями и вредоносным кодом,
          пока они не попали в релиз.
        </p>
        <p>
          Вы подключаете репозиторий через GitHub, а мы сами определяем, на чём он написан,
          и проверяем зависимости и настройки по шаблонам именно для вашего стека. Никаких
          ручных списков и скриптов.
        </p>
        <p>Что мы проверяем:</p>
        <ul>
          <li>
            зависимости из манифестов: <code>package.json</code>, <code>pom.xml</code>,{' '}
            <code>requirements.txt</code> и других;
          </li>
          <li>файлы конфигураций и настроек проекта;</li>
          <li>известные уязвимости и подозрительные пакеты.</li>
        </ul>
      </div>
    </section>
  );
}
