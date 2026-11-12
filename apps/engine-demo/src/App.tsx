// Sistema inteiro a partir da spec: tudo vem de GET /api/_meta, até o painel. Componente custom (registrado
// por nome em `components`) só entra quando o app.json ou uma entidade cita um.

import { C3Shell, httpAuth } from '@c3theme/engine';

import Balcao from './balcao/Balcao';

// login pela shell: telas pelo `auth` do app.json, autenticação pelo /auth/* do c3-example
const auth = httpAuth('/api');

// a página registrada /balcao cita "balcao"; o assistente (`layout.header.assistant` e a página /assistente) vem do
// app.json e fala com o /_chat do c3-example
const components = { balcao: Balcao };

export default function App() {
  return <C3Shell apiUrl="/api" auth={auth} components={components} theme={{ storageKey: 'c3-engine-demo' }} />;
}
