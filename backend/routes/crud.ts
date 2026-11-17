import express from 'express';
import pool from '../db';
import { auth } from '../middleware/auth';

interface CrudConfig {
  tabela: 'clientes' | 'fornecedores' | 'produtos';
  campos: { nome: string }[];
  busca: string[];
}

// Fábrica de CRUD genérico para entidades simples
function crud({ tabela, campos, busca }: CrudConfig) {
  const router = express.Router();
  router.use(auth);

  const cols = ['id', ...campos.map(f => f.nome), 'ativo'];

  router.get('/', async (req, res) => {
    try {
      const q = typeof req.query.q === 'string' ? req.query.q : '';
      let sql = `SELECT ${cols.join(', ')} FROM ${tabela}`;
      const params = [];
      if (q && busca.length) {
        sql += ' WHERE ' + busca.map((c, i) => `${c} ILIKE $${i + 1}`).join(' OR ');
        params.push(...busca.map(() => `%${q}%`));
      }
      sql += ' ORDER BY id DESC';
      const { rows } = await pool.query(sql, params);
      res.json(rows);
    } catch (e) { res.status(500).json({ erro: e instanceof Error ? e.message : 'Erro interno' }); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const { rows } = await pool.query(`SELECT ${cols.join(', ')} FROM ${tabela} WHERE id = $1`, [req.params.id]);
      rows[0] ? res.json(rows[0]) : res.status(404).json({ erro: 'Não encontrado' });
    } catch (e) { res.status(500).json({ erro: e instanceof Error ? e.message : 'Erro interno' }); }
  });

  router.post('/', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const valores = campos.map(f => body[f.nome] ?? null);
      const sql = `INSERT INTO ${tabela} (${campos.map(f => f.nome).join(', ')})
                   VALUES (${campos.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`;
      const { rows } = await pool.query(sql, valores);
      res.status(201).json(rows[0]);
    } catch (e) { res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao criar registro' }); }
  });

  router.put('/:id', async (req, res) => {
    try {
      const sets = campos.map((f, i) => `${f.nome} = $${i + 1}`).join(', ');
      const body = req.body as Record<string, unknown>;
      const valores = [...campos.map(f => body[f.nome] ?? null), req.params.id];
      const { rows } = await pool.query(`UPDATE ${tabela} SET ${sets} WHERE id = $${campos.length + 1} RETURNING *`, valores);
      rows[0] ? res.json(rows[0]) : res.status(404).json({ erro: 'Não encontrado' });
    } catch (e) { res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao atualizar registro' }); }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { rowCount } = await pool.query(`DELETE FROM ${tabela} WHERE id = $1`, [req.params.id]);
      rowCount ? res.json({ ok: true }) : res.status(404).json({ erro: 'Não encontrado' });
    } catch (e) { res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao excluir registro' }); }
  });

  return router;
}

const camposPessoa = [
  { nome: 'nome' }, { nome: 'documento' }, { nome: 'email' },
  { nome: 'telefone' }, { nome: 'endereco' }, { nome: 'cidade' }, { nome: 'uf' },
];

export const routerClientes = crud({ tabela: 'clientes', campos: camposPessoa, busca: ['nome', 'documento', 'email'] });
export const routerFornecedores = crud({ tabela: 'fornecedores', campos: camposPessoa, busca: ['nome', 'documento', 'email'] });
export const routerProdutos = crud({
  tabela: 'produtos',
  campos: [
    { nome: 'codigo' }, { nome: 'nome' }, { nome: 'descricao' }, { nome: 'preco' },
    { nome: 'estoque' }, { nome: 'estoque_min' }, { nome: 'fornecedor_id' },
  ],
  busca: ['nome', 'codigo'],
});
