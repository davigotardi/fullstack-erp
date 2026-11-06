import { NavLink, Outlet, useNavigate } from 'react-router-dom';

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/clientes', label: 'Clientes' },
  { to: '/fornecedores', label: 'Fornecedores' },
  { to: '/produtos', label: 'Estoque / Produtos' },
  { to: '/pedidos', label: 'Pedidos' },
];

export default function Layout() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
  const isAdmin = user.perfil === 'admin';

  const logout = () => {
    localStorage.clear();
    nav('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: 220, background: '#1e293b', color: '#fff', padding: '1rem',
        display: 'flex', flexDirection: 'column', gap: '0.25rem', flexShrink: 0,
      }}>
        <h2 style={{ margin: '0 0 1rem' }}>ERP</h2>
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            style={({ isActive }) => ({
              color: '#cbd5e1', textDecoration: 'none', padding: '0.5rem 0.75rem',
              borderRadius: 6, background: isActive ? '#334155' : 'transparent',
            })}>{l.label}</NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/usuarios"
            style={({ isActive }) => ({
              color: '#cbd5e1', textDecoration: 'none', padding: '0.5rem 0.75rem',
              borderRadius: 6, background: isActive ? '#334155' : 'transparent',
            })}>Usuários</NavLink>
        )}
        <div style={{ marginTop: 'auto', fontSize: '0.85rem', color: '#94a3b8' }}>
          <div>{user.nome}</div>
          <button onClick={logout}
            style={{ marginTop: 8, background: 'none', border: '1px solid #475569', color: '#fff', padding: '0.3rem 0.7rem', borderRadius: 6, cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </aside>
      <main style={{ flex: 1, padding: '1.5rem', background: '#f1f5f9', overflow: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
