// Porta de autenticação: o que a shell precisa do sistema para as telas de entrada. A shell não sabe como o
// sistema autentica (senha no banco, SSO, LDAP); só chama esta interface e manda o token em todo pedido.

import type { Text } from '../types';

export interface AuthUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
  phone?: string;
}

/** `auth` do app.json (spec/v0/app.schema.json). */
export interface AuthConfig {
  title?: Text;
  subtitle?: Text;
  identifier?: 'email' | 'username';
  remember?: boolean;
  register?: boolean;
  forgotPassword?: boolean;
  profile?: boolean;
}

/**
 * Implementada pelo sistema (ou pelo adaptador `httpAuth`). Os métodos opcionais ligam telas: sem `register`,
 * não há cadastro mesmo com `auth.register` no app.json; sem `forgotPassword`, não há "Esqueci a senha".
 */
export interface AuthPort {
  /** `identifier` é o e-mail ou o usuário, conforme `auth.identifier`. Erro com `message` aparece na tela. */
  login(identifier: string, password: string): Promise<{ token: string; user: AuthUser }>;
  /** Valida o token guardado ao abrir o sistema; falhar volta ao login. */
  me(token: string): Promise<AuthUser>;
  logout?(token: string): Promise<void>;
  register?(data: { name: string; identifier: string; password: string }): Promise<void>;
  forgotPassword?(identifier: string): Promise<void>;
  verifyCode?(identifier: string, code: string): Promise<void>;
  resetPassword?(identifier: string, code: string, password: string): Promise<void>;
  updateProfile?(token: string, changes: { name?: string; phone?: string }): Promise<AuthUser>;
  changePassword?(token: string, current: string, next: string): Promise<void>;
}

/** Cada fluxo aparece só quando o app.json liga e a porta implementa. */
export const canRegister = (c: AuthConfig, p: AuthPort) => Boolean(c.register && p.register);
export const canRecover = (c: AuthConfig, p: AuthPort) => Boolean(c.forgotPassword && p.forgotPassword && p.verifyCode && p.resetPassword);
export const canProfile = (c: AuthConfig, p: AuthPort) => c.profile !== false && Boolean(p.updateProfile || p.changePassword);
