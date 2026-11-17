import type { Request } from 'express';

export interface AuthenticatedUser {
  id: number;
  nome: string;
  perfil: 'admin' | 'vendedor';
}

declare global {
  namespace Express {
    interface Request {
      usuario: AuthenticatedUser;
    }
  }
}

export type AuthenticatedRequest = Request;
