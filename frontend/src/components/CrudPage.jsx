import { useEffect, useState } from 'react';
import api from '../api';

// Página CRUD genérica usada por Clientes, Fornecedores e Produtos.
// `campos`: [{nome, label, tipo, required, chave?, optionsEndpoint?, optionLabel?, optionValue?}]
// `colunas`: nomes de campo a exibir na tabela.
export default function CrudPage({ titulo, endpoint, campos, colunas }) {
  const [dados, setDados] = useState([]);
  const [form, setForm] = useState({});
  const [editId, setEditId] = useState(null);
  const [q, setQ] = useState('');
  const [erro, setErro] = useState('');
  const [opcoes, setOpcoes] = useState({});

  const vazio = () => Object.fromEntries(campos.map(c => [c.nome, c.tipo === 'number' ? 0 : '']));
  const labelDe = (nome) => campos.find(c => c.nome === nome)?.label || nome;
  const chaveDe = (nome) => campos.find(c => c.nome === nome)?.chave || nome;

  useEffect(() => {
    campos.filter(c => c.tipo === 'select').forEach(async c => {
      if (opcoes[c.nome]) return;
      const { data } = await api.get(`/${c.optionsEndpoint}`);
      setOpcoes(o => ({ ...o, [c.nome]: data }));
    });
  }, []); // eslint-disable-line

  const carregar = async () => {
    const { data } = await api.get(`/${endpoint}`, { params: q ? { q } : {} });
    setDados(data);
  };
  useEffect(() => { carregar(); }, [q]); // eslint-disable-line

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    const payload = {};
    campos.forEach(c => {
      let v = form[c.nome];
      if (c.tipo === 'number' || c.tipo === 'select') v = v === '' || v == null ? null : Number(v);
      else if (v === '') v = null;
      payload[c.nome] = v;
    });
    try {
      if (editId) await api.put(`/${endpoint}/${editId}`, payload);
      else await api.post(`/${endpoint}`, payload);
      setForm(vazio()); setEditId(null); carregar();
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao salvar'); }
  };

  const editar = (row) => {
    setEditId(row.id);
    setForm(Object.fromEntries(campos.map(c => [c.nome, row[c.nome] ?? (c.tipo === 'number' || c.tipo === 'select' ? 0 : '')])));
  };

  const excluir = async (id) => {
    if (!confirm('Excluir este registro?')) return;
    try { await api.delete(`/${endpoint}/${id}`); carregar(); }
    catch (err) { alert(err.response?.data?.erro || 'Erro ao excluir'); }
  };

  const input = { padding: '0.4rem', borderRadius: 6, border: '1px solid #cbd5e1' };
  const th = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };
  const btn = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer' };

  return (
    <div>
      <h1>{titulo}</h1>
      <input placeholder="Buscar..." value={q} onChange={e => setQ(e.target.value)}
        style={{ ...input, width: 280, marginBottom: '1rem' }} />
      <form onSubmit={salvar} style={{
        display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end',
        background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem',
      }}>
        {campos.map(c => (
          <label key={c.nome} style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: '#475569' }}>
            {c.label}
            {c.tipo === 'select' ? (
              <select style={input} value={form[c.nome] ?? ''}
                onChange={e => setForm({ ...form, [c.nome]: e.target.value })}>
                <option value="">—</option>
                {(opcoes[c.nome] || []).map(o => (
                  <option key={o[c.optionValue]} value={o[c.optionValue]}>{o[c.optionLabel]}</option>
                ))}
              </select>
            ) : (
              <input style={input} required={c.required} type={c.tipo || 'text'}
                value={form[c.nome] ?? ''} onChange={e => setForm({ ...form, [c.nome]: e.target.value })} />
            )}
          </label>
        ))}
        <button type="submit" style={{ ...btn, background: '#2563eb', color: '#fff' }}>
          {editId ? 'Atualizar' : 'Adicionar'}
        </button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm(vazio()); }}
          style={{ ...btn, background: '#e2e8f0' }}>Cancelar</button>}
      </form>
      {erro && <p style={{ color: '#dc2626' }}>{erro}</p>}
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead><tr>{colunas.map(c => <th key={c} style={th}>{labelDe(c)}</th>)}<th style={th}></th></tr></thead>
        <tbody>
          {dados.map(row => (
            <tr key={row.id}>
              {colunas.map(c => (
                <td key={c} style={td}>{row[chaveDe(c)] ?? ''}</td>
              ))}
              <td style={td}>
                <button onClick={() => editar(row)} style={{ ...btn, marginRight: 6 }}>Editar</button>
                <button onClick={() => excluir(row.id)} style={{ ...btn, color: '#dc2626' }}>Excluir</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
