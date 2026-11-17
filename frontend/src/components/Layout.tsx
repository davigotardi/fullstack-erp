import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { AppUser } from '../types';

const links: { to: string; label: string; icon: string; end?: boolean }[] = [
  { to: '/', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/clientes', label: 'Clientes', icon: '♙' },
  { to: '/fornecedores', label: 'Fornecedores', icon: '◈' },
  { to: '/produtos', label: 'Estoque / Produtos', icon: '▦' },
  { to: '/pedidos', label: 'Pedidos', icon: '▤' },
];

export default function Layout() {
  const nav = useNavigate();
  const storedUser = localStorage.getItem('erp_user');
  const user: Partial<AppUser> = storedUser ? JSON.parse(storedUser) as AppUser : {};
  const isAdmin = user.perfil === 'admin';
  const initials = user.nome?.split(/\s+/).slice(0, 2).map(name => name[0]).join('') || 'U';

  const logout = () => {
    localStorage.clear();
    nav('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">E</div>
          <div>
            <div className="brand-name">ERP Central</div>
            <div className="brand-caption">GESTÃO EMPRESARIAL</div>
          </div>
        </div>
        <div className="nav-caption">Menu principal</div>
        <nav className="side-nav" aria-label="Navegação principal">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/usuarios" className={({ isActive }) => `side-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">♧</span>
              Usuários
            </NavLink>
          )}
        </nav>
        <div className="sidebar-footer">
          <div className="user-summary">
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{user.nome}</div>
              <div className="user-role">{isAdmin ? 'Administrador' : 'Vendedor'}</div>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>Sair da conta</button>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">ERP Central <span aria-hidden="true">/</span> Painel de gestão</div>
          <div className="topbar-note"><span className="status-dot" /> Sistema operacional</div>
        </header>
        <div className="page-content"><Outlet /></div>
      </main>
    </div>
  );
}
