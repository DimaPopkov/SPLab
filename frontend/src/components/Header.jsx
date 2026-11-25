import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import { ShieldIcon } from './icons.jsx';

export function Header({ user, onLogout }) {
  const [buttonText, setButtonText] = useState('Проверить сервер');
  const [isLoading, setIsLoading] = useState(false);

  const checkServer = async () => {
    setIsLoading(true);
    setButtonText('Запрос...');

    try {
      const response = await fetch('https://splab.onrender.com/api/ping');

      if (!response.ok) {
        throw new Error(`Ошибка HTTP: ${response.status}`);
      }

      const data = await response.json();
      setButtonText(data.message || data.status || 'Сервер ответил!');
    } catch (error) {
      console.error('Ошибка при запросе к серверу:', error);
      setButtonText('Ошибка подключения');
    } finally {
      setIsLoading(false);
    }
  };

  const [isMenuOpen, setIsMenuOpen] = useState(false);

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

        <nav
          id="main-nav"
          className={`site-header__nav${isMenuOpen ? ' is-open' : ''}`}
        >
          {/* <NavLink to="/" end onClick={closeMenu}>
            Главная
          </NavLink>
          <NavLink to="/profile" onClick={closeMenu}>
            Профиль
          </NavLink> */}
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
              {user && (
                <div className="site-header__actions">
                  <Link to="/profile" className="site-header__user" title="Открыть профиль и историю отчётов">
                    @{user.username}
                  </Link>
                  <button type="button" onClick={onLogout} className="btn btn--m">
                    Выйти
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}