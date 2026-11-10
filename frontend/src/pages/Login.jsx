import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <div className="login-page">
      <section className="login-showcase">
        <Link className="brand" to="/" aria-label="Evolve ERP">
          <span className="brand-mark">E</span>
          <span className="brand-copy">
            <strong>evolve</strong>
            <span>gestão inteligente</span>
          </span>
        </Link>
        <div className="showcase-copy">
          <h2>Seu negócio, em um novo ritmo.</h2>
          <p>Uma visão clara de cada operação para você tomar decisões com confiança e seguir em frente.</p>
        </div>
        <div className="showcase-footer">Gestão simples. Resultados consistentes.</div>
      </section>

      <main className="login-panel">
        <form className="login-form" onSubmit={submit}>
          <h1>Bem-vindo de volta</h1>
          <p className="login-description">Entre na sua conta para continuar.</p>
          <label htmlFor="login-email">Email</label>
          <input id="login-email" type="email" placeholder="voce@empresa.com" autoComplete="email" required
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <label htmlFor="login-password">Senha</label>
          <input id="login-password" type="password" placeholder="Sua senha" autoComplete="current-password" required
            value={form.senha} onChange={e => setForm({ ...form, senha: e.target.value })} />
          {erro && <p className="error-message" role="alert">{erro}</p>}
          <button type="submit" className="primary-button">Entrar na plataforma <span aria-hidden="true">&nbsp; →</span></button>
          <p className="demo-hint">Acesso de demonstração<br /><strong>admin@erp.com</strong> / <strong>admin123</strong></p>
        </form>
      </main>
    </div>
  );
}
