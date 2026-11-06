import { useEffect, useState } from 'react';
import api from '../api';

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nome: '', email: '', senha: '', perfil: 'vendedor' });
  const [erro, setErro] = useState('');

  const carregar = () => api.get('/auth/usuarios').then(r => setUsuarios(r.data));
  useEffect(() => { carregar(); }, []);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      await api.post('/auth/usuarios', form);
      setForm({ nome: '', email: '', senha: '', perfil: 'vendedor' });
      carregar();
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao criar usuário'); }
  };

  const input = { padding: '0.4rem', borderRadius: 6, border: '1px solid #cbd5e1' };
  const th = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };

  return (
    <div>
      <h1>Usuários</h1>
      <form onSubmit={salvar} style={{
        display: 'flex', gap: '0.5rem', alignItems: 'flex-end', flexWrap: 'wrap',
        background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem',
      }}>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>Nome
          <input style={input} required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>Email
          <input style={input} type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>Senha
          <input style={input} type="password" required value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>Perfil
          <select style={input} value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
            <option value="vendedor">Vendedor</option><option value="admin">Admin</option>
          </select></label>
        <button type="submit" style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Adicionar</button>
      </form>
      {erro && <p style={{ color: '#dc2626' }}>{erro}</p>}
      <table style={{ width: '100%', maxWidth: 700, borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead><tr><th style={th}>Nome</th><th style={th}>Email</th><th style={th}>Perfil</th><th style={th}>Status</th></tr></thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td style={td}>{u.nome}</td><td style={td}>{u.email}</td>
              <td style={td}>{u.perfil}</td><td style={td}>{u.ativo ? 'Ativo' : 'Inativo'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
