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

## Entrada por senha ou por código

A `AuthPort` declara o modo em `entrada`. Sem declarar, é `senha`: identificador + senha (`login`) e, se o app.json
ligar e a porta implementar, cadastro, "Esqueci a senha" e perfil.

```tsx
const auth = { login: (identificador, senha) => api.login(identificador, senha), me: (token) => api.me(token) };
<C3Shell apiUrl="/api" auth={auth} />;
```

Com `entrada: 'codigo'` a shell monta só o e-mail + **Enviar código** e a conferência do código: não existe campo de
senha nem rota de cadastro, esqueci a senha ou redefinir. A porta implementa `enviarCodigo` e `entrarComCodigo`; o
`login` pode ficar de fora. A sessão expõe `requestCode` e `loginWithCode` para telas escritas à mão.

```tsx
const auth: AuthPort = {
  entrada: 'codigo',
  me: (token) => api.me(token),
  enviarCodigo: (email) => api.pedirCodigo(email),
  entrarComCodigo: (email, codigo) => api.entrarComCodigo(email, codigo)
};
<C3Shell apiUrl="/api" auth={auth} />;
```

Os erros de `enviarCodigo` e `entrarComCodigo` com `code` `codigo-invalido`, `codigo-expirado`,
`muitas-tentativas` ou `sem-rede` viram os estados em PT-BR da tela; qualquer outro erro mostra a mensagem que a
porta deu. O foco começa no e-mail e, na conferência, na primeira casa do código; Enter envia/confere.

No modo código o identificador é sempre e-mail, mesmo se a configuração antiga declarava `username`.
Métodos legados de senha eventualmente presentes na porta não expõem a aba de troca de senha no perfil.
Erros de transporte com `status: 0` usam o estado sem rede e `status: 429` usam muitas tentativas.
Há uma espera de 30 segundos antes de reenviar; código expirado permite pedir outro imediatamente,
mas muitas tentativas reinicia a espera. Enquanto um envio ou uma conferência está pendente, Enter
repetido não dispara outro pedido e reenviar não disputa com a conferência. Após reenviar, o foco
volta à primeira casa do novo código.

## Licença

MIT. Veja o arquivo `LICENSE`.
