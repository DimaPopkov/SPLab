import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import { ShieldIcon } from './icons.jsx';

export default function Header() {
  const [buttonText, setButtonText] = useState('Проверить сервер');
  const [isLoading, setIsLoading] = useState(false);

  const checkServer = async () => {
    setIsLoading(true);
    setButtonText('Запрос...');

    try {
      // Укажите ваш эндпоинт: /api/ping или /api/health
      const response = await fetch('http://127.0.0.1:8000/api/ping');
      
      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      // Выводим в кнопку поле message или status из JSON-ответа FastAPI
      setButtonText(data.message || data.status || 'Сервер ответил!');
    } catch (error) {
      console.error('Ошибка при запросе к серверу:', error);
      setButtonText('Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link to="/" className="site-header__logo" onClick={closeMenu}>
          <span className="site-header__mark">
            <ShieldIcon size={20} />
          </span>
          SPLab
        </Link>

        <button
          type="button"
          className="site-header__burger"
          aria-label="Открыть меню"
          aria-expanded={isMenuOpen}
          aria-controls="main-nav"
          onClick={toggleMenu}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id="main-nav"
          className={`site-header__nav${isMenuOpen ? ' is-open' : ''}`}
        >
          <NavLink to="/" end onClick={closeMenu}>
            Главная
          </NavLink>
          <NavLink to="/profile" onClick={closeMenu}>
            Профиль
          </NavLink>
        </nav>

        <button onClick={checkServer} className="btn btn--secondary btn--m" disabled={isLoading}>
          {buttonText}
        </button>
      </div>
    </header>
  );
}
