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

  return (
    <div className="crud-page">
      <div className="page-heading">
        <div>
          <h1>{titulo}</h1>
          <p className="page-subtitle">Gerencie seus registros e mantenha tudo organizado.</p>
        </div>
      </div>
      <input className="search-input" placeholder="⌕  Buscar..." value={q} onChange={e => setQ(e.target.value)} />
      <form onSubmit={salvar} className="form-card">
        {campos.map(c => (
          <label key={c.nome}>
            {c.label}
            {c.tipo === 'select' ? (
              <select value={form[c.nome] ?? ''}
                onChange={e => setForm({ ...form, [c.nome]: e.target.value })}>
                <option value="">—</option>
                {(opcoes[c.nome] || []).map(o => (
                  <option key={o[c.optionValue]} value={o[c.optionValue]}>{o[c.optionLabel]}</option>
                ))}
              </select>
            ) : (
              <input required={c.required} type={c.tipo || 'text'}
                value={form[c.nome] ?? ''} onChange={e => setForm({ ...form, [c.nome]: e.target.value })} />
            )}
          </label>
        ))}
        <button type="submit" className="primary-button">
          {editId ? 'Atualizar' : 'Adicionar'}
        </button>
        {editId && <button type="button" onClick={() => { setEditId(null); setForm(vazio()); }}
          className="secondary-button">Cancelar</button>}
      </form>
      {erro && <p className="error-message">{erro}</p>}
      <div className="table-card">
        <table>
          <thead><tr>{colunas.map(c => <th key={c}>{labelDe(c)}</th>)}<th>Ações</th></tr></thead>
          <tbody>
            {dados.map(row => (
              <tr key={row.id}>
                {colunas.map(c => (
                  <td key={c}>{row[chaveDe(c)] ?? ''}</td>
                ))}
                <td>
                  <button onClick={() => editar(row)}>Editar</button>
                  <button className="row-delete" onClick={() => excluir(row.id)}>Excluir</button>
                </td>
              </tr>
            ))}
            {!dados.length && <tr><td className="empty-table" colSpan={colunas.length + 1}>Nenhum registro encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
