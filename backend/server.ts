import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool from './db';
import authRoutes from './routes/auth';
import pedidosRoutes from './routes/pedidos';
import { routerClientes, routerFornecedores, routerProdutos } from './routes/crud';
import { auth } from './middleware/auth';

const app = express();
app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas requisições em pouco tempo. Tente novamente mais tarde.' },
}));

app.get('/api/health', (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/clientes', routerClientes);
app.use('/api/fornecedores', routerFornecedores);
app.use('/api/produtos', routerProdutos);
app.use('/api/pedidos', pedidosRoutes);

// Dashboard: totais rápidos
app.get('/api/dashboard', auth, async (_req, res) => {
  try {
    const [cli, forn, prod, ped, vendas] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS n FROM clientes WHERE ativo'),
      pool.query('SELECT COUNT(*)::int AS n FROM fornecedores WHERE ativo'),
      pool.query(`SELECT COUNT(*)::int AS n,
                  COUNT(*) FILTER (WHERE estoque <= estoque_min)::int AS baixo
                  FROM produtos WHERE ativo`),
      pool.query(`SELECT COUNT(*)::int AS n,
                  COUNT(*) FILTER (WHERE status IN ('pendente','aprovado','em_separacao'))::int AS abertos
                  FROM pedidos`),
      pool.query(`SELECT COALESCE(SUM(total),0)::float AS total
                  FROM pedidos WHERE status IN ('aprovado','em_separacao','enviado','entregue')`),
    ]);
    res.json({
      clientes: cli.rows[0].n,
      fornecedores: forn.rows[0].n,
      produtos: prod.rows[0].n,
      produtosEstoqueBaixo: prod.rows[0].baixo,
      pedidosAbertos: ped.rows[0].abertos,
      totalVendas: vendas.rows[0].total,
    });
  } catch (e) { res.status(500).json({ erro: e instanceof Error ? e.message : 'Erro interno' }); }
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
});

const PORT = Number(process.env.PORT || 3001);
app.listen(PORT, () => console.log(`API ERP rodando em http://localhost:${PORT}`));
