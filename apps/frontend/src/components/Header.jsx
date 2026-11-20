import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import { ShieldIcon } from './icons.jsx';
import { api } from '../api/client.js';

export function Header({ user, onLogout }) {
  const [buttonText, setButtonText] = useState('Проверить сервер');
  const [isLoading, setIsLoading] = useState(false);

  const checkServer = async () => {
    setIsLoading(true);
    setButtonText('Запрос...');

    try {
      const data = await api.ping();
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

        <div className="site-header__actions">
          <button
            onClick={checkServer}
            className="btn btn--secondary btn--m"
            disabled={isLoading}
          >
            {buttonText}
          </button>

          {user && (
            <>
              <span className="site-header__user">@{user.username}</span>
              <button onClick={onLogout} className="btn btn--secondary btn--m">
                Выйти
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
