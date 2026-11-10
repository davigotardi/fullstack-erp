import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const carregar = () => api.get('/pedidos').then(r => setPedidos(r.data));
  useEffect(() => { carregar(); }, []);

  const cancelar = async (id) => {
    if (!confirm('Cancelar pedido e devolver itens ao estoque?')) return;
    try { await api.post(`/pedidos/${id}/cancelar`); carregar(); }
    catch (e) { alert(e.response?.data?.erro || 'Erro ao cancelar'); }
  };

  return (
    <div className="crud-page">
      <div className="page-heading">
        <div>
          <h1>Pedidos</h1>
          <p className="page-subtitle">Acompanhe e gerencie os pedidos da sua operação.</p>
        </div>
        <Link to="/pedidos/novo" className="primary-button">+ Novo pedido</Link>
      </div>
      <div className="table-card">
        <table>
          <thead><tr>
            <th>Número</th><th>Cliente</th><th>Vendedor</th>
            <th>Itens</th><th>Total</th><th>Status</th><th>Data</th><th>Ações</th>
          </tr></thead>
          <tbody>
            {pedidos.map(p => (
              <tr key={p.id}>
                <td><Link to={`/pedidos/${p.id}`}>{p.numero}</Link></td>
                <td>{p.cliente_nome}</td>
                <td>{p.vendedor}</td>
                <td>{p.itens?.length || 0}</td>
                <td>R$ {Number(p.total).toFixed(2)}</td>
                <td>
                  <span className={`status-badge status-${p.status}`}>
                    {p.status.replaceAll('_', ' ')}
                  </span>
                </td>
                <td>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
                <td>
                  {p.status !== 'cancelado' && p.status !== 'entregue' && (
                    <button className="row-delete" onClick={() => cancelar(p.id)}>Cancelar</button>
                  )}
                </td>
              </tr>
            ))}
            {!pedidos.length && <tr><td className="empty-table" colSpan="8">Nenhum pedido encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
