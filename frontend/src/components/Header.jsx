import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

import { ShieldIcon } from './icons.jsx';

export default function Header() {
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
      </div>
    </header>
  );
}
