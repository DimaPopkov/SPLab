import { Outlet } from 'react-router-dom';

import Header from './Header.jsx';

import '../styles/layout.css';

// Общий каркас всех страниц: шапка, содержимое текущего маршрута, подвал.
export default function Base() {
  return (
    <>
      <Header />

      <main id="content">
        <Outlet />
      </main>

      <footer className="site-footer">© {new Date().getFullYear()} SPLab</footer>
    </>
  );
}
