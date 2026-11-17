# 0016. Abas das threads: apresentação das conversas à parte no painel central

## Status

Aceita em 17/11/2026 (issue #134).

## Contexto

As conversas à parte (ADR 0005, `lanes`) abrem num painel ao lado da conversa principal. Um app de agentes quer as
threads como abas no alto do painel central: uma por thread, com nova aba, fechar e reabrir, renomear, reordenar,
indicadores de estado e atalhos. Pelo [ADR 0003](0003-motor-sem-excecoes.md), a faixa é casca do motor: o app declara
e não desenha.

## Decisão

1. **Mesmo modelo, outra apresentação.** As abas são as conversas à parte que já existem; não há recurso novo no
   backend. `chat.tabs` só troca o painel ao lado pela faixa no alto do painel central. A thread principal é sempre a
   primeira aba e não fecha.
2. **Estado da faixa é do aparelho.** Abas abertas, ordem e nomes dados pela pessoa ficam no `localStorage`, por
   servidor (nome do app) e agente (conversa), e as janelas do mesmo app acompanham pelo evento `storage`. O servidor
   continua dono das threads: fechar a aba não apaga nada e thread que some da lista sai da faixa.
3. **Thread nova é rascunho local** até a primeira mensagem, que cria a conversa à parte com o texto (`POST /_lanes`,
   `kind: "aside"`). Assim não sobra thread vazia no servidor.
4. **Indicadores pelo fio**, como campos opcionais da `Lane` em `chat-lanes.yaml`: `attention` (`approval`/`question`),
   `failed` e `unavailable`, além dos `working` e `unread` de antes. Backend que não manda não quebra.
5. **Componente genérico no `ui`.** `ThreadTabs` recebe dados e callbacks e não sabe de chat nem de rotas; o motor liga
   (`chat/tabs/`). Atalhos usam a forma canônica do ADR 0014 (`format: "shortcut"`).
6. **Fechar da aba ativa** volta para a vizinha da esquerda e oferece Desfazer por um aviso (`notify`), no lugar de
   confirmação.

## Consequências

- O painel ao lado continua para quem declara só `lanes`. Com `tabs`, "mover para o painel lateral" não existe:
  fica para quando um app pedir.
- Arquivar a thread no servidor não entra agora: o contrato de lanes não tem rota de arquivar.
- As threads laterais visitadas ficam montadas (uma conexão de mensagens por aba visitada), para preservar rascunho e
  rolagem. Com muitas abas abertas isso pesa; se virar problema, guardar o rascunho por conversa e desmontar.
