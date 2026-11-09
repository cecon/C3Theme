// A mesma shell do navegador, com duas trocas para o Electron: o transporte vai por IPC ao main (que sabe onde está
// o backend) e as rotas vão no hash, porque a página é aberta de arquivo.

import { C3Shell, httpAuth } from '@c3theme/engine';
import { ipcFetch } from '@c3theme/electron/renderer';

const transport = ipcFetch(window.c3);
// apiUrl vazio: o caminho vai cru pelo IPC e o main põe a base do backend escolhido
const auth = httpAuth('', transport);

export default function App() {
  return <C3Shell apiUrl="" router="hash" transport={transport} auth={auth} theme={{ storageKey: 'c3-electron' }} />;
}
