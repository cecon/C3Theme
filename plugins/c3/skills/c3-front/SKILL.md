---
name: c3-front
description: Monta o front React de um sistema com o C3 - C3Shell lendo a spec do backend, EngineProvider com EntityList/EntityForm dentro de um app que já existe, componentes custom registrados por nome (campo, coluna, seção, página registrada, header) e o @c3theme/ui nas exceções (tema, AppLayout, campos, DataTable, avisos). Toda tela de negócio é JSON no motor (ADR 0001). Use ao instalar ou atualizar @c3theme/ui ou @c3theme/engine, escrever um componente custom para a spec, decidir se algo pode ficar fora do motor ou corrigir visual que destoa do C3.
---

# Front com @c3theme/ui e @c3theme/engine

- `@c3theme/ui`: tema sobre o MUI 9 (claro e escuro, cores de marca, visual `c3` ou `angle`, RTL), layout (header, menu lateral ou em barra, breadcrumbs), campos e componentes. Vale sozinho, sem o motor.
- `@c3theme/engine`: renderer da spec. O `<C3Shell>` lê `/_meta` do backend e monta menu, rotas, listas, formulários, ações e painel.

## Instalar

Os pacotes são privados e entram por git, **presos a um commit**:

```json
"@c3theme/ui": "github:cecon/C3Theme#<sha>&path:packages/ui",
"@c3theme/engine": "github:cecon/C3Theme#<sha>&path:packages/engine"
```

- Use o mesmo `<sha>` nos pacotes JS e no `c3-engine` do `Cargo.lock`. Recurso novo da spec só aparece com os dois lados atualizados.
- Peers: `react` 19, `@mui/material` e `@mui/system` 9, `@emotion/react`, `@emotion/styled`, `@emotion/cache`, `react-router` 8, `react-intl` 12, `swr` 2 (engine). `@tanstack/react-table` só para `@c3theme/ui/table`. Ícones vêm do `iconsax-reactjs`.
- Para saber o que mudou entre dois commits, leia o `CHANGELOG.md` do pacote (o chat tem) e o `git log -- packages/<pacote>`.

## Regra: tela de negócio é JSON

Toda tela de negócio sai do motor ([ADR 0001](../../../../docs/adr/0001-motor-dsl-caminho-padrao.md)). Antes de escrever TS, escreva o JSON (skill `c3-spec`) e suba a escada dela. TS de tela só nas exceções: página registrada (com `config` validado), catálogo de primitivas, chat, flow e moldura do desktop. Se o motor não alcança o resultado, registre a lacuna e diga ao usuário que é trabalho no motor; não esconda uma tela em TS nem crie um custom genérico para contornar a spec.

## Escolha o modo

| Situação                                                 | Use                                                                                    |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Sistema novo, ou retaguarda inteira descrita na spec     | `<C3Shell apiUrl="/api" ...>`: o app inteiro vem do backend; no C3Theme, `pnpm create-app <nome> [--backend node]` gera front + backend pelo motor |
| App que já existe, trocando uma tela por vez             | `EngineProvider` + `<EntityList entity="x" />` / `<EntityForm entity="x" id={id} />` no layout do app (metadados por `loadEntities`) |
| Tela que não é cadastro e nenhum degrau resolve (PDV com TEF) | página registrada: `pages[].component` + `config` validado pelo `components/<nome>.schema.json`, componente em `components` |
| Protótipo ou teste de tela sem servidor                  | `createMemoryClient(seed)` no lugar do backend, com `loadEntities` e `EngineProvider` (como a seção "Por JSON" da vitrine) |
| App sem backend do motor (portal, landing): exceção      | só `@c3theme/ui`: `C3ThemeProvider` + `AppLayout`; ponto de partida: `pnpm create-app <nome> --sem-motor` no C3Theme (copia o seed) |

```tsx
import { ptBR } from '@mui/material/locale';
import { Box, Profile2User, Warning2 } from 'iconsax-reactjs';
import { C3Shell, httpAuth } from '@c3theme/engine';

const auth = httpAuth('/api');                     // login, me etc. em /auth/*; ou a sua AuthPort
const components = { 'erp/painel-caixa': PainelCaixa, 'placa-input': PlacaInput, assistente: AssistantButton };
const icons = { Box, Profile2User, Warning2 };     // só os nomes que a spec cita

export default function App() {
  return <C3Shell apiUrl="/api" auth={auth} components={components} icons={icons}
    theme={{ storageKey: 'meu-erp', themeOverrides: ptBR, defaultConfig: { brand: 'teal' } }} />;
}
```

- **Passe `icons`**. Sem ele, a shell carrega o catálogo inteiro do iconsax, que tem vários MB.
- `theme.defaultConfig`: `look` (`c3` ou `angle`, para conviver com um sistema Angle), `brand`, `menuOrientation`, `locale` etc. O usuário muda o resto no painel de aparência.
- `onTelemetry` recebe `task.start`, `task.done` e `task.abandon`, sem dado pessoal. Guardar ou enviar é com o sistema.
- `drawerFooter` existe, mas o usuário logado vai por `layout.user: "drawer"` na spec. Não monte outro cartão de usuário.

## Componente custom: o contrato de cada lugar

A spec cita por nome (`component`), e o front registra em `components`.

| Onde na spec                                   | Props que o componente recebe                                                            |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------- |
| campo do formulário `{ field, component }`     | `CustomFieldProps`: `field`, `value`, `onChange(valor)`, `error`, `required`, `readOnly` (já soma o travado), `label`, `record`, `entity` |
| seção `{ component }`                          | `CustomSectionProps`: `entity`, `record`, `onChange(nome, valor)`, `editing`, `errors`, `id` (ausente no novo), `dirty` |
| coluna `{ field, component }`                  | `field`, `value`, `record` (a linha)                                                     |
| página `pages[].component`, `layout.header.actions`, `views.detail.component` | nada obrigatório; use os hooks abaixo                       |

- Dentro do custom: `useEngine()` traz `client` (chamadas ao contrato com token e filial), `app`, `entities` (`def` e `capabilities` de cada uma) e `org` (filial ativa). Também existem `useEntity(nome)`, `useText()` (textos da spec traduzidos), `useAction(entity)` (roda ação e atualiza o cache), `<RecordActions>` e `<FieldInput>` (o campo padrão de um `FieldDef`).
- **O valor segue o formato trafegado**: decimal em string, data `"2026-10-17"`, reference como id. `DecimalField` e `DateField` já fazem a conversão.
- **Monte o custom com os campos do `@c3theme/ui`**, nunca com `<input>`/`<select>` nativo ou markup de outro framework. Bootstrap no meio da tela já produziu rótulo por cima, "— Escolha —" nativo e altura diferente.
- Antes de escrever um custom, confira se a spec já resolve (skill `c3-spec`, "A escada"). Busca de registro é `reference`; CEP é `lookup`.

## Catálogo do @c3theme/ui (o que já existe)

| Preciso de                       | Componente                                                                                     |
| -------------------------------- | ---------------------------------------------------------------------------------------------- |
| Tema e preferências              | `C3ThemeProvider` (`branding`, `defaultConfig`, `storageKey`, `loadMessages`, `tokens`), `useUiConfig` |
| Estrutura de tela                | `AppLayout`, `AppFooter`, `Breadcrumbs`, `FillHeight` (altura cheia), `AuthLayout`, `MessagePage` |
| Header                           | `CommandSearch` (Ctrl+K), `ColorModeButton`, `FullscreenButton`, `SettingsButton`, `UserMenu`, `NotificationsButton` |
| Campos                           | `DecimalField`, `MoneyField`, `DateField`, `DateTimeField`, `SelectField`, `RadioField`, `FlagsField`, `FileField`, `SearchSelectField`, `withHint` |
| Tabela                           | `DataTable` de `@c3theme/ui/table` (modo `server`, seleção, paginação, `TableEmpty`)           |
| Bloco e estado                   | `Panel`, `StatusChip` (tom), `EmptyState`, `PageLoader`, skeletons (`TableSkeletonRows`, `FormSkeleton`, `PanelSkeleton`) |
| Aviso e confirmação              | `notify(...)` + `<Notifier />` (fila de até 3, com ação "Desfazer"), `ActionDialog`             |
| Período e impressão              | `PeriodFilter`, `printHidden`, `printOnly`                                                     |
| Upload grande com progresso      | `UploadField` + porta `Uploader` (`xhrUploader`)                                               |
| Outros                           | `OtpInput`, `PasswordStrength`, `SoftAvatar`, `SoftIconButton`, `Progress`, `Logo`             |

Antes de criar um componente, procure no `packages/ui/src/index.ts` do commit instalado. Para ver funcionando, use a vitrine `apps/showcase` (`pnpm dev:showcase` no C3Theme).

## Armadilhas

- **Cor e tamanho vêm do tema.** Use `theme.palette`, os tons (`neutral`, `info`, `success`, `warning`, `danger`) e `theme.fieldHeight`; não use hex nem altura fixa. Assim o modo escuro, o visual Angle e as cores de marca continuam funcionando.
- **CSS global do sistema vaza no MUI.** Bootstrap ou Angle carregado na mesma página muda a altura de input e as margens. Isole o CSS antigo nas telas antigas.
- **Título duplicado**: a shell já mostra o título e os breadcrumbs da tela. Não ponha outro cabeçalho no componente.
- **Texto da tela** passa por `useText`/`react-intl` (chaves `c3.*` já existem em pt-BR e en). Não fixe "Sim/Não" no componente.
- **Permissão no front é só conforto.** Esconder um botão não protege nada: o backend responde 403.
- Confira no navegador: largura de celular, modo escuro e um erro de validação vindo do backend.
