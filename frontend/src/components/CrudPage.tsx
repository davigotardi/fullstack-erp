import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import api, { apiErrorMessage } from '../api';
import type { CrudField, CrudRow } from '../types';

// Página CRUD genérica usada por Clientes, Fornecedores e Produtos.
// `campos`: [{nome, label, tipo, required, chave?, optionsEndpoint?, optionLabel?, optionValue?}]
// `colunas`: nomes de campo a exibir na tabela.
interface CrudPageProps {
  titulo: string;
  endpoint: string;
  campos: CrudField[];
  colunas: string[];
}

interface Option {
  id: number;
  [key: string]: string | number;
}

type FormValues = Record<string, string | number>;

export default function CrudPage({ titulo, endpoint, campos, colunas }: CrudPageProps) {
  const [dados, setDados] = useState<CrudRow[]>([]);
  const [form, setForm] = useState<FormValues>({});
  const [editId, setEditId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const [erro, setErro] = useState('');
  const [opcoes, setOpcoes] = useState<Record<string, Option[]>>({});
  const requestId = useRef(0);

  const vazio = (): FormValues => Object.fromEntries(campos.map(c => [c.nome, c.tipo === 'number' ? 0 : '']));
  const labelDe = (nome: string): string => campos.find(c => c.nome === nome)?.label || nome;
  const chaveDe = (nome: string): string => campos.find(c => c.nome === nome)?.chave || nome;

  useEffect(() => {
    campos.filter(c => c.tipo === 'select').forEach(async c => {
      if (opcoes[c.nome]) return;
      const { data } = await api.get(`/${c.optionsEndpoint}`);
      setOpcoes(o => ({ ...o, [c.nome]: data as Option[] }));
    });
  }, []); // eslint-disable-line

  const carregar = async () => {
    const currentRequestId = ++requestId.current;
    const { data } = await api.get<CrudRow[]>(`/${endpoint}`, { params: q ? { q } : {} });
    if (currentRequestId === requestId.current) setDados(data);
  };
  useEffect(() => { carregar(); }, [q]); // eslint-disable-line

  const salvar = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro('');
    const payload: Record<string, string | number | null> = {};
    campos.forEach(c => {
      const value = form[c.nome];
      if (c.tipo === 'number' || c.tipo === 'select') {
        payload[c.nome] = value === '' || value == null ? null : Number(value);
      } else {
        payload[c.nome] = value === '' ? null : value;
      }
    });
    try {
      if (editId) await api.put(`/${endpoint}/${editId}`, payload);
      else await api.post(`/${endpoint}`, payload);
      setForm(vazio()); setEditId(null); carregar();
    } catch (err) { setErro(apiErrorMessage(err, 'Erro ao salvar')); }
  };

  const editar = (row: CrudRow) => {
    setEditId(row.id);
    const values: FormValues = {};
    campos.forEach(c => {
      const value = row[c.nome];
      values[c.nome] = typeof value === 'string' || typeof value === 'number'
        ? value
        : c.tipo === 'number' || c.tipo === 'select' ? 0 : '';
    });
    setForm(values);
  };

  const excluir = async (id: number) => {
    if (!confirm('Excluir este registro?')) return;
    try { await api.delete(`/${endpoint}/${id}`); carregar(); }
    catch (err) { alert(apiErrorMessage(err, 'Erro ao excluir')); }
  };

  const input: CSSProperties = { padding: '0.4rem', borderRadius: 6, border: '1px solid #cbd5e1' };
  const th: CSSProperties = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td: CSSProperties = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };
  const btn: CSSProperties = { padding: '0.45rem 1rem', border: 'none', borderRadius: 6, cursor: 'pointer' };

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
                  <option key={o[c.optionValue || 'id']} value={o[c.optionValue || 'id']}>
                    {o[c.optionLabel || 'nome']}
                  </option>
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
