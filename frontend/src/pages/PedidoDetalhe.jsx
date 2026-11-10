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

  return (
    <div className="order-detail">
      <h1>Pedido {pedido.numero}</h1>
      <div className="card order-summary">
        <p><strong>Cliente:</strong> {pedido.cliente_nome} ({pedido.cliente_documento || '—'})</p>
        <p><strong>Vendedor:</strong> {pedido.vendedor}</p>
        <p><strong>Status:</strong> {pedido.status}</p>
        <p><strong>Data:</strong> {new Date(pedido.criado_em).toLocaleString('pt-BR')}</p>
        {pedido.observacao && <p><strong>Observação:</strong> {pedido.observacao}</p>}
      </div>
      <div className="table-card">
        <table>
          <thead><tr><th>Produto</th><th>Qtd</th><th>Preço unit.</th><th>Subtotal</th></tr></thead>
          <tbody>
            {pedido.itens.map(i => (
              <tr key={i.id}>
                <td>{i.produto_nome} ({i.produto_codigo || '—'})</td>
                <td>{i.quantidade}</td>
                <td>R$ {Number(i.preco_unit).toFixed(2)}</td>
                <td>R$ {Number(i.subtotal).toFixed(2)}</td>
              </tr>
            ))}
            <tr><td colSpan="3"><strong>Total</strong></td>
              <td><strong>R$ {Number(pedido.total).toFixed(2)}</strong></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
