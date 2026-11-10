import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const today = new Date();

const links = [
  { to: '/', label: 'Dashboard', icon: '▦', end: true },
  { to: '/clientes', label: 'Clientes', icon: '♙' },
  { to: '/fornecedores', label: 'Fornecedores', icon: '⌂' },
  { to: '/produtos', label: 'Estoque / Produtos', icon: '▤' },
  { to: '/pedidos', label: 'Pedidos', icon: '▧' },
];

export default function Layout() {
  const nav = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
  const isAdmin = user.perfil === 'admin';
  const currentPage = links.find(link => link.end ? location.pathname === link.to : location.pathname.startsWith(link.to));
  const initials = (user.nome || 'Usuário')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('');

  const logout = () => {
    localStorage.clear();
    nav('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/" aria-label="ERP - início">
          <span className="brand-mark">E</span>
          <span className="brand-copy">
            <strong>evolve</strong>
            <span>gestão inteligente</span>
          </span>
        </Link>

        <div className="nav-caption">Workspace</div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          {links.map(link => (
            <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/usuarios" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">♧</span>
              Usuários
            </NavLink>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="profile-card">
            <span className="avatar">{initials}</span>
            <div className="profile-details">
              <strong>{user.nome || 'Usuário'}</strong>
              <span>{user.perfil || 'Conta'}</span>
            </div>
          </div>
          <button className="logout-button" onClick={logout}>↪ &nbsp; Sair da conta</button>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">Workspace <span aria-hidden="true">/</span> <strong>{currentPage?.label || (location.pathname.startsWith('/pedidos/') ? 'Pedidos' : 'Usuários')}</strong></div>
          <div className="topbar-date">{today.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
