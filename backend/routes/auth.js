const { auth, admin } = require('../middleware/auth');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body || {};
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios' });
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE email = $1 AND ativo = TRUE', [email]);
    const usuario = rows[0];
    if (!usuario || !(await bcrypt.compare(senha, usuario.senha_hash))) {
      return res.status(401).json({ erro: 'Credenciais inválidas' });
    }
    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome, perfil: usuario.perfil },
      process.env.JWT_SECRET || 'segredo-dev',
      { expiresIn: '8h' }
    );
    res.json({ token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil } });
  } catch (e) {
    res.status(500).json({ erro: e.message });
  }
});

router.get('/me', auth, (req, res) => res.json(req.usuario));

// Administração de usuários (somente admin)
router.get('/usuarios', auth, admin, async (req, res) => {
  const { rows } = await pool.query('SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY nome');
  res.json(rows);
});

router.post('/usuarios', auth, admin, async (req, res) => {
  const { nome, email, senha, perfil = 'vendedor' } = req.body || {};
  if (!nome || !email || !senha) return res.status(400).json({ erro: 'nome, email e senha são obrigatórios' });
  try {
    const hash = await bcrypt.hash(senha, 10);
    const { rows } = await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, perfil',
      [nome, email, hash, perfil]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    res.status(400).json({ erro: e.message });
  }
});

module.exports = router;
