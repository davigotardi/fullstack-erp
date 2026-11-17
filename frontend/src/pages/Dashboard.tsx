import { useEffect, useState, type CSSProperties } from 'react';
import api from '../api';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const [d, setD] = useState<DashboardStats | null>(null);
  useEffect(() => { api.get<DashboardStats>('/dashboard').then(r => setD(r.data)).catch(() => {}); }, []);

  if (!d) return <p role="status">Carregando painel...</p>;
  const cards: { label: string; value: string | number; icon: string; color: string; tint: string }[] = [
    { label: 'Clientes', value: d.clientes, icon: '♙', color: '#4263eb', tint: '#edf1ff' },
    { label: 'Fornecedores', value: d.fornecedores, icon: '◈', color: '#9b5de5', tint: '#f5edff' },
    { label: 'Produtos', value: d.produtos, icon: '▦', color: '#159b87', tint: '#e8f8f4' },
    { label: 'Estoque baixo', value: d.produtosEstoqueBaixo, icon: '⌁', color: '#df8b22', tint: '#fff5e5' },
    { label: 'Pedidos abertos', value: d.pedidosAbertos, icon: '▤', color: '#e35d78', tint: '#fff0f3' },
    { label: 'Total em vendas', value: `R$ ${d.totalVendas.toFixed(2)}`, icon: '↗', color: '#2586c7', tint: '#eaf6ff' },
  ];
  return (
    <section>
      <div className="page-heading">
        <div className="page-eyebrow">Visão geral</div>
        <h1>Dashboard</h1>
        <p className="page-subtitle">Acompanhe os principais indicadores da sua operação.</p>
      </div>
      <div className="dashboard-grid">
        {cards.map(card => (
          <div key={card.label} className="stat-card" style={{ '--stat-color': card.color, '--stat-tint': card.tint } as CSSProperties}>
            <div className="stat-top">
              <div className="stat-label">{card.label}</div>
              <div className="stat-icon" aria-hidden="true">{card.icon}</div>
            </div>
            <div className={`stat-value${card.label === 'Total em vendas' ? ' currency' : ''}`}>{card.value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
