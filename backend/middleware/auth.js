const jwt = require('jsonwebtoken');

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ erro: 'Token não informado' });
  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET || 'segredo-dev');
    next();
  } catch {
    return res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

function admin(req, res, next) {
  if (req.usuario?.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { auth, admin };
