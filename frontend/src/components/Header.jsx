import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <header>
        <Link to="/" onClick={closeMobileMenu}>
        SPLab
        </Link>

        <NavLink to="profile" end onClick={closeMobileMenu}>
        Профиль
        </NavLink>
    </header>
  );
}