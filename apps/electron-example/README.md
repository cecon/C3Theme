# Exemplo: motor C3 no Electron

A mesma `<C3Shell>` do navegador, aberta de arquivo num app Electron. Duas trocas em relação ao navegador:

- `router="hash"`: a rota vai depois do `#` (`index.html#/customer`), porque a página é aberta por `file://`.
- `transport={ipcFetch(window.c3)}`: o pedido do contrato vai por IPC ao processo main, que o repassa ao backend.
  Não há CORS (o pedido sai do main) e o renderer só alcança caminhos dentro da API.
- O main só atende a página do app (`fromPage`), só deixa a janela navegar dentro do `index.html` e só repassa os
  cabeçalhos do contrato (`authorization`, `content-type`, `accept`, `if-match`, `c3-*`). Cabeçalho próprio do
  sistema (chave do dispositivo, tenant) vai no main, em `forwardTo(url, { headers })`, não no `headers` do `<C3Shell>`.

```
renderer (C3Shell)  --ipcFetch-->  preload (exposeC3Bridge)  --IPC-->  main (serveC3 + forwardTo)  --HTTP-->  backend
```

## Rodar

```sh
cargo build -p c3-example   # backend local de exemplo (Rust + SQLite)
pnpm electron                # compila o renderer, o main e o preload e abre o app
```

Login: `admin` / `c3`.

O binário do Electron é baixado no `pnpm install` (o `pnpm-workspace.yaml` libera o postinstall dele). Se a
instalação foi feita com `ELECTRON_SKIP_BINARY_DOWNLOAD=1`, rode `pnpm rebuild electron`.

## Para onde vão os pedidos

Por variável de ambiente, lida pelo main (`electron/backend.ts`):

| Variável                                 | Modo                                                                                      |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| `C3_API_URL=https://erp.exemplo.com/api` | servidor remoto: o main só repassa                                                        |
| `C3_BACKEND=/caminho/do/binario`         | binário local: o main sobe numa porta livre de 127.0.0.1, com o banco em `userData/c3.db` |
| nenhuma                                  | binário local `target/debug/c3-example` do repositório                                    |

No app empacotado, o binário vai em `extraResources` e o caminho sai de `process.resourcesPath`.

## No seu sistema

```ts
// main
// só a página do app fala com o backend; cabeçalho extra do sistema vai aqui (forwardTo(url, { headers }))
serveC3(ipcMain, forwardTo(apiUrl), { allow: fromPage(pathToFileURL(indexHtml).href) });
// backend local: forwardTo((await startSidecar({ command })).url)
// preload (sandbox: empacote junto, como em vite.electron.config.mts)
exposeC3Bridge(contextBridge, ipcRenderer);
// renderer
const transport = ipcFetch(window.c3);
<C3Shell apiUrl="" router="hash" transport={transport} auth={httpAuth('', transport)} />
```
