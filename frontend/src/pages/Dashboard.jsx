import { useEffect, useState } from 'react';
import api from '../api';

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setD(r.data)).catch(() => {}); }, []);

  if (!d) return <p>Carregando...</p>;
  const cards = [
    ['Clientes', d.clientes], ['Fornecedores', d.fornecedores],
    ['Produtos', d.produtos], ['Estoque baixo', d.produtosEstoqueBaixo],
    ['Pedidos abertos', d.pedidosAbertos],
    ['Total em vendas', `R$ ${d.totalVendas.toFixed(2)}`],
  ];
  return (
    <div>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {cards.map(([label, val]) => (
          <div key={label} style={{ background: '#fff', padding: '1.25rem', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,.08)' }}>
            <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: 4 }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
