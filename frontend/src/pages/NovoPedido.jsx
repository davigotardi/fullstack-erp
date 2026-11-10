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

  return (
    <div className="new-order-page">
      <div className="page-heading">
        <div>
          <h1>Novo pedido</h1>
          <p className="page-subtitle">Preencha os dados e adicione os produtos do pedido.</p>
        </div>
      </div>
      <form onSubmit={salvar} className="card order-form">
        <div className="order-fields">
          <label className="field-label">
            Cliente *
            <select required value={clienteId} onChange={e => setClienteId(e.target.value)}>
              <option value="">Selecione...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </label>
          <label className="field-label">
            Observação
            <input value={observacao} onChange={e => setObservacao(e.target.value)} />
          </label>
        </div>

        <div className="table-card order-items">
          <table>
            <thead><tr><th>Produto</th><th>Estoque</th><th>Preço</th><th>Qtd</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>
              {itens.map((it, i) => {
                const p = produtos.find(x => x.id === Number(it.produto_id));
                return (
                  <tr key={i}>
                    <td>
                      <select value={it.produto_id}
                        onChange={e => setItem(i, 'produto_id', e.target.value)} required>
                        <option value="">Selecione...</option>
                        {produtos.map(pr => <option key={pr.id} value={pr.id}>{pr.nome}</option>)}
                      </select>
                    </td>
                    <td>{p ? p.estoque : '—'}</td>
                    <td>{p ? `R$ ${Number(p.preco).toFixed(2)}` : '—'}</td>
                    <td>
                      <input className="quantity-input" type="number" min="1" value={it.quantidade}
                        onChange={e => setItem(i, 'quantidade', e.target.value)} required />
                    </td>
                    <td>{p ? `R$ ${(Number(p.preco) * Number(it.quantidade || 0)).toFixed(2)}` : '—'}</td>
                    <td>
                      {itens.length > 1 && (
                        <button className="remove-item" type="button" aria-label="Remover item" onClick={() => setItens(itens.filter((_, j) => j !== i))}>×</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <button className="secondary-button add-item" type="button" onClick={() => setItens([...itens, { produto_id: '', quantidade: 1 }])}>
          + Adicionar item
        </button>

        {erro && <p className="error-message">{erro}</p>}
        <div className="order-footer">
          <strong>Total: R$ {total.toFixed(2)}</strong>
          <button type="submit" className="primary-button">Confirmar pedido</button>
        </div>
      </form>
    </div>
  );
}
