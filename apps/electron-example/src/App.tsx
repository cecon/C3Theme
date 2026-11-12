// A mesma shell do navegador, com três trocas para o Electron: o transporte vai por IPC ao main (que sabe onde está
// o backend), as rotas vão no hash, porque a página é aberta de arquivo, e a porta da janela diz a plataforma para a
// shell montar a moldura do `layout.desktop` do app.json.

import { C3Shell, httpAuth } from '@c3theme/engine';
import { electronDesktop, ipcFetch } from '@c3theme/electron/renderer';

const transport = ipcFetch(window.c3);
// apiUrl vazio: o caminho vai cru pelo IPC e o main põe a base do backend escolhido
const auth = httpAuth('', transport);
const desktopHost = electronDesktop();

export default function App() {
  return (
    <C3Shell apiUrl="" router="hash" transport={transport} auth={auth} desktopHost={desktopHost} theme={{ storageKey: 'c3-electron' }} />
  );
}
