import { useEffect, useState } from 'react';
import api from '../api';

const today = new Date();
const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => { api.get('/dashboard').then(r => setD(r.data)).catch(() => {}); }, []);

  if (!d) return <p className="loading-state">Preparando seu painel...</p>;

  const cards = [
    { label: 'Clientes', value: d.clientes, icon: '♙', color: '#625bff', soft: '#efefff' },
    { label: 'Fornecedores', value: d.fornecedores, icon: '⌂', color: '#188c76', soft: '#e7f7f2' },
    { label: 'Produtos cadastrados', value: d.produtos, icon: '▤', color: '#d58a21', soft: '#fff5e6' },
    { label: 'Estoque baixo', value: d.produtosEstoqueBaixo, icon: '↘', color: '#dc6570', soft: '#fff0f1' },
    { label: 'Pedidos em aberto', value: d.pedidosAbertos, icon: '▧', color: '#4388db', soft: '#edf5ff' },
    { label: 'Total em vendas', value: currency.format(d.totalVendas), icon: 'R$', color: '#9a62c7', soft: '#f6edff' },
  ];

  return (
    <div>
      <div className="dashboard-intro">
        <div>
          <h1>Visão geral</h1>
          <p>Acompanhe os principais indicadores do seu negócio.</p>
        </div>
        <span className="dashboard-date">{today.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <section className="metrics-grid" aria-label="Indicadores do negócio">
        {cards.map(card => (
          <article className="metric-card" key={card.label} style={{ '--metric-color': card.color, '--metric-soft': card.soft }}>
            <div className="metric-top">
              <span className="metric-label">{card.label}</span>
              <span className="metric-icon" aria-hidden="true">{card.icon}</span>
            </div>
            <div className="metric-value">{card.value}</div>
          </article>
        ))}
      </section>
    </div>
  );
}
