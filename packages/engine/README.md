# @c3theme/engine

Renderer da shell C3: lê o `/_meta` do backend (a spec em JSON) e monta layout, menu, rotas, listas,
formulários, painéis, quadro e calendário com o `@c3theme/ui`. O backend segue o contrato HTTP do C3
(spec v0) e cuida das próprias migrações.

## Instalação

```sh
npm install @c3theme/engine @c3theme/ui @mui/material @mui/system @emotion/react @emotion/styled \
  @emotion/cache react react-dom react-intl react-router swr
```

Peers: os mesmos do `@c3theme/ui` (que também é peer) mais `swr` 2.

## Exemplo mínimo

```tsx
import { C3Shell } from '@c3theme/engine';

export default function App() {
  return <C3Shell apiUrl="/api" />;
}
```

Sem backend (protótipo, vitrine estática, teste de tela), `createMemoryClient` atende a mesma porta em memória.
Para montar listas e formulários dentro do layout do próprio sistema, sem a shell, use `EngineProvider`,
`EntityList` e `EntityForm`.

## Ícones e carregamento inicial

A shell **não carrega um catálogo automaticamente**. Passe apenas os ícones que os JSONs citam:

```tsx
import { Box, Profile2User } from 'iconsax-reactjs';
import { C3Shell } from '@c3theme/engine';

const icons = { Box, Profile2User };
export default function App() {
  return <C3Shell apiUrl="/api" icons={icons} />;
}
```

Sem `icons`, ou com nome desconhecido, o ícone da spec é omitido e o rótulo continua. Os ícones internos dos controles
continuam funcionando. Ao atualizar um app que dependia do catálogo automático, adicione esse mapa; não precisa de
plugin de build para substituir imports do motor. O demo inclui o mapa da spec do CRM.

Se a spec permite nomes arbitrários e o app aceita o custo do catálogo inteiro, o opt-in fica num ponto de entrada
separado (não exportado pelo módulo principal):

```tsx
import icons from '@c3theme/engine/icones-completos';
// <C3Shell apiUrl="/api" icons={icons} />
```

Também pode carregar esse módulo no próprio app com `import('@c3theme/engine/icones-completos')` e passar o `default`
quando resolver. Com import estático, o catálogo entra no carregamento inicial por escolha do app.

A rota do quadro carrega o DnD ao abrir. O `QrCode` público continua aceitando as mesmas props, mas reserva o seu
tamanho enquanto carrega o gerador de QR na primeira renderização; renovar o valor preserva o SVG pronto.

### Verificar o bundle

No checkout, `node scripts/check-entry-bundle.mjs` constrói uma entrada de teste real pelo Vite/Rolldown com source
maps (`C3Shell`, `DeviceLink`, `QrCode`), sem escrever artefatos. Percorre os imports **estáticos** da entrada e cobra
que o DnD e o gerador QR estejam só em chunks posteriores e que o catálogo inteiro não entre. O modo `--full-icons`
confere o opt-in; `--measure` só mede (útil para comparar uma base anterior). Precisa das dependências do workspace.

Na mesma entrada, sem minificar, antes/depois da #121: **9.244.114 → 2.335.577 bytes** (redução de 74,7%). A parte do
iconsax caiu de 6.902.897 para 261.148 bytes; DnD passou de 168.389 para zero bytes iniciais, e QR de 43.938 para zero.
Os módulos continuam nos chunks sob demanda. Isso mede a fixture, não o renderer do PieceWork nem bytes transferidos
com compressão; o app consumidor deve repetir o build com o próprio source map para medir o ganho dele.

## Licença

MIT. Veja o arquivo `LICENSE`.
