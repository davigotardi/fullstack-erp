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

  return (
    <div className="crud-page">
      <div className="page-heading">
        <div>
          <h1>Usuários</h1>
          <p className="page-subtitle">Gerencie os acessos à plataforma.</p>
        </div>
      </div>
      <form onSubmit={salvar} className="form-card">
        <label>Nome
          <input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></label>
        <label>Email
          <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
        <label>Senha
          <input type="password" required value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} /></label>
        <label>Perfil
          <select value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
            <option value="vendedor">Vendedor</option><option value="admin">Admin</option>
          </select></label>
        <button type="submit" className="primary-button">Adicionar</button>
      </form>
      {erro && <p className="error-message">{erro}</p>}
      <div className="table-card">
        <table className="users-table">
          <thead><tr><th>Nome</th><th>Email</th><th>Perfil</th><th>Status</th></tr></thead>
          <tbody>
            {usuarios.map(u => (
              <tr key={u.id}>
                <td>{u.nome}</td><td>{u.email}</td>
                <td>{u.perfil}</td><td><span className={`status-badge ${u.ativo ? 'status-delivered' : 'status-cancelled'}`}>{u.ativo ? 'Ativo' : 'Inativo'}</span></td>
              </tr>
            ))}
            {!usuarios.length && <tr><td className="empty-table" colSpan="4">Nenhum usuário cadastrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
