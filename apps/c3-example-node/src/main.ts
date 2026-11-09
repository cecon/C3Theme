// Sobe o CRM de exemplo (server.ts) para a suíte de conformidade. Variáveis: DATABASE_URL (padrão c3-example.db),
// PORT (3000).

import { exampleServer } from './server';

const file = (process.env.DATABASE_URL ?? 'c3-example.db').replace(/^sqlite:\/\//, '');
const port = Number(process.env.PORT ?? 3000);

const { server } = await exampleServer(file);
server.listen(port, '127.0.0.1', () => console.log(`c3-example-node ouvindo em http://127.0.0.1:${port}/api`));
