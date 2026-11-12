import { useEffect, useState } from 'react';
import api from '../api';

const formPadrao = { nome: '', email: '', senha: '', perfil: 'vendedor' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(formPadrao);
  const [editId, setEditId] = useState(null);
  const [erro, setErro] = useState('');

  const carregar = () => api.get('/auth/usuarios').then(r => setUsuarios(r.data));
  useEffect(() => { carregar(); }, []);

  const limparFormulario = () => {
    setForm(formPadrao);
    setEditId(null);
  };

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      if (editId) {
        const payload = { ...form };
        if (!payload.senha) delete payload.senha;
        await api.patch(`/auth/usuarios/${editId}`, payload);
      } else {
        await api.post('/auth/usuarios', form);
      }

      limparFormulario();
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao salvar usuário');
    }
  };

  const alternarStatus = async (usuario) => {
    try {
      await api.patch(`/auth/usuarios/${usuario.id}/status`, { ativo: !usuario.ativo });
      carregar();
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro ao alterar status do usuário');
    }
  };

  const editar = (usuario) => {
    setEditId(usuario.id);
    setForm({ nome: usuario.nome, email: usuario.email, senha: '', perfil: usuario.perfil });
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
          <input style={input} type="password" placeholder={editId ? 'Nova senha (opcional)' : 'Sua senha'} required={!editId} value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} /></label>
        <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem' }}>Perfil
          <select style={input} value={form.perfil} onChange={e => setForm({ ...form, perfil: e.target.value })}>
            <option value="vendedor">Vendedor</option><option value="admin">Admin</option>
          </select></label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" style={{ padding: '0.45rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>{editId ? 'Atualizar' : 'Adicionar'}</button>
          {editId && <button type="button" onClick={limparFormulario}>Cancelar</button>}
        </div>
      </form>
      {erro && <p style={{ color: '#dc2626' }}>{erro}</p>}
      <table style={{ width: '100%', maxWidth: 700, borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead><tr><th style={th}>Nome</th><th style={th}>Email</th><th style={th}>Perfil</th><th style={th}>Status</th><th style={th}>Ações</th></tr></thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id}>
              <td style={td}>{u.nome}</td><td style={td}>{u.email}</td>
              <td style={td}>{u.perfil}</td><td style={td}>{u.ativo ? 'Ativo' : 'Inativo'}</td>
              <td style={td}>
                <button onClick={() => editar(u)}>Editar</button>
                <button onClick={() => alternarStatus(u)}>{u.ativo ? 'Desativar' : 'Ativar'}</button>
              </td>
            </tr>
          ))}
          {!usuarios.length && <tr><td style={td} colSpan="5">Nenhum usuário cadastrado.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
