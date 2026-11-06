import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setErro('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('erp_token', data.token);
      localStorage.setItem('erp_user', JSON.stringify(data.usuario));
      nav('/');
    } catch (err) {
      setErro(err.response?.data?.erro || 'Falha no login');
    }
  };

  const input = { width: '100%', padding: '0.6rem', marginBottom: '0.75rem', borderRadius: 6, border: '1px solid #cbd5e1', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: '2rem', borderRadius: 10, width: 340 }}>
        <h1 style={{ marginTop: 0 }}>ERP</h1>
        <p style={{ color: '#64748b', marginTop: -8 }}>Sistema de Gestão Empresarial</p>
        <input style={input} type="email" placeholder="Email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input style={input} type="password" placeholder="Senha" required
          value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
        {erro && <p style={{ color: '#dc2626', fontSize: '0.9rem' }}>{erro}</p>}
        <button type="submit" style={{ width: '100%', padding: '0.65rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          Entrar
        </button>
        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '1rem' }}>
          Demo: admin@erp.com / admin123
        </p>
      </form>
    </div>
  );
}
