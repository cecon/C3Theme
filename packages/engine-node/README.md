# @c3theme/engine-node

Backend Node do contrato C3 (spec/v0) sobre SQLite, com a mesma semântica do `c3-engine` em Rust. O sistema entrega o
banco (um `Store`), os JSONs da spec e os hooks; o pacote entrega `/_meta`, o CRUD, as condições, as ações, o tempo
real e os erros. A prova é a mesma suíte de conformidade do Rust: `pnpm conformance node` sobe
`apps/c3-example-node` (o CRM de exemplo com os mesmos hooks) e roda os 120 testes duas vezes no mesmo banco.

## Uso

```ts
import { createServer } from 'node:http';
import { buildEngine, engineListener } from '@c3theme/engine-node';
import { BetterSqliteStore } from '@c3theme/engine-node/better-sqlite3';

const store = new BetterSqliteStore('app.db'); // as migrations são do sistema: rode-as em store.database antes
const engine = await buildEngine({ store, app: appJson, entities: [customerJson], hooks: {} });
createServer(engineListener(engine, { prefix: '/api', routes: myLoginRoutes })).listen(3000);
```

Sem `node:http` (Electron por IPC, por exemplo), use `handle(engine, request)` direto: recebe um `EngineRequest`
(método, caminho, query, cabeçalhos em minúsculas, corpo em texto) e devolve um `EngineResponse`.

## Camadas

- `domain/`: a spec parseada (entidades, campos, condições, ações) e as regras puras. Sem Node.
- `ports/`: o que o motor pede de fora: `Store` (banco), `Hooks` (sistema) e o formato da requisição.
- `app/`: os casos de uso (ler, listar, gravar, ações, lookups, tempo real).
- `http/`: as rotas (`handle`) e o adaptador de `node:http`.
- `adapters/`: o `Store` sobre better-sqlite3 (`@c3theme/engine-node/better-sqlite3`).

## better-sqlite3

Duas conexões no mesmo arquivo em WAL: a leitura nunca vê transação em andamento e as transações entram uma por vez
(fila), porque o motor é assíncrono e uma transação pode esperar um hook. Por isso `:memory:` não serve. Escritas do
sistema (hooks) devem passar por `inTx(store, ...)` para entrar na mesma fila; uma conexão de escrita própria do
sistema concorre com a do motor e pode receber `SQLITE_BUSY`. O `Store` só trafega INTEGER, TEXT e NULL: REAL volta
como texto e BLOB é erro (leia BLOB por uma conexão própria, como o anexo do exemplo).

## Diferenças conhecidas para o Rust

- Inteiros acima de 2^53 não são aceitos (número do JavaScript).
- `\d` e `\w` em `pattern` e no `REGEXP` são só ASCII no JavaScript; no Rust são Unicode.
- O hash de `_version` usa o JSON do valor; objeto aninhado com chaves em outra ordem dá outra versão.
- As partes de UI do assistente (`agent_ui`) não foram portadas.
- Só há adaptador para better-sqlite3 (sem `node:sqlite` por enquanto).
