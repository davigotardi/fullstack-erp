import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NovoPedido() {
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [clienteId, setClienteId] = useState('');
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState([{ produto_id: '', quantidade: 1 }]);
  const [erro, setErro] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    api.get('/clientes').then(r => setClientes(r.data));
    api.get('/produtos').then(r => setProdutos(r.data.filter(p => p.ativo)));
  }, []);

  const setItem = (i, campo, valor) => {
    const copia = [...itens];
    copia[i] = { ...copia[i], [campo]: valor };
    setItens(copia);
  };

  const total = itens.reduce((acc, it) => {
    const p = produtos.find(x => x.id === Number(it.produto_id));
    return acc + (p ? Number(p.preco) * Number(it.quantidade || 0) : 0);
  }, 0);

  const salvar = async (e) => {
    e.preventDefault();
    setErro('');
    const payloadItens = itens.filter(i => i.produto_id).map(i => ({
      produto_id: Number(i.produto_id), quantidade: Number(i.quantidade),
    }));
    try {
      const { data } = await api.post('/pedidos', {
        cliente_id: Number(clienteId), itens: payloadItens, observacao,
      });
      nav(`/pedidos/${data.id}`);
    } catch (err) { setErro(err.response?.data?.erro || 'Erro ao criar pedido'); }
  };

  const input = { padding: '0.4rem', borderRadius: 6, border: '1px solid #cbd5e1' };
  const th = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };

  return (
    <div>
      <h1>Novo pedido</h1>
      <form onSubmit={salvar} style={{ background: '#fff', padding: '1.25rem', borderRadius: 8, maxWidth: 900 }}>
        <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem' }}>
            Cliente *
            <select style={{ ...input, minWidth: 280 }} required value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.85rem', flex: 1 }}>
            Observação
            <input style={input} value={observacao} onChange={e => setObservacao(e.target.value)} />
          </label>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
          <thead><tr><th style={th}>Produto</th><th style={th}>Estoque</th><th style={th}>Preço</th><th style={th}>Qtd</th><th style={th}>Subtotal</th><th style={th}></th></tr></thead>
          <tbody>
            {itens.map((it, i) => {
              const p = produtos.find(x => x.id === Number(it.produto_id));
              return (
                <tr key={i}>
                  <td style={td}>
                    <select style={{ ...input, width: '100%' }} value={it.produto_id}
                      onChange={e => setItem(i, 'produto_id', e.target.value)} required>
                      <option value="">Selecione...</option>
                      {produtos.map(pr => <option key={pr.id} value={pr.id}>{pr.nome}</option>)}
                    </select>
                  </td>
                  <td style={td}>{p ? p.estoque : '—'}</td>
                  <td style={td}>{p ? `R$ ${Number(p.preco).toFixed(2)}` : '—'}</td>
                  <td style={td}>
                    <input style={{ ...input, width: 70 }} type="number" min="1" value={it.quantidade}
                      onChange={e => setItem(i, 'quantidade', e.target.value)} required />
                  </td>
                  <td style={td}>{p ? `R$ ${(Number(p.preco) * Number(it.quantidade || 0)).toFixed(2)}` : '—'}</td>
                  <td style={td}>
                    {itens.length > 1 && (
                      <button type="button" onClick={() => setItens(itens.filter((_, j) => j !== i))}
                        style={{ color: '#dc2626', border: 'none', background: 'none', cursor: 'pointer' }}>✕</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button type="button" onClick={() => setItens([...itens, { produto_id: '', quantidade: 1 }])}
          style={{ ...input, cursor: 'pointer', marginBottom: '1rem' }}>+ Adicionar item</button>

        {erro && <p style={{ color: '#dc2626' }}>{erro}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <strong>Total: R$ {total.toFixed(2)}</strong>
          <button type="submit" style={{ padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            Confirmar pedido
          </button>
        </div>
      </form>
    </div>
  );
}
