import type { Meta, StoryObj } from '@storybook/react-vite';

import { C3Shell } from '@c3theme/engine';
import type { AuthPort } from '@c3theme/engine';

/**
 * Entrada por código de e-mail (#123): a porta declara `entrada: 'codigo'` e o motor monta só o e-mail e,
 * depois, a conferência do código. Digite qualquer e-mail válido; o código de demonstração é `123456`.
 */
const resposta = (corpo: unknown) => new Response(JSON.stringify({ data: corpo }), { headers: { 'content-type': 'application/json' } });

const APP = { name: 'C3', homePath: '/', entities: [], pages: [{ path: '/', title: 'Início' }], layout: { menu: [] } };

const transport = async (url: string) => {
  if (url.endsWith('/_meta/login')) return resposta({ name: 'C3', auth: {} });
  if (url.endsWith('/_meta/app')) return resposta(APP);
  return new Response('{}', { status: 404 });
};

const auth: AuthPort = {
  entrada: 'codigo',
  me: async () => ({ id: 'demo', name: 'Ana', email: 'ana@exemplo.com' }),
  enviarCodigo: async () => undefined,
  entrarComCodigo: async (_email, codigo) => {
    if (codigo !== '123456') throw Object.assign(new Error('código inválido'), { code: 'codigo-invalido' });
    return { token: 'demo', user: { id: 'demo', name: 'Ana', email: 'ana@exemplo.com' } };
  }
};

const meta = {
  title: 'Motor/Entrada por código',
  parameters: { layout: 'fullscreen' }
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** E-mail, enviar código e conferir o código — sem senha e sem rotas de senha. */
export const Codigo: Story = {
  name: 'E-mail + código',
  render: () => <C3Shell apiUrl="/api" auth={auth} transport={transport} theme={{ storageKey: 'story-codigo' }} />
};
