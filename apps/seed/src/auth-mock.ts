import type { AuthService, User } from './auth';

/**
 * Backend de mentira para o seed rodar sem servidor: usuários no localStorage, token com o formato de um JWT
 * (sem assinatura) e código de verificação fixo. Usuário inicial: demo@c3theme.dev / 123456.
 */
export const MOCK_CREDENTIALS = { email: 'demo@c3theme.dev', password: '123456' };
export const MOCK_CODE = '123456';

const USERS_KEY = 'c3-mock-users';
const TTL_SECONDS = 60 * 60 * 24;

interface MockUser extends User {
  password: string;
}

const wait = () => new Promise((r) => setTimeout(r, 350));

function users(): MockUser[] {
  try {
    const stored = localStorage.getItem(USERS_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // dado corrompido: volta ao usuário padrão
  }
  return [{ id: 'u1', name: 'Usuário Demo', email: MOCK_CREDENTIALS.email, role: 'Administrador', password: MOCK_CREDENTIALS.password }];
}

const save = (list: MockUser[]) => localStorage.setItem(USERS_KEY, JSON.stringify(list));
const strip = ({ password: _p, ...u }: MockUser): User => u;
const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const token = (u: User) =>
  [b64({ alg: 'none', typ: 'JWT' }), b64({ sub: u.id, exp: Math.floor(Date.now() / 1000) + TTL_SECONDS }), 'mock'].join('.');

export function decodeToken(t: string): { sub?: string; exp?: number } {
  try {
    return JSON.parse(atob(t.split('.')[1]!.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return {};
  }
}

const norm = (email: string) => email.trim().toLowerCase();

export const mockAuth: AuthService = {
  async login(email, password) {
    await wait();
    const u = users().find((x) => x.email === norm(email) && x.password === password);
    if (!u) throw new Error('E-mail ou senha inválidos.');
    return { token: token(u), user: strip(u) };
  },
  async register({ name, email, password }) {
    await wait();
    const list = users();
    if (list.some((x) => x.email === norm(email))) throw new Error('Já existe uma conta com esse e-mail.');
    list.push({ id: crypto.randomUUID(), name, email: norm(email), password, role: 'Usuário' });
    save(list);
  },
  async me(t) {
    const { sub, exp } = decodeToken(t);
    if (!exp || exp < Date.now() / 1000) throw new Error('Sessão expirada.');
    const u = users().find((x) => x.id === sub);
    if (!u) throw new Error('Sessão expirada.');
    return strip(u);
  },
  async forgotPassword(email) {
    await wait();
    // não revela se o e-mail existe; o código fixo do mock é 123456
    void email;
  },
  async verifyCode(email, code) {
    await wait();
    void email;
    if (code !== MOCK_CODE) throw new Error('Código inválido. No modo de demonstração, use 123456.');
  },
  async resetPassword(email, code, password) {
    await wait();
    if (code !== MOCK_CODE) throw new Error('Código inválido ou expirado.');
    const list = users();
    const u = list.find((x) => x.email === norm(email));
    if (u) {
      u.password = password;
      save(list);
    }
  },
  async updateProfile(t, changes) {
    await wait();
    const { sub } = decodeToken(t);
    const list = users();
    const u = list.find((x) => x.id === sub);
    if (!u) throw new Error('Sessão expirada.');
    Object.assign(u, changes);
    save(list);
    return strip(u);
  },
  async changePassword(t, current, next) {
    await wait();
    const { sub } = decodeToken(t);
    const list = users();
    const u = list.find((x) => x.id === sub);
    if (!u || u.password !== current) throw new Error('Senha atual incorreta.');
    u.password = next;
    save(list);
  }
};
