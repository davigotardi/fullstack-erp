import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const STATUS = {
  pendente: '#f59e0b', aprovado: '#3b82f6', em_separacao: '#8b5cf6',
  enviado: '#06b6d4', entregue: '#22c55e', cancelado: '#ef4444',
};

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const carregar = () => api.get('/pedidos').then(r => setPedidos(r.data));
  useEffect(() => { carregar(); }, []);

  const cancelar = async (id) => {
    if (!confirm('Cancelar pedido e devolver itens ao estoque?')) return;
    try { await api.post(`/pedidos/${id}/cancelar`); carregar(); }
    catch (e) { alert(e.response?.data?.erro || 'Erro ao cancelar'); }
  };

  const th = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };
  const btn = { padding: '0.3rem 0.7rem', border: 'none', borderRadius: 6, cursor: 'pointer' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Pedidos</h1>
        <Link to="/pedidos/novo" style={{ background: '#2563eb', color: '#fff', padding: '0.5rem 1rem', borderRadius: 6, textDecoration: 'none' }}>
          + Novo pedido
        </Link>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead><tr>
          <th style={th}>Número</th><th style={th}>Cliente</th><th style={th}>Vendedor</th>
          <th style={th}>Itens</th><th style={th}>Total</th><th style={th}>Status</th><th style={th}>Data</th><th style={th}></th>
        </tr></thead>
        <tbody>
          {pedidos.map(p => (
            <tr key={p.id}>
              <td style={td}><Link to={`/pedidos/${p.id}`}>{p.numero}</Link></td>
              <td style={td}>{p.cliente_nome}</td>
              <td style={td}>{p.vendedor}</td>
              <td style={td}>{p.itens?.length || 0}</td>
              <td style={td}>R$ {Number(p.total).toFixed(2)}</td>
              <td style={td}>
                <span style={{ background: STATUS[p.status] || '#94a3b8', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: 10, fontSize: '0.8rem' }}>
                  {p.status}
                </span>
              </td>
              <td style={td}>{new Date(p.criado_em).toLocaleDateString('pt-BR')}</td>
              <td style={td}>
                {p.status !== 'cancelado' && p.status !== 'entregue' && (
                  <button onClick={() => cancelar(p.id)} style={{ ...btn, color: '#dc2626' }}>Cancelar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
