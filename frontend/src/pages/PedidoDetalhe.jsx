import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

export default function PedidoDetalhe() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    api.get(`/pedidos/${id}`).then(r => setPedido(r.data)).catch(() => {});
  }, [id]);

  if (!pedido) return <p>Carregando...</p>;

  const th = { textAlign: 'left', padding: '0.5rem', borderBottom: '2px solid #e2e8f0' };
  const td = { padding: '0.5rem', borderBottom: '1px solid #e2e8f0' };

  return (
    <div style={{ maxWidth: 800 }}>
      <h1>Pedido {pedido.numero}</h1>
      <div style={{ background: '#fff', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
        <p><strong>Cliente:</strong> {pedido.cliente_nome} ({pedido.cliente_documento || '—'})</p>
        <p><strong>Vendedor:</strong> {pedido.vendedor}</p>
        <p><strong>Status:</strong> {pedido.status}</p>
        <p><strong>Data:</strong> {new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
        {pedido.observacao && <p><strong>Observação:</strong> {pedido.observacao}</p>}
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden' }}>
        <thead><tr><th style={th}>Produto</th><th style={th}>Qtd</th><th style={th}>Preço unit.</th><th style={th}>Subtotal</th></tr></thead>
        <tbody>
          {pedido.itens.map(i => (
            <tr key={i.id}>
              <td style={td}>{i.produto_nome} ({i.produto_codigo || '—'})</td>
              <td style={td}>{i.quantidade}</td>
              <td style={td}>R$ {Number(i.preco_unit).toFixed(2)}</td>
              <td style={td}>R$ {Number(i.subtotal).toFixed(2)}</td>
            </tr>
          ))}
          <tr><td style={td} colSpan="3"><strong>Total</strong></td>
            <td style={td}><strong>R$ {Number(pedido.total).toFixed(2)}</strong></td></tr>
        </tbody>
      </table>
    </div>
  );
}
