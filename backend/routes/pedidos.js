const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const router = express.Router();
router.use(auth);

function numeroPedido() {
  return 'PED-' + Date.now().toString(36).toUpperCase();
}

// Listar pedidos com cliente e itens
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT p.*, c.nome AS cliente_nome, u.nome AS vendedor,
        COALESCE(json_agg(json_build_object(
          'id', i.id, 'produto_id', i.produto_id, 'quantidade', i.quantidade,
          'preco_unit', i.preco_unit, 'subtotal', i.subtotal, 'produto_nome', pr.nome
        ) ORDER BY i.id) FILTER (WHERE i.id IS NOT NULL), '[]') AS itens
      FROM pedidos p
      JOIN clientes c ON c.id = p.cliente_id
      JOIN usuarios u ON u.id = p.usuario_id
      LEFT JOIN itens_pedido i ON i.pedido_id = p.id
      LEFT JOIN produtos pr ON pr.id = i.produto_id
      GROUP BY p.id, c.nome, u.nome
      ORDER BY p.id DESC`);
    res.json(rows);
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows: ped } = await pool.query(`
      SELECT p.*, c.nome AS cliente_nome, c.documento AS cliente_documento, u.nome AS vendedor
      FROM pedidos p JOIN clientes c ON c.id = p.cliente_id JOIN usuarios u ON u.id = p.usuario_id
      WHERE p.id = $1`, [req.params.id]);
    if (!ped[0]) return res.status(404).json({ erro: 'Pedido não encontrado' });
    const { rows: itens } = await pool.query(`
      SELECT i.*, pr.nome AS produto_nome, pr.codigo AS produto_codigo
      FROM itens_pedido i JOIN produtos pr ON pr.id = i.produto_id
      WHERE i.pedido_id = $1 ORDER BY i.id`, [req.params.id]);
    res.json({ ...ped[0], itens });
  } catch (e) { res.status(500).json({ erro: e.message }); }
});

// Criar pedido: valida estoque e baixa em transação
router.post('/', async (req, res) => {
  const { cliente_id, itens = [], observacao } = req.body || {};
  if (!cliente_id) return res.status(400).json({ erro: 'cliente_id é obrigatório' });
  if (!Array.isArray(itens) || itens.length === 0) {
    return res.status(400).json({ erro: 'O pedido precisa de ao menos um item' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let total = 0;
    const itensValidados = [];
    for (const it of itens) {
      const { rows } = await client.query('SELECT id, nome, preco, estoque FROM produtos WHERE id = $1 AND ativo = TRUE FOR UPDATE', [it.produto_id]);
      const prod = rows[0];
      if (!prod) throw new Error(`Produto ${it.produto_id} não encontrado`);
      const qtd = Number(it.quantidade);
      if (!Number.isInteger(qtd) || qtd <= 0) throw new Error('Quantidade inválida');
      if (prod.estoque < qtd) throw new Error(`Estoque insuficiente para "${prod.nome}" (disponível: ${prod.estoque})`);
      const subtotal = qtd * Number(prod.preco);
      total += subtotal;
      itensValidados.push({ produto_id: prod.id, quantidade: qtd, preco_unit: prod.preco, subtotal });
    }

    const { rows: ped } = await client.query(
      `INSERT INTO pedidos (numero, cliente_id, usuario_id, total, observacao) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [numeroPedido(), cliente_id, req.usuario.id, total.toFixed(2), observacao || null]
    );

    for (const it of itensValidados) {
      await client.query(
        'INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unit, subtotal) VALUES ($1,$2,$3,$4,$5)',
        [ped[0].id, it.produto_id, it.quantidade, it.preco_unit, it.subtotal]
      );
      await client.query('UPDATE produtos SET estoque = estoque - $1 WHERE id = $2', [it.quantidade, it.produto_id]);
    }

    await client.query('COMMIT');
    res.status(201).json(ped[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ erro: e.message });
  } finally {
    client.release();
  }
});

// Atualizar status do pedido
const STATUS = ['pendente','aprovado','em_separacao','enviado','entregue','cancelado'];
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!STATUS.includes(status)) return res.status(400).json({ erro: 'Status inválido' });
  try {
    const { rows } = await pool.query(
      'UPDATE pedidos SET status = $1, atualizado_em = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );
    rows[0] ? res.json(rows[0]) : res.status(404).json({ erro: 'Pedido não encontrado' });
  } catch (e) { res.status(400).json({ erro: e.message }); }
});

// Cancelar pedido: devolve estoque
router.post('/:id/cancelar', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query('SELECT id, status FROM pedidos WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!rows[0]) { await client.query('ROLLBACK'); return res.status(404).json({ erro: 'Pedido não encontrado' }); }
    if (rows[0].status === 'cancelado') { await client.query('ROLLBACK'); return res.status(400).json({ erro: 'Pedido já cancelado' }); }
    if (rows[0].status === 'entregue') { await client.query('ROLLBACK'); return res.status(400).json({ erro: 'Pedido já entregue não pode ser cancelado' }); }

    const { rows: itens } = await client.query('SELECT produto_id, quantidade FROM itens_pedido WHERE pedido_id = $1', [req.params.id]);
    for (const it of itens) {
      await client.query('UPDATE produtos SET estoque = estoque + $1 WHERE id = $2', [it.quantidade, it.produto_id]);
    }
    const { rows: upd } = await client.query(
      "UPDATE pedidos SET status = 'cancelado', atualizado_em = NOW() WHERE id = $1 RETURNING *", [req.params.id]);
    await client.query('COMMIT');
    res.json(upd[0]);
  } catch (e) {
    await client.query('ROLLBACK');
    res.status(400).json({ erro: e.message });
  } finally {
    client.release();
  }
});

module.exports = router;
