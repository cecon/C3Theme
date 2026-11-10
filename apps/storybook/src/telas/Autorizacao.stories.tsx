import { useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

import { authorizingFetch, useAuthorization, useEngine } from '@c3theme/engine';
import { withMotor } from '../motor/withMotor';

/**
 * `app.authorization`: o servidor recusa com `orcamento_excedido`, a shell pede quem libera e reenvia o mesmo pedido
 * com o cabeçalho C3-Authorization. Aqui o "servidor" é uma função: a senha certa é 1234; a errada volta ao diálogo.
 */
function Lancamento() {
  const { app } = useEngine();
  const authz = useAuthorization(app.authorization);
  const [result, setResult] = useState<string>();
  const fetch = useMemo(
    () =>
      authorizingFetch(
        async (_url, init) => {
          const header = new Headers(init?.headers).get('c3-authorization');
          const values = header ? JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(header), (c) => c.charCodeAt(0)))) : null;
          const body = !values
            ? {
                status: 409,
                error: { code: 'orcamento_excedido', message: 'O lançamento passa do orçado da conta 3.1.01 em R$ 1.250,00.' }
              }
            : values.senha !== '1234'
              ? { status: 403, error: { code: 'liberacao_negada', message: 'Usuário ou senha não conferem.' } }
              : { status: 201, data: { liberadoPor: values.usuario } };
          return new Response(JSON.stringify(body), { status: body.status, headers: { 'content-type': 'application/json' } });
        },
        authz.codes,
        authz.ask
      ),
    [authz.codes, authz.ask]
  );
  return (
    <Stack spacing={2} sx={{ maxWidth: 480 }}>
      <Button
        variant="contained"
        onClick={() =>
          void fetch('/lancamento', { method: 'POST', body: '{}' })
            .then((r) => r.json())
            .then((j) => setResult(j.data ? `Gravado, liberado por ${j.data.liberadoPor}.` : j.error.message))
        }
      >
        Gravar lançamento
      </Button>
      {result && <Alert severity="info">{result}</Alert>}
      {authz.dialog}
    </Stack>
  );
}

const meta = {
  title: 'Telas/Autorização de outro usuário',
  component: Lancamento,
  decorators: [withMotor]
} satisfies Meta<typeof Lancamento>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Liberacao: Story = { name: 'Liberação do orçamento' };
