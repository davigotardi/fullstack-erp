import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { apiErrorMessage } from '../api';
import type { AppUser } from '../types';

export default function Login() {
  const [form, setForm] = useState({ email: '', senha: '' });
  const [erro, setErro] = useState('');
  const nav = useNavigate();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    try {
      const { data } = await api.post<{ token: string; usuario: AppUser }>('/auth/login', form);
      localStorage.setItem('erp_token', data.token);
      localStorage.setItem('erp_user', JSON.stringify(data.usuario));
      nav('/');
    } catch (err) {
      setErro(apiErrorMessage(err, 'Falha no login'));
    }
  };

  return (
    <div className="login-page">
      <section className="login-story" aria-label="Apresentação do ERP">
        <div className="login-story-brand">
          <div className="brand-mark">E</div>
          <div className="brand-name">ERP Central</div>
        </div>
        <div className="login-story-copy">
          <h2>Gestão simples. Resultados melhores.</h2>
          <p>Tenha clientes, estoque, vendas e pedidos em um só lugar. Mais clareza para cuidar do seu negócio todos os dias.</p>
        </div>
        <div className="login-story-foot">Uma plataforma completa para a sua operação.</div>
      </section>
      <main className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="page-eyebrow">Bem-vindo de volta</div>
          <h1>ERP</h1>
          <p className="login-intro">Entre para acessar sua empresa.</p>
          <label className="login-label" htmlFor="login-email">Email</label>
          <input id="login-email" type="email" placeholder="Email" autoComplete="username" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label className="login-label" htmlFor="login-password">Senha</label>
          <input id="login-password" type="password" placeholder="Senha" autoComplete="current-password" required
            value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
          {erro && <p className="error-message" role="alert">{erro}</p>}
          <button type="submit">Entrar</button>
          <p className="login-demo">Acesso de demonstração: <strong>admin@erp.com / admin123</strong></p>
        </form>
      </main>
    </div>
  );
}
