import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { AuthenticatedUser } from '../types/express';

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    res.status(401).json({ erro: 'Token não informado' });
    return;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'segredo-dev');
    if (
      typeof payload === 'string'
      || typeof payload.id !== 'number'
      || typeof payload.nome !== 'string'
      || (payload.perfil !== 'admin' && payload.perfil !== 'vendedor')
    ) {
      res.status(401).json({ erro: 'Token inválido ou expirado' });
      return;
    }
    const usuario: AuthenticatedUser = {
      id: payload.id,
      nome: payload.nome,
      perfil: payload.perfil,
    };
    req.usuario = usuario;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function admin(req: Request, res: Response, next: NextFunction): void {
  if (req.usuario?.perfil !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito a administradores' });
    return;
  }
  next();
}
