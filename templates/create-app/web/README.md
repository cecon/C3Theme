# {{title}}

App gerado por `pnpm create-app` e montado **inteiro pelo motor C3** ([ADR 0001](../../docs/adr/0001-motor-dsl-caminho-padrao.md)):
este front não tem tela em TS; menu, rotas, lista, formulário e painel vêm do backend em `GET /api/_meta`.

| Parte  | Pasta                       | O que tem                                                                   |
| ------ | --------------------------- | --------------------------------------------------------------------------- |
| Telas  | `{{apiDir}}/spec/`          | `app.json` (menu, painel, página inicial) e uma entidade por arquivo        |
| Banco  | `{{apiDir}}/migrations/`    | as tabelas das entidades; as migrations são do sistema, não do motor        |
| Regras | `{{apiDir}}/{{hooksFile}}`  | `Hooks`: validação entre campos, permissões, filiais, ações                 |
| Front  | `apps/{{name}}/`            | `<C3Shell apiUrl="/api">` e os ícones que a spec cita                       |

## Rodar (dois terminais)

```bash
{{apiDev}}   # API em http://127.0.0.1:3001/api
pnpm --filter @c3theme/{{name}} dev   # shell em http://localhost:5173
```

## Tela nova

1. Escreva `{{apiDir}}/spec/<entidade>.json` e cite a entidade em `entities` e no `layout.menu` do `app.json`.
2. Crie a migration da tabela (`{{apiDir}}/migrations/0002_<entidade>.sql`).{{rustEntityStep}}
3. Valide: `node scripts/validate-spec.mjs {{apiDir}}/spec` (o backend também recusa subir se spec e banco não batem).
4. Se o ícone é novo, acrescente-o em `icons` no `src/App.tsx`.

Antes de escrever TS, suba a escada da skill [`c3-spec`](../../plugins/c3/skills/c3-spec/SKILL.md): convenção, view,
recurso declarado, widget de campo, seção custom e, por último, página registrada. O que o motor não alcança vira
lacuna registrada e trabalho no motor, não tela em TS escondida.

## Login

O app nasce sem login. Para ter: declare `auth` no `app.json`, responda `POST /auth/login` e `GET /auth/me` no
backend e passe `auth={httpAuth('/api')}` ao `<C3Shell>` (modelo: `crates/c3-example/src/login.rs` ou
`apps/c3-example-node/src/login.ts`, que são só demonstração).
