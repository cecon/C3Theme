# @c3theme/electron

Adaptadores do motor C3 para Electron. O renderer pede por IPC, o preload expõe a ponte e o processo main
repassa o pedido ao backend (servidor remoto ou binário local).

- `@c3theme/electron/renderer`: `ipcFetch(window.c3)`, o transporte para o `<C3Shell transport>`.
- `@c3theme/electron/preload`: `exposeC3Bridge(contextBridge, ipcRenderer)`.
- `@c3theme/electron/main`: `serveC3`, `fromPage`, `forwardTo` e `startSidecar` (binário local numa porta livre).

## Instalação

```sh
npm install @c3theme/electron
```

O pacote não depende do Electron: recebe `ipcMain`, `ipcRenderer` e `contextBridge` por parâmetro. O main usa
APIs do Node (`node:child_process`, `node:net`), então só importe `./main` no processo main.

## Exemplo mínimo

```ts
// main: só a página do app fala com o backend; cabeçalho extra do sistema vai em forwardTo(url, { headers })
serveC3(ipcMain, forwardTo(apiUrl), { allow: fromPage(pathToFileURL(indexHtml).href) });
// preload (com sandbox, empacote junto do app)
exposeC3Bridge(contextBridge, ipcRenderer);
// renderer
const transport = ipcFetch(window.c3);
<C3Shell apiUrl="" router="hash" transport={transport} auth={httpAuth('', transport)} />;
```

O exemplo completo está em `apps/electron-example` no repositório.

## Licença

MIT. Veja o arquivo `LICENSE`.
