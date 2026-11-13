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
 * Como a shell entra: `senha` (e-mail/usuário + senha) ou `codigo` (e-mail + código enviado por e-mail, sem
 * senha). A porta declara o modo; a casca monta somente as telas dele e não oferece rotas de senha no modo código.
 */
export type ModoDeEntrada = 'senha' | 'codigo';

/** Sessão devolvida pela entrada por senha ou por código. */
export interface SessaoDaPorta {
  token: string;
  user: AuthUser;
}

/**
 * Implementada pelo sistema (ou pelo adaptador `httpAuth`). Os métodos opcionais ligam telas: sem `register`,
 * não há cadastro mesmo com `auth.register` no app.json; sem `forgotPassword`, não há "Esqueci a senha".
 *
 * No modo `codigo`, o sistema implementa `enviarCodigo` e `entrarComCodigo` (e pode omitir `login`, `register`,
 * `forgotPassword` e `resetPassword`: a casca não monta telas de senha). Sem `entrada`, o modo é `senha`.
 */
export interface AuthPort {
  /** O modo de entrada declarado pela porta. Padrão: `senha`. */
  readonly entrada?: ModoDeEntrada;
  /** `identifier` é o e-mail ou o usuário, conforme `auth.identifier`. Erro com `message` aparece na tela. */
  login?(identifier: string, password: string): Promise<SessaoDaPorta>;
  /** Valida o token guardado ao abrir o sistema; falhar volta ao login. */
  me(token: string): Promise<AuthUser>;
  logout?(token: string): Promise<void>;
  register?(data: { name: string; identifier: string; password: string }): Promise<void>;
  forgotPassword?(identifier: string): Promise<void>;
  verifyCode?(identifier: string, code: string): Promise<void>;
  resetPassword?(identifier: string, code: string, password: string): Promise<void>;
  updateProfile?(token: string, changes: { name?: string; phone?: string }): Promise<AuthUser>;
  changePassword?(token: string, current: string, next: string): Promise<void>;
  /**
   * Modo `codigo`: envia o código para o identificador. Um erro com `code` conhecido aparece como estado:
   * `codigo-invalido`, `codigo-expirado`, `muitas-tentativas` ou `sem-rede`.
   */
  enviarCodigo?(identifier: string): Promise<void>;
  /** Modo `codigo`: confere o código e devolve a sessão. Mesmos códigos de erro de `enviarCodigo`. */
  entrarComCodigo?(identifier: string, code: string): Promise<SessaoDaPorta>;
}

/** Cada fluxo aparece só quando o app.json liga e a porta implementa. */
export const canRegister = (c: AuthConfig, p: AuthPort) => Boolean(c.register && p.register);
export const canRecover = (c: AuthConfig, p: AuthPort) => Boolean(c.forgotPassword && p.forgotPassword && p.verifyCode && p.resetPassword);
export const canProfile = (c: AuthConfig, p: AuthPort) =>
  c.profile !== false && Boolean(p.updateProfile || (p.entrada !== 'codigo' && p.changePassword));

/** O modo efetivo da porta: `codigo` só com os dois métodos; `senha` só com `login`; sem nada, indefinido. */
export function modoDeEntrada(port: AuthPort): ModoDeEntrada | undefined {
  if (port.entrada === 'codigo') return port.enviarCodigo && port.entrarComCodigo ? 'codigo' : undefined;
  return port.login ? 'senha' : undefined;
}

/** A casca não monta nenhuma rota de senha quando a entrada é por código. */
export const entradaPorCodigo = (port: AuthPort) => modoDeEntrada(port) === 'codigo';
