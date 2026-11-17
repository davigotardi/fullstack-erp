import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db';
import { auth, admin } from '../middleware/auth';
import type { AuthenticatedUser } from '../types/express';

interface UserRecord {
  id: number;
  nome: string;
  email: string;
  senha_hash: string;
  perfil: AuthenticatedUser['perfil'];
  ativo: boolean;
  criado_em: string;
}

const router = express.Router();

function normalizarEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function devolverUsuario(usuario: UserRecord | undefined) {
  return usuario ? {
    id: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    ativo: usuario.ativo,
    criado_em: usuario.criado_em,
  } : null;
}

router.post('/login', async (req, res) => {
  const email = normalizarEmail(req.body?.email);
  const senha: unknown = req.body?.senha;

  if (!email || typeof senha !== 'string' || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });

  try {
    const { rows } = await pool.query<UserRecord>('SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE', [email]);
    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'segredo-dev',
      { expiresIn: '8h' }
    );

    res.json({
      token,
      usuario: devolverUsuario(usuario),
    });
  } catch (e) {
    res.status(500).json({ erro: e instanceof Error ? e.message : 'Erro interno' });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const { rows } = await pool.query<UserRecord>('SELECT * FROM usuarios WHERE id = $1', [req.usuario.id]);
    res.json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(500).json({ erro: e instanceof Error ? e.message : 'Erro interno' });
  }
});

router.patch('/me', auth, async (req, res) => {
  const { nome, email, senha } = req.body || {};
  if (!nome && !email && !senha) {
    return res.status(400).json({ erro: 'Informe pelo menos um campo para atualizar' });
  }

  try {
    const updates = [];
    const values = [];

    if (nome) {
      updates.push(`nome = $${values.length + 1}`);
      values.push(String(nome).trim());
    }

    if (email) {
      const emailNormalizado = normalizarEmail(email);
      const { rows: existente } = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [emailNormalizado, req.usuario.id]);
      if (existente.length) return res.status(400).json({ erro: 'Este email já está em uso' });
      updates.push(`email = $${values.length + 1}`);
      values.push(emailNormalizado);
    }

    if (senha) {
      updates.push(`senha_hash = $${values.length + 1}`);
      values.push(await bcrypt.hash(senha, 10));
    }

    values.push(req.usuario.id);
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, nome, email, perfil, ativo, criado_em`;
    const { rows } = await pool.query(sql, values);

    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao atualizar usuário' });
  }
});

// Administração de usuários (somente admin)
router.get('/usuarios', auth, admin, async (req, res) => {
  const { rows } = await pool.query<UserRecord>('SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome');
  res.json(rows.map(devolverUsuario));
});

router.get('/usuarios/:id', auth, admin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao consultar usuário' });
  }
});

router.post('/usuarios', auth, admin, async (req, res) => {
  const nome = String(req.body?.nome || '').trim();
  const email = normalizarEmail(req.body?.email);
  const senha: unknown = req.body?.senha;
  const perfil = req.body?.perfil || 'vendedor';

  if (!nome || !email || typeof senha !== 'string' || !senha) return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
  if (!['admin', 'vendedor'].includes(perfil)) return res.status(400).json({ erro: 'Perfil inválido' });

  try {
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, perfil, ativo, criado_em',
      [nome, email, hash, perfil]
    );
    res.status(201).json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao criar usuário' });
  }
});

router.patch('/usuarios/:id', auth, admin, async (req, res) => {
  const { nome, email, perfil, ativo, senha } = req.body || {};
  if (!nome && !email && !perfil && ativo === undefined && !senha) {
    return res.status(400).json({ erro: 'Informe pelo menos um campo para atualizar' });
  }

  try {
    const updates = [];
    const values = [];

    if (nome) {
      updates.push(`nome = $${values.length + 1}`);
      values.push(String(nome).trim());
    }

    if (email) {
      const emailNormalizado = normalizarEmail(email);
      const { rows: existente } = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND id <> $2', [emailNormalizado, req.params.id]);
      if (existente.length) return res.status(400).json({ erro: 'Este email já está em uso' });
      updates.push(`email = $${values.length + 1}`);
      values.push(emailNormalizado);
    }

    if (perfil) {
      if (!['admin', 'vendedor'].includes(perfil)) return res.status(400).json({ erro: 'Perfil inválido' });
      updates.push(`perfil = $${values.length + 1}`);
      values.push(perfil);
    }

    if (ativo !== undefined) {
      updates.push(`ativo = $${values.length + 1}`);
      values.push(Boolean(ativo));
    }

    if (senha) {
      updates.push(`senha_hash = $${values.length + 1}`);
      values.push(await bcrypt.hash(senha, 10));
    }

    values.push(req.params.id);
    const sql = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${values.length} RETURNING id, nome, email, perfil, ativo, criado_em`;
    const { rows } = await pool.query(sql, values);

    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao atualizar usuário' });
  }
});

router.patch('/usuarios/:id/status', auth, admin, async (req, res) => {
  const { ativo } = req.body || {};
  if (ativo === undefined || typeof ativo !== 'boolean') {
    return res.status(400).json({ erro: 'Campo "ativo" deve ser booleano' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE usuarios SET ativo = $1 WHERE id = $2 RETURNING id, nome, email, perfil, ativo, criado_em',
      [ativo, req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ erro: 'Usuário não encontrado' });
    res.json(devolverUsuario(rows[0]));
  } catch (e) {
    res.status(400).json({ erro: e instanceof Error ? e.message : 'Erro ao alterar status do usuário' });
  }
});

export default router;
